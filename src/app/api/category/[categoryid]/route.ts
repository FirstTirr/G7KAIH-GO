import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryid: string }> }
) {
  try {
    const { categoryid } = await params
    const body = await request.json()
    const update: Record<string, any> = {}
    if (typeof body.categoryname === "string") {
      update.categoryname = body.categoryname.trim()
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("category")
      .update(update)
      .eq("categoryid", categoryid)
      .select("categoryid, categoryname")
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryid: string }> }
) {
  try {
    const { categoryid } = await params
    const supabase = await createClient()
    // Best-effort: remove join rows first if join table exists
    const { error: delJoinErr } = await supabase
      .from("kegiatan_categories")
      .delete()
      .eq("categoryid", categoryid)
    if (delJoinErr && !String(delJoinErr.message || "").includes("does not exist")) {
      throw delJoinErr
    }
    const { error } = await supabase
      .from("category")
      .delete()
      .eq("categoryid", categoryid)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
