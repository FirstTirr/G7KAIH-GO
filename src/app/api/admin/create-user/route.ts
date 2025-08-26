import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

type Body = {
  email: string
  password: string
  username?: string
  roleid?: number
  kelas?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>
    const email = (body.email || "").trim()
    const password = String(body.password || "")
    const username = (body.username || email.split("@")[0] || "user").trim()
  // coerce roleid, fallback to 1 (unknown)
  const roleid = Number.isFinite(Number(body.roleid)) ? Number(body.roleid) : 1
    const kelas = (body.kelas ?? null) as string | null

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 })
    }

    // Ensure caller is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("roleid")
      .eq("userid", user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: "Forbidden: no profile found" }, { status: 403 })
    }

    // Admin check: allow override via ADMIN_ROLE_ID, else match common admin role names
    const envAdminRoleId = Number(process.env.ADMIN_ROLE_ID ?? "")
    let isAdmin = !Number.isNaN(envAdminRoleId) && profile.roleid === envAdminRoleId

    const admin = await createAdminClient()
    if (!isAdmin) {
      const roleNames = [
        "admin",
        "Admin",
        "administrator",
        "Administrator",
        "superadmin",
        "Superadmin",
      ]
      const { data: adminRoles, error: rolesErr } = await admin
        .from("role")
        .select("roleid, rolename")
        .in("rolename", roleNames)

      if (!rolesErr && adminRoles && adminRoles.length > 0) {
        isAdmin = adminRoles.some((r) => r.roleid === profile.roleid)
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: only admin can create accounts" }, { status: 403 })
    }

    // Use service role to create auth user
    // IMPORTANT: pass role metadata so trigger can respect it
    const { data: createdUser, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, roleid, kelas },
    })
    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    const newUserId = createdUser.user?.id
    if (!newUserId) {
      return NextResponse.json({ error: "Failed to get created user id" }, { status: 500 })
    }

    // Ensure user_profiles row reflects requested role.
    // If a trigger already inserted with roleid=1, this upsert will correct it.
    const { data: profileRow, error: insertError } = await admin
      .from("user_profiles")
      .upsert(
        { userid: newUserId, username, email, roleid, kelas },
        { onConflict: "userid" }
      )
      .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: profileRow }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}
