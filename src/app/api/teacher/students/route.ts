import { createAdminClient } from "@/utils/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
  const supabase = await createAdminClient()

    // Fetch roles to find the role id for students (case-insensitive match)
    const { data: roles, error: roleErr } = await supabase
      .from("role")
      .select("roleid, rolename")

    if (roleErr) throw roleErr

    const siswaRoleId = roles?.find((r) => String(r.rolename).toLowerCase() === "siswa")?.roleid

    // Fetch profiles; if siswa role exists, filter, otherwise return all as fallback
  let query = supabase
      .from("user_profiles")
      .select("userid, username, email, roleid, kelas, created_at, updated_at")

    if (siswaRoleId) {
      query = query.eq("roleid", siswaRoleId)
    }

    const { data: profiles, error: profErr } = await query
    if (profErr) throw profErr

    // If we have profiles (e.g., siswa), only show those as cards to avoid duplicates.
    let userIds: string[] = (profiles || []).map((p: any) => p.userid)
    let acts: any[] = []
    if (userIds.length > 0) {
      const { data, error: actErr } = await supabase
        .from("aktivitas")
        .select("userid, status, created_at")
        .in("userid", userIds)
        .order("created_at", { ascending: false })
      if (actErr) throw actErr
      acts = data || []
    } else {
      // Full fallback: build from aktivitas if there are no profiles at all
      const { data, error: actErr } = await supabase
        .from("aktivitas")
        .select("userid, status, created_at")
        .order("created_at", { ascending: false })
      if (actErr) throw actErr
      acts = data || []
      userIds = Array.from(new Set(acts.map((a) => a.userid).filter(Boolean))) as string[]
      if (userIds.length === 0) {
        return NextResponse.json({ data: [] })
      }
      // Try to fetch profiles for these users (some may not exist)
      const { data: prof2, error: prof2Err } = await supabase
        .from("user_profiles")
        .select("userid, username, email, roleid, kelas, created_at, updated_at")
        .in("userid", userIds)
      if (prof2Err) throw prof2Err
      ;(profiles as any) = prof2 || []
    }

    const byUser: Record<string, { total: number; completed: number; last?: string }> = {}
    for (const a of acts) {
      const u = a.userid as string
      if (!u) continue
      if (!byUser[u]) byUser[u] = { total: 0, completed: 0, last: undefined }
      byUser[u].total++
      if (a.status === "completed") byUser[u].completed++
      if (!byUser[u].last) byUser[u].last = a.created_at as string
    }

    const now = Date.now()
    const mapProfile = new Map<string, any>((profiles || []).map((p: any) => [p.userid, p]))

    // Enrich names/emails for profiles missing email/username using auth.users
    const toEnrich = Array.from(mapProfile.entries())
      .filter(([, p]) => !p?.username && !p?.email)
      .map(([uid]) => uid)
    const authMap = new Map<string, { email?: string; name?: string }>()
    if (toEnrich.length > 0) {
      const { data: authRows, error: authErr } = await supabase
        .from("auth.users")
        .select("id, email, raw_user_meta_data")
        .in("id", toEnrich)
      if (!authErr) {
        for (const r of authRows || []) {
          authMap.set(r.id, {
            email: (r as any).email,
            name: (r as any)?.raw_user_meta_data?.full_name || (r as any)?.raw_user_meta_data?.name,
          })
        }
      }
    }

    // Return only profiles as cards to avoid duplicates from aktivitas-only IDs
    const data = (profiles || []).map((p: any) => {
      const uid = p.userid
      const p = mapProfile.get(uid) || {}
      const stats = byUser[uid] || { total: 0, completed: 0, last: undefined }
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      const lastActivity = stats.last
      let status: "active" | "inactive" | "completed" = "inactive"
      if (completionRate >= 95 && stats.total > 0) status = "completed"
      else if (lastActivity) {
        const diffDays = (now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
        status = diffDays <= 3 ? "active" : "inactive"
      }

      const auth = authMap.get(uid) || {}
      const displayName = p.username || p.email || auth.name || auth.email || "Tanpa Nama"

      return {
        id: uid,
        name: displayName,
        class: p.kelas || "",
        email: p.email || auth.email || null,
        activitiesCount: stats.total,
        completionRate,
        lastActivity,
        status,
      }
    })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 })
  }
}
