import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { userid: string } }
) {
  try {
    const { userid } = params
    const payload = await request.json()
    const update: Record<string, any> = {}
  for (const key of ["username", "email", "roleid", "kelas"]) {
      if (key in payload) update[key] = payload[key]
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("user_profiles")
      .update(update)
      .eq("userid", userid)
  .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { userid: string } }
) {
  try {
    const { userid } = params
    const supabase = await createClient()
    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("userid", userid)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}
