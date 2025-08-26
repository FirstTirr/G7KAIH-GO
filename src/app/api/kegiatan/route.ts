import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    // Base kegiatan list
    const { data: kegList, error: kegErr } = await supabase
      .from("kegiatan")
  .select("kegiatanid, kegiatanname, created_at")
      .order("created_at", { ascending: false })
    if (kegErr) throw kegErr

    // Try many-to-many join table first
    const { data: mapRows, error: mapErr } = await supabase
      .from("kegiatan_categories")
      .select("kegiatanid, categoryid, category:categoryid(categoryid, categoryname)")

    let result: any[] = []
    if (!mapErr && Array.isArray(mapRows)) {
      const byKeg = new Map<string, { categoryid: string; categoryname: string }[]>()
      for (const m of mapRows as any[]) {
        const arr = byKeg.get(m.kegiatanid) ?? []
        if (m.category) arr.push(m.category)
        byKeg.set(m.kegiatanid, arr)
      }
      result = (kegList || []).map((k) => ({
        kegiatanid: k.kegiatanid,
        kegiatanname: k.kegiatanname,
        created_at: k.created_at,
        categories: byKeg.get(k.kegiatanid) ?? [],
      }))
    } else {
      // Fallback: join table not present, return kegiatan without categories
      result = (kegList || []).map((k) => ({
        kegiatanid: k.kegiatanid,
        kegiatanname: k.kegiatanname,
        created_at: k.created_at,
        categories: [],
      }))
    }

    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { kegiatanname, categories } = (await request.json()) as {
      kegiatanname?: string
      categories?: string[] | null // new m2m
    }
    if (!kegiatanname || !kegiatanname.trim()) {
      return NextResponse.json(
        { error: "kegiatanname is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const name = kegiatanname.trim()
    // Soft duplicate guard: exact name check
    const { data: existKeg, error: existErr } = await supabase
      .from("kegiatan")
      .select("kegiatanid")
      .eq("kegiatanname", name)
      .limit(1)
    if (existErr) throw existErr
    if (Array.isArray(existKeg) && existKeg.length > 0) {
      return NextResponse.json({ error: "Kegiatan dengan nama sama sudah ada" }, { status: 409 })
    }
    const { data: keg, error } = await supabase
      .from("kegiatan")
      .insert({ kegiatanname: name })
      .select("kegiatanid, kegiatanname, created_at")
      .single()
    if (error) throw error

    // If categories array provided, try to write to join table (graceful fallback)
    const cats = Array.isArray(categories) ? categories.filter(Boolean) : []
    if (keg && cats.length) {
      const rows = cats.map((cid) => ({ kegiatanid: keg.kegiatanid, categoryid: cid }))
      const { error: linkErr } = await supabase.from("kegiatan_categories").upsert(rows)
      if (linkErr && !String(linkErr.message || "").includes("does not exist")) {
        // real error
        throw linkErr
      }
    }

    return NextResponse.json({ data: keg })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
