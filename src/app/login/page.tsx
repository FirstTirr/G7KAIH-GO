import GoogleSignInButton from '@/components/ui/googleButton'
import Image from 'next/image'
import Link from 'next/link'

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