import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { APIClient } from '@/utils/api/client'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const client = new APIClient()
    const { user, token } = await client.login(email, password)

    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }
}