import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import QuizClient from './QuizClient'

export default async function QuizPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get program
  const { data: program } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!program) notFound()

  // Get quiz with questions and options (program-level quiz)
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_options(*))')
    .eq('program_id', program.id)
    .single()

  if (!quiz) notFound()

  // Sort questions and options by sort_order
  const quizFormatted = {
    ...quiz,
    questions: [...(quiz.quiz_questions || [])]
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((q: any) => ({
        ...q,
        quiz_options: [...(q.quiz_options || [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
      })),
  }

  // Get all modules with lesson IDs to check completion
  const { data: modules } = await supabase
    .from('modules')
    .select('id, lessons(id)')
    .eq('program_id', program.id)

  // Get user progress
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('completed', true)

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id))
  const allLessons = (modules || []).flatMap((m: any) =>
    Array.isArray(m.lessons) ? m.lessons : m.lessons ? [m.lessons] : []
  )
  const allLessonsComplete = allLessons.length > 0 && allLessons.every((l: any) => completedIds.has(l.id))

  // Get quiz attempts for this quiz
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', quiz.id)
    .order('started_at', { ascending: false })

  const passedAttempt = (attempts || []).find((a: any) => a.passed) || null
  const canAttempt = !passedAttempt && (attempts || []).length < quiz.max_attempts

  return (
    <QuizClient
      quiz={quizFormatted}
      program={program}
      slug={params.slug}
      userId={user.id}
      attempts={attempts || []}
      passedAttempt={passedAttempt}
      canAttempt={canAttempt}
      allLessonsComplete={allLessonsComplete}
    />
  )
}
