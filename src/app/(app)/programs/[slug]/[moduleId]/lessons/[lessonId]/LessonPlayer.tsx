'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  lesson: any
  resources: any[]
  slug: string
  moduleId: string
  isCompleted: boolean
  allModuleLessonsDone: boolean
  nextLesson: { id: string; moduleId: string } | null
  nextModuleFirstLesson: { id: string; moduleId: string } | null
  userId: string
  programQuizId: string | null
  allProgramLessonsDone: boolean
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  if (url.includes('youtube.com/embed/')) return url
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?\s]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  return url
}

// ── Parses the flat description text into structured blocks ──────────────────
function parseContentBlocks(text: string) {
  const blocks: { type: 'heading' | 'bullet' | 'numbered' | 'paragraph'; text: string; num?: number }[] = []
  const lines = text.split('\n')

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) continue

    // Numbered items like "1. Cervical..."
    const numMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      blocks.push({ type: 'numbered', text: numMatch[2], num: parseInt(numMatch[1]) })
      continue
    }
    // Bullet points
    if (line.startsWith('•')) {
      blocks.push({ type: 'bullet', text: line.slice(1).trim() })
      continue
    }
    // All-caps short lines = heading (max 70 chars, no lowercase)
    const trimmed = line.trim()
    if (
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 3 &&
      trimmed.length < 70 &&
      /[A-Z]/.test(trimmed)
    ) {
      blocks.push({ type: 'heading', text: trimmed })
      continue
    }
    blocks.push({ type: 'paragraph', text: trimmed })
  }
  return blocks
}

export default function LessonPlayer({
  lesson,
  resources,
  slug,
  moduleId,
  isCompleted,
  allModuleLessonsDone,
  nextLesson,
  nextModuleFirstLesson,
  userId,
  programQuizId,
  allProgramLessonsDone,
}: Props) {
  const [completed, setCompleted] = useState(isCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const embedUrl = lesson.video_url ? getYouTubeEmbedUrl(lesson.video_url) : null
  const isReading = lesson.lesson_type === 'reading' || lesson.lesson_type === 'presentation'

  async function markComplete() {
    if (completed || loading) return
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    // ── 1. Read profile FIRST (before any updates) ───────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, total_study_days, last_activity_date')
      .eq('id', userId)
      .single()

    // ── 2. Mark lesson complete ───────────────────────────────────
    await supabase.from('user_progress').upsert({
      user_id: userId,
      lesson_id: lesson.id,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    // ── 3. Upsert study session ───────────────────────────────────
    const { data: existingSession } = await supabase
      .from('study_sessions')
      .select('id, lessons_completed')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single()

    if (existingSession) {
      await supabase
        .from('study_sessions')
        .update({ lessons_completed: existingSession.lessons_completed + 1 })
        .eq('id', existingSession.id)
    } else {
      await supabase.from('study_sessions').insert({
        user_id: userId,
        session_date: today,
        lessons_completed: 1,
      })
    }

    // ── 4. Calculate streak using OLD last_activity_date ─────────
    if (profile) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newStreak: number
      if (profile.last_activity_date === today) {
        // Already studied today — keep streak unchanged
        newStreak = profile.current_streak
      } else if (profile.last_activity_date === yesterdayStr) {
        // Studied yesterday → extend streak
        newStreak = profile.current_streak + 1
      } else {
        // Gap in activity → reset streak to 1
        newStreak = 1
      }

      const isNewDay = profile.last_activity_date !== today

      await supabase.from('profiles').update({
        last_lesson_id: lesson.id,
        last_program_slug: slug,
        last_activity_date: today,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak ?? 0),
        total_study_days: (profile.total_study_days ?? 0) + (isNewDay ? 1 : 0),
      }).eq('id', userId)
    } else {
      // No profile data — safe fallback
      await supabase.from('profiles').update({
        last_lesson_id: lesson.id,
        last_program_slug: slug,
        last_activity_date: today,
        current_streak: 1,
        longest_streak: 1,
        total_study_days: 1,
      }).eq('id', userId)
    }

    setCompleted(true)
    setLoading(false)
    router.refresh()
  }

  const showQuizButton = completed && allProgramLessonsDone && programQuizId
  const showNextLesson = completed && nextLesson && !allModuleLessonsDone
  const showNextModule = completed && !nextLesson && nextModuleFirstLesson

  // ── Content blocks for reading/presentation ──────────────────────────────
  const contentBlocks = isReading && lesson.description
    ? parseContentBlocks(lesson.description)
    : []

  // Group blocks into sections (each heading starts a new section)
  type Section = { heading: string | null; items: typeof contentBlocks }
  const sections: Section[] = []
  let currentSection: Section = { heading: null, items: [] }
  for (const block of contentBlocks) {
    if (block.type === 'heading') {
      if (currentSection.items.length > 0 || currentSection.heading) {
        sections.push(currentSection)
      }
      currentSection = { heading: block.text, items: [] }
    } else {
      currentSection.items.push(block)
    }
  }
  if (currentSection.items.length > 0 || currentSection.heading) {
    sections.push(currentSection)
  }

  return (
    <div className="flex flex-col flex-1">

      {/* ── VIDEO ──────────────────────────────────────────────────── */}
      {embedUrl && (
        <div className="bg-black w-full aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* ── READING / PRESENTATION HERO ────────────────────────────── */}
      {!embedUrl && isReading && (
        <div style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%)' }}>
          <div className="max-w-3xl mx-auto px-8 py-10 flex items-start gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              {lesson.lesson_type === 'presentation' ? (
                <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              ) : (
                <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] mb-2"
                style={{ color: 'rgba(201,168,76,0.7)' }}>
                {lesson.lesson_type === 'presentation' ? 'Presentation' : 'Reading'} · {lesson.duration_minutes && `${lesson.duration_minutes} min read`}
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight">{lesson.title}</h1>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO PLACEHOLDER ──────────────────────────────────────── */}
      {!embedUrl && !isReading && (
        <div className="bg-black w-full aspect-video flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">Video coming soon</p>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">

        {/* Video lesson title + type badge */}
        {!isReading && (
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-1">
              <h1 className="text-xl font-bold text-[#1A1A2E]">{lesson.title}</h1>
              {lesson.duration_minutes && (
                <span className="text-gray-400 text-sm flex-shrink-0 mt-0.5">{lesson.duration_minutes} min</span>
              )}
            </div>
          </div>
        )}

        {/* ── READING CONTENT — section cards ──────────────────────── */}
        {isReading && sections.length > 0 && (
          <div className="space-y-4 mb-8">
            {sections.map((section, si) => (
              <div
                key={si}
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid #E8E8E4' }}
              >
                {/* Section heading */}
                {section.heading && (
                  <div
                    className="px-6 py-4"
                    style={{ background: '#1A1A2E' }}
                  >
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#C9A84C' }}>
                      {section.heading}
                    </h2>
                  </div>
                )}

                {/* Section body */}
                <div className="px-6 py-5 space-y-3 bg-white">
                  {section.items.map((item, ii) => {
                    if (item.type === 'bullet') {
                      return (
                        <div key={ii} className="flex gap-3 items-start">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                            style={{ background: '#C9A84C' }}
                          />
                          <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                        </div>
                      )
                    }
                    if (item.type === 'numbered') {
                      return (
                        <div key={ii} className="flex gap-3 items-start">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                            style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
                          >
                            {item.num}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                        </div>
                      )
                    }
                    // paragraph
                    return (
                      <p key={ii} className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── VIDEO LESSON description (coaching cues) ─────────────── */}
        {!isReading && lesson.description && (
          <div className="mb-7 space-y-1">
            {lesson.description.split('\n').map((line: string, i: number) => {
              if (!line.trim()) return <div key={i} className="h-2" />
              if (line.match(/^(COACHING CUES|MUSCLES|Work:|Rest:)/)) {
                return (
                  <p key={i} className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mt-4 mb-1 first:mt-0">
                    {line}
                  </p>
                )
              }
              if (line.startsWith('•')) {
                return (
                  <div key={i} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                    <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }}>•</span>
                    <span>{line.slice(1).trim()}</span>
                  </div>
                )
              }
              return <p key={i} className="text-sm text-gray-500 leading-relaxed">{line}</p>
            })}
          </div>
        )}

        {/* ── RESOURCES ────────────────────────────────────────────── */}
        {resources.length > 0 && (
          <div className="mb-7">
            <h3 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-3">Resources</h3>
            <div className="space-y-2">
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-colors group"
                  style={{ background: '#F8F8F5', border: '1px solid #EEEEEA' }}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A2E] group-hover:text-[#C9A84C] transition-colors truncate">{r.title}</p>
                    {r.file_size_kb && <p className="text-xs text-gray-400">{r.file_size_kb} KB</p>}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#C9A84C] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-3 pt-5"
          style={{ borderTop: '1px solid #EBEBEB' }}
        >
          {!completed ? (
            <button
              onClick={markComplete}
              disabled={loading}
              className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Mark as Complete
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Completed
            </span>
          )}

          {/* Final quiz unlock */}
          {showQuizButton && (
            <Link
              href={`/programs/${slug}/quiz`}
              className="inline-flex items-center gap-2 font-bold px-5 py-3 rounded-xl text-sm transition-colors text-white"
              style={{ background: '#1A1A2E' }}
            >
              <svg className="w-4 h-4" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Take Certification Quiz
            </Link>
          )}

          {/* Next lesson */}
          {showNextLesson && (
            <Link
              href={`/programs/${slug}/${nextLesson!.moduleId}/lessons/${nextLesson!.id}`}
              className="inline-flex items-center gap-2 font-bold px-5 py-3 rounded-xl text-sm text-white transition-colors"
              style={{ background: '#1A1A2E' }}
            >
              Next Lesson
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Next module */}
          {showNextModule && (
            <Link
              href={`/programs/${slug}/${nextModuleFirstLesson!.moduleId}/lessons/${nextModuleFirstLesson!.id}`}
              className="inline-flex items-center gap-2 font-bold px-5 py-3 rounded-xl text-sm text-white transition-colors"
              style={{ background: '#1A1A2E' }}
            >
              Next Module
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
