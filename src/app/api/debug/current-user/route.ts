import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Not authenticated", 
        user: null, 
        profile: null 
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("userid, username, email, roleid")
      .eq("userid", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: "Profile not found", 
        user: { id: user.id, email: user.email }, 
        profile: null,
        profileError: profileError.message
      })
    }

    // Get role name
    const { data: roleData, error: roleError } = await supabase
      .from("role")
      .select("roleid, rolename")
      .eq("roleid", profile.roleid)
      .single()

    return NextResponse.json({ 
      user: { id: user.id, email: user.email },
      profile,
      role: roleData || null,
      roleError: roleError?.message || null
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}
