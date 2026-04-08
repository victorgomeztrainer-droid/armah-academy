import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import LessonPlayer from './LessonPlayer'

export default async function LessonPage({
  params,
}: {
  params: { slug: string; moduleId: string; lessonId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, modules(id, title, program_id, sort_order, programs(id, title, slug))')
    .eq('id', params.lessonId)
    .single()

  if (!lesson) notFound()

  const program = (lesson.modules as any)?.programs
  const moduleData = lesson.modules as any

  // All modules for sidebar
  const { data: allModules } = await supabase
    .from('modules')
    .select('id, title, sort_order, lessons(id, title, sort_order, lesson_type)')
    .eq('program_id', program.id)
    .order('sort_order', { ascending: true })

  // Program-level quiz
  const { data: programQuiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('program_id', program.id)
    .single()

  // User progress
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('completed', true)

  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, passed')
    .eq('user_id', user.id)
    .eq('passed', true)

  // Resources
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('lesson_id', params.lessonId)

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id))
  const passedQuizIds = new Set((quizAttempts || []).filter((q) => q.passed).map((q) => q.quiz_id))

  const sortedModules = [...(allModules || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)

  // Current module lessons sorted
  const currentModule = sortedModules.find((m: any) => m.id === params.moduleId) as any
  const sortedLessons = [...(currentModule?.lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const currentIdx = sortedLessons.findIndex((l: any) => l.id === params.lessonId)
  const nextLesson = sortedLessons[currentIdx + 1] || null

  // Next module first lesson
  const currentModuleIdx = sortedModules.findIndex((m: any) => m.id === params.moduleId)
  const nextModule = sortedModules[currentModuleIdx + 1] as any
  const nextModuleFirstLesson = nextModule
    ? [...(nextModule.lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
    : null

  // All lessons in module done?
  const allModuleLessonsDone = sortedLessons.every(
    (l: any) => completedIds.has(l.id) || l.id === params.lessonId
  )

  // All lessons in program done (including this one)?
  const allProgramLessons = sortedModules.flatMap((m: any) => m.lessons || [])
  const allProgramLessonsDone = allProgramLessons.every(
    (l: any) => completedIds.has(l.id) || l.id === params.lessonId
  )

  // Lock helper for sidebar
  function isModuleLocked(modIdx: number): boolean {
    if (modIdx === 0) return false
    const prev = sortedModules[modIdx - 1] as any
    const prevLessons = prev?.lessons || []
    return !prevLessons.every((l: any) => completedIds.has(l.id))
  }

  function lessonTypeIcon(type: string) {
    if (type === 'reading') return (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
    if (type === 'presentation') return (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    )
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 min-h-screen flex-shrink-0">
        {/* Back link + progress */}
        <div className="p-5 border-b border-gray-100">
          <Link
            href={`/programs/${params.slug}`}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs mb-4 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {program?.title}
          </Link>
          {(() => {
            const total = allProgramLessons.length
            const done = allProgramLessons.filter((l: any) => completedIds.has(l.id)).length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold text-[#1A1A2E]">{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }}
                  />
                </div>
              </>
            )
          })()}
        </div>

        {/* Module/lesson list */}
        <nav className="flex-1 overflow-y-auto py-3">
          {sortedModules.map((mod: any, modIdx: number) => {
            const modLessons = [...(mod.lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
            const locked = isModuleLocked(modIdx)

            return (
              <div key={mod.id} className="mb-1">
                {/* Module label */}
                <div className="flex items-center gap-2 px-4 py-2">
                  {locked ? (
                    <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : null}
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider truncate">
                    {mod.title}
                  </span>
                </div>

                {!locked && modLessons.map((l: any) => {
                  const done = completedIds.has(l.id)
                  const active = l.id === params.lessonId
                  return (
                    <Link
                      key={l.id}
                      href={`/programs/${params.slug}/${mod.id}/lessons/${l.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                      style={active
                        ? { background: 'rgba(201,168,76,0.08)', borderRight: '2px solid #C9A84C', color: '#1A1A2E' }
                        : { color: '#9CA3AF' }
                      }
                    >
                      <div
                        className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center"
                        style={done
                          ? { background: '#C9A84C', borderColor: '#C9A84C' }
                          : active
                            ? { borderColor: '#C9A84C' }
                            : { borderColor: '#D1D5DB' }
                        }
                      >
                        {done && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[11px] leading-tight flex-1 truncate ${active ? 'font-semibold text-[#1A1A2E]' : ''}`}>
                        {l.title}
                      </span>
                      <span className="text-gray-300 flex-shrink-0">
                        {lessonTypeIcon(l.lesson_type)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )
          })}

          {/* Final quiz in sidebar */}
          {programQuiz && (
            <div className="mt-2 mx-3">
              <div className="h-px bg-gray-100 mb-2" />
              <Link
                href={`/programs/${params.slug}/quiz`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 group"
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                  style={passedQuizIds.has(programQuiz.id)
                    ? { background: '#C9A84C' }
                    : { background: '#1A1A2E' }
                  }
                >
                  <svg className="w-2.5 h-2.5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-[#1A1A2E] group-hover:text-[#C9A84C] transition-colors truncate">
                  Final Certification Quiz
                </span>
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <LessonPlayer
          lesson={lesson}
          resources={resources || []}
          slug={params.slug}
          moduleId={params.moduleId}
          isCompleted={completedIds.has(params.lessonId)}
          allModuleLessonsDone={allModuleLessonsDone}
          nextLesson={nextLesson ? { id: nextLesson.id, moduleId: params.moduleId } : null}
          nextModuleFirstLesson={nextModuleFirstLesson ? { id: nextModuleFirstLesson.id, moduleId: nextModule?.id } : null}
          userId={user.id}
          programQuizId={programQuiz?.id || null}
          allProgramLessonsDone={allProgramLessonsDone}
        />
      </div>
    </div>
  )
}
