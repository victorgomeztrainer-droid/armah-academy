import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { approveUser, rejectUser, updateUserProfile, createUser } from '@/app/admin/actions'
import { BRANDS, ALL_BRANCHES, ROLES, getRoleInfo } from '@/lib/branches'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'admin'].includes(me.role)) redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const q = searchParams.q?.toLowerCase() ?? ''
  const filtered = q
    ? (users || []).filter((u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.branch?.toLowerCase().includes(q)
      )
    : (users || [])

  const pending  = filtered.filter((u) => !u.is_approved)
  const approved = filtered.filter((u) => u.is_approved)

  // Branch counts for summary
  const branchCounts: Record<string, number> = {}
  for (const u of users || []) {
    if (u.branch) branchCounts[u.branch] = (branchCounts[u.branch] ?? 0) + 1
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users?.length ?? 0} users · {pending.length} pending approval
          </p>
        </div>
      </div>

      {/* Toast messages */}
      {searchParams.error && (
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium"
          style={{ background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {searchParams.error}
        </div>
      )}
      {searchParams.success && (
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium"
          style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {searchParams.success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Search */}
          <form method="get" className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search by name, email or branch…"
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-white border border-gray-100 shadow-sm outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all"
            />
          </form>

          {/* Pending Approvals */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold text-[#1A1A2E]">Pending Approval</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#FEF3C7', color: '#D97706' }}>{pending.length}</span>
              </div>
              <div className="space-y-2">
                {pending.map((u) => {
                  const role = getRoleInfo(u.role)
                  return (
                    <div key={u.id}
                      className="bg-white rounded-2xl border border-amber-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: '#1A1A2E' }}>
                          <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>
                            {u.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A2E] text-sm">{u.full_name}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                          {u.branch && <p className="text-gray-400 text-xs">{u.branch}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <form action={approveUser.bind(null, u.id)}>
                          <button type="submit"
                            className="text-xs font-bold px-4 py-2 rounded-xl transition-colors text-white"
                            style={{ background: '#16A34A' }}>
                            Approve
                          </button>
                        </form>
                        <form action={rejectUser.bind(null, u.id)}>
                          <button type="submit"
                            className="text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 text-red-500 hover:border-red-200 transition-colors bg-white">
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Approved Users Table */}
          <div>
            <h2 className="text-sm font-bold text-[#1A1A2E] mb-3">
              All Users
              <span className="ml-2 text-xs font-normal text-gray-400">{approved.length} active</span>
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5">User</th>
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5">Branch</th>
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5">Role</th>
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5">Streak</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {approved.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 text-sm py-10">No users found</td>
                      </tr>
                    )}
                    {approved.map((u) => {
                      const role = getRoleInfo(u.role)
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#C9A84C] text-xs font-bold">{u.full_name?.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#1A1A2E]">{u.full_name}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">{u.branch ?? '—'}</td>
                          <td className="px-5 py-4">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                              style={{ background: role.bg, color: role.color }}>
                              {role.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            🔥 {u.current_streak ?? 0}
                          </td>
                          <td className="px-5 py-4">
                            <Link href={`/admin/users/${u.id}`}
                              className="text-xs font-semibold transition-colors hover:text-[#C9A84C]"
                              style={{ color: 'rgba(26,26,46,0.4)' }}>
                              View →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Create User Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4" style={{ background: '#1A1A2E', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create New User
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(201,168,76,0.6)' }}>
                User is auto-approved and can log in immediately
              </p>
            </div>
            <form action={createUser} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name *</label>
                <input name="full_name" required placeholder="Ahmed Al-Rashid"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email *</label>
                <input name="email" type="email" required placeholder="ahmed@armahsports.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Password *</label>
                <input name="password" type="password" required minLength={8} placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Role</label>
                <select name="role"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A84C] bg-white">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Branch / Sede</label>
                <select name="branch"
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
              <button type="submit"
                className="w-full font-bold py-2.5 rounded-xl text-sm transition-all mt-1"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}>
                Create User
              </button>
            </form>
          </div>

          {/* Branch summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider mb-4">Users by Brand</h2>
            <div className="space-y-4">
              {Object.values(BRANDS).map((brand) => {
                const branchUsers = brand.branches.reduce((sum, b) => sum + (branchCounts[b] ?? 0), 0)
                return (
                  <div key={brand.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: brand.color }} />
                        <span className="text-xs font-bold text-[#1A1A2E]">{brand.name}</span>
                        <span className="text-[10px] text-gray-400">{brand.city}</span>
                      </div>
                      <span className="text-xs font-bold text-[#1A1A2E]">{branchUsers}</span>
                    </div>
                    <div className="space-y-1 pl-4">
                      {brand.branches.map((b) => {
                        const count = branchCounts[b] ?? 0
                        return (
                          <div key={b} className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">{b}</span>
                            <span className="text-[11px] font-medium text-gray-500">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
