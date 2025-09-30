import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: cats, error: catErr } = await supabase
      .from("category")
      .select("categoryid, categoryname")
      .order("categoryname", { ascending: true })
    if (catErr) throw catErr

    if (!cats || cats.length === 0) return NextResponse.json({ data: [] })

    const ids = cats.map((c: any) => c.categoryid)
    const { data: fields, error: fldErr } = await supabase
      .from("category_fields")
      .select("categoryid, field_key, label, type, required, order_index, config")
      .in("categoryid", ids)
    if (fldErr) throw fldErr

    const byCat = new Map<string, any[]>()
    for (const f of fields || []) {
      const arr = byCat.get(f.categoryid) || []
      arr.push({
        key: f.field_key,
        label: f.label,
        type: f.type,
        required: !!f.required,
        order: typeof f.order_index === "number" ? f.order_index : 0,
        config: f.config && typeof f.config === "object" ? f.config : undefined,
      })
      byCat.set(f.categoryid, arr)
    }

    const data = cats.map((c: any) => ({
      categoryid: c.categoryid,
      categoryname: c.categoryname,
      inputs: (byCat.get(c.categoryid) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }))

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { categoryname, inputs, kegiatanIds, autoAttachAllKegiatan } = (await request.json()) as {
      categoryname?: string
      inputs?: any
      kegiatanIds?: string[] | null
      autoAttachAllKegiatan?: boolean
    }
    if (!categoryname || !categoryname.trim()) {
      return NextResponse.json(
        { error: "categoryname is required" },
        { status: 400 }
      )
    }

  const supabase = await createClient()
    const name = categoryname.trim()
    // Check duplicate by exact name
    const { data: existsData, error: existsErr } = await supabase
      .from("category")
      .select("categoryid")
      .eq("categoryname", name)
      .limit(1)
    if (existsErr) throw existsErr
    if (Array.isArray(existsData) && existsData.length > 0) {
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 })
    }
    // optional inputs validation
    let cleanInputs: any[] = []
    if (typeof inputs !== "undefined") {
      const { validateCategoryInputs } = await import("@/utils/lib/category-inputs")
      const res = validateCategoryInputs(inputs)
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 })
      }
      cleanInputs = res.value || []
    }

    // Insert category
    const { data: cat, error: catErr } = await supabase
      .from("category")
      .insert({ categoryname: name })
      .select("categoryid, categoryname")
      .single()
    if (catErr) throw catErr

    // Insert fields if any
    if (cleanInputs.length > 0) {
      const rows = cleanInputs.map((f: any) => ({
        categoryid: cat.categoryid,
        field_key: f.key,
        label: f.label,
        type: f.type,
        required: !!f.required,
        order_index: typeof f.order === "number" ? f.order : 0,
        config: f.config ?? {},
      }))
      const { error: cfErr } = await supabase.from("category_fields").insert(rows)
      if (cfErr) throw cfErr
    }

    // Auto attach to kegiatan if requested (default: attach to all existing)
    const explicitIds = Array.isArray(kegiatanIds)
      ? Array.from(
          new Set(
            kegiatanIds
              .map((id) => (typeof id === "string" ? id.trim() : ""))
              .filter((id) => id.length > 0)
          )
        )
      : []
    let targetKegiatanIds = [...explicitIds]
    if (targetKegiatanIds.length === 0 && autoAttachAllKegiatan !== false) {
      const { data: kegiatanList, error: kegErr } = await supabase
        .from("kegiatan")
        .select("kegiatanid")
      if (kegErr && !String(kegErr.message || "").includes("does not exist")) {
        throw kegErr
      }
      if (Array.isArray(kegiatanList)) {
        targetKegiatanIds = kegiatanList
          .map((k: any) => k?.kegiatanid)
          .filter((id: any): id is string => typeof id === "string" && id.length > 0)
      }
    }

    if (targetKegiatanIds.length > 0) {
      const rows = targetKegiatanIds.map((kegiatanid) => ({ kegiatanid, categoryid: cat.categoryid }))
      const { error: linkErr } = await supabase.from("kegiatan_categories").upsert(rows)
      if (linkErr && !String(linkErr.message || "").includes("does not exist")) {
        throw linkErr
      }
    }

    // Return with mapped inputs
    const data = { ...cat, inputs: cleanInputs }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
