import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// Lightweight in-memory cache for the full response (helps repeated loads in short bursts)
let CACHE: { data: any; expiresAt: number } | null = null
const CACHE_TTL_MS = 0 // Disable cache for debugging

// Verified duplicate mappings (manually curated to prevent cross-contamination)
const VERIFIED_ALIASES = new Map<string, string[]>([
  // Raditya Alfarisi - verified same person with different userids
  ['6f07ae03-187e-4e25-a519-9f72f96f22ff', ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'eca885ad-1119-48ca-8efe-91efcbfb54b4']],
  ['eca885ad-1119-48ca-8efe-91efcbfb54b4', ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'eca885ad-1119-48ca-8efe-91efcbfb54b4']]
])

// Optional verified display names for known users (improves UX when metadata is missing)
const VERIFIED_DISPLAY_NAMES = new Map<string, string>([
  ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'Raditya Alfarisi'],
  ['eca885ad-1119-48ca-8efe-91efcbfb54b4', 'Raditya Alfarisi'],
])

function nameFromEmail(email?: string | null): string | null {
  if (!email) return null
  const local = String(email).split('@')[0]
  if (!local) return null
  // Replace separators with spaces, then title-case
  const words = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean)
  if (words.length === 0) return null
  const pretty = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return pretty
}

// Expand a list of userIds with any verified alias groups that intersect the list
function expandWithVerifiedAliases(ids: string[]): string[] {
  const set = new Set(ids)
  for (const [primary, list] of VERIFIED_ALIASES.entries()) {
    // If any id from this alias group is present, add the whole group (including primary)
    const hit = list.some((id) => set.has(id)) || set.has(primary)
    if (hit) {
      set.add(primary)
      for (const id of list) set.add(id)
    }
  }
  return Array.from(set)
}

export async function GET() {
  try {
    console.log("Service key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    // Serve from cache when fresh
    if (CACHE && Date.now() < CACHE.expiresAt) {
      return NextResponse.json({ data: CACHE.data })
    }

  const supabase = await createAdminClient()

    // Fetch roles to find the role id for students (case-insensitive match)
    const { data: roles, error: roleErr } = await supabase
      .from("role")
      .select("roleid, rolename")

    if (roleErr) throw roleErr

    const siswaRoleId = roles?.find((r) => 
      String(r.rolename).toLowerCase() === "siswa" || 
      String(r.rolename).toLowerCase() === "student"
    )?.roleid || 5 // Default to 5 if not found

  // Fetch profiles; always fetch all and filter later if needed
  const { data: profiles, error: profErr } = await supabase
    .from("user_profiles")
    .select("userid, username, email, roleid, kelas, created_at, updated_at")
  if (profErr) throw profErr
  let profilesData: any[] = profiles || []
  console.log("Profiles fetched:", profilesData.length, profilesData)  // If we have profiles (e.g., siswa), start from them, but also include orphan activity userids as placeholders.
  let userIds: string[] = (profilesData || []).map((p: any) => p.userid)
  // We'll fetch activities once and aggregate in-memory
  let acts: any[] = []

    if (userIds.length > 0) {
      // Also include orphan activity userids not present in profiles (safe placeholder, no remapping)
      let orphanIds: string[] = []
      if (userIds.length > 0) {
        // Build a properly quoted IN list for PostgREST `in` filter
        const inList = `(${userIds.map((id) => `"${id}"`).join(',')})`
        const { data: orphanActs, error: orphanErr } = await supabase
          .from("aktivitas")
          .select("userid")
          .not("userid", "in", inList)
          .limit(50)
        if (!orphanErr) {
          const set = new Set<string>()
          for (const a of orphanActs || []) {
            if (a?.userid) set.add(a.userid as string)
          }
          orphanIds = Array.from(set)
        }
      }

  // Merge known users + orphans, then expand with verified alias sets (e.g., Raditya)
  let allUserIds = Array.from(new Set([...(userIds || []), ...orphanIds]))
  allUserIds = expandWithVerifiedAliases(allUserIds)

      // Single fetch of activities for all relevant user ids
      const { data: allActs, error: allActErr } = await supabase
        .from("aktivitas")
        .select("userid, status, created_at")
        .in("userid", allUserIds)
      if (allActErr) throw allActErr
      acts = allActs || []

      // Extend profiles with placeholders for orphanIds so they appear in the list
      const placeholderProfiles = (orphanIds || []).map((uid) => ({
        userid: uid,
        username: null,
        email: null,
        roleid: siswaRoleId || 5, // Assume orphans are students
        kelas: null,
        created_at: null,
        updated_at: null,
      }))
      profilesData = [
        ...(profilesData || []),
        ...placeholderProfiles,
      ]
      userIds = allUserIds
    } else {
      // Full fallback: build from aktivitas if there are no profiles at all
  const { data: allActs, error: actErr } = await supabase
        .from("aktivitas")
        .select("userid, status, created_at")
      if (actErr) throw actErr
      acts = allActs || []
  userIds = Array.from(new Set(acts.map((a: any) => a.userid).filter(Boolean))) as string[]
  // Ensure we include all verified aliases for any user we saw
  userIds = expandWithVerifiedAliases(userIds)
      if (userIds.length === 0) {
        return NextResponse.json({ data: [] })
      }
      // Try to fetch profiles for these users (some may not exist)
      const { data: prof2, error: prof2Err } = await supabase
        .from("user_profiles")
        .select("userid, username, email, roleid, kelas, created_at, updated_at")
        .in("userid", userIds)
      if (prof2Err) throw prof2Err
      profilesData = prof2 || []
    }

    // Consolidate into byUser from acts
  const byUser: Record<string, { total: number; completed: number; last?: string }> = {}
    for (const a of acts) {
      const u = a.userid as string
      if (!u) continue
      if (!byUser[u]) byUser[u] = { total: 0, completed: 0, last: undefined }
      byUser[u].total++
      if (a.status === "completed") byUser[u].completed++
      const ts = String(a.created_at)
      if (!byUser[u].last || ts > byUser[u].last!) byUser[u].last = ts
    }

    // Aggregate stats for verified aliases (e.g., Raditya Alfarisi duplicate accounts)
  const aggregatedByUser: Record<string, { total: number; completed: number; last?: string }> = {}
    for (const [userid, stats] of Object.entries(byUser)) {
      const verifiedAliases = VERIFIED_ALIASES.get(userid)
      if (verifiedAliases) {
        // Use the first verified alias as the primary userid for aggregation
        const primaryUserId = verifiedAliases[0]
        if (!aggregatedByUser[primaryUserId]) {
          aggregatedByUser[primaryUserId] = { total: 0, completed: 0, last: undefined }
        }
        
        aggregatedByUser[primaryUserId].total += stats.total
        aggregatedByUser[primaryUserId].completed += stats.completed
        if (!aggregatedByUser[primaryUserId].last || (stats.last && stats.last > aggregatedByUser[primaryUserId].last!)) {
          aggregatedByUser[primaryUserId].last = stats.last
        }
      } else {
        aggregatedByUser[userid] = stats
      }
    }

    const now = Date.now()
  // De-duplicate secondary IDs in verified alias groups (show only primary card)
    const aliasPrimaryById = new Map<string, string>()
    for (const [primary, list] of VERIFIED_ALIASES.entries()) {
      for (const id of list) aliasPrimaryById.set(id, primary)
    }

    // Build a profile map that prefers primary IDs and drops secondary duplicates
    const mapProfile = new Map<string, any>()
  for (const p of (profilesData || []) as any[]) {
      const uid = p.userid
      const primary = aliasPrimaryById.get(uid) || uid
      // Keep first occurrence only (prefer whichever comes first)
      if (!mapProfile.has(primary)) {
        mapProfile.set(primary, p)
      }
    }

    // Re-hydrate missing usernames/emails from user_profiles (single batched query)
    const missingIds: string[] = Array.from(mapProfile.entries())
      .filter(([, p]) => !p?.username && !p?.email)
      .map(([uid]) => uid)
    if (missingIds.length > 0) {
      const { data: refill, error: refillErr } = await supabase
        .from("user_profiles")
        .select("userid, username, email, roleid, kelas, created_at, updated_at")
        .in("userid", missingIds)
      if (!refillErr && refill) {
        for (const r of refill) {
          if (!r?.userid) continue
          // Replace placeholder entry with real profile row
          mapProfile.set(r.userid, { ...(mapProfile.get(r.userid) || {}), ...r })
        }
      }
    }

  // No extra DB fallback needed; aggregation already covered per-id totals/last

    // Enrich names/emails for profiles missing email/username using Admin Auth API
    const toEnrich = Array.from(mapProfile.entries())
      .filter(([, p]) => !p?.username && !p?.email)
      .map(([uid]) => uid)
    const authMap = new Map<string, { email?: string; name?: string }>()
    if (toEnrich.length > 0) {
      // Fetch users one-by-one via Admin API (small sets; avoids relying on PostgREST auth schema exposure)
      const results = await Promise.all(
        toEnrich.map(async (uid) => {
          try {
            const res = await supabase.auth.admin.getUserById(uid)
            const user = res?.data?.user
            if (user) {
              // Prefer explicit name from user metadata; fallback to identities if present
              const meta: any = (user as any).user_metadata || (user as any).raw_user_meta_data || {}
              let fullName: string | undefined = meta.full_name || meta.name
              let email: string | undefined = (user as any).email

              if (!fullName && Array.isArray((user as any).identities)) {
                for (const ident of (user as any).identities) {
                  const idata: any = ident.identity_data || {}
                  const n = idata.full_name || idata.name || [idata.given_name, idata.family_name].filter(Boolean).join(" ")
                  const e = idata.email
                  if (!fullName && n) fullName = n
                  if (!email && e) email = e
                }
              }

              authMap.set(uid, { email, name: fullName })
            }
          } catch (e) {
            // ignore per-user fetch errors
          }
        })
      )
      void results
    }

    // Return profiles (plus placeholders) as cards, de-duped by verified alias primary ID
    let data = Array.from(mapProfile.entries()).map(([uid, prof]: [string, any]) => {
      const primaryUid = uid
      const profMerged = mapProfile.get(primaryUid) || {}
      const stats = aggregatedByUser[primaryUid] || { total: 0, completed: 0, last: undefined }
      const lastActivity = stats.last
      let status: "active" | "inactive" | "completed" = "inactive"
  if (lastActivity) {
        const diffDays = (now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
        status = diffDays <= 3 ? "active" : "inactive"
      }

  const auth = authMap.get(uid) || {}
      const verifiedName = VERIFIED_DISPLAY_NAMES.get(primaryUid)
      const emailForName = profMerged.email || auth.email
      const derived = nameFromEmail(emailForName)
      const displayName =
        profMerged.username ||
        verifiedName ||
        auth.name ||
        derived ||
        (profMerged.email || auth.email)?.split('@')[0] ||
        `Siswa ${primaryUid.slice(0, 8)}`

      return {
        id: primaryUid,
        name: displayName,
        class: profMerged.kelas || "",
        email: profMerged.email || auth.email || null,
        activitiesCount: stats.total,
        lastActivity,
        status,
        roleid: profMerged.roleid,
      }
    })

    // Filter to only include students if siswaRoleId is found
    if (siswaRoleId) {
      data = data.filter(d => d.roleid === siswaRoleId)
    }  // Store in cache (best effort)
  CACHE = { data, expiresAt: Date.now() + CACHE_TTL_MS }
  console.log("Final data:", data)
  return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 })
  }
}
