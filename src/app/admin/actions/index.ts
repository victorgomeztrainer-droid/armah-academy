'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Guards ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) redirect('/dashboard')
  return supabase
}

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')
  return supabase
}

// ─── User Management ─────────────────────────────────────────────────────────

export async function approveUser(userId: string) {
  const supabase = await requireAdmin()
  await supabase.from('profiles').update({ is_approved: true }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function rejectUser(userId: string) {
  const supabase = await requireAdmin()
  await supabase.from('profiles').update({ is_approved: false }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await requireAdmin()
  await supabase.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function updateUserProfile(userId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string
  const branch = formData.get('branch') as string

  const { error } = await supabase.from('profiles').update({
    full_name: full_name || undefined,
    role: role || undefined,
    branch: branch || null,
  }).eq('id', userId)

  if (error) {
    console.error('updateUserProfile error:', error)
    redirect(`/admin/users/${userId}?error=` + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  redirect(`/admin/users/${userId}?success=Profile+updated`)
}

/**
 * Creates a new user directly — bypasses the registration/approval flow.
 * Uses the Supabase Admin API (service role key required).
 */
export async function createUser(formData: FormData) {
  await requireAdmin()

  const email      = (formData.get('email') as string)?.trim()
  const password   = (formData.get('password') as string)?.trim()
  const full_name  = (formData.get('full_name') as string)?.trim()
  const role       = (formData.get('role') as string) || 'trainer'
  const branch     = (formData.get('branch') as string)?.trim() || null

  if (!email || !password || !full_name) {
    redirect('/admin/users?error=' + encodeURIComponent('Name, email and password are required'))
  }

  const adminClient = createAdminClient()

  // 1. Create auth user (email auto-confirmed — no verification email)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError || !authData?.user) {
    redirect('/admin/users?error=' + encodeURIComponent(authError?.message ?? 'User creation failed'))
  }

  const uid = authData.user.id

  // 2. Upsert profile (the trigger may already have created a stub row)
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: uid,
    email,
    full_name,
    role,
    branch,
    is_approved: true,
  }, { onConflict: 'id' })

  if (profileError) {
    // Roll back: delete the auth user so we don't leave orphans
    await adminClient.auth.admin.deleteUser(uid)
    redirect('/admin/users?error=' + encodeURIComponent(profileError.message))
  }

  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent(`${full_name} was created successfully`))
}

export async function deleteUser(userId: string) {
  await requireSuperAdmin()
  const adminClient = createAdminClient()
  await adminClient.auth.admin.deleteUser(userId)
  // Profile deleted via FK cascade in DB
  revalidatePath('/admin/users')
}

// ─── Programs ────────────────────────────────────────────────────────────────

export async function createProgram(formData: FormData) {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  const title            = formData.get('title') as string
  const slug             = (formData.get('slug') as string).toLowerCase().replace(/\s+/g, '-')
  const description      = formData.get('description') as string
  const category         = formData.get('category') as string
  const difficulty       = formData.get('difficulty') as string
  const estimated_hours  = parseFloat(formData.get('estimated_hours') as string) || null
  const is_published     = formData.get('is_published') === 'on'

  const { data, error } = await supabase.from('programs').insert({
    title, slug, description, category, difficulty, estimated_hours, is_published,
    created_by: user!.id,
  }).select().single()

  if (error) redirect('/admin/programs?error=' + encodeURIComponent(error.message))
  redirect(`/admin/programs/${data.id}`)
}

export async function updateProgram(programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const title           = formData.get('title') as string
  const slug            = (formData.get('slug') as string).toLowerCase().replace(/\s+/g, '-')
  const description     = formData.get('description') as string
  const category        = formData.get('category') as string
  const difficulty      = formData.get('difficulty') as string
  const estimated_hours = parseFloat(formData.get('estimated_hours') as string) || null
  const is_published    = formData.get('is_published') === 'on'

  await supabase.from('programs').update({
    title, slug, description, category, difficulty, estimated_hours, is_published,
    updated_at: new Date().toISOString(),
  }).eq('id', programId)

  revalidatePath('/admin/programs')
  revalidatePath(`/admin/programs/${programId}`)
}

export async function createModule(programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const title           = formData.get('title') as string
  const description     = formData.get('description') as string
  const is_prerequisite = formData.get('is_prerequisite') === 'on'

  const { data: existing } = await supabase.from('modules').select('sort_order').eq('program_id', programId).order('sort_order', { ascending: false }).limit(1)
  const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  await supabase.from('modules').insert({ program_id: programId, title, description, sort_order, is_prerequisite })
  revalidatePath(`/admin/programs/${programId}`)
}

export async function deleteModule(moduleId: string, programId: string) {
  const supabase = await requireAdmin()
  await supabase.from('modules').delete().eq('id', moduleId)
  revalidatePath(`/admin/programs/${programId}`)
}

export async function createLesson(moduleId: string, programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const title            = formData.get('title') as string
  const description      = formData.get('description') as string
  const video_url        = formData.get('video_url') as string
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || null
  const lesson_type      = formData.get('lesson_type') as string

  const { data: existing } = await supabase.from('lessons').select('sort_order').eq('module_id', moduleId).order('sort_order', { ascending: false }).limit(1)
  const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  await supabase.from('lessons').insert({ module_id: moduleId, title, description, video_url, duration_minutes, lesson_type, sort_order })
  revalidatePath(`/admin/programs/${programId}`)
}

export async function deleteLesson(lessonId: string, programId: string) {
  const supabase = await requireAdmin()
  await supabase.from('lessons').delete().eq('id', lessonId)
  revalidatePath(`/admin/programs/${programId}`)
}

export async function createQuiz(programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const title         = formData.get('title') as string
  const passing_score = parseInt(formData.get('passing_score') as string) || 70
  const max_attempts  = parseInt(formData.get('max_attempts') as string) || 3

  await supabase.from('quizzes').insert({ program_id: programId, title, passing_score, max_attempts })
  revalidatePath(`/admin/programs/${programId}`)
}

export async function createQuestion(quizId: string, programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const question_text  = formData.get('question_text') as string
  const question_type  = formData.get('question_type') as string
  const explanation    = formData.get('explanation') as string
  const correct_option = formData.get('correct_option') as string

  const { data: existing } = await supabase.from('quiz_questions').select('sort_order').eq('quiz_id', quizId).order('sort_order', { ascending: false }).limit(1)
  const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data: question } = await supabase.from('quiz_questions').insert({
    quiz_id: quizId, question_text, question_type, explanation, sort_order,
  }).select().single()

  if (!question) return

  const options = ['option_a', 'option_b', 'option_c', 'option_d']
    .map((key, idx) => ({ text: formData.get(key) as string, idx }))
    .filter((o) => o.text?.trim())

  await supabase.from('quiz_options').insert(
    options.map((o) => ({
      question_id: question.id,
      option_text: o.text,
      is_correct: correct_option === String(o.idx),
      sort_order: o.idx,
    }))
  )

  revalidatePath(`/admin/programs/${programId}`)
}

export async function deleteQuestion(questionId: string, programId: string) {
  const supabase = await requireAdmin()
  await supabase.from('quiz_questions').delete().eq('id', questionId)
  revalidatePath(`/admin/programs/${programId}`)
}
