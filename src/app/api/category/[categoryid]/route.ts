import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryid: string }> }
) {
  try {
    const { categoryid } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Update name if supplied
    if (typeof body.categoryname === "string") {
      const name = String(body.categoryname).trim()
      const { error: upErr } = await supabase
        .from("category")
        .update({ categoryname: name })
        .eq("categoryid", categoryid)
      if (upErr) throw upErr
    }

    // Replace inputs if supplied (this will remove existing field values for this category)
    let mappedInputs: any[] | undefined = undefined
    if (typeof body.inputs !== "undefined") {
      const { validateCategoryInputs } = await import("@/utils/lib/category-inputs")
      const res = validateCategoryInputs(body.inputs)
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 })
      }
      const inputs = res.value || []
      // Fetch existing field ids for this category
      const { data: existingFields, error: selErr } = await supabase
        .from("category_fields")
        .select("fieldid")
        .eq("categoryid", categoryid)
      if (selErr) throw selErr
      const fieldIds = (existingFields || []).map((f: any) => f.fieldid)
      if (fieldIds.length > 0) {
        const { error: delValsErr } = await supabase
          .from("aktivitas_field_values")
          .delete()
          .in("fieldid", fieldIds)
        if (delValsErr) throw delValsErr
      }
      // Delete existing fields, then insert new set
      const { error: delErr } = await supabase
        .from("category_fields")
        .delete()
        .eq("categoryid", categoryid)
      if (delErr) throw delErr
      if (inputs.length > 0) {
        const rows = inputs.map((f: any) => ({
          categoryid,
          field_key: f.key,
          label: f.label,
          type: f.type,
          required: !!f.required,
          order_index: typeof f.order === "number" ? f.order : 0,
          config: f.config ?? {},
        }))
        const { error: insErr } = await supabase.from("category_fields").insert(rows)
        if (insErr) throw insErr
      }
      mappedInputs = inputs
    }

    // Return latest
    const { data: cat, error: catErr } = await supabase
      .from("category")
      .select("categoryid, categoryname")
      .eq("categoryid", categoryid)
      .single()
    if (catErr) throw catErr
    if (mappedInputs === undefined) {
      const { data: fields } = await supabase
        .from("category_fields")
        .select("field_key, label, type, required, order_index, config")
        .eq("categoryid", categoryid)
      mappedInputs = (fields || []).map((f: any) => ({
        key: f.field_key,
        label: f.label,
        type: f.type,
        required: !!f.required,
        order: typeof f.order_index === "number" ? f.order_index : 0,
        config: f.config && typeof f.config === "object" ? f.config : undefined,
      }))
    }
    mappedInputs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return NextResponse.json({ data: { ...cat, inputs: mappedInputs } })
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
    // Remove dependent rows first
    const { data: fields } = await supabase
      .from("category_fields")
      .select("fieldid")
      .eq("categoryid", categoryid)
    const fids = (fields || []).map((f: any) => f.fieldid)
    if (fids.length > 0) {
      await supabase.from("aktivitas_field_values").delete().in("fieldid", fids)
    }
    await supabase.from("category_fields").delete().eq("categoryid", categoryid)
    await supabase.from("kegiatan_categories").delete().eq("categoryid", categoryid)
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
