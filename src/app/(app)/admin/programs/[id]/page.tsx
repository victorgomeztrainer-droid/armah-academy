import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  updateProgram, createModule, deleteModule,
  createLesson, deleteLesson, createQuiz, createQuestion, deleteQuestion,
} from '@/app/admin/actions'

export default async function EditProgramPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'admin'].includes(me.role)) redirect('/dashboard')

  const { data: program } = await supabase.from('programs').select('*').eq('id', params.id).single()
  if (!program) notFound()

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('program_id', params.id)
    .order('sort_order', { ascending: true })

  // Program-level quiz
  const { data: programQuiz } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_options(*))')
    .eq('program_id', params.id)
    .single()

  const questions = programQuiz
    ? [...(programQuiz.quiz_questions || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
    : []

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <Link href="/admin/programs" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Programs
      </Link>

      {/* Program settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-5">Program Settings</h2>
        <form action={updateProgram.bind(null, params.id)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Title</label>
              <input name="title" defaultValue={program.title} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Slug</label>
              <input name="slug" defaultValue={program.slug} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
            <textarea name="description" defaultValue={program.description ?? ''} rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
              <input name="category" defaultValue={program.category ?? ''}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Difficulty</label>
              <select name="difficulty" defaultValue={program.difficulty ?? ''}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors bg-white">
                <option value="">Select...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Est. Hours</label>
              <input name="estimated_hours" type="number" step="0.5" defaultValue={program.estimated_hours ?? ''}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_published" defaultChecked={program.is_published} className="w-4 h-4 accent-[#C9A84C]" />
              <span className="text-sm font-medium text-[#1A1A2E]">Published</span>
            </label>
            <button type="submit"
              className="bg-[#1A1A2E] hover:bg-[#16213E] text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Modules */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Modules</h2>
        <div className="space-y-4 mb-4">
          {(modules || []).map((mod: any) => {
            const sortedLessons = [...(mod.lessons || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <div>
                    <span className="font-semibold text-[#1A1A2E] text-sm">{mod.title}</span>
                    {mod.is_prerequisite && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Prerequisite</span>
                    )}
                    <span className="ml-2 text-xs text-gray-400">{sortedLessons.length} lessons</span>
                  </div>
                  <form action={deleteModule.bind(null, mod.id, params.id)}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
                      Delete
                    </button>
                  </form>
                </div>

                <div className="p-5 space-y-4">
                  {sortedLessons.length > 0 && (
                    <div className="space-y-1.5">
                      {sortedLessons.map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 group">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 flex-shrink-0 w-16">
                              {lesson.lesson_type}
                            </span>
                            <span className="text-sm text-[#1A1A2E] truncate">{lesson.title}</span>
                            {lesson.duration_minutes && (
                              <span className="text-xs text-gray-400 flex-shrink-0">{lesson.duration_minutes}m</span>
                            )}
                          </div>
                          <form action={deleteLesson.bind(null, lesson.id, params.id)}>
                            <button type="submit"
                              className="text-xs text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2">
                              ×
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add lesson */}
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-semibold text-[#C9A84C] hover:text-[#E8C96D] transition-colors list-none flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Lesson
                    </summary>
                    <form action={createLesson.bind(null, mod.id, params.id)} className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                      <input name="title" required placeholder="Lesson title"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                      <input name="video_url" placeholder="YouTube URL (optional)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                      <div className="grid grid-cols-2 gap-3">
                        <input name="duration_minutes" type="number" placeholder="Duration (min)"
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                        <select name="lesson_type"
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors bg-white">
                          <option value="video">Video</option>
                          <option value="reading">Reading</option>
                          <option value="presentation">Presentation</option>
                        </select>
                      </div>
                      <textarea name="description" placeholder="Description / coaching cues" rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" />
                      <button type="submit"
                        className="w-full bg-[#1A1A2E] text-white font-medium py-2 rounded-xl text-sm hover:bg-[#16213E] transition-colors">
                        Add Lesson
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add module */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">Add Module</h3>
          <form action={createModule.bind(null, params.id)} className="space-y-3">
            <input name="title" required placeholder="Module title"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
            <textarea name="description" placeholder="Description (optional)" rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_prerequisite" className="w-4 h-4 accent-[#C9A84C]" />
                <span className="text-sm text-gray-600">Is prerequisite</span>
              </label>
              <button type="submit"
                className="bg-[#1A1A2E] hover:bg-[#16213E] text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors">
                Add Module
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Program-level Quiz */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A1A2E]">Final Certification Quiz</h2>
            <p className="text-xs text-gray-400">Unlocks after all lessons are complete</p>
          </div>
        </div>

        {programQuiz ? (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">{programQuiz.title}</p>
                <p className="text-xs text-gray-400">{programQuiz.passing_score}% to pass · {programQuiz.max_attempts} attempts · {questions.length} questions</p>
              </div>
            </div>

            {/* Questions list */}
            {questions.length > 0 && (
              <div className="space-y-2 mb-4">
                {questions.map((q: any, i: number) => (
                  <div key={q.id} className="flex items-start justify-between py-3 px-4 rounded-xl bg-gray-50 group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A1A2E] mb-1">
                        <span className="text-gray-400 mr-1.5">Q{i + 1}.</span>{q.question_text}
                      </p>
                      <p className="text-xs text-green-600">
                        ✓ {q.quiz_options?.find((o: any) => o.is_correct)?.option_text}
                      </p>
                    </div>
                    <form action={deleteQuestion.bind(null, q.id, params.id)}>
                      <button type="submit"
                        className="text-xs text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-3 flex-shrink-0">
                        ×
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            {/* Add question */}
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-[#C9A84C] hover:text-[#E8C96D] transition-colors list-none flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Question
              </summary>
              <form action={createQuestion.bind(null, programQuiz.id, params.id)} className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                <textarea name="question_text" required placeholder="Question text" rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <input key={idx} name={`option_${letter.toLowerCase()}`} placeholder={`Option ${letter}`}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Correct answer</label>
                  <select name="correct_option"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors bg-white">
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                  </select>
                </div>
                <textarea name="explanation" placeholder="Explanation (shown after answering)" rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" />
                <button type="submit"
                  className="w-full bg-[#1A1A2E] text-white font-medium py-2 rounded-xl text-sm hover:bg-[#16213E] transition-colors">
                  Add Question
                </button>
              </form>
            </details>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400 mb-4">No certification quiz yet. Create one below.</p>
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-[#C9A84C] hover:text-[#E8C96D] transition-colors list-none flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Certification Quiz
              </summary>
              <form action={createQuiz.bind(null, params.id)} className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                <input name="title" required placeholder="Quiz title (e.g. CORE V3 — Final Certification Quiz)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Passing score (%)</label>
                    <input name="passing_score" type="number" defaultValue={70}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Max attempts</label>
                    <input name="max_attempts" type="number" defaultValue={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" />
                  </div>
                </div>
                <button type="submit"
                  className="w-full bg-[#1A1A2E] text-white font-medium py-2 rounded-xl text-sm hover:bg-[#16213E] transition-colors">
                  Create Quiz
                </button>
              </form>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
