import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const admin = await createAdminClient()
  const supa = await createClient()

  // Admin guard
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: caller } = await supa.from("user_profiles").select("roleid").eq("userid", user.id).maybeSingle()
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const envAdminRoleId = Number(process.env.ADMIN_ROLE_ID ?? "")
  let isAdmin = !Number.isNaN(envAdminRoleId) && caller.roleid === envAdminRoleId
  if (!isAdmin) {
    const { data: adminRoles } = await admin.from("role").select("roleid, rolename").in("rolename", ["admin", "Admin", "administrator", "Administrator", "superadmin", "Superadmin"]) 
    if (adminRoles && adminRoles.length) isAdmin = adminRoles.some((r) => r.roleid === caller.roleid)
  }
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Load minimal profiles
  const { data: profiles, error } = await admin
    .from("user_profiles")
    .select("userid, username, email, updated_at, created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byEmail = new Map<string, string[]>()
  const byUsername = new Map<string, string[]>()
  for (const p of profiles || []) {
    const email = (p.email || "").trim().toLowerCase()
    const uname = (p.username || "").trim().toLowerCase()
    if (email) byEmail.set(email, [...(byEmail.get(email) || []), p.userid])
    if (uname) byUsername.set(uname, [...(byUsername.get(uname) || []), p.userid])
  }

  const groups: Array<{ type: "email" | "username"; key: string; userids: string[] }> = []
  for (const [k, ids] of byEmail) if (ids.length > 1) groups.push({ type: "email", key: k, userids: Array.from(new Set(ids)) })
  for (const [k, ids] of byUsername) if (ids.length > 1) groups.push({ type: "username", key: k, userids: Array.from(new Set(ids)) })

  return NextResponse.json({ data: groups })
}
