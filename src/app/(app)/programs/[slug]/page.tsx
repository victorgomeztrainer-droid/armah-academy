import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!program) notFound()

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(id, title, sort_order, duration_minutes, lesson_type)')
    .eq('program_id', program.id)
    .order('sort_order', { ascending: true })

  // Fetch the final certification quiz (module_id is null = program-level)
  const { data: quizzesData } = await supabase
    .from('quizzes')
    .select('id, title, passing_score, max_attempts, module_id')
    .eq('program_id', program.id)
    .order('created_at', { ascending: false })

  // Use the quiz with no module_id (program-level final exam)
  const programQuiz = (quizzesData || []).find((q) => !q.module_id) ?? (quizzesData?.[0] ?? null)

  const { data: progressData } = await supabase
    .from('user_progress')
    .select('lesson_id, completed')
    .eq('user_id', user.id)
    .eq('completed', true)

  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, passed')
    .eq('user_id', user.id)
    .eq('passed', true)

  const completedLessonIds = new Set((progressData || []).map((p) => p.lesson_id))
  const passedQuizIds = new Set((quizAttempts || []).map((q) => q.quiz_id))

  const allLessons = (modules || []).flatMap((m: any) =>
    [...(m.lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  )
  const totalLessons = allLessons.length
  const completedLessons = allLessons.filter((l: any) => completedLessonIds.has(l.id)).length
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const allLessonsComplete = completedLessons === totalLessons && totalLessons > 0
  const quizPassed = programQuiz ? passedQuizIds.has(programQuiz.id) : false

  function isModuleLocked(modIndex: number): boolean {
    if (modIndex === 0) return false
    const prevModule = (modules || [])[modIndex - 1] as any
    if (!prevModule) return false
    const prevLessons = (prevModule.lessons || []) as any[]
    return !prevLessons.every((l: any) => completedLessonIds.has(l.id))
  }

  // Check certificate
  const { data: certificate } = await supabase
    .from('certificates')
    .select('certificate_number')
    .eq('user_id', user.id)
    .eq('program_id', program.id)
    .single()

  // Find resume lesson (first incomplete)
  let resumeLesson: { moduleId: string; lessonId: string } | null = null
  for (const mod of modules || []) {
    const sorted = [...((mod as any).lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
    for (const lesson of sorted) {
      if (!completedLessonIds.has(lesson.id)) {
        resumeLesson = { moduleId: mod.id, lessonId: lesson.id }
        break
      }
    }
    if (resumeLesson) break
  }

  // Lesson type icon helper
  function lessonTypeIcon(type: string) {
    if (type === 'reading') return (
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
    if (type === 'presentation') return (
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    )
    // default: video
    return (
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    )
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/programs" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Programs
      </Link>

      {/* Header card */}
      <div className="bg-[#1A1A2E] rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/10 to-transparent pointer-events-none" />
        <div className="relative">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest">{program.category}</span>
          <h1 className="text-white text-3xl font-bold mt-2 mb-3">{program.title}</h1>
          {program.description && (
            <p className="text-white/60 text-sm leading-relaxed max-w-2xl mb-6">{program.description}</p>
          )}

          <div className="flex items-center gap-5 mb-6">
            <div className="flex items-center gap-1.5 text-white/50 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {totalLessons} lessons
            </div>
            {program.estimated_hours && (
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {program.estimated_hours}h
              </div>
            )}
            <span className="capitalize text-white/50 text-sm">{program.difficulty}</span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 bg-white/10 rounded-full h-2">
              <div className="bg-[#C9A84C] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white/70 text-sm font-medium w-12 text-right">{pct}%</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {certificate ? (
              <Link
                href={`/programs/${program.slug}/certificate`}
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                View Certificate
              </Link>
            ) : resumeLesson ? (
              <Link
                href={`/programs/${program.slug}/${resumeLesson.moduleId}/lessons/${resumeLesson.lessonId}`}
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {completedLessons > 0 ? 'Continue Learning' : 'Start Course'}
              </Link>
            ) : null}

            {allLessonsComplete && !quizPassed && programQuiz && !certificate && (
              <Link
                href={`/programs/${program.slug}/quiz`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Take Certification Quiz
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-4">
        {(modules || []).map((mod: any, modIndex: number) => {
          const locked = isModuleLocked(modIndex)
          const modLessons = [...(mod.lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
          const modCompleted = modLessons.filter((l: any) => completedLessonIds.has(l.id)).length
          const modTotal = modLessons.length
          const allModLessonsDone = modCompleted === modTotal && modTotal > 0

          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border overflow-hidden shadow-sm transition-all"
              style={locked
                ? { borderColor: '#F1F1F1', opacity: 0.6 }
                : { borderColor: allModLessonsDone ? 'rgba(201,168,76,0.25)' : '#F1F1F1' }
              }
            >
              {/* Module header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  {locked ? (
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  ) : allModLessonsDone ? (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.12)' }}>
                      <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{modIndex + 1}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[#1A1A2E] text-sm">{mod.title}</h3>
                    {locked
                      ? <p className="text-gray-400 text-xs mt-0.5">Complete previous module to unlock</p>
                      : <p className="text-gray-400 text-xs mt-0.5">{modCompleted}/{modTotal} lessons complete</p>
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mod.is_prerequisite && (
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
                      Prerequisite
                    </span>
                  )}
                  {!locked && modTotal > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                      {Math.round((modCompleted / modTotal) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Lessons */}
              {!locked && (
                <div className="divide-y divide-gray-50">
                  {modLessons.map((lesson: any) => {
                    const done = completedLessonIds.has(lesson.id)
                    return (
                      <Link
                        key={lesson.id}
                        href={`/programs/${program.slug}/${mod.id}/lessons/${lesson.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${done ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-gray-200 group-hover:border-[#C9A84C]'}`}>
                          {done && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className={`text-gray-400 ${done ? 'text-gray-300' : 'group-hover:text-[#C9A84C]'} transition-colors`}>
                            {lessonTypeIcon(lesson.lesson_type)}
                          </span>
                          <p className={`text-sm font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-[#1A1A2E]'}`}>
                            {lesson.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.duration_minutes && (
                            <span className="text-xs text-gray-400">{lesson.duration_minutes}m</span>
                          )}
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#C9A84C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Final Certification Quiz card */}
        {programQuiz && (
          <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${allLessonsComplete ? 'border-[#C9A84C]/30' : 'border-gray-100 opacity-60'}`}>
            <div className="p-5 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={quizPassed
                  ? { background: 'rgba(201,168,76,0.12)' }
                  : allLessonsComplete
                    ? { background: '#1A1A2E' }
                    : { background: '#F1F1F1' }
                }
              >
                {quizPassed ? (
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    style={{ color: allLessonsComplete ? '#C9A84C' : '#9CA3AF' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-[#1A1A2E] text-sm">{programQuiz.title}</h3>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
                  >
                    Final Quiz
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {quizPassed
                    ? 'Passed ✓ — Certificate earned'
                    : allLessonsComplete
                      ? `${programQuiz.passing_score}% to pass · ${programQuiz.max_attempts} attempts`
                      : 'Complete all lessons to unlock'}
                </p>
              </div>

              {allLessonsComplete ? (
                <Link
                  href={`/programs/${program.slug}/quiz`}
                  className="flex-shrink-0 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                  style={quizPassed
                    ? { background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }
                    : { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }
                  }
                >
                  {quizPassed ? 'View Results' : 'Start Quiz'}
                </Link>
              ) : (
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
