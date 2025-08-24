'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  // Get user profile and redirect based on role
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('userid, username, roleid')
      .eq('userid', user.id)
      .single()

    if (profile?.roleid) {
      // Get role name
      const { data: roleData } = await supabase
        .from('role')
        .select('rolename')
        .eq('roleid', profile.roleid)
        .single()

      const roleName = roleData?.rolename

      // Redirect based on role
      switch (roleName) {
        case 'admin':
          redirect('/dashboard')
        case 'student':
          redirect('/siswa')
        case 'teacher':
          redirect('/guru')
        case 'parent':
          redirect('/orangtua')
        case 'unknown':
          redirect('/unknown')
        default:
          redirect('/unknown')
      }
    } else {
      redirect('/unknown')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  // New signups always go to unknown for approval
  revalidatePath('/', 'layout')
  redirect('/unknown')
}