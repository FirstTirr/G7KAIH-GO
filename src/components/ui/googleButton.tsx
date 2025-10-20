'use client'

import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

export default function GoogleSignInButton() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://g7kaih.tefa-bcs.org/auth/callback'
      }
    })
    
    if (error) {
      console.error('Error signing in:', error)
    }
  }

  return (
    <button 
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <Image src='/googlelogo.svg' alt='google logo' width={20} height={20}/>
      <span className="text-sm font-medium">Continue with Google</span>
    </button>
  )
}