'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ArmahLogo from '@/components/ui/ArmahLogo'
import { logout } from '@/app/auth/actions'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Programs',
    href: '/programs',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const adminItems = [
  {
    label: 'Users',
    href: '/admin/users',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Programs',
    href: '/admin/programs',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

interface SidebarProps {
  role: string
  userName: string
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === 'super_admin' || role === 'admin'

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0"
      style={{ background: 'linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 100%)', borderRight: '1px solid rgba(201,168,76,0.08)' }}>

      {/* Brand */}
      <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <ArmahLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'text-[#1A1A2E]'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' } : {}}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-5 pb-2 px-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>
                  Admin
                </p>
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
              </div>
            </div>
            {adminItems.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'text-[#1A1A2E]'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                  style={active ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' } : {}}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 group mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight group-hover:text-[#C9A84C] transition-colors">{userName}</p>
            <p className="text-xs capitalize truncate" style={{ color: 'rgba(201,168,76,0.5)' }}>
              {role.replace('_', ' ')} · View profile
            </p>
          </div>
        </Link>

        <form action={logout}>
          <button type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <svg className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="text-sm font-medium transition-colors group-hover:text-white/70"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sign out
            </span>
          </button>
        </form>
      </div>
    </aside>
  )
}
