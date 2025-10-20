import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Auth paths don't need token verification
  const authPaths = ['/api/auth/login', '/api/auth/signup']
  if (authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback', '/auth/confirm', '/error', '/auth/auth-code-error', '/tos']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  const authToken = request.cookies.get('auth-token')

  // Redirect unauthenticated users to login
  if (!authToken && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add auth token to request headers if it exists
  if (authToken) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${authToken.value}`)
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Role-based routing
    if (!isPublicRoute && !pathname.startsWith('/api/')) {
      try {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, {
          headers: { 'Authorization': `Bearer ${authToken.value}` }
        })

        if (userRes.ok) {
          const { user } = await userRes.json()
          const role = user.profile?.role || 'unknown'

          // Redirect root path based on role
          if (pathname === '/') {
            return NextResponse.redirect(new URL(getRoleHomePath(role), request.url))
          }

          // Role-based access control
          if (!checkRoleAccess(pathname, role)) {
            return NextResponse.redirect(new URL(getRoleHomePath(role), request.url))
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    return response
  }

  return NextResponse.next()
}

function getRoleHomePath(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'siswa':
      return '/siswa'
    case 'guru':
      return '/guru'
    case 'guruwali':
      return '/guruwali'
    case 'orangtua':
      return '/orangtua'
    default:
      return '/unknown'
  }
}

function checkRoleAccess(pathname: string, role: string): boolean {
  const roleAccessMap: Record<string, string[]> = {
    '/dashboard': ['admin'],
    '/guru': ['guru', 'guruwali'],
    '/guruwali': ['guruwali'],
    '/siswa': ['siswa'],
    '/orangtua': ['orangtua'],
    '/unknown': ['unknown']
  }

  for (const [path, allowedRoles] of Object.entries(roleAccessMap)) {
    if (pathname.startsWith(path)) {
      return allowedRoles.includes(role)
    }
  }

  return false
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static files and images
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    // Include API routes that need auth
    '/api/:path*'
  ]
}