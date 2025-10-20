'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  try {
    // Send request to Go backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: formData.get('token'),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Terjadi kesalahan saat login')
    }

    const { token, profile } = await res.json()

    // Set the token cookie
    const cookieStore = await cookies()
    cookieStore.delete('auth-token') // Clear any existing token
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Redirect based on role
    const role = profile?.role
    switch (role) {
      case 'admin':
        redirect('/dashboard')
      case 'siswa':
        redirect('/siswa')
      case 'guru':
        redirect('/guru')
      case 'guruwali':
        redirect('/guruwali')
      case 'orangtua':
        redirect('/orangtua')
      default:
        redirect('/unknown')
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Terjadi kesalahan saat login')
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  redirect('/login')
}