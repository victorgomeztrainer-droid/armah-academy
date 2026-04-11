import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { updateUserProfile } from '@/app/admin/actions'
import { BRANDS, ROLES, getRoleInfo, getBrandForBranch } from '@/lib/branches'
import SubmitButton from '@/components/ui/SubmitButton'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getLast8Weeks(sessions: { session_date: string }[]) {
  const weeks = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  for (let w = 7; w >= 0; w--) {
    const week = DAYS.map((_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() - w * 7 + i)
      const dateStr = d.toISOString().split('T')[0]
      const active = sessions.some((s) => s.session_date === dateStr)
      const isToday = dateStr === today.toISOString().split('T')[0]
      return { active, isToday, dateStr }
    })
    weeks.push(week)
  }
  return weeks
}

export default async function UserDetailPage({ params, searchParams }: { params: { userId: string }, searchParams: { success?: string, error?: string } }) {
  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', me.id).single()
  if (!myProfile || !['super_admin', 'admin'].includes(myProfile.role)) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single()

  if (!profile) notFound()

  // Fetch all data in parallel
  const [
    { data: programs },
    { data: allLessons },
    { data: progressData },
    { data: sessions },
    { data: quizAttempts },
    { data: certificates },
  ] = await Promise.all([
    supabase.from('programs').select('id, title, slug').eq('is_published', true),
    supabase.from('lessons').select('id, module_id, modules(program_id)'),
    supabase.from('user_progress').select('lesson_id, completed_at').eq('user_id', params.userId).eq('completed', true),
    supabase.from('study_sessions').select('session_date, lessons_completed').eq('user_id', params.userId).order('session_date', { ascending: false }).limit(56),
    supabase.from('quiz_attempts').select('quiz_id, score, passed, completed_at, quizzes(title)').eq('user_id', params.userId).order('completed_at', { ascending: false }),
    supabase.from('certificates').select('program_id, certificate_number, issued_at, programs(title)').eq('user_id', params.userId),
  ])

  const weeks = getLast8Weeks(sessions || [])
  const totalLessonsCompleted = (sessions || []).reduce((s, r) => s + r.lessons_completed, 0)
  const passedQuizzes = (quizAttempts || []).filter((a) => a.passed).length
  const avgScore = quizAttempts && quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length)
    : 0

  const brand = profile.branch ? getBrandForBranch(profile.branch) : null
  const roleInfo = getRoleInfo(profile.role)

  // Program progress
  const programProgress = (programs || []).map((p) => {
    const total = (allLessons || []).filter((l: any) => l.modules?.program_id === p.id).length
    const done = (progressData || []).filter((pr: any) => {
      const lesson = (allLessons || []).find((l: any) => l.id === pr.lesson_id)
      return (lesson as any)?.modules?.program_id === p.id
    }).length
    const certified = (certificates || []).some((c) => c.program_id === p.id)
    return { ...p, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0, certified }
  }).filter((p) => p.total > 0)

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const activeThisWeek = (sessions || []).some((s) => s.session_date >= weekAgo)

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">

      {/* Toast feedback */}
      {searchParams.success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
          ✓ {searchParams.success.replace(/\+/g, ' ')}
        </div>
      )}
      {searchParams.error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>
          ✗ {searchParams.error}
        </div>
      )}

      {/* Back */}
      <Link href="/admin/users"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Users
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl p-7 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C9A84C, transparent 70%)' }} />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
              <span className="text-2xl font-bold" style={{ color: '#C9A84C' }}>
                {profile.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{profile.full_name}</h1>
              <p className="text-white/50 text-sm">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                  style={{ background: roleInfo.bg, color: roleInfo.color }}>
                  {roleInfo.label}
                </span>
                {profile.branch && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    {profile.branch}
                  </span>
                )}
                {brand && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${brand.color}20`, color: brand.color }}>
                    {brand.name} · {brand.city}
                  </span>
                )}
                {activeThisWeek && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(22,163,74,0.2)', color: '#4ADE80' }}>
                    Active this week
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {[
              { label: 'Streak', value: `🔥 ${profile.current_streak ?? 0}` },
              { label: 'Study Days', value: profile.total_study_days ?? 0 },
              { label: 'Certificates', value: (certificates || []).length },
              { label: 'Avg Score', value: `${avgScore}%` },
            ].map((s) => (
              <div key={s.label} className="text-center px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT — Activity + Progress ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Activity heatmap — last 8 weeks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider">Activity — Last 8 Weeks</h2>
              <span className="text-xs text-gray-400">{totalLessonsCompleted} lessons total</span>
            </div>
            <div className="flex items-center gap-1 mb-2 pl-8">
              {DAYS.map((d) => (
                <span key={d} className="flex-1 text-center text-[10px] text-gray-300 font-medium">{d[0]}</span>
              ))}
            </div>
            <div className="space-y-1">
              {weeks.map((week, wi) => {
                const weekNum = 8 - wi
                const label = wi === 7 ? 'This' : wi === 6 ? 'Last' : `${weekNum}w`
                return (
                  <div key={wi} className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-300 w-7 text-right flex-shrink-0">{label}</span>
                    {week.map((day, di) => (
                      <div
                        key={di}
                        title={day.dateStr}
                        className="flex-1 h-6 rounded-md transition-all"
                        style={{
                          background: day.active ? '#C9A84C' : '#F3F3EF',
                          boxShadow: day.isToday ? '0 0 0 1.5px #C9A84C' : 'none',
                          opacity: day.active ? 1 : 0.8,
                        }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#C9A84C' }} />
                Active
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#F3F3EF' }} />
                Inactive
              </div>
            </div>
          </div>

          {/* Program progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Program Progress</h2>
            {programProgress.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No program activity yet</p>
            ) : (
              <div className="space-y-4">
                {programProgress.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1A1A2E]">{p.title}</span>
                        {p.certified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
                            ✓ Certified
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#1A1A2E]">{p.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: '#F3F3EF' }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{
                          width: `${p.pct}%`,
                          background: p.certified
                            ? 'linear-gradient(90deg, #C9A84C, #E8C96D)'
                            : 'linear-gradient(90deg, #1A1A2E, #374151)',
                        }} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.done} / {p.total} lessons</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quiz history */}
          {quizAttempts && quizAttempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">
                Quiz Attempts
                <span className="ml-2 font-normal text-gray-400">{passedQuizzes} passed</span>
              </h2>
              <div className="space-y-2">
                {(quizAttempts as any[]).slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={a.passed
                        ? { background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }
                        : { background: '#FFF1F2', color: '#BE123C' }
                      }>
                      {a.passed ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A2E] truncate">{(a.quizzes as any)?.title ?? 'Quiz'}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: '#F3F3EF' }}>
                        <div className="h-1.5 rounded-full"
                          style={{ width: `${a.score}%`, background: a.passed ? '#C9A84C' : '#F87171' }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: a.passed ? '#1A1A2E' : '#DC2626' }}>
                        {a.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {certificates && certificates.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Certificates Earned</h2>
              <div className="space-y-2">
                {(certificates as any[]).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: '#F8F8F5', border: '1px solid #EEEEEA' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                      <svg className="w-4 h-4" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{c.programs?.title}</p>
                      <p className="text-[10px] text-gray-400">{c.certificate_number} · {new Date(c.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — Edit Profile ──────────────────────────────── */}
        <div className="space-y-5">

          {/* Edit form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider">Edit Profile</h2>
            </div>
            <form action={updateUserProfile.bind(null, params.userId)} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                <input name="full_name" defaultValue={profile.full_name}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Role</label>
                <select name="role" defaultValue={profile.role}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] bg-white">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Branch / Sede</label>
                <select name="branch" defaultValue={profile.branch ?? ''}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] bg-white">
                  <option value="">— No branch —</option>
                  {Object.values(BRANDS).map((brand) => (
                    <optgroup key={brand.id} label={`${brand.name} (${brand.city})`}>
                      {brand.branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <SubmitButton loadingText="Saving...">Save Changes</SubmitButton>
            </form>
          </div>

          {/* Account info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-3">Account Info</h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Email', value: profile.email },
                { label: 'Status', value: profile.is_approved ? 'Approved' : 'Pending' },
                { label: 'Best Streak', value: `${profile.longest_streak ?? 0} days` },
                { label: 'Last Active', value: profile.last_activity_date
                    ? new Date(profile.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never' },
                { label: 'Joined', value: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-[#1A1A2E]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link to view as user */}
          <div className="rounded-2xl p-4 text-center"
            style={{ background: '#F8F8F5', border: '1px solid #EEEEEA' }}>
            <p className="text-xs text-gray-400 mb-3">See what this user has access to in the platform</p>
            <Link href="/programs"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all"
              style={{ background: '#1A1A2E', color: 'white' }}>
              <svg className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Programs Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
