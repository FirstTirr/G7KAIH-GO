import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// Verified duplicate mappings (manually curated to prevent cross-contamination)
const VERIFIED_ALIASES = new Map<string, string[]>([
  // Raditya Alfarisi - verified same person with different userids
  ['6f07ae03-187e-4e25-a519-9f72f96f22ff', ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'eca885ad-1119-48ca-8efe-91efcbfb54b4']],
  ['eca885ad-1119-48ca-8efe-91efcbfb54b4', ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'eca885ad-1119-48ca-8efe-91efcbfb54b4']]
])

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userid = url.searchParams.get("userid") || "6f07ae03-187e-4e25-a519-9f72f96f22ff"
    
    const supabase = await createAdminClient()

    // Test verified aliases
    const verifiedAliases = VERIFIED_ALIASES.get(userid)
    console.log(`[DEBUG] Testing userid: ${userid}`)
    console.log(`[DEBUG] Verified aliases:`, verifiedAliases)

    if (verifiedAliases) {
      // Check activities for each alias
      const aliasResults = []
      for (const aliasId of verifiedAliases) {
        const { count, error } = await supabase
          .from("aktivitas")
          .select("activityid", { count: "exact", head: true })
          .eq("userid", aliasId)
        
        aliasResults.push({
          userid: aliasId,
          activityCount: count || 0,
          error: error?.message
        })
      }

      return NextResponse.json({
        userid,
        verifiedAliases,
        aliasResults,
        totalActivities: aliasResults.reduce((sum, r) => sum + r.activityCount, 0)
      })
    } else {
      return NextResponse.json({
        userid,
        message: "No verified aliases found",
        verifiedAliases: null
      })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
