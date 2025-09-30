import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const JAKARTA_TZ = "Asia/Jakarta"

function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

type NormalizedField = {
  key: string
  label: string
  type: string
  required: boolean
  order: number
  config?: Record<string, any>
}

const allowedFieldTypes = new Set(["text", "time", "image", "text_image", "multiselect"])

function sanitizeFieldType(value: any): string {
  const next = typeof value === "string" ? value.trim().toLowerCase() : ""
  return allowedFieldTypes.has(next) ? next : "text"
}

function normalizeInputs(raw: any): NormalizedField[] {
  const asArray = (() => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
        if (parsed && typeof parsed === "object") return Object.values(parsed)
      } catch {
        return []
      }
    }
    if (raw && typeof raw === "object") {
      if (Array.isArray((raw as any).data)) return (raw as any).data
      const values = Object.values(raw)
      if (values.every((item) => item && typeof item === "object")) return values
    }
    return []
  })()

  const normalized: NormalizedField[] = []

  asArray.forEach((item: any, index: number) => {
    const key = typeof item?.key === "string" ? item.key : null
    if (!key) return
    const label = typeof item?.label === "string" ? item.label : ""
    const type = sanitizeFieldType(item?.type)
    normalized.push({
      key,
      label,
      type,
      required: !!item?.required,
      order: Number.isFinite(item?.order) ? Number(item.order) : index,
      config:
        item?.config && typeof item.config === "object"
          ? (item.config as Record<string, any>)
          : undefined,
    })
  })

  return normalized.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

async function getCurrentRoleName(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { userId: null, roleName: null }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("userid, role:roleid(rolename)")
    .eq("userid", user.id)
    .maybeSingle()

  const linkedRole = (profile as any)?.role
  let roleName: string | null = null
  if (linkedRole) {
    roleName = Array.isArray(linkedRole) ? linkedRole[0]?.rolename ?? null : linkedRole?.rolename ?? null
  }

  return { userId: user.id, roleName }
}

async function isSubmissionWindowOpen(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("submission_window")
    .select("is_open")
    .eq("id", 1)
    .maybeSingle<{ is_open: boolean }>()

  if (error && error.code !== "PGRST116") throw error
  return data?.is_open ?? false
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ kegiatanid: string }> }
) {
  try {
    const { kegiatanid } = await params
    const supabase = await createClient()

    const { userId, roleName } = await getCurrentRoleName(supabase)
    if (roleName === "student") {
      const open = await isSubmissionWindowOpen(supabase)
      if (!open) {
        return NextResponse.json(
          { error: "Pengumpulan belum dibuka. Silakan hubungi admin." },
          { status: 403 }
        )
      }
    }

    let adminClient: Awaited<ReturnType<typeof createAdminClient>> | null = null
    if (roleName === "student") {
      adminClient = await createAdminClient().catch((err) => {
        console.error("[kegiatan/:id] admin client unavailable", err?.message || err)
        return null
      })
    }
    const categoryClient = (adminClient ?? supabase) as any

    // Fetch kegiatan
    const { data: keg, error: kegErr } = await supabase
      .from("kegiatan")
      .select("kegiatanid, kegiatanname, created_at")
      .eq("kegiatanid", kegiatanid)
      .single()
    if (kegErr) throw kegErr

    let categories: { categoryid: string; categoryname: string; inputs?: any[] }[] = []

    if (roleName === "student") {
      const { data: rpcCategories, error: rpcErr } = await categoryClient.rpc(
        "student_get_kegiatan_categories",
        { p_kegiatanid: kegiatanid }
      )

      if (rpcErr && rpcErr.code !== "PGRST116") throw rpcErr

      if (Array.isArray(rpcCategories) && rpcCategories.length) {
        categories = rpcCategories
          .filter((row: any) => typeof row?.categoryid === "string")
          .map((row: any) => ({
            categoryid: row.categoryid,
            categoryname: typeof row?.categoryname === "string" ? row.categoryname : "",
            inputs: normalizeInputs(row?.inputs),
          }))
      }
    }

    if (!categories.length) {
      // Fallback to direct table queries (used for non-students or when RPC returns nothing)
      const { data: joinRows, error: joinErr } = await categoryClient
        .from("kegiatan_categories")
        .select("categoryid")
        .eq("kegiatanid", kegiatanid)

      if (joinErr && joinErr.code !== "PGRST116") throw joinErr

      const orderedCatIds = (joinRows || [])
        .map((row: any) => {
          const raw = row?.categoryid
          if (typeof raw === "string") return raw
          if (typeof raw === "number") return String(raw)
          return null
        })
        .filter((id: string | null): id is string => typeof id === "string" && id.length > 0)

      const uniqueCatIds = Array.from(new Set(orderedCatIds))

      if (uniqueCatIds.length) {
        const { data: catRows, error: catErr } = await categoryClient
          .from("category")
          .select("categoryid, categoryname")
          .in("categoryid", uniqueCatIds)
        if (catErr) throw catErr

        const nameMap = new Map<string, string>()
        for (const row of catRows || []) {
          if (row?.categoryid) nameMap.set(row.categoryid, row.categoryname ?? "")
        }

        const baseCategoryMap = new Map<string, { categoryid: string; categoryname: string; inputs: any[] }>()
        for (const id of orderedCatIds) {
          if (!baseCategoryMap.has(id)) {
            baseCategoryMap.set(id, {
              categoryid: id,
              categoryname: nameMap.get(id) ?? "",
              inputs: [],
            })
          }
        }

        categories = Array.from(baseCategoryMap.values())

        const { data: fields, error: fldErr } = await categoryClient
          .from("category_fields")
          .select("categoryid, field_key, label, type, required, order_index, config")
          .in("categoryid", uniqueCatIds)
        if (fldErr && fldErr.code !== "PGRST116" && fldErr.code !== "42501") throw fldErr

        const fieldRows = (!fldErr || fldErr.code === "PGRST116" || fldErr.code === "42501") ? fields || [] : []

        const byCat = new Map<string, any[]>()
        for (const f of fieldRows) {
          const arr = byCat.get(f.categoryid) || []
          arr.push({
            key: f.field_key,
            label: typeof f.label === "string" ? f.label : "",
            type: sanitizeFieldType(f.type),
            required: !!f.required,
            order: typeof f.order_index === "number" ? f.order_index : 0,
            config: f.config && typeof f.config === "object" ? f.config : undefined,
          })
          byCat.set(f.categoryid, arr)
        }

        categories = categories.map((c) => ({
          ...c,
          inputs: (byCat.get(c.categoryid) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }))
      }
    }

    let submissionStatus: { canSubmit: boolean; lastSubmittedAt: string | null } = {
      canSubmit: true,
      lastSubmittedAt: null,
    }
    if (roleName === "student" && userId) {
      const today = todayInJakarta()
      const { data: existingToday, error: existingErr } = await supabase
        .from("aktivitas")
        .select("activityid, created_at")
        .eq("kegiatanid", kegiatanid)
        .eq("userid", userId)
        .eq("submitted_date", today)
        .maybeSingle()

      if (existingErr && existingErr.code !== "PGRST116") {
        throw existingErr
      }

      if (existingToday) {
        submissionStatus = {
          canSubmit: false,
          lastSubmittedAt: existingToday.created_at ?? null,
        }
      }
    }

    return NextResponse.json({ data: { ...keg, categories, submissionStatus } })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}

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
