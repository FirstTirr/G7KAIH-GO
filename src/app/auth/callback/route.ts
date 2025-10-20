import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const getRoleHomePath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'siswa':
      return '/siswa';
    case 'guru':
      return '/guru';
    case 'guruwali':
      return '/guruwali';
    case 'orangtua':
      return '/orangtua';
    default:
      return '/unknown';
  }
};

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Set the token in the cookie
    
    // Set the token in the cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Get user profile to determine redirect
    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { user } = await profileRes.json();
    const role = user.profile?.role || 'unknown';
    const redirectPath = getRoleHomePath(role);

    // Determine the origin for the redirect
    const host = request.headers.get('host');
    const protocol = request.url.startsWith('https') ? 'https' : 'http';
    const origin = host ? `${protocol}://${host}` : new URL(request.url).origin;

    return NextResponse.redirect(new URL(redirectPath, origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
