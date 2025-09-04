import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback', '/auth/confirm', '/error', '/auth/auth-code-error', '/tos']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Auth guard for authenticated users
  if (user && !isPublicRoute) {
    // Get user profile and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('userid, username, roleid')
      .eq('userid', user.id)
      .single()

    if (profile?.roleid) {
      // Get role name
      const { data: roleData } = await supabase
        .from('role')
        .select('rolename')
        .eq('roleid', profile.roleid)
        .single()

      const roleName = roleData?.rolename

      // Route protection based on role
  if (pathname.startsWith('/dashboard') && roleName !== 'admin' && roleName !== 'teacher') {
        // Redirect to appropriate role page instead of unknown
        switch (roleName) {
          case 'teacher':
            return NextResponse.redirect(new URL('/guru', request.url))
          case 'student':
            return NextResponse.redirect(new URL('/siswa', request.url))
          case 'parent':
            return NextResponse.redirect(new URL('/orangtua', request.url))
          default:
            return NextResponse.redirect(new URL('/unknown', request.url))
        }
      }
      
  if (pathname.startsWith('/siswa') && roleName !== 'student') {
        // Redirect to appropriate role page instead of unknown
        switch (roleName) {
          case 'admin':
            return NextResponse.redirect(new URL('/dashboard', request.url))
          case 'teacher':
            return NextResponse.redirect(new URL('/guru', request.url))
          case 'parent':
            return NextResponse.redirect(new URL('/orangtua', request.url))
          default:
            return NextResponse.redirect(new URL('/unknown', request.url))
        }
      }
      
  // removed /guru route guard
      
      if (pathname.startsWith('/orangtua') && roleName !== 'parent') {
        // Redirect to appropriate role page instead of unknown
        switch (roleName) {
          case 'admin':
            return NextResponse.redirect(new URL('/dashboard', request.url))
          case 'teacher':
            return NextResponse.redirect(new URL('/guru', request.url))
          case 'student':
            return NextResponse.redirect(new URL('/siswa', request.url))
          default:
            return NextResponse.redirect(new URL('/unknown', request.url))
        }
      }

      // Users with role 'unknown' can only access /unknown
      if (roleName === 'unknown' && pathname !== '/unknown') {
        return NextResponse.redirect(new URL('/unknown', request.url))
      }

      // Redirect root path based on role
      if (pathname === '/') {
        switch (roleName) {
          case 'admin':
            return NextResponse.redirect(new URL('/dashboard', request.url))
          case 'student':
            return NextResponse.redirect(new URL('/siswa', request.url))
          case 'teacher':
            return NextResponse.redirect(new URL('/guru', request.url))
          case 'parent':
            return NextResponse.redirect(new URL('/orangtua', request.url))
          case 'unknown':
            return NextResponse.redirect(new URL('/unknown', request.url))
          default:
            return NextResponse.redirect(new URL('/unknown', request.url))
        }
      }
    } else {
      // No profile found, redirect to unknown
      if (pathname !== '/unknown') {
        return NextResponse.redirect(new URL('/unknown', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}