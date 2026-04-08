import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekActivity(sessions: { session_date: string }[]) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  return DAYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const active = sessions.some((s) => s.session_date === dateStr)
    const isToday = dateStr === today.toISOString().split('T')[0]
    return { active, isToday }
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_approved) redirect('/pending-approval')

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug, thumbnail_url, category, difficulty, estimated_hours, is_published')
    .order('is_published', { ascending: false })
    .order('created_at', { ascending: true })

  const { data: progressData } = await supabase
    .from('user_progress')
    .select('lesson_id, completed, lessons(module_id, modules(program_id))')
    .eq('user_id', user.id)
    .eq('completed', true)

  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, module_id, modules(program_id)')

  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, program_id, certificate_number, programs(title)')
    .eq('user_id', user.id)

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('session_date')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .limit(7)

  const weekActivity = getWeekActivity(sessions || [])

  const progressMap: Record<string, { completed: number; total: number }> = {}
  if (programs && allLessons) {
    for (const program of programs) {
      const total = allLessons.filter((l: any) => l.modules?.program_id === program.id).length
      const completed = (progressData || []).filter((p: any) => p.lessons?.modules?.program_id === program.id).length
      progressMap[program.id] = { total, completed }
    }
  }

  const publishedPrograms = (programs || []).filter((p) => p.is_published)
  const inProgressPrograms = publishedPrograms.filter((p) => {
    const prog = progressMap[p.id]
    return prog && prog.completed > 0 && prog.completed < prog.total
  })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">

      {/* Hero welcome */}
      <div className="relative rounded-2xl overflow-hidden mb-8 p-8"
        style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 60%, #16213E 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C9A84C, transparent 70%)' }} />
          <svg className="absolute bottom-0 right-0 opacity-5" width="300" height="200" viewBox="0 0 300 200">
            <polygon points="150,10 290,180 10,180" stroke="#C9A84C" strokeWidth="1.5" fill="none"/>
            <polygon points="150,40 260,170 40,170" stroke="#C9A84C" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: '#C9A84C' }}>
              Armah Academy
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
              Welcome back, {profile.full_name?.split(' ')[0]}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {profile.branch ?? 'Armah Sports'} · {profile.role?.replace('_', ' ')}
            </p>
          </div>

          {profile.last_lesson_id && profile.last_program_slug ? (
            <Link href={`/programs/${profile.last_program_slug}`}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Continue Learning
            </Link>
          ) : (
            <Link href="/programs"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}>
              Explore Programs
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Day Streak', value: profile.current_streak, icon: '🔥', highlight: true },
          { label: 'Study Days', value: profile.total_study_days, icon: '📅', highlight: false },
          { label: 'Certificates', value: certificates?.length ?? 0, icon: '🏆', highlight: false },
          { label: 'Best Streak', value: profile.longest_streak, icon: '⚡', highlight: false },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{s.icon}</span>
              {s.highlight && s.value > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                  Active
                </span>
              )}
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>{s.value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(26,26,46,0.4)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Week activity */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold" style={{ color: '#1A1A2E' }}>This Week</h2>
          <span className="text-xs" style={{ color: 'rgba(26,26,46,0.35)' }}>
            {weekActivity.filter(d => d.active).length} / 7 days active
          </span>
        </div>
        <div className="flex items-end gap-2">
          {DAYS.map((day, i) => {
            const { active, isToday } = weekActivity[i]
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full rounded-lg transition-all"
                  style={{
                    height: active ? '36px' : '16px',
                    background: active ? 'linear-gradient(180deg, #E8C96D, #C9A84C)' : '#EBEBEB',
                    boxShadow: isToday ? '0 0 0 2px #C9A84C' : 'none',
                  }} />
                <span className="text-[10px] font-semibold"
                  style={{ color: isToday ? '#C9A84C' : 'rgba(26,26,46,0.3)' }}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* In progress */}
      {inProgressPrograms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#1A1A2E' }}>Continue Learning</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {inProgressPrograms.map((program) => {
              const { completed, total } = progressMap[program.id]
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              return (
                <Link key={program.id} href={`/programs/${program.slug}`}
                  className="card card-hover p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1A1A2E, #16213E)' }}>
                    <svg className="w-5 h-5" fill="currentColor" style={{ color: '#C9A84C' }} viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1A1A2E' }}>{program.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#EBEBEB' }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                      </div>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: '#C9A84C' }}>{pct}%</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(26,26,46,0.35)' }}>{completed} / {total} lessons</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* All Programs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: '#1A1A2E' }}>
            Programs
            <span className="ml-2 text-xs font-normal" style={{ color: 'rgba(26,26,46,0.4)' }}>
              {publishedPrograms.length} available
            </span>
          </h2>
          <Link href="/programs" className="text-xs font-semibold transition-colors" style={{ color: '#C9A84C' }}>
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {publishedPrograms.slice(0, 3).map((program) => {
            const { completed, total } = progressMap[program.id] ?? { completed: 0, total: 0 }
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            return (
              <Link key={program.id} href={`/programs/${program.slug}`}
                className="card card-hover overflow-hidden group">
                <div className="h-28 relative flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0D0D1A, #1A1A2E)' }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ background: 'radial-gradient(circle at 70% 30%, #C9A84C, transparent 60%)' }} />
                  <span className="text-3xl relative z-10">
                    {program.category === 'Group Fitness' ? '🏋️' :
                     program.category === 'Recovery & Mobility' ? '🧘' :
                     program.category === 'Combat Fitness' ? '🥊' : '📚'}
                  </span>
                  {pct === 100 && (
                    <span className="absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}>
                      ✓ Done
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(26,26,46,0.4)' }}>{program.category}</p>
                  <p className="font-bold text-sm mb-3" style={{ color: '#1A1A2E' }}>{program.title}</p>
                  {pct > 0 ? (
                    <>
                      <div className="h-1 rounded-full mb-1" style={{ background: '#EBEBEB' }}>
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(26,26,46,0.35)' }}>{pct}% complete</p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold" style={{ color: '#C9A84C' }}>
                      Start course →
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#1A1A2E' }}>My Certificates</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #0D0D1A, #1A1A2E)', border: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <svg className="w-5 h-5" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{cert.programs?.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(201,168,76,0.6)' }}>{cert.certificate_number}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
