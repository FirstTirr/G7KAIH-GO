import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ kegiatanid: string }> }
) {
  try {
    const { kegiatanid } = await params
    const body = await request.json()
    const update: Record<string, any> = {}
    if (typeof body.kegiatanname === "string") {
      update.kegiatanname = body.kegiatanname.trim()
    }

    const supabase = await createClient()
    if (Object.keys(update).length) {
      const { error: updErr } = await supabase
        .from("kegiatan")
        .update(update)
        .eq("kegiatanid", kegiatanid)
      if (updErr) throw updErr
    }

    // Many-to-many categories support
    if (Array.isArray(body.categories)) {
      const newSet = new Set<string>(body.categories.filter(Boolean))
      const { data: existing, error: exErr } = await supabase
        .from("kegiatan_categories")
        .select("categoryid")
        .eq("kegiatanid", kegiatanid)
      if (!exErr && Array.isArray(existing)) {
        const curSet = new Set<string>(existing.map((r: any) => r.categoryid))
        const toAdd = [...newSet].filter((id) => !curSet.has(id))
        const toDel = [...curSet].filter((id) => !newSet.has(id))
        if (toAdd.length) {
          const rows = toAdd.map((cid) => ({ kegiatanid, categoryid: cid }))
          const { error: addErr } = await supabase.from("kegiatan_categories").upsert(rows)
          if (addErr) throw addErr
        }
        if (toDel.length) {
          const { error: delErr } = await supabase
            .from("kegiatan_categories")
            .delete()
            .eq("kegiatanid", kegiatanid)
            .in("categoryid", toDel)
          if (delErr) throw delErr
        }
  } else if (exErr) {
        throw exErr
      }
    }

    const { data, error } = await supabase
      .from("kegiatan")
  .select("kegiatanid, kegiatanname, created_at")
      .eq("kegiatanid", kegiatanid)
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
  { params }: { params: Promise<{ kegiatanid: string }> }
) {
  try {
    const { kegiatanid } = await params
    const supabase = await createClient()
    // Best-effort: remove join rows first if join table exists
    const { error: delJoinErr } = await supabase
      .from("kegiatan_categories")
      .delete()
      .eq("kegiatanid", kegiatanid)
    if (delJoinErr && !String(delJoinErr.message || "").includes("does not exist")) {
      throw delJoinErr
    }
    const { error } = await supabase
      .from("kegiatan")
      .delete()
      .eq("kegiatanid", kegiatanid)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
