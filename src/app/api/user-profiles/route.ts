import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("user_profiles")
  .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
  const { username, email, roleid, kelas, userid: bodyUserid } = body ?? {}

  if (!username || typeof roleid === "undefined") {
      return NextResponse.json(
        { error: "username and roleid are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    // Resolve userid: prefer provided value, else current authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const finalUserid = bodyUserid ?? user?.id
    if (!finalUserid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        { userid: finalUserid, username, email, roleid, kelas },
        { onConflict: "userid" }
      )
      .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unexpected error", code: (error as any).code },
        { status: 500 }
      )
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}
