import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BRANDS, getRoleInfo, getBrandForBranch, canAccessAnalytics } from '@/lib/branches'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { brand?: string; branch?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role, branch, full_name')
    .eq('id', user.id)
    .single()

  if (!me || !canAccessAnalytics(me.role)) redirect('/dashboard')

  const isFullAdmin  = ['super_admin', 'admin'].includes(me.role)
  const isDirector   = me.role === 'director'
  const isManager    = me.role === 'manager'

  // ── Determine branch filter ───────────────────────────────────────────────
  // Managers are locked to their own branch; directors/admins can filter freely
  const filterBranch = isManager
    ? (me.branch ?? null)
    : (searchParams.branch ?? null)
  const filterBrand = isManager
    ? null
    : (searchParams.brand ?? null)

  // ── Fetch users ───────────────────────────────────────────────────────────
  let userQuery = supabase.from('profiles')
    .select('id, full_name, branch, role, current_streak, longest_streak, total_study_days, last_activity_date')
    .eq('is_approved', true)

  if (filterBranch) userQuery = userQuery.eq('branch', filterBranch)
  else if (filterBrand) {
    const brand = Object.values(BRANDS).find((b) => b.id === filterBrand)
    if (brand) userQuery = userQuery.in('branch', [...brand.branches])
  }

  const { data: users } = await userQuery.order('current_streak', { ascending: false })

  const { data: programs }      = await supabase.from('programs').select('id, title, slug').eq('is_published', true)
  const { data: allLessons }    = await supabase.from('lessons').select('id, module_id, modules(program_id)')
  const { data: allProgress }   = await supabase.from('user_progress').select('user_id, lesson_id, completed').eq('completed', true)
  const { data: allAttempts }   = await supabase.from('quiz_attempts').select('user_id, score, passed')
  const { data: certificates }  = await supabase.from('certificates').select('user_id, program_id')

  const { data: recentSessions } = await supabase
    .from('study_sessions')
    .select('user_id, session_date, lessons_completed')
    .order('session_date', { ascending: false })
    .limit(500)

  // ── Derived stats ─────────────────────────────────────────────────────────
  const userIds = new Set((users || []).map((u) => u.id))

  const filteredProgress  = (allProgress || []).filter((p) => userIds.has(p.user_id))
  const filteredAttempts  = (allAttempts || []).filter((a) => userIds.has(a.user_id))
  const filteredCerts     = (certificates || []).filter((c) => userIds.has(c.user_id))

  const totalUsers    = users?.length ?? 0
  const weekAgo       = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const activeThisWeek = (users || []).filter((u) => u.last_activity_date && u.last_activity_date >= weekAgo).length
  const totalCerts    = filteredCerts.length
  const avgQuizScore  = filteredAttempts.length > 0
    ? Math.round(filteredAttempts.reduce((s, a) => s + a.score, 0) / filteredAttempts.length)
    : 0

  // Sessions activity last 30 days (per day)
  const activityByDay: Record<string, number> = {}
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  for (const s of recentSessions || []) {
    if (!userIds.has(s.user_id)) continue
    if (s.session_date < thirtyAgo) continue
    activityByDay[s.session_date] = (activityByDay[s.session_date] ?? 0) + s.lessons_completed
  }
  const activityDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    const str = d.toISOString().split('T')[0]
    return { date: str, count: activityByDay[str] ?? 0 }
  })
  const maxActivity = Math.max(1, ...activityDays.map((d) => d.count))

  // Per-program stats
  const programStats = (programs || []).map((p) => {
    const totalLessons  = (allLessons || []).filter((l: any) => l.modules?.program_id === p.id).length
    const usersStarted  = new Set(filteredProgress.filter((pr) => {
      const lesson = (allLessons || []).find((l: any) => l.id === pr.lesson_id)
      return (lesson as any)?.modules?.program_id === p.id
    }).map((pr) => pr.user_id)).size
    const usersCompleted = filteredCerts.filter((c) => c.program_id === p.id).length
    const pct = totalUsers > 0 ? Math.round((usersStarted / totalUsers) * 100) : 0
    return { ...p, totalLessons, usersStarted, usersCompleted, pct }
  })

  // Branch breakdown (only for admins/directors seeing all)
  const branchMap: Record<string, { users: number; activeWeek: number }> = {}
  for (const u of users || []) {
    if (!u.branch) continue
    if (!branchMap[u.branch]) branchMap[u.branch] = { users: 0, activeWeek: 0 }
    branchMap[u.branch].users++
    if (u.last_activity_date && u.last_activity_date >= weekAgo) branchMap[u.branch].activeWeek++
  }

  // Leaderboard (top by streak)
  const leaderboard = [...(users || [])].sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0)).slice(0, 10)

  const activeBrand = filterBrand ? Object.values(BRANDS).find((b) => b.id === filterBrand) : null
  const filterLabel = isManager
    ? me.branch
    : filterBranch
      ? filterBranch
      : activeBrand
        ? `${activeBrand.name} — ${activeBrand.city}`
        : 'All Branches'

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isManager
              ? `Showing: ${me.branch ?? 'Your branch'}`
              : filterLabel}
            {' '}· {totalUsers} users
          </p>
        </div>

        {/* Filter bar (only for admins + directors) */}
        {(isFullAdmin || isDirector) && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/analytics"
              className="text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
              style={!filterBranch && !filterBrand
                ? { background: '#1A1A2E', color: 'white' }
                : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }
              }>
              All
            </Link>
            {Object.values(BRANDS).map((brand) => (
              <Link
                key={brand.id}
                href={`/admin/analytics?brand=${brand.id}`}
                className="text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                style={filterBrand === brand.id
                  ? { background: brand.color, color: 'white' }
                  : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }
                }>
                {brand.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Branch sub-filter when a brand is selected */}
      {(isFullAdmin || isDirector) && filterBrand && activeBrand && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/admin/analytics?brand=${filterBrand}`}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all"
            style={!filterBranch ? { background: '#1A1A2E', color: 'white', border: 'transparent' } : { color: '#6B7280', border: '#E5E7EB' }}>
            All {activeBrand.name}
          </Link>
          {activeBrand.branches.map((b) => (
            <Link
              key={b}
              href={`/admin/analytics?branch=${encodeURIComponent(b)}`}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all"
              style={filterBranch === b
                ? { background: activeBrand.color, color: 'white', border: 'transparent' }
                : { color: '#6B7280', border: '#E5E7EB' }
              }>
              {b}
            </Link>
          ))}
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: totalUsers, icon: '👥' },
          { label: 'Active This Week', value: activeThisWeek, icon: '🔥', sub: `${totalUsers > 0 ? Math.round((activeThisWeek / totalUsers) * 100) : 0}%` },
          { label: 'Certificates', value: totalCerts, icon: '🏆' },
          { label: 'Avg Quiz Score', value: `${avgQuizScore}%`, icon: '📊' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{stat.icon}</span>
              {stat.sub && (
                <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>{stat.sub}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-[#1A1A2E]">{stat.value}</p>
            <p className="text-gray-400 text-xs mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Activity chart — last 30 days */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider">Lessons Completed — Last 30 Days</h2>
          <span className="text-xs text-gray-400">
            {activityDays.reduce((s, d) => s + d.count, 0)} total
          </span>
        </div>
        <div className="flex items-end gap-0.5 h-16">
          {activityDays.map((day, i) => {
            const h = Math.max(4, Math.round((day.count / maxActivity) * 64))
            const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6
            return (
              <div
                key={i}
                title={`${day.date}: ${day.count} lessons`}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${h}px`,
                  background: day.count > 0
                    ? 'linear-gradient(180deg, #E8C96D, #C9A84C)'
                    : isWeekend ? '#F9F9F5' : '#EEEEEA',
                  minWidth: '4px',
                }}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-300">
          <span>{activityDays[0]?.date && new Date(activityDays[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span>Today</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">

        {/* Streak Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Streak Leaderboard</h2>
          <div className="space-y-2.5">
            {leaderboard.map((u, i) => {
              const roleInfo = getRoleInfo(u.role)
              const brandForBranch = u.branch ? getBrandForBranch(u.branch) : null
              return (
                <Link
                  key={u.id}
                  href={isFullAdmin ? `/admin/users/${u.id}` : '#'}
                  className={`flex items-center gap-3 py-1.5 rounded-xl ${isFullAdmin ? 'hover:bg-gray-50 transition-colors -mx-2 px-2' : ''}`}>
                  <span className="w-5 text-center text-xs font-bold flex-shrink-0"
                    style={{ color: i === 0 ? '#C9A84C' : i === 1 ? '#9CA3AF' : i === 2 ? '#B45309' : '#D1D5DB' }}>
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#C9A84C] text-xs font-bold">{u.full_name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">{u.full_name}</p>
                    <div className="flex items-center gap-1.5">
                      {u.branch && (
                        <span className="text-[10px] text-gray-400 truncate">{u.branch}</span>
                      )}
                      {brandForBranch && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: brandForBranch.color }} />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#1A1A2E] flex-shrink-0">
                    🔥 {u.current_streak ?? 0}
                  </span>
                </Link>
              )
            })}
            {leaderboard.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No activity yet</p>
            )}
          </div>
        </div>

        {/* Branch breakdown (admin/director) or per-program (manager) */}
        {!isManager ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">
              {filterBranch || filterBrand ? 'Branch Detail' : 'Users by Brand'}
            </h2>
            {filterBranch ? (
              // Single branch detail
              <div className="space-y-3">
                {[
                  { label: 'Total Users', value: totalUsers },
                  { label: 'Active This Week', value: activeThisWeek },
                  { label: 'Certificates', value: totalCerts },
                  { label: 'Avg Quiz Score', value: `${avgQuizScore}%` },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className="text-sm font-bold text-[#1A1A2E]">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              // Brand-level breakdown
              <div className="space-y-4">
                {Object.values(BRANDS).map((brand) => {
                  const inBrand = (users || []).filter((u) =>
                    (brand.branches as readonly string[]).includes(u.branch ?? '')
                  )
                  const activeInBrand = inBrand.filter((u) => u.last_activity_date && u.last_activity_date >= weekAgo).length
                  if (inBrand.length === 0 && !filterBrand) return null
                  return (
                    <div key={brand.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: brand.color }} />
                          <Link href={`/admin/analytics?brand=${brand.id}`}
                            className="text-sm font-bold text-[#1A1A2E] hover:underline">
                            {brand.name}
                          </Link>
                          <span className="text-xs text-gray-400">{brand.city}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#1A1A2E]">{inBrand.length}</span>
                          <span className="text-xs text-gray-400 ml-1">users</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: '#F3F3EF' }}>
                        <div className="h-1.5 rounded-full"
                          style={{
                            width: totalUsers > 0 ? `${Math.round((inBrand.length / totalUsers) * 100)}%` : '0%',
                            background: brand.color,
                          }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{brand.branches.length} branches</span>
                        <span>{activeInBrand} active this week</span>
                      </div>
                    </div>
                  )
                })}
                {totalUsers === 0 && (
                  <p className="text-gray-400 text-sm text-center py-6">No users yet</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Manager: show program progress for their branch */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Branch Progress</h2>
            <div className="space-y-3">
              {programStats.map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-[#1A1A2E]">{p.title}</span>
                    <span className="text-xs text-gray-400">{p.usersStarted} users</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: '#F3F3EF' }}>
                    <div className="h-1.5 rounded-full"
                      style={{ width: `${p.pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>{p.pct}% started</span>
                    <span>🏆 {p.usersCompleted} certified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Program stats table (admin/director) */}
      {!isManager && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Program Adoption</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Program', 'Lessons', 'Users Started', '% Adoption', 'Certified'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider py-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {programStats.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 text-sm font-medium text-[#1A1A2E]">{p.title}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{p.totalLessons}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{p.usersStarted}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full" style={{ background: '#F3F3EF' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                        </div>
                        <span className="text-xs font-bold text-[#1A1A2E]">{p.pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-500">🏆 {p.usersCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All users table */}
      {isFullAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider">All Users</h2>
            <Link href="/admin/users" className="text-xs font-semibold transition-colors hover:text-[#C9A84C]"
              style={{ color: 'rgba(26,26,46,0.4)' }}>
              Manage users →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['User', 'Branch', 'Streak', 'Study Days', 'Last Active'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2.5 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(users || []).map((u) => {
                  const brand = u.branch ? getBrandForBranch(u.branch) : null
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 group">
                          <div className="w-7 h-7 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#C9A84C] text-[10px] font-bold">{u.full_name?.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium text-[#1A1A2E] group-hover:text-[#C9A84C] transition-colors">{u.full_name}</span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          {brand && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: brand.color }} />}
                          <span className="text-xs text-gray-500">{u.branch ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm font-semibold text-[#1A1A2E]">🔥 {u.current_streak ?? 0}</td>
                      <td className="py-3 pr-4 text-sm text-gray-500">{u.total_study_days ?? 0}</td>
                      <td className="py-3 text-xs text-gray-400">
                        {u.last_activity_date
                          ? new Date(u.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Never'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
