import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    // Fetch aktivitas with related kegiatan name
    const { data: acts, error } = await supabase
      .from("aktivitas")
      .select(
        "activityid, activityname, activitycontent, kegiatanid, userid, status, created_at, updated_at, kegiatan:kegiatanid(kegiatanid, kegiatanname)"
      )
      .order("created_at", { ascending: false })
    if (error) throw error

    // Merge usernames from user_profiles manually (no direct FK from aktivitas -> user_profiles)
    const userIds = Array.from(
      new Set((acts || []).map((a: any) => a.userid).filter(Boolean))
    ) as string[]

    let nameByUser = new Map<string, string | null>()
    if (userIds.length) {
      const { data: profiles, error: profErr } = await supabase
        .from("user_profiles")
        .select("userid, username")
        .in("userid", userIds)
      if (profErr) throw profErr
      for (const p of profiles || []) nameByUser.set(p.userid, p.username ?? null)
    }

    const result = (acts || []).map((a: any) => ({
      ...a,
      profile: a.userid ? { username: nameByUser.get(a.userid) ?? null } : null,
    }))

    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}

// Create a new aktivitas with submitted field values
// Payload shape:
// {
//   kegiatanid: string,
//   activityname?: string,
//   activitycontent?: string,
//   status?: string,
//   values: Array<{
//     categoryid: string,
//     fields: Array<{ key: string; type?: string; value: any }>
//   }>
// }
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() || ""
    let kegiatanid: string | undefined
    let activityname: string | undefined
    let activitycontent: string | undefined
    let status: string | undefined
    let values: Array<{ categoryid: string; fields: Array<{ key: string; type?: string; value: any }> }> = []
    const incomingFiles: Array<{ categoryid: string; field_key: string; file: File }> = []

    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData()
      kegiatanid = (fd.get("kegiatanid") as string) || undefined
      activityname = (fd.get("activityname") as string) || undefined
      activitycontent = (fd.get("activitycontent") as string) || undefined
      status = (fd.get("status") as string) || undefined
      const rawValues = fd.get("values") as string | null
      if (rawValues) {
        try {
          const parsed = JSON.parse(rawValues)
          if (Array.isArray(parsed)) values = parsed
        } catch {}
      }
      for (const [key, val] of fd.entries()) {
        if (typeof val === "object" && "arrayBuffer" in val && key.startsWith("file:")) {
          const parts = key.split(":")
          if (parts.length === 3) {
            const [, catId, fieldKey] = parts
            incomingFiles.push({ categoryid: catId, field_key: fieldKey, file: val as File })
          }
        }
      }
    } else {
      const body = await request.json().catch(() => null)
      kegiatanid = body?.kegiatanid
      activityname = body?.activityname
      activitycontent = body?.activitycontent
      status = body?.status
      values = Array.isArray(body?.values) ? body.values : []
    }

    if (!kegiatanid) {
      return NextResponse.json({ error: "kegiatanid wajib diisi" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    const userid = auth.user?.id
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Ensure kegiatan exists (also get name for default title)
    const { data: keg, error: kegErr } = await supabase
      .from("kegiatan")
      .select("kegiatanid, kegiatanname")
      .eq("kegiatanid", kegiatanid)
      .single()
    if (kegErr || !keg) {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 })
    }

    // Insert aktivitas row
    const fallbackName = (() => {
      const base = keg?.kegiatanname || "Aktivitas"
      // ISO without seconds for brevity
      const iso = new Date().toISOString().slice(0, 16).replace("T", " ")
      return `${base} - ${iso}`
    })()
    const nonNullName = (typeof activityname === "string" && activityname.trim().length > 0)
      ? activityname.trim()
      : fallbackName
    const nonNullContent = typeof activitycontent === "string" ? activitycontent : ""

    const insertRow: any = { kegiatanid, userid, activityname: nonNullName, activitycontent: nonNullContent }
    if (typeof status === "string" && status.trim().length > 0) insertRow.status = status
    const { data: act, error: actErr } = await supabase
      .from("aktivitas")
      .insert(insertRow)
      .select("activityid")
      .single()
    if (actErr) throw actErr

    const activityid = act.activityid as string

    if (values.length === 0) {
      // No field values provided; return success for activity creation only
      // If files exist, continue to process files
      if (!incomingFiles.length) {
        return NextResponse.json({ data: { activityid, inserted: 0, warnings: ["Tidak ada nilai field yang dikirim."] } }, { status: 201 })
      }
    }

    // Resolve fieldids for provided categories/keys
    type FieldRow = { fieldid: string; categoryid: string; field_key: string; type?: string }
    const categories = Array.from(new Set([
      ...values.map(v => v.categoryid).filter(Boolean),
      ...incomingFiles.map(f => f.categoryid).filter(Boolean),
    ]))
    const { data: fieldRows, error: fieldsErr } = await supabase
      .from("category_fields")
      .select("fieldid, categoryid, field_key, type")
      .in("categoryid", categories)
    if (fieldsErr) throw fieldsErr

    const fieldMap = new Map<string, FieldRow>() // key: categoryid|field_key
    for (const f of fieldRows || []) {
      fieldMap.set(`${f.categoryid}|${f.field_key}`, f as FieldRow)
    }

    const rows: any[] = []
    const warnings: string[] = []

    for (const group of values) {
      if (!group?.categoryid || !Array.isArray(group.fields)) continue
      for (const fld of group.fields) {
        const key = `${group.categoryid}|${fld.key}`
        const meta = fieldMap.get(key)
        if (!meta) {
          warnings.push(`Field tidak dikenal: category=${group.categoryid} key=${fld.key}`)
          continue
        }
        // Normalize value based on type; we store as text for now
        let value: string | null = null
        const t = (fld.type ?? meta.type ?? "text").toString()
        if (fld.value == null) {
          value = null
        } else if (t === "multiselect") {
          // Accept string or string[]; store as comma-separated
          const arr = Array.isArray(fld.value) ? fld.value : [String(fld.value)]
          value = arr.join(",")
        } else if (t === "text_image") {
          // Expect text only here (image handled separately via files)
          const textOnly = (fld && typeof fld.value === "object" && fld.value !== null && "text" in fld.value)
            ? (fld.value as any).text
            : fld.value
          value = textOnly != null ? String(textOnly) : null
        } else if (t === "image") {
          // Image bytes stored separately; keep value null or filename
          value = null
        } else if (t === "time" || t === "text") {
          value = String(fld.value)
        } else {
          // Fallback stringify
          value = String(fld.value)
        }

        rows.push({ activityid, fieldid: meta.fieldid, value })
      }
    }

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("aktivitas_field_values").insert(rows)
      if (insErr) throw insErr
    }

    // Handle file uploads -> store as BYTEA in aktivitas_field_files
    if (incomingFiles.length > 0) {
      const fileRows: any[] = []
      for (const f of incomingFiles) {
        const meta = fieldMap.get(`${f.categoryid}|${f.field_key}`)
        if (!meta) {
          warnings.push(`File field tidak dikenal: category=${f.categoryid} key=${f.field_key}`)
          continue
        }
        const ab = await f.file.arrayBuffer()
        const bytes = Buffer.from(ab)
        fileRows.push({
          activityid,
          fieldid: meta.fieldid,
          filename: f.file.name || null,
          content_type: (f.file as any).type || "application/octet-stream",
          file_bytes: bytes,
        })
      }
      if (fileRows.length > 0) {
        // Try inserting into aktivitas_field_files; if table missing, fallback to aktivitas.activityimage when only one file
        const { error: fileErr } = await supabase.from("aktivitas_field_files").insert(fileRows)
        if (fileErr) {
          const message = String(fileErr.message || "")
          const looksMissing = message.includes("does not exist") || message.includes("not found") || message.includes("schema cache")
          if (looksMissing && fileRows.length === 1) {
            // Fallback: store first file into aktivitas.activityimage (BYTEA)
            const bytes = fileRows[0].file_bytes
            const { error: upErr } = await supabase
              .from("aktivitas")
              .update({ activityimage: bytes })
              .eq("activityid", activityid)
            if (upErr) {
              return NextResponse.json(
                { error: `Gagal menyimpan file ke kolom aktivitas.activityimage: ${upErr.message}` },
                { status: 500 }
              )
            }
            warnings.push("Tabel aktivitas_field_files belum ada. File disimpan ke aktivitas.activityimage.")
          } else {
            return NextResponse.json(
              { error: `Gagal menyimpan file ke database: ${fileErr.message}. Pastikan tabel aktivitas_field_files dengan kolom (activityid uuid, fieldid uuid, filename text, content_type text, file_bytes bytea, created_at timestamptz default now()) tersedia.` },
              { status: 500 }
            )
          }
        }
      }
    }

    return NextResponse.json({ data: { activityid, inserted: rows.length, warnings } }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
