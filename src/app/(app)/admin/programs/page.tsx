import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'admin'].includes(me.role)) redirect('/dashboard')

  const { data: programs } = await supabase
    .from('programs')
    .select('*, modules(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Programs</h1>
          <p className="text-gray-500 text-sm mt-1">{programs?.length ?? 0} programs</p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#16213E] text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Program
        </Link>
      </div>

      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
          {searchParams.error}
        </div>
      )}

      {programs && programs.length > 0 ? (
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:border-[#C9A84C]/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C9A84C] font-bold">{p.title.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A2E]">{p.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{p.category}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{p.modules?.length ?? 0} modules</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className={`text-xs font-medium ${p.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                      {p.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={`/admin/programs/${p.id}`}
                className="text-sm text-gray-400 hover:text-[#C9A84C] font-medium transition-colors"
              >
                Edit →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <p className="text-gray-400 mb-4">No programs yet.</p>
          <Link href="/admin/programs/new" className="bg-[#C9A84C] hover:bg-[#E8C96D] text-[#1A1A2E] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Create first program
          </Link>
        </div>
      )}
    </div>
  )
}
