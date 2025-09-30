import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userid: string }> }
) {
  try {
    const { userid } = await params
    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: "Password harus minimal 6 karakter" }, 
        { status: 400 }
      )
    }

    // Ensure caller is authenticated and is an admin
    const supabase = await createClient()
    const {
      data: { user: caller },
    } = await supabase.auth.getUser()
    
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from("user_profiles")
      .select("roleid")
      .eq("userid", caller.id)
      .maybeSingle()

    if (!callerProfile) {
      return NextResponse.json(
        { error: "Forbidden: profile not found" }, 
        { status: 403 }
      )
    }

    // Check if caller is admin
    let isAdmin = false
    const envAdminRoleId = Number(process.env.ADMIN_ROLE_ID ?? "")
    if (!Number.isNaN(envAdminRoleId)) {
      isAdmin = callerProfile.roleid === envAdminRoleId
    }
    
    if (!isAdmin) {
      // Fallback to role name lookup using admin client
      const admin = await createAdminClient()
      const { data: adminRoles } = await admin
        .from("role")
        .select("roleid, rolename")
        .in("rolename", [
          "admin",
          "Admin", 
          "administrator",
          "Administrator",
          "superadmin",
          "Superadmin",
        ])
      
      if (adminRoles && adminRoles.length > 0) {
        isAdmin = adminRoles.some((r: any) => r.roleid === callerProfile.roleid)
      }
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: only admin can update passwords" }, 
          { status: 403 }
        )
      }
    }

    // Use admin client to update user password
    const admin = await createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(userid, {
      password: password
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update password" }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password berhasil diperbarui" 
    })
    
  } catch (err: any) {
    console.error('Password update error:', err)
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" }, 
      { status: 500 }
    )
  }
}