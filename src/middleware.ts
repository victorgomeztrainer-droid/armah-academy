import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── In-memory rate limiter (per IP, resets on cold start) ─────────────────────
// Limits login/register to 10 attempts per 15 minutes per IP
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const RATE_LIMIT_MAX       = 10               // max attempts per window

function isRateLimited(ip: string): boolean {
  const now   = Date.now()
  const times = (rateLimitMap.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (times.length >= RATE_LIMIT_MAX) return true
  times.push(now)
  rateLimitMap.set(ip, times)
  return false
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rate-limit auth endpoints + login POST
  const isAuthPath = pathname.startsWith('/api/auth') || pathname === '/login'
  if (isAuthPath && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? request.headers.get('x-real-ip')
           ?? 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
        { status: 429 }
      )
    }
  }

  // ── Supabase session refresh ──────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes — no auth needed
  const publicRoutes = ['/login', '/register', '/pending-approval']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
