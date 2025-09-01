"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"

type Field = {
  key: string
  label: string
  type: "text" | "time" | "image" | "text_image" | "multiselect"
  required?: boolean
  config?: any
}

type Category = {
  categoryid: string
  categoryname: string
  inputs?: Field[]
}

type KegiatanDetail = {
  kegiatanname: string
  categories: Category[]
}

export default function SiswaKegiatanDetail() {
  const params = useParams<{ kegiatanid: string | string[] }>()
  const router = useRouter()
  const kegiatanid = Array.isArray(params?.kegiatanid)
    ? params.kegiatanid[0]
    : params?.kegiatanid

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<KegiatanDetail | null>(null)
  const [values, setValues] = React.useState<Record<string, Record<string, any>>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    if (!kegiatanid) {
      setError("Kegiatan tidak ditemukan")
      setLoading(false)
      return
    }
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/kegiatan/${kegiatanid}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Gagal memuat data (${res.status})`)
        const json = await res.json()
        const payload: KegiatanDetail | undefined = json?.data ?? json
        if (!payload) throw new Error("Data tidak ditemukan")
        if (active) {
          setData({ kegiatanname: payload.kegiatanname, categories: payload.categories || [] })
          const seed: Record<string, Record<string, any>> = {}
          for (const c of payload.categories || []) seed[c.categoryid] = {}
          setValues(seed)
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Terjadi kesalahan")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [kegiatanid])

  const setFieldValue = (categoryid: string, key: string, val: any) => {
    setValues((prev) => ({
      ...prev,
      [categoryid]: {
        ...(prev[categoryid] || {}),
        [key]: val,
      },
    }))
  }

  const validateRequired = (): string | null => {
    if (!data) return "Tidak ada data"
    for (const cat of data.categories || []) {
      for (const f of cat.inputs || []) {
        if (f.required) {
          const v = values?.[cat.categoryid]?.[f.key]
          if (
            v == null ||
            (typeof v === "string" && v.trim() === "") ||
            (Array.isArray(v) && v.length === 0)
          ) {
            return `Kolom wajib: ${f.label} (Kategori: ${cat.categoryname})`
          }
        }
      }
    }
    return null
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    const invalid = validateRequired()
    if (invalid) {
      setSubmitError(invalid)
      return
    }

    try {
      setSubmitting(true)
      // Build multipart form-data to carry files + values JSON
      const valuesArray = (data?.categories || []).map((c) => ({
        categoryid: c.categoryid,
        fields: (c.inputs || []).map((f) => {
          const cur = values?.[c.categoryid]?.[f.key]
          if (f.type === "multiselect") {
            return { key: f.key, type: f.type, value: Array.isArray(cur) ? cur : [] }
          }
          if (f.type === "image") {
            // value stored via file part
            return { key: f.key, type: f.type, value: null }
          }
          if (f.type === "text_image") {
            const textVal = cur && typeof cur === "object" ? cur.text ?? "" : ""
            return { key: f.key, type: f.type, value: textVal }
          }
          return { key: f.key, type: f.type, value: cur ?? null }
        }),
      }))

      const fd = new FormData()
      fd.append("kegiatanid", String(kegiatanid))
      fd.append("values", JSON.stringify(valuesArray))
      for (const c of data?.categories || []) {
        for (const f of c.inputs || []) {
          const cur = values?.[c.categoryid]?.[f.key]
          if (f.type === "image" && cur instanceof File) {
            fd.append(`file:${c.categoryid}:${f.key}`, cur, cur.name)
          }
          if (f.type === "text_image" && cur && typeof cur === "object" && cur.image instanceof File) {
            fd.append(`file:${c.categoryid}:${f.key}`, cur.image as File, (cur.image as File).name)
          }
        }
      }

      const res = await fetch("/api/aktivitas", {
        method: "POST",
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Gagal menyimpan aktivitas")
      setSubmitSuccess("Aktivitas berhasil dikirim.")
      setTimeout(() => router.push("/siswa"), 900)
    } catch (e: any) {
      setSubmitError(e?.message || "Terjadi kesalahan saat mengirim")
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (c: Category, f: Field) => {
    const fieldId = `${c.categoryid}-${f.key}`
    const v = values?.[c.categoryid]?.[f.key]
    const common =
      "block w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"

    switch (f.type) {
      case "text":
        return (
          <input
            id={fieldId}
            type="text"
            className={common}
            required={f.required}
            value={v ?? ""}
            onChange={(e) => setFieldValue(c.categoryid, f.key, e.target.value)}
            placeholder={f.label}
          />
        )
      case "time":
        return (
          <input
            id={fieldId}
            type="time"
            className={common}
            required={f.required}
            value={v ?? ""}
            onChange={(e) => setFieldValue(c.categoryid, f.key, e.target.value)}
          />
        )
      case "multiselect": {
        const opts: string[] = Array.isArray(f?.config?.options) ? f.config.options : []
        const selected: string[] = Array.isArray(v) ? v : []
        return (
          <div className="flex flex-col gap-1" id={fieldId}>
            {opts.map((o) => {
              const checked = selected.includes(o)
              return (
                <label key={o} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selected)
                      if (e.target.checked) next.add(o)
                      else next.delete(o)
                      setFieldValue(c.categoryid, f.key, Array.from(next))
                    }}
                  />
                  <span>{o}</span>
                </label>
              )
            })}
          </div>
        )
      }
      case "image":
        return (
          <input
            id={fieldId}
            type="file"
            accept={f?.config?.accept || "image/*"}
            className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:text-sm file:bg-gray-100 file:hover:bg-gray-200"
            onChange={(e) => setFieldValue(c.categoryid, f.key, e.target.files?.[0] || null)}
          />
        )
      case "text_image":
        return (
          <div className="space-y-2">
            <input
              id={fieldId}
              type="text"
              className={common}
              placeholder={f.label}
              value={v?.text ?? ""}
              onChange={(e) =>
                setFieldValue(c.categoryid, f.key, { ...(v || {}), text: e.target.value })
              }
            />
            <input
              type="file"
              accept={f?.config?.accept || "image/*"}
              className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:text-sm file:bg-gray-100 file:hover:bg-gray-200"
              onChange={(e) =>
                setFieldValue(c.categoryid, f.key, { ...(v || {}), image: e.target.files?.[0] || null })
              }
            />
          </div>
        )
      default:
        return (
          <input
            id={fieldId}
            type="text"
            className={common}
            value={v ?? ""}
            onChange={(e) => setFieldValue(c.categoryid, f.key, e.target.value)}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">{data?.kegiatanname || "Detail Kegiatan"}</h1>
            <p className="text-sm text-gray-500">Isi aktivitasmu sesuai kategori yang tersedia.</p>
          </div>
          <Link href="/siswa" className="text-sm text-emerald-700 hover:underline">
            &larr; Kembali
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="h-24 bg-white rounded-lg border animate-pulse" />
            <div className="h-24 bg-white rounded-lg border animate-pulse" />
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <form onSubmit={onSubmit} className="space-y-6">
            {data.categories?.length ? (
              data.categories.map((c) => (
                <div key={c.categoryid} className="bg-white rounded-lg border shadow-sm">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h2 className="font-medium">{c.categoryname}</h2>
                    <span className="text-xs text-gray-500">
                      {(c.inputs?.filter((f) => f.required).length || 0)} wajib diisi
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    {(c.inputs || []).length === 0 ? (
                      <p className="text-sm text-gray-500">Tidak ada field untuk kategori ini.</p>
                    ) : (
                      (c.inputs || []).map((f) => (
                        <div key={f.key} className="space-y-1">
                          <label htmlFor={`${c.categoryid}-${f.key}`} className="text-sm font-medium">
                            {f.label}
                            {f.required ? <span className="text-red-600"> *</span> : null}
                          </label>
                          {renderField(c, f)}
                          <p className="text-[11px] text-gray-500">
                            {f.type === "multiselect"
                              ? "Bisa memilih lebih dari satu opsi."
                              : f.type === "image" || f.type === "text_image"
                              ? "File gambar akan dikirim dan disimpan di database."
                              : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border rounded p-4 text-sm text-gray-600">
                Belum ada kategori untuk kegiatan ini.
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{submitError}</div>
            )}
            {submitSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded text-sm">
                {submitSuccess}
              </div>
            )}

            <div className="sticky bottom-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white ${
                  submitting ? "bg-emerald-300" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {submitting ? "Mengirim…" : "Kirim Aktivitas"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/siswa")}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

