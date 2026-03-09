import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/dealer': ['DEALER', 'ADMIN'],
  '/mypage': ['CUSTOMER', 'DEALER', 'ADMIN'],
}

const AUTH_PAGES = ['/login', '/signup']

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'ADMIN': return '/admin/dashboard'
    case 'DEALER': return '/dealer/dashboard'
    default: return '/mypage'
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // If Supabase is not configured, protect routes by redirecting to /login
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const pathname = request.nextUrl.pathname
    const isProtected = Object.keys(PROTECTED_ROUTES).some((prefix) => pathname.startsWith(prefix))
    if (isProtected) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always refresh token via getUser (security: validates JWT against Supabase)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if this is a protected route
  const matchedRoute = Object.entries(PROTECTED_ROUTES)
    .find(([prefix]) => pathname.startsWith(prefix))

  if (matchedRoute) {
    const [, allowedRoles] = matchedRoute

    // Not authenticated -> redirect to login with redirect param
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated -> check role (query profiles table only for protected routes)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return supabaseResponse
  }

  // Auth pages: redirect already-authenticated users to their dashboard
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page)
  if (isAuthPage && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      return NextResponse.redirect(new URL(getRoleDashboard(profile.role), request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
