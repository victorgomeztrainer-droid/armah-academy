'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) redirect('/dashboard')
  return supabase
}

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

export async function createProgram(formData: FormData) {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  const title = formData.get('title') as string
  const slug = (formData.get('slug') as string).toLowerCase().replace(/\s+/g, '-')
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const difficulty = formData.get('difficulty') as string
  const estimated_hours = parseFloat(formData.get('estimated_hours') as string) || null
  const is_published = formData.get('is_published') === 'on'

  const { data, error } = await supabase.from('programs').insert({
    title, slug, description, category, difficulty, estimated_hours, is_published,
    created_by: user!.id,
  }).select().single()

  if (error) redirect('/admin/programs?error=' + encodeURIComponent(error.message))
  redirect(`/admin/programs/${data.id}`)
}

export async function updateProgram(programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const title = formData.get('title') as string
  const slug = (formData.get('slug') as string).toLowerCase().replace(/\s+/g, '-')
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const difficulty = formData.get('difficulty') as string
  const estimated_hours = parseFloat(formData.get('estimated_hours') as string) || null
  const is_published = formData.get('is_published') === 'on'

  await supabase.from('programs').update({
    title, slug, description, category, difficulty, estimated_hours, is_published, updated_at: new Date().toISOString(),
  }).eq('id', programId)

  revalidatePath('/admin/programs')
  revalidatePath(`/admin/programs/${programId}`)
}

export async function createModule(programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
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

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const video_url = formData.get('video_url') as string
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || null
  const lesson_type = formData.get('lesson_type') as string

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

  const title = formData.get('title') as string
  const passing_score = parseInt(formData.get('passing_score') as string) || 70
  const max_attempts = parseInt(formData.get('max_attempts') as string) || 3

  await supabase.from('quizzes').insert({ program_id: programId, title, passing_score, max_attempts })
  revalidatePath(`/admin/programs/${programId}`)
}

export async function createQuestion(quizId: string, programId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const question_text = formData.get('question_text') as string
  const question_type = formData.get('question_type') as string
  const explanation = formData.get('explanation') as string
  const correct_option = formData.get('correct_option') as string

  const { data: existing } = await supabase.from('quiz_questions').select('sort_order').eq('quiz_id', quizId).order('sort_order', { ascending: false }).limit(1)
  const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data: question } = await supabase.from('quiz_questions').insert({
    quiz_id: quizId, question_text, question_type, explanation, sort_order,
  }).select().single()

  if (!question) return

  // Create options
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
