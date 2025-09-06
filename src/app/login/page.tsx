import { Button } from '@/components/ui/button'
import GoogleSignInButton from '@/components/ui/googleButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { login } from './action'

export default function LoginPage() {
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
        <form action={login} className="space-y-4">
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

          <Button type="submit" className="w-full">
            Login
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