import { createAdminClient } from "@/utils/supabase/admin"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userid: string }> }
) {
  try {
    const { userid } = await params
    if (!userid) {
      return NextResponse.json({ error: "userid is required" }, { status: 400 })
    }
    const url = new URL(request.url)
    const month = url.searchParams.get("month") // YYYY-MM or "latest"

  const supabase = await createAdminClient()

    // Quick debug: check if there are any rows for this userid at all
    const { count: anyCount, error: anyErr } = await supabase
      .from("aktivitas")
      .select("activityid", { count: "exact", head: true })
      .eq("userid", userid)
    if (anyErr) throw anyErr
  console.log("[activities API] userid=", userid, "month=", month, "anyCount=", anyCount)

    async function getMonthBounds(target?: string): Promise<{ start: Date; end: Date; monthUsed: string } | null> {
      if (target === "latest") {
        const { data: latest, error: latestErr } = await supabase
          .from("aktivitas")
          .select("created_at")
          .eq("userid", userid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestErr) throw latestErr
        if (!latest?.created_at) return null
        const d = new Date(latest.created_at as string)
        const y = d.getFullYear()
        const m = d.getMonth()
        return {
          start: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
          end: new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0)),
          monthUsed: `${y}-${String(m + 1).padStart(2, "0")}`,
        }
      }
      if (target && /^\d{4}-\d{2}$/.test(target)) {
        const [y, m] = target.split("-").map((n) => Number(n))
        return {
          start: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0)),
          end: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
          monthUsed: target,
        }
      }
      const now = new Date()
      return {
        start: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)),
        monthUsed: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      }
    }

    let bounds = await getMonthBounds(month || undefined)
    if (!bounds) {
      console.log("[activities API] No bounds found for userid=", userid, "month=", month, "anyCount=", anyCount)
      return NextResponse.json({
        data: {},
        monthUsed: null,
        debug: {
          requestedMonth: month,
          anyCount,
          userid,
          note: "No aktivitas found for this userid",
        },
      })
    }
    let { start, end, monthUsed } = bounds

  const { data: items, error } = await supabase
      .from("aktivitas")
      .select("activityid, activityname, activitycontent, status, created_at")
      .eq("userid", userid)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })

    if (error) throw error

  let result = items || []
    console.log("[activities API] initial month query count=", result.length, { monthUsed, start: start.toISOString(), end: end.toISOString() })
    // Fallback: if no items for requested month and request wasn't "latest", try latest month with data
    if (result.length === 0 && month !== "latest") {
      const latestBounds = await getMonthBounds("latest")
      if (latestBounds) {
        start = latestBounds.start
        end = latestBounds.end
        monthUsed = latestBounds.monthUsed
        const { data: latestItems, error: latestErr } = await supabase
          .from("aktivitas")
          .select("activityid, activityname, activitycontent, status, created_at")
          .eq("userid", userid)
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString())
          .order("created_at", { ascending: true })
        if (latestErr) throw latestErr
        result = latestItems || []
  console.log("[activities API] latest month fallback count=", result.length, { monthUsed })
      }
    }

    // Final fallback: if still empty, try fetching recent entries regardless of month
    if ((result?.length ?? 0) === 0) {
      const { data: recent, error: recentErr } = await supabase
        .from("aktivitas")
        .select("activityid, activityname, activitycontent, status, created_at")
        .eq("userid", userid)
        .order("created_at", { ascending: true })
        .limit(100)
      if (recentErr) throw recentErr
      if (recent && recent.length > 0) {
        result = recent
        const last = new Date(recent[recent.length - 1].created_at as string)
        const y = last.getFullYear()
        const m = last.getMonth()
        monthUsed = `${y}-${String(m + 1).padStart(2, "0")}`
  console.log("[activities API] recent fallback count=", result.length, { monthUsed })
      }
    }

    const byDate: Record<string, any[]> = {}
  for (const a of result) {
      const d = new Date(a.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      const points = a.status === "completed" ? 10 : 0
      ;(byDate[key] ||= []).push({
        id: a.activityid,
        title: a.activityname,
        type: "habit",
        status: a.status,
        time,
        description: a.activitycontent,
        points,
      })
    }

  console.log("[activities API] final grouped days=", Object.keys(byDate).length, "totalItems=", Object.values(byDate).reduce((n, arr) => n + (arr?.length || 0), 0))
  return NextResponse.json({
      data: byDate,
      monthUsed,
      debug: {
        requestedMonth: month,
        bounds: { start: start.toISOString(), end: end.toISOString() },
        totalItems: Object.values(byDate).reduce((n, arr) => n + (arr?.length || 0), 0),
        anyCount,
        userid,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 })
  }
}
