import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import QuizClient from './QuizClient'

export default async function ModuleQuizPage({
  params,
}: {
  params: { slug: string; moduleId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get module info
  const { data: module } = await supabase
    .from('modules')
    .select('id, title, program_id, programs(id, title, slug)')
    .eq('id', params.moduleId)
    .single()

  if (!module) notFound()

  // Get the quiz for this module
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_options(*))')
    .eq('module_id', params.moduleId)
    .maybeSingle()

  if (!quiz) notFound()

  // Rename for QuizClient compatibility
  quiz.questions = quiz.quiz_questions

  // Get user's attempts
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', quiz.id)
    .order('created_at', { ascending: false })

  const passedAttempt = (attempts || []).find((a) => a.passed) ?? null
  const canAttempt =
    !passedAttempt &&
    (quiz.max_attempts === null || (attempts || []).length < quiz.max_attempts)

  return (
    <QuizClient
      quiz={quiz}
      module={module}
      slug={params.slug}
      userId={user.id}
      attempts={attempts || []}
      passedAttempt={passedAttempt}
      canAttempt={canAttempt}
    />
  )
}
