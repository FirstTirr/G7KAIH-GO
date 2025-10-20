import { cookies } from 'next/headers'

export type User = {
  id: string
  email: string
  profile?: {
    id: string
    name: string
    role: string
    avatar_url?: string
    nis?: string
    class?: string
  }
}

export type LoginResponse = {
  user: User
  token: string
}

export class APIClient {
  private baseUrl: string
  private token?: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(email: string, password: string, name: string): Promise<LoginResponse> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async getUser(): Promise<User> {
    return this.request('/auth/user')
  }

  async logout(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
  }
}