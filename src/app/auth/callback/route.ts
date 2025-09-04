import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user and check their role
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Wait a bit for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Try to get by userid first
        let { data: profile } = await supabase
          .from('user_profiles')
          .select('userid, username, roleid')
          .eq('userid', user.id)
          .single()

        if (!profile) {
          // If not found, try to find an existing profile by email and link it
          const userEmail = user.email ?? null
          if (userEmail) {
            const { data: byEmail } = await supabase
              .from('user_profiles')
              .select('userid, username, roleid')
              .eq('email', userEmail)
              .maybeSingle()

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
          switch (roleName) {
            case 'unknown':
              return NextResponse.redirect(`${origin}/unknown`)
            case 'student':
              return NextResponse.redirect(`${origin}/siswa`)
            case 'teacher':
              return NextResponse.redirect(`${origin}/dashboard/teacher`)
            case 'parent':
              return NextResponse.redirect(`${origin}/orangtua`)
            case 'admin':
              return NextResponse.redirect(`${origin}/dashboard`)
            default:
              return NextResponse.redirect(`${origin}/unknown`)
          }
        } else {
          // No profile found, redirect to unknown
          console.log('No role found, redirecting to unknown')
          return NextResponse.redirect(`${origin}/unknown`)
        }
      }
    } else {
      console.error('Auth error:', error)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}