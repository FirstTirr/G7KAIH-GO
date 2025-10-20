import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const roleRedirectMap: Record<string, string> = {
  unknown: '/unknown',
  student: '/siswa',
  teacher: '/guru',
  parent: '/orangtua',
  admin: '/dashboard',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user and check their role
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('User authenticated:', user.id, 'Email:', user.email) // Debug log
        
        // Wait a bit for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Try to get by userid first
        let { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('userid, username, roleid')
          .eq('userid', user.id)
          .single()

        console.log('Profile query result:', profile, 'Error:', profileError) // Debug log

        if (!profile) {
          // If not found, try to find an existing profile by email and link it
          const userEmail = user.email ?? null
          console.log('Profile not found by userid, trying email:', userEmail) // Debug log
          if (userEmail) {
            const { data: byEmail, error: emailError } = await supabase
              .from('user_profiles')
              .select('userid, username, roleid')
              .eq('email', userEmail)
              .maybeSingle()

            console.log('Profile by email:', byEmail, 'Error:', emailError) // Debug log

            if (byEmail) {
              // Link existing email profile to this auth user id
              const { data: updated } = await supabase
                .from('user_profiles')
                .update({ userid: user.id })
                .eq('email', userEmail)
                .select('userid, username, roleid')
                .single()
              profile = updated ?? byEmail
            }
          }

          // Still no profile, create one manually
          if (!profile) {
            const defaultUsername = user.email?.split('@')[0] || 'user'
            const { data: created } = await supabase
              .from('user_profiles')
              .insert({
                userid: user.id,
                username: defaultUsername,
                email: user.email ?? null,
                roleid: 1, // unknown role
              })
              .select('userid, username, roleid')
              .single()

            profile = created ?? null
          }
        }

        console.log('User profile:', profile) // Debug log

        if (profile?.roleid) {
          // Get role name separately
          const { data: roleData } = await supabase
            .from('role')
            .select('rolename')
            .eq('roleid', profile.roleid)
            .single()

          const roleName = roleData?.rolename

          console.log('Role name:', roleName) // Debug log
          
          // Redirect based on role
          const fallbackPath = roleRedirectMap[roleName ?? ''] ?? '/unknown'
          return redirectTo(fallbackPath)
        } else {
          // No profile found, redirect to unknown
          console.log('No role found, redirecting to unknown')
          return redirectTo('/unknown')
        }
      }
    } else {
      console.error('Auth error:', error)
    }
  }

  return redirectTo('/auth/auth-code-error')
}