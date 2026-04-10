'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ArmahLogo from '@/components/ui/ArmahLogo'
import { BackgroundPaths } from '@/components/ui/background-paths'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check approval status
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', user.id)
        .single()

      if (!profile?.is_approved) {
        router.push('/pending-approval')
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0D0D1A' }}>

      {/* Left panel — animated branding */}
      <div className="hidden lg:flex flex-col justify-between w-[50%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%)' }}>

        {/* Animated gold paths */}
        <BackgroundPaths />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)' }} />

        {/* Content */}
        <div className="relative z-10">
          <ArmahLogo />
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: '#C9A84C' }}>
            Internal Training Platform
          </p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-5">
            Elevate Your<br />
            <span style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8C96D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Training Expertise
            </span>
          </h2>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            World-class programs designed for Armah Sports fitness professionals.
            Learn, certify, and grow.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {[
            { value: '30+', label: 'Years of Excellence' },
            { value: '600+', label: 'Trainers' },
            { value: 'KSA', label: 'Nationwide' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-6">
              {i > 0 && <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />}
              <div>
                <p className="text-xl font-bold" style={{ color: '#C9A84C' }}>{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: '#0D0D1A' }}>

        {/* Subtle paths on mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <BackgroundPaths />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <ArmahLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sign in to your Armah Academy account
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(201,168,76,0.7)' }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@armahsports.com"
                className="w-full px-4 py-3 text-sm text-white rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(201,168,76,0.7)' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm text-white rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all mt-2 relative overflow-hidden"
              style={{
                background: loading
                  ? 'rgba(201,168,76,0.4)'
                  : 'linear-gradient(135deg, #C9A84C, #E8C96D)',
                color: '#0D0D1A',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Don&apos;t have an account?{' '}
              <a href="/register" className="font-semibold transition-colors" style={{ color: '#C9A84C' }}>
                Request access
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
