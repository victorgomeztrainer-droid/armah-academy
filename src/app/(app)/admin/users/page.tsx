import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { approveUser, rejectUser, updateUserRole } from '@/app/admin/actions'

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  trainer: 'bg-gray-100 text-gray-600',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'admin'].includes(me.role)) redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = (users || []).filter((u) => !u.is_approved)
  const approved = (users || []).filter((u) => u.is_approved)

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">{users?.length ?? 0} total users</p>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-[#1A1A2E]">Pending Approval</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="space-y-3">
            {pending.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-amber-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <p className="font-semibold text-[#1A1A2E]">{u.full_name}</p>
                  <p className="text-gray-400 text-sm">{u.email}</p>
                  {u.branch && <p className="text-gray-400 text-xs mt-0.5">{u.branch}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveUser.bind(null, u.id)}>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      Approve
                    </button>
                  </form>
                  <form action={rejectUser.bind(null, u.id)}>
                    <button type="submit" className="bg-white border border-gray-200 hover:border-red-200 text-red-500 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All users */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">All Users ({approved.length} approved)</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Branch</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Streak</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Status</th>
                  {me.role === 'super_admin' && (
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {approved.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                          <span className="text-[#C9A84C] text-xs font-bold">{u.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A2E]">{u.full_name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.branch ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      🔥 {u.current_streak} days
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Active</span>
                    </td>
                    {me.role === 'super_admin' && (
                      <td className="px-6 py-4">
                        <form action={updateUserRole.bind(null, u.id, u.role === 'trainer' ? 'admin' : 'trainer')} className="inline">
                          <button type="submit" className="text-xs text-gray-400 hover:text-[#C9A84C] transition-colors font-medium">
                            {u.role === 'trainer' ? 'Make Admin' : 'Make Trainer'}
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
