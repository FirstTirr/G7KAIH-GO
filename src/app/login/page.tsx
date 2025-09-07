"use client"

import { Button } from '@/components/ui/button'
import GoogleSignInButton from '@/components/ui/googleButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { login } from './action'

declare global {
  interface Window {
    grecaptcha: {
      render: (element: string, opts: { sitekey: string }) => void
      getResponse: () => string
      reset: () => void
    }
  }
}

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (document.getElementById("recaptcha-script")) return
    
    // Fungsi untuk render reCAPTCHA setelah siap
    const renderRecaptcha = () => {
      const sitekey = process.env.NEXT_PUBLIC_DATA_SITEKEY
      if (sitekey && window.grecaptcha && window.grecaptcha.render) {
        try {
          window.grecaptcha.render("recaptcha-container", {
            sitekey: sitekey,
          })
        } catch (error) {
          console.error("Error rendering reCAPTCHA:", error)
        }
      }
    }

    // Set callback global untuk reCAPTCHA
    (window as any).onRecaptchaLoad = renderRecaptcha

    const script = document.createElement("script")
    script.id = "recaptcha-script"
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      // Tunggu grecaptcha siap
      if (!window.grecaptcha || !window.grecaptcha.getResponse) {
        setError("reCAPTCHA belum siap. Silakan reload halaman.")
        setLoading(false)
        return
      }
      const token = window.grecaptcha.getResponse()
      if (!token) {
        setError("Silakan selesaikan reCAPTCHA terlebih dahulu.")
        setLoading(false)
        return
      }
      const formData = new FormData(e.currentTarget)
      formData.append("g-recaptcha-response", token)
      await login(formData)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Login gagal")
    } finally {
      setLoading(false)
      // Reset reCAPTCHA setelah submit
      if (window.grecaptcha && window.grecaptcha.reset) {
        window.grecaptcha.reset()
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-16 px-6">
      {/* Logo */}
      <div className="mb-8">
        <Image 
          src='/image/Logo_SMK_Negeri_4_Payakumbuh.png' 
          alt='logo smk 4 pyk' 
          width={120} 
          height={120}
          className="rounded-full"
        />
      </div>

      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Login page
        </h1>
        <p className="text-gray-500 text-sm">
          Halaman login G7KAIH
        </p>
      </div>

      {/* Email and Password Login Form */}
      <div className="w-full max-w-sm mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Masukkan email anda"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Masukkan password anda"
              required
              className="w-full"
            />
          </div>
          {/* Google reCAPTCHA v2 widget */}
          <div className="my-4">
            <div id="recaptcha-container"></div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>
      </div>

      {/* Divider */}
      <div className="w-full max-w-sm mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Atau</span>
          </div>
        </div>
      </div>

      {/* Google Sign In Button */}
      <div className="w-full max-w-sm mb-6">
        <GoogleSignInButton />
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start mb-8 w-full max-w-sm">
        <label htmlFor="terms" className="text-sm text-gray-600">
          Dengan menggunakan aplikasi anda setuju dengan{' '}
          <Link href="/tos" className="text-blue-600 underline">
            Term of Service kami.
          </Link>
        </label>
      </div>
    </div>
  )
}