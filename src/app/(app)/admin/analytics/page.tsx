import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'admin'].includes(me.role)) redirect('/dashboard')

  const { data: users } = await supabase.from('profiles').select('id, full_name, branch, current_streak, longest_streak, total_study_days, last_activity_date').eq('is_approved', true)
  const { data: programs } = await supabase.from('programs').select('id, title, slug').eq('is_published', true)
  const { data: allProgress } = await supabase.from('user_progress').select('user_id, lesson_id, completed').eq('completed', true)
  const { data: allAttempts } = await supabase.from('quiz_attempts').select('user_id, score, passed')
  const { data: certificates } = await supabase.from('certificates').select('user_id, program_id')
  const { data: allLessons } = await supabase.from('lessons').select('id, module_id, modules(program_id)')

  const totalUsers = users?.length ?? 0
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const activeThisWeek = (users || []).filter((u) => u.last_activity_date && u.last_activity_date >= weekAgo).length
  const totalCerts = certificates?.length ?? 0
  const avgQuizScore = allAttempts && allAttempts.length > 0
    ? Math.round(allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length)
    : 0

  // Leaderboard — top by streak
  const leaderboard = [...(users || [])].sort((a, b) => b.current_streak - a.current_streak).slice(0, 10)

  // Per-program stats
  const programStats = (programs || []).map((p) => {
    const totalLessons = (allLessons || []).filter((l: any) => l.modules?.program_id === p.id).length
    const usersStarted = new Set((allProgress || []).filter((pr: any) => {
      const lesson = (allLessons || []).find((l: any) => l.id === pr.lesson_id)
      return (lesson as any)?.modules?.program_id === p.id
    }).map((pr) => pr.user_id)).size
    const usersCompleted = (certificates || []).filter((c) => c.program_id === p.id).length
    return { ...p, totalLessons, usersStarted, usersCompleted }
  })

  // Branch breakdown
  const branchMap: Record<string, number> = {}
  for (const u of users || []) {
    if (u.branch) branchMap[u.branch] = (branchMap[u.branch] || 0) + 1
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers },
          { label: 'Active This Week', value: activeThisWeek },
          { label: 'Certificates Issued', value: totalCerts },
          { label: 'Avg Quiz Score', value: `${avgQuizScore}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#1A1A2E]">{stat.value}</p>
            <p className="text-gray-400 text-xs mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#1A1A2E] mb-4">Streak Leaderboard</h2>
          <div className="space-y-3">
            {leaderboard.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className={`w-6 text-center text-xs font-bold ${i === 0 ? 'text-[#C9A84C]' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C9A84C] text-xs font-bold">{u.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A2E] truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.branch}</p>
                </div>
                <span className="text-sm font-bold text-[#1A1A2E] flex-shrink-0">🔥 {u.current_streak}</span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No data yet</p>}
          </div>
        </div>

        {/* Branch breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#1A1A2E] mb-4">Users by Branch</h2>
          <div className="space-y-3">
            {Object.entries(branchMap).sort(([, a], [, b]) => b - a).map(([branch, count]) => (
              <div key={branch} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1A1A2E] font-medium">{branch}</span>
                    <span className="text-sm font-bold text-[#1A1A2E]">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#C9A84C] h-1.5 rounded-full"
                      style={{ width: `${(count / totalUsers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(branchMap).length === 0 && <p className="text-gray-400 text-sm text-center py-4">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Per-program */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#1A1A2E] mb-4">Program Stats</h2>
        {programStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Program</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Lessons</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Started</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Certified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {programStats.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 text-sm font-medium text-[#1A1A2E]">{p.title}</td>
                    <td className="py-3 text-sm text-gray-500">{p.totalLessons}</td>
                    <td className="py-3 text-sm text-gray-500">{p.usersStarted}</td>
                    <td className="py-3 text-sm text-gray-500">{p.usersCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">No programs published yet.</p>
        )}
      </div>
    </div>
  )
}
