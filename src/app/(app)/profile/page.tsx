import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getLast4Weeks(sessions: { session_date: string }[]) {
  const weeks = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  for (let w = 3; w >= 0; w--) {
    const weekDays = DAYS.map((_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() - w * 7 + i)
      const dateStr = d.toISOString().split('T')[0]
      return sessions.some((s) => s.session_date === dateStr)
    })
    weeks.push(weekDays)
  }
  return weeks
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, programs(title, slug, category)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('session_date, lessons_completed, quizzes_taken')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .limit(28)

  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('score, passed, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(10)

  const weeks = getLast4Weeks(sessions || [])
  const totalLessons = (sessions || []).reduce((sum, s) => sum + s.lessons_completed, 0)
  const passedQuizzes = (quizAttempts || []).filter((a) => a.passed).length
  const avgScore = quizAttempts && quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
    : 0

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#1A1A2E] rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/10 to-transparent" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#C9A84C] text-2xl font-bold">
                {profile?.full_name?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">{profile?.full_name}</h1>
              <p className="text-white/50 text-sm mt-0.5">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                  {profile?.role?.replace('_', ' ')}
                </span>
                {profile?.branch && (
                  <span className="bg-white/10 text-white/60 text-xs px-2.5 py-0.5 rounded-full">
                    {profile.branch}
                  </span>
                )}
              </div>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="text-white/30 hover:text-white/60 text-xs transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Current Streak', value: `🔥 ${profile?.current_streak}`, sub: 'days' },
          { label: 'Best Streak', value: profile?.longest_streak, sub: 'days' },
          { label: 'Study Days', value: profile?.total_study_days, sub: 'total' },
          { label: 'Certificates', value: certificates?.length ?? 0, sub: 'earned' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
            <p className="text-2xl font-bold text-[#1A1A2E]">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity grid — last 4 weeks */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-[#1A1A2E] mb-4">Activity — Last 4 Weeks</h2>
        <div className="flex items-center gap-1 mb-2">
          {DAYS.map((d) => (
            <span key={d} className="flex-1 text-center text-xs text-gray-300 font-medium">{d[0]}</span>
          ))}
        </div>
        <div className="space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex items-center gap-1">
              {week.map((active, di) => (
                <div
                  key={di}
                  className={`flex-1 h-7 rounded-lg transition-all ${active ? 'bg-[#C9A84C]' : 'bg-gray-100'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
          <span>{totalLessons} lessons completed</span>
          <span>{sessions?.length ?? 0} active days</span>
        </div>
      </div>

      {/* Quiz stats */}
      {quizAttempts && quizAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-[#1A1A2E] mb-4">Quiz Performance</h2>
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{avgScore}%</p>
              <p className="text-xs text-gray-400">Average score</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{passedQuizzes}</p>
              <p className="text-xs text-gray-400">Quizzes passed</p>
            </div>
          </div>
          <div className="space-y-2">
            {quizAttempts.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${a.passed ? 'bg-[#C9A84C]' : 'bg-red-300'}`}
                      style={{ width: `${a.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-8 text-right ${a.passed ? 'text-[#1A1A2E]' : 'text-red-400'}`}>
                    {a.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      <div>
        <h2 className="text-sm font-bold text-[#1A1A2E] mb-4">My Certificates</h2>
        {certificates && certificates.length > 0 ? (
          <div className="space-y-3">
            {certificates.map((cert: any) => (
              <Link
                key={cert.id}
                href={`/programs/${cert.programs?.slug}/certificate`}
                className="bg-[#1A1A2E] rounded-2xl p-5 flex items-center justify-between hover:bg-[#16213E] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{cert.programs?.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{cert.certificate_number}</p>
                    <p className="text-white/30 text-xs">
                      {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-white/20 group-hover:text-[#C9A84C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No certificates yet. Complete a program to earn one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
