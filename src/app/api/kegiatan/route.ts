import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

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

export async function GET() {
  try {
    const supabase = await createClient()
    const { roleName } = await getCurrentRoleName(supabase)

    if (roleName === "student") {
      const open = await isSubmissionWindowOpen(supabase)
      if (!open) {
        return NextResponse.json(
          { error: "Pengumpulan belum dibuka. Silakan hubungi admin." },
          { status: 403 }
        )
      }
    }
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
    const { kegiatanname, categories, autoAttachAllCategories } = (await request.json()) as {
      kegiatanname?: string
      categories?: string[] | null // new m2m
      autoAttachAllCategories?: boolean
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
    const providedCats = Array.isArray(categories)
      ? Array.from(
          new Set(
            categories
              .map((cid) => (typeof cid === "string" ? cid.trim() : ""))
              .filter((cid) => cid.length > 0)
          )
        )
      : []
    let catIds = [...providedCats]

    if (catIds.length === 0 && autoAttachAllCategories !== false) {
      const { data: catList, error: catFetchErr } = await supabase.from("category").select("categoryid")
      if (catFetchErr && !String(catFetchErr.message || "").includes("does not exist")) {
        throw catFetchErr
      }
      if (Array.isArray(catList)) {
        catIds = catList
          .map((c: any) => c?.categoryid)
          .filter((cid: any): cid is string => typeof cid === "string" && cid.length > 0)
      }
    }

    if (keg && catIds.length) {
      const rows = catIds.map((cid) => ({ kegiatanid: keg.kegiatanid, categoryid: cid }))
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
