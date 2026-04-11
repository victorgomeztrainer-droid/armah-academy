'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import StarButton from '@/components/ui/StarButton'

interface Props {
  quiz: any
  program: { id: string; title: string; slug: string }
  slug: string
  userId: string
  attempts: any[]
  passedAttempt: any | null
  canAttempt: boolean
  allLessonsComplete: boolean
}

export default function QuizClient({
  quiz,
  program,
  slug,
  userId,
  attempts,
  passedAttempt,
  canAttempt,
  allLessonsComplete,
}: Props) {
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

    // Score calculation
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

    // Save quiz attempt
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
    const { data: existingSession } = await supabase
      .from('study_sessions')
      .select('id, quizzes_taken')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single()

    if (existingSession) {
      await supabase
        .from('study_sessions')
        .update({ quizzes_taken: existingSession.quizzes_taken + 1 })
        .eq('id', existingSession.id)
    } else {
      await supabase
        .from('study_sessions')
        .insert({ user_id: userId, session_date: today, quizzes_taken: 1 })
    }

    // If passed → generate certificate
    if (passed) {
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('program_id', program.id)
        .maybeSingle()

      if (!existingCert) {
        const certNum = `ARMAH-${slug.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`
        await supabase.from('certificates').insert({
          user_id: userId,
          program_id: program.id,
          certificate_number: certNum,
        })
      }
    }

    setResult({ score, passed, breakdown })
    setSubmitting(false)
    router.refresh()
  }

  // ─── LOCKED: lessons not yet complete ───────────────────────────────────────
  if (!allLessonsComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4F4F0' }}>
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">Quiz Locked</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Complete all lessons in every module to unlock the Final Certification Quiz.
            </p>
            <Link
              href={`/programs/${slug}`}
              className="inline-flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#16213E] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Continue Learning
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULT SCREEN ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4F4F0' }}>
        <div className="w-full max-w-xl">
          {/* Score card */}
          <div
            className="rounded-2xl p-8 text-center mb-5"
            style={result.passed ? { background: '#1A1A2E' } : { background: 'white', border: '1px solid #E5E5E5' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={result.passed
                ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)' }
                : { background: '#FEF2F2', border: '1px solid #FECACA' }
              }
            >
              {result.passed ? (
                <svg className="w-10 h-10" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <p className="text-5xl font-bold mb-2" style={result.passed ? { color: '#C9A84C' } : { color: '#1A1A2E' }}>
              {result.score}%
            </p>
            <p className="text-lg font-bold mb-1" style={result.passed ? { color: 'white' } : { color: '#1A1A2E' }}>
              {result.passed ? '🎉 Certification Passed!' : 'Not quite there yet'}
            </p>
            <p className="text-sm" style={result.passed ? { color: 'rgba(255,255,255,0.5)' } : { color: '#9CA3AF' }}>
              {result.passed
                ? 'Your certificate has been generated. Excellent work!'
                : `You need ${quiz.passing_score}% to pass. Review the material and try again.`}
            </p>
          </div>

          {/* Question breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Review Answers</h3>
            {result.breakdown.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={item.isCorrect
                  ? { background: '#F0FDF4', border: '1px solid #BBF7D0' }
                  : { background: '#FFF1F2', border: '1px solid #FECDD3' }
                }
              >
                <p className="text-sm font-semibold text-[#1A1A2E] mb-1.5">
                  Q{i + 1}. {item.question}
                </p>
                <p className={`text-xs font-medium ${item.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                  {item.isCorrect ? '✓ Correct' : `✗ You answered: ${item.selected ?? 'No answer'}`}
                </p>
                {!item.isCorrect && (
                  <p className="text-xs text-green-700 mt-0.5">Correct: {item.correct}</p>
                )}
                {item.explanation && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 leading-relaxed">
                    {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link
              href={`/programs/${slug}`}
              className="flex-1 text-center py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'white', border: '1px solid #E5E5E5', color: '#1A1A2E' }}
            >
              Back to Program
            </Link>
            {result.passed ? (
              <Link
                href={`/programs/${slug}/certificate`}
                className="flex-1 text-center py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}
              >
                🏆 View Certificate
              </Link>
            ) : (
              canAttempt && (
                <button
                  onClick={() => {
                    setStarted(false)
                    setCurrentQ(0)
                    setAnswers({})
                    setSelected(null)
                    setResult(null)
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: '#1A1A2E' }}
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

  // ─── QUIZ IN PROGRESS ────────────────────────────────────────────────────────
  if (started) {
    const progress = (currentQ / questions.length) * 100
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4F4F0' }}>
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-medium">
              Question {currentQ + 1} of {questions.length}
            </span>
            <span className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full">
              {quiz.passing_score}% to pass
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-7">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }}
            />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <p className="text-lg font-bold text-[#1A1A2E] mb-6 leading-snug">{question.question_text}</p>

            <div className="space-y-3 mb-7">
              {question.quiz_options.map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className="w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-sm font-medium"
                  style={
                    selected === opt.id
                      ? { borderColor: '#C9A84C', background: 'rgba(201,168,76,0.06)', color: '#1A1A2E' }
                      : { borderColor: '#F1F1F1', color: '#6B7280' }
                  }
                >
                  {opt.option_text}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selected || submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: '#1A1A2E' }}
            >
              {submitting
                ? 'Submitting...'
                : currentQ === questions.length - 1
                ? 'Submit Quiz'
                : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── START SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4F4F0' }}>
      <div className="w-full max-w-lg">
        <Link
          href={`/programs/${slug}`}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Program
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: '#1A1A2E' }}
          >
            <svg className="w-7 h-7" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>

          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{program.title}</p>
          <h1 className="text-xl font-bold text-[#1A1A2E] mb-5">{quiz.title}</h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Questions', value: questions.length },
              { label: 'To Pass', value: `${quiz.passing_score}%` },
              { label: 'Max Attempts', value: quiz.max_attempts },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#F8F8F5' }}>
                <p className="text-xl font-bold text-[#1A1A2E]">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Attempts history */}
          {attempts.length > 0 && (
            <div className="mb-5 p-4 rounded-xl" style={{ background: '#F8F8F5' }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Previous Attempts</p>
              {attempts.map((a: any, i: number) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-0.5">
                  <span className="text-gray-500">Attempt {attempts.length - i}</span>
                  <span className={`font-semibold ${a.passed ? 'text-green-600' : 'text-red-500'}`}>
                    {a.score}% — {a.passed ? 'Passed ✓' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action */}
          {passedAttempt ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                You already passed this certification!
              </div>
              <Link
                href={`/programs/${slug}/certificate`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}
              >
                🏆 View Certificate
              </Link>
            </div>
          ) : canAttempt ? (
            <div className="flex justify-center">
              <StarButton onClick={() => setStarted(true)} className="w-full justify-center py-3.5 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Start Certification Evaluation
              </StarButton>
            </div>
          ) : (
            <div className="text-center p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-red-500 font-semibold text-sm mb-3">No attempts remaining.</p>
              <Link
                href={`/programs/${slug}`}
                className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
              >
                Back to Program
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
