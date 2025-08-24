'use client'

import { createClient } from '@/utils/supabase/client'

export default function GoogleSignInButton() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Error signing in:', error)
    }
  }

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  )
}