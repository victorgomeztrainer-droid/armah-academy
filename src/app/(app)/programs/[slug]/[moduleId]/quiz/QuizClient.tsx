'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import StarButton from '@/components/ui/StarButton'

interface Props {
  quiz: any
  module: any
  slug: string
  userId: string
  attempts: any[]
  passedAttempt: any | null
  canAttempt: boolean
}

export default function QuizClient({ quiz, module, slug, userId, attempts, passedAttempt, canAttempt }: Props) {
  const [started, setStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; passed: boolean; breakdown: any[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const questions = quiz.questions || []
  const question = questions[currentQ]

  function handleSelect(optionId: string) {
    setSelected(optionId)
  }

  function handleNext() {
    if (!selected) return
    const newAnswers = { ...answers, [question.id]: selected }
    setAnswers(newAnswers)
    setSelected(null)

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      submitQuiz(newAnswers)
    }
  }

  async function submitQuiz(finalAnswers: Record<string, string>) {
    setSubmitting(true)

    // Calculate score
    const breakdown = questions.map((q: any) => {
      const selectedOptionId = finalAnswers[q.id]
      const correctOption = q.quiz_options.find((o: any) => o.is_correct)
      const selectedOption = q.quiz_options.find((o: any) => o.id === selectedOptionId)
      return {
        question: q.question_text,
        explanation: q.explanation,
        correct: correctOption?.option_text,
        selected: selectedOption?.option_text,
        isCorrect: selectedOptionId === correctOption?.id,
      }
    })

    const correct = breakdown.filter((b: any) => b.isCorrect).length
    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= quiz.passing_score

    // Save attempt
    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      quiz_id: quiz.id,
      score,
      passed,
      answers: finalAnswers,
      completed_at: new Date().toISOString(),
    })

    // Update study session
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('study_sessions')
      .select('id, quizzes_taken')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single()

    if (existing) {
      await supabase.from('study_sessions').update({ quizzes_taken: existing.quizzes_taken + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('study_sessions').insert({ user_id: userId, session_date: today, quizzes_taken: 1 })
    }

    // Check program completion → auto-generate certificate
    if (passed) {
      const { data: programData } = await supabase
        .from('modules')
        .select('program_id')
        .eq('id', quiz.module_id)
        .single()

      if (programData?.program_id) {
        const { data: allModules } = await supabase
          .from('modules')
          .select('id, lessons(id), quizzes(id)')
          .eq('program_id', programData.program_id)

        const { data: allProgress } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('completed', true)

        const { data: allPassed } = await supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('user_id', userId)
          .eq('passed', true)

        const completedSet = new Set((allProgress || []).map((p) => p.lesson_id))
        const passedSet = new Set([...(allPassed || []).map((q) => q.quiz_id), quiz.id])

        const allLessonsComplete = (allModules || []).every((m: any) => {
          const lessons = Array.isArray(m.lessons) ? m.lessons : m.lessons ? [m.lessons] : []
          return lessons.every((l: any) => completedSet.has(l.id))
        })
        const allQuizzesPassed = (allModules || []).every((m: any) => {
          const quizzes = Array.isArray(m.quizzes) ? m.quizzes : m.quizzes ? [m.quizzes] : []
          return quizzes.every((q: any) => passedSet.has(q.id))
        })

        if (allLessonsComplete && allQuizzesPassed) {
          const { data: existingCert } = await supabase
            .from('certificates')
            .select('id')
            .eq('user_id', userId)
            .eq('program_id', programData.program_id)
            .single()

          if (!existingCert) {
            const certNum = `ARMAH-${slug.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`
            await supabase.from('certificates').insert({
              user_id: userId,
              program_id: programData.program_id,
              certificate_number: certNum,
            })
          }
        }
      }
    }

    setResult({ score, passed, breakdown })
    setSubmitting(false)
    router.refresh()
  }

  // — Result screen —
  if (result) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className={`rounded-2xl p-8 text-center mb-6 ${result.passed ? 'bg-[#1A1A2E]' : 'bg-white border border-gray-100'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-[#C9A84C]/20 border border-[#C9A84C]/40' : 'bg-red-50 border border-red-200'}`}>
              {result.passed ? (
                <svg className="w-10 h-10 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <p className={`text-4xl font-bold mb-2 ${result.passed ? 'text-[#C9A84C]' : 'text-[#1A1A2E]'}`}>{result.score}%</p>
            <p className={`text-lg font-semibold mb-1 ${result.passed ? 'text-white' : 'text-[#1A1A2E]'}`}>
              {result.passed ? 'Passed!' : 'Not quite'}
            </p>
            <p className={`text-sm ${result.passed ? 'text-white/50' : 'text-gray-400'}`}>
              {result.passed
                ? 'Great job! You can now continue to the next module.'
                : `You need ${quiz.passing_score}% to pass. Keep practicing!`}
            </p>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-[#1A1A2E] text-sm mb-4">Review</h3>
            {result.breakdown.map((item, i) => (
              <div key={i} className={`p-4 rounded-xl border ${item.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <p className="text-sm font-medium text-[#1A1A2E] mb-2">{item.question}</p>
                <p className={`text-xs ${item.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                  Your answer: {item.selected ?? 'No answer'}
                </p>
                {!item.isCorrect && (
                  <p className="text-xs text-green-700 mt-0.5">Correct: {item.correct}</p>
                )}
                {item.explanation && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">{item.explanation}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/programs/${slug}`}
              className="flex-1 text-center bg-white border border-gray-200 hover:border-gray-300 text-[#1A1A2E] font-medium py-3 rounded-xl text-sm transition-colors"
            >
              Back to Program
            </Link>
            {result.passed ? (
              <Link
                href={`/programs/${slug}`}
                className="flex-1 text-center bg-[#C9A84C] hover:bg-[#E8C96D] text-[#1A1A2E] font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Continue
              </Link>
            ) : (
              canAttempt && (
                <button
                  onClick={() => { setStarted(false); setCurrentQ(0); setAnswers({}); setSelected(null); setResult(null) }}
                  className="flex-1 bg-[#1A1A2E] hover:bg-[#16213E] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  Try Again
                </button>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  // — Quiz in progress —
  if (started) {
    const progress = ((currentQ) / questions.length) * 100
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 font-medium">Question {currentQ + 1} of {questions.length}</span>
            <span className="text-sm text-gray-400">{quiz.passing_score}% to pass</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
            <div className="bg-[#C9A84C] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <p className="text-lg font-semibold text-[#1A1A2E] mb-6 leading-snug">{question.question_text}</p>

            <div className="space-y-3 mb-8">
              {question.quiz_options.map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    selected === opt.id
                      ? 'border-[#C9A84C] bg-[#C9A84C]/5 text-[#1A1A2E]'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  {opt.option_text}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selected || submitting}
              className="w-full bg-[#1A1A2E] hover:bg-[#16213E] disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Submitting...' : currentQ === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // — Start screen —
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link href={`/programs/${slug}`} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Program
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#1A1A2E] flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>

          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">{module?.title}</p>
          <h1 className="text-xl font-bold text-[#1A1A2E] mb-4">{quiz.title}</h1>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#1A1A2E]">{questions.length}</p>
              <p className="text-xs text-gray-400">Questions</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#1A1A2E]">{quiz.passing_score}%</p>
              <p className="text-xs text-gray-400">To Pass</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#1A1A2E]">{quiz.max_attempts}</p>
              <p className="text-xs text-gray-400">Max Attempts</p>
            </div>
          </div>

          {attempts.length > 0 && (
            <div className="mb-5 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Previous Attempts</p>
              {attempts.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Attempt {attempts.length - i}</span>
                  <span className={`font-semibold ${a.passed ? 'text-green-600' : 'text-red-500'}`}>
                    {a.score}% — {a.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {passedAttempt ? (
            <div className="text-center">
              <p className="text-green-600 font-semibold text-sm mb-4">You already passed this quiz!</p>
              <Link href={`/programs/${slug}`} className="inline-flex bg-[#C9A84C] hover:bg-[#E8C96D] text-[#1A1A2E] font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                Continue Program
              </Link>
            </div>
          ) : canAttempt ? (
            <div className="flex justify-center">
              <StarButton onClick={() => setStarted(true)} className="w-full justify-center py-3 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Start Quiz
              </StarButton>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-500 font-medium text-sm mb-4">No attempts remaining.</p>
              <Link href={`/programs/${slug}`} className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
                Back to Program
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
