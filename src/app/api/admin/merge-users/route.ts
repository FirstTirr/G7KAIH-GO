import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

/**
 * POST /api/admin/merge-users
 * Body: { fromUserid: string, toUserid: string }
 *
 * Moves all rows from `aktivitas` with userid=fromUserid to userid=toUserid,
 * merges `user-profiles` (preferring existing non-null values on target),
 * and deletes the source profile row.
 *
 * Notes:
 * - This route uses the service-role client and should be protected upstream (e.g., via secret header or admin-only access).
 */
export async function POST(req: Request) {
  const admin = await createAdminClient()
  // Ensure caller is an admin
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: callerProfile } = await supa
    .from("user_profiles")
    .select("roleid")
    .eq("userid", user.id)
    .maybeSingle()
  if (!callerProfile) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const envAdminRoleId = Number(process.env.ADMIN_ROLE_ID ?? "")
  let isAdmin = !Number.isNaN(envAdminRoleId) && callerProfile.roleid === envAdminRoleId
  if (!isAdmin) {
    const roleNames = ["admin", "Admin", "administrator", "Administrator", "superadmin", "Superadmin"]
    const { data: adminRoles } = await admin
      .from("role")
      .select("roleid, rolename")
      .in("rolename", roleNames)
    if (adminRoles && adminRoles.length) {
      isAdmin = adminRoles.some((r) => r.roleid === callerProfile.roleid)
    }
  }
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
  const body = await req.json().catch(() => ({}))
  const { fromUserid, toUserid, preferSourceName }: { fromUserid?: string; toUserid?: string; preferSourceName?: boolean } = body || {}

    if (!fromUserid || !toUserid || fromUserid === toUserid) {
      return NextResponse.json(
        { error: "fromUserid and toUserid are required and must differ" },
        { status: 400 }
      )
    }

    // Fetch profiles for context
    const { data: fromProfile, error: fromErr } = await admin
      .from("user_profiles")
      .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .eq("userid", fromUserid)
      .maybeSingle()
    if (fromErr) throw fromErr

    const { data: toProfile, error: toErr } = await admin
      .from("user_profiles")
      .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .eq("userid", toUserid)
      .maybeSingle()
    if (toErr) throw toErr

    // 1) Move aktivitas rows
    const { data: movedActs, error: moveActsErr } = await admin
      .from("aktivitas")
      .update({ userid: toUserid })
      .eq("userid", fromUserid)
      .select("activityid")
    if (moveActsErr) throw moveActsErr

    // 2) Merge profile fields into target
    // Email: preserve target email if any (auth sign-in), otherwise take source email
    const email = toProfile?.email ?? fromProfile?.email ?? null

    // Role/Kelas: prefer target if present, else source
    const roleid = toProfile?.roleid ?? fromProfile?.roleid ?? null
    const kelas = toProfile?.kelas ?? fromProfile?.kelas ?? null

    // Username: choose by preference or smart heuristic
    function isNiceName(v?: string | null) {
      if (!v) return false
      const looksEmail = /@/.test(v)
      const manyDotsDigits = /\.|\d/.test(v)
      const hasSpace = /\s/.test(v)
      const hasUppercase = /[A-Z]/.test(v)
      return !looksEmail && (hasSpace || hasUppercase) && !manyDotsDigits
    }
    let username: string | null = null
    if (preferSourceName) {
      username = fromProfile?.username ?? toProfile?.username ?? null
    } else {
      const candTarget = toProfile?.username ?? null
      const candSource = fromProfile?.username ?? null
      if (isNiceName(candSource) && !isNiceName(candTarget)) username = candSource
      else username = candTarget ?? candSource ?? null
    }

    const mergedProfile = { userid: toUserid, username, email, roleid, kelas }

    const { data: upserted, error: upsertErr } = await admin
      .from("user_profiles")
      .upsert(mergedProfile, { onConflict: "userid" })
      .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .maybeSingle()
    if (upsertErr) throw upsertErr

    // 3) Delete the source profile (if exists) to avoid duplicates
    let deletedProfile = false
    if (fromProfile) {
      const { error: delErr } = await admin
        .from("user_profiles")
        .delete()
        .eq("userid", fromUserid)
      if (delErr) throw delErr
      deletedProfile = true
    }

    return NextResponse.json({
      ok: true,
      movedActivitiesCount: movedActs?.length ?? 0,
      targetProfile: upserted ?? mergedProfile,
      deletedSourceProfile: deletedProfile,
      debug: { fromUserid, toUserid, preferSourceName: !!preferSourceName },
    })
  } catch (err: any) {
    console.error("[merge-users] error", err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
