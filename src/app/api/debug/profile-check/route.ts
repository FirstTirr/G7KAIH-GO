import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userids = url.searchParams.get("userids")?.split(",") || []
    
    if (userids.length === 0) {
      return NextResponse.json({ error: "userids parameter required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get profiles for the userids
    const { data: profiles, error: profErr } = await supabase
      .from("user_profiles")
      .select("userid, username, email, created_at")
      .in("userid", userids)

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    // Get recent activities for these userids
    const { data: activities, error: actErr } = await supabase
      .from("aktivitas")
      .select("userid, activityname, created_at")
      .in("userid", userids)
      .order("created_at", { ascending: false })
      .limit(10)

    if (actErr) {
      return NextResponse.json({ error: actErr.message }, { status: 500 })
    }

    return NextResponse.json({
      profiles: profiles || [],
      activities: activities || [],
      analysis: {
        profileCount: profiles?.length || 0,
        activityCount: activities?.length || 0,
        potentialDuplicates: checkDuplicates(profiles || [])
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function checkDuplicates(profiles: any[]) {
  const duplicates = []
  
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const p1 = profiles[i]
      const p2 = profiles[j]
      
      const reasons = []
      if (p1.username === p2.username && p1.username) {
        reasons.push("same username")
      }
      if (p1.email === p2.email && p1.email) {
        reasons.push("same email")
      }
      
      if (reasons.length > 0) {
        duplicates.push({
          userid1: p1.userid,
          userid2: p2.userid,
          reasons
        })
      }
    }
  }
  
  return duplicates
}
