import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    // Fetch aktivitas with related kegiatan name
    const { data: acts, error } = await supabase
      .from("aktivitas")
      .select(
        "activityid, activityname, activitycontent, kegiatanid, userid, status, created_at, updated_at, kegiatan:kegiatanid(kegiatanid, kegiatanname)"
      )
      .order("created_at", { ascending: false })
    if (error) throw error

    // Merge usernames from user_profiles manually (no direct FK from aktivitas -> user_profiles)
    const userIds = Array.from(
      new Set((acts || []).map((a: any) => a.userid).filter(Boolean))
    ) as string[]

    let nameByUser = new Map<string, string | null>()
    if (userIds.length) {
      const { data: profiles, error: profErr } = await supabase
        .from("user_profiles")
        .select("userid, username")
        .in("userid", userIds)
      if (profErr) throw profErr
      for (const p of profiles || []) nameByUser.set(p.userid, p.username ?? null)
    }

    const result = (acts || []).map((a: any) => ({
      ...a,
      profile: a.userid ? { username: nameByUser.get(a.userid) ?? null } : null,
    }))

    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
