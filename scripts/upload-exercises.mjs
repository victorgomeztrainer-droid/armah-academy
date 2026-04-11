/**
 * Uploads exercise images to Supabase Storage and links them to lessons.
 * Run with: node scripts/upload-exercises.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kjckumagmyzqfirwxirx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const PROGRAM_ID   = '30a43ed7-fe6c-4d89-a24f-df52fc8a74a3'
const IMAGES_DIR   = 'C:/Users/victo/Downloads/ExersicesC_extracted/Exersices'
const BUCKET       = 'exercises'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── 1. Create bucket if it doesn't exist ────────────────────────────────────
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.find(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Bucket creation failed: ${error.message}`)
    console.log(`✅ Bucket '${BUCKET}' created`)
  } else {
    console.log(`✅ Bucket '${BUCKET}' exists`)
  }
}

// ── 2. Get lesson IDs by circuit ─────────────────────────────────────────────
async function getLessons() {
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, sort_order')
    .eq('program_id', PROGRAM_ID)
    .in('sort_order', [8, 9, 10])
    .order('sort_order')

  if (!modules?.length) throw new Error('No Circuit modules found')

  const lessons = {}
  for (const mod of modules) {
    const circuitNum = mod.sort_order - 7  // 8→1, 9→2, 10→3
    const { data: lessonRows } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('module_id', mod.id)
      .ilike('lesson_type', 'image')
      .order('sort_order')

    lessons[circuitNum] = lessonRows || []
    console.log(`Circuit ${circuitNum} (${mod.title}): ${lessonRows?.length} image lessons`)
    lessonRows?.forEach(l => console.log(`  - ${l.title} [${l.id}]`))
  }
  return lessons
}

// ── 3. Parse filename → { circuit, exercise } ────────────────────────────────
// "Circuit 1 - exersice 1a.jpeg" → { circuit: 1, exercise: 1 }
function parseFilename(filename) {
  const m = filename.match(/Circuit (\d+) - exersice (\d+)([abc])\.jpe?g/i)
  if (!m) return null
  return { circuit: parseInt(m[1]), exercise: parseInt(m[2]), variant: m[3] }
}

// ── 4. Main ──────────────────────────────────────────────────────────────────
async function main() {
  await ensureBucket()
  const lessons = await getLessons()

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.jpe?g$/i.test(f))
    .sort()

  console.log(`\n📁 Found ${files.length} images\n`)

  // Group images by circuit + exercise number
  const grouped = {}
  for (const file of files) {
    const parsed = parseFilename(file)
    if (!parsed) { console.warn(`⚠️  Skipping unrecognized: ${file}`); continue }
    const key = `${parsed.circuit}-${parsed.exercise}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push({ file, ...parsed })
  }

  let uploaded = 0
  let linked = 0

  for (const [key, images] of Object.entries(grouped)) {
    const { circuit, exercise } = images[0]
    const circuitLessons = lessons[circuit]
    if (!circuitLessons) { console.warn(`⚠️  No lessons found for Circuit ${circuit}`); continue }

    // Match lesson by exercise number in title
    const lesson = circuitLessons.find(l => {
      const m = l.title.match(/Exercise (\d+)/i)
      return m && parseInt(m[1]) === exercise
    })

    if (!lesson) {
      console.warn(`⚠️  No lesson found for Circuit ${circuit} Exercise ${exercise}`)
      continue
    }

    // Upload each image variant (a, b, c)
    for (const img of images.sort((a, b) => a.variant.localeCompare(b.variant))) {
      const filePath = path.join(IMAGES_DIR, img.file)
      const fileBuffer = fs.readFileSync(filePath)
      const storagePath = `circuit${circuit}/exercise${exercise}${img.variant}.jpeg`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error(`❌ Upload failed for ${img.file}: ${uploadError.message}`)
        continue
      }

      uploaded++
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)

      // Insert resource record
      const { error: insertError } = await supabase
        .from('resources')
        .insert({
          lesson_id: lesson.id,
          title: `${lesson.title} — Image ${img.variant.toUpperCase()}`,
          file_type: 'image',
          file_url: publicUrl,
          file_size_kb: Math.round(fs.statSync(filePath).size / 1024),
        })

      if (insertError) {
        console.error(`❌ DB insert failed for ${img.file}: ${insertError.message}`)
      } else {
        linked++
        console.log(`✅ C${circuit} Ex${exercise}${img.variant} → ${lesson.title}`)
      }
    }
  }

  console.log(`\n🎉 Done! ${uploaded} images uploaded, ${linked} resources linked`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
