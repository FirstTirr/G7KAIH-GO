"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { login } from './action'

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await login(formData)
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err?.message || "Token tidak valid. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-16 px-6">
      {/* Logo */}
      <div className="mb-8">
        <Image 
          src="/bcslogo.webp" 
          alt="logo smk 4 pyk" 
          width={150} 
          height={150} 
          priority
        />
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-8">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="token">Token</Label>
            <Input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="Masukkan token 4 digit"
              required
              className="mt-2"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Belum punya akun? Hubungi administrator untuk mendaftar.
        </div>
      </div>
    </div>
  )
}