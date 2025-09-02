import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

function isNiceName(v?: string | null) {
  if (!v) return false
  const looksEmail = /@/.test(v)
  const manyDotsDigits = /\.|\d/.test(v)
  const hasSpace = /\s/.test(v)
  const hasUppercase = /[A-Z]/.test(v)
  return !looksEmail && (hasSpace || hasUppercase) && !manyDotsDigits
}

export async function POST() {
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

  // Load profiles and aktivitas counts
  const { data: profiles, error: profErr } = await admin
    .from("user_profiles")
    .select("userid, username, email, roleid, kelas, created_at, updated_at")
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })

  const { data: acts, error: actErr } = await admin
    .from("aktivitas")
    .select("userid, status")
  if (actErr) return NextResponse.json({ error: actErr.message }, { status: 500 })

  const countByUser = new Map<string, number>()
  for (const a of acts || []) {
    if (!a.userid) continue
    countByUser.set(a.userid, (countByUser.get(a.userid) || 0) + 1)
  }

  const byEmail = new Map<string, any[]>()
  const byUsername = new Map<string, any[]>()
  for (const p of profiles || []) {
    const email = (p.email || "").trim().toLowerCase()
    const uname = (p.username || "").trim().toLowerCase()
    const rec = { ...p, activities: countByUser.get(p.userid) || 0 }
    if (email) byEmail.set(email, [...(byEmail.get(email) || []), rec])
    if (uname) byUsername.set(uname, [...(byUsername.get(uname) || []), rec])
  }

  const merges: Array<{ fromUserid: string; toUserid: string; reason: string; preferSourceName: boolean }> = []

  function plan(group: any[], label: string) {
    if (!group || group.length <= 1) return
    // Choose target: most activities, then newest updated_at
    const sorted = [...group].sort((a, b) => {
      const d = (b.activities || 0) - (a.activities || 0)
      if (d !== 0) return d
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    })
    const target = sorted[0]
    for (let i = 1; i < sorted.length; i++) {
      const src = sorted[i]
      const prefer = isNiceName(src.username) && !isNiceName(target.username)
      merges.push({ fromUserid: src.userid, toUserid: target.userid, reason: label, preferSourceName: prefer })
    }
  }

  for (const [, group] of byEmail) plan(group, "email")
  for (const [, group] of byUsername) plan(group, "username")

  // Execute merges sequentially via the existing merge route logic
  let ok = 0, fail = 0
  const results: any[] = []
  for (const m of merges) {
    try {
      const { data: movedActs, error: moveActsErr } = await admin
        .from("aktivitas")
        .update({ userid: m.toUserid })
        .eq("userid", m.fromUserid)
        .select("activityid")
      if (moveActsErr) throw moveActsErr

      const { data: fromProfile } = await admin.from("user_profiles").select("username, email, roleid, kelas").eq("userid", m.fromUserid).maybeSingle()
      const { data: toProfile } = await admin.from("user_profiles").select("username, email, roleid, kelas").eq("userid", m.toUserid).maybeSingle()

      const email = toProfile?.email ?? fromProfile?.email ?? null
      const roleid = toProfile?.roleid ?? fromProfile?.roleid ?? null
      const kelas = toProfile?.kelas ?? fromProfile?.kelas ?? null
      let username: string | null = null
      if (m.preferSourceName) username = fromProfile?.username ?? toProfile?.username ?? null
      else {
        const candTarget = toProfile?.username ?? null
        const candSource = fromProfile?.username ?? null
        if (isNiceName(candSource) && !isNiceName(candTarget)) username = candSource
        else username = candTarget ?? candSource ?? null
      }

      const { error: upErr } = await admin
        .from("user_profiles")
        .upsert({ userid: m.toUserid, username, email, roleid, kelas }, { onConflict: "userid" })
      if (upErr) throw upErr

      await admin.from("user_profiles").delete().eq("userid", m.fromUserid)

      ok++
      results.push({ ...m, moved: movedActs?.length || 0 })
    } catch (e: any) {
      fail++
      results.push({ ...m, error: e.message })
    }
  }

  return NextResponse.json({ planned: merges.length, merged: ok, failed: fail, results })
}
