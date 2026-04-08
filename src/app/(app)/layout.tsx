import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import ArmahLogo from '@/components/ui/ArmahLogo'
import { logout } from '@/app/auth/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_approved')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) redirect('/pending-approval')

  return (
    <div className="min-h-screen" style={{ background: '#F4F4F0' }}>
      <Sidebar role={profile.role} userName={profile.full_name} />
      <MobileNav role={profile.role} />

      {/* Mobile top bar */}
      <header className="md:hidden px-4 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 100%)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
        <ArmahLogo />
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>
              {profile.full_name?.charAt(0).toUpperCase()}
            </span>
          </Link>
          <form action={logout}>
            <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <svg className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <main className="md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
