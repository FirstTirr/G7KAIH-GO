import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { APIClient } from '@/utils/api/client'

export async function GET(req: NextRequest) {
  try {
    const client = new APIClient()
    const user = await client.getUser()
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }
}