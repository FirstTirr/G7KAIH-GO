import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userid: string }> }
) {
  try {
    const { userid } = await params
    const payload = await request.json()
    const update: Record<string, any> = {}
  for (const key of ["username", "email", "roleid", "kelas"]) {
      if (key in payload) update[key] = payload[key]
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("user_profiles")
      .update(update)
      .eq("userid", userid)
  .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userid: string }> }
) {
  try {
    const { userid } = await params
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
      return NextResponse.json({ error: "Forbidden: profile not found" }, { status: 403 })
    }

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
        return NextResponse.json({ error: "Forbidden: only admin can delete users" }, { status: 403 })
      }
    }

    // Delete profile first (idempotent if not exists)
    const { error: profileErr, data: existingProfile } = await supabase
      .from("user_profiles")
      .delete()
      .eq("userid", userid)
      .select("userid, username, email, roleid, kelas")
      .maybeSingle()
    if (profileErr) throw profileErr

    // Use admin client to delete from auth.users
    const admin = await createAdminClient()
    const { error: authErr } = await admin.auth.admin.deleteUser(userid)
    if (authErr) {
      // Best-effort rollback: re-insert profile if we deleted it
      if (existingProfile) {
        await admin
          .from("user_profiles")
          .upsert(existingProfile, { onConflict: "userid" })
      }
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}
