"use client"
import Link from "next/link";
import * as React from "react";

type Kegiatan = { kegiatanid: string; kegiatanname: string; created_at?: string; categories?: { categoryid: string; categoryname: string }[] }

export default function Page() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<Kegiatan[]>([])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/kegiatan", { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Gagal memuat kegiatan")
        if (mounted) setRows(json.data || [])
      } catch (e: any) {
        if (mounted) setError(e?.message || "Gagal memuat")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Kegiatan</h1>
      {loading ? (
        <div>Memuat…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div>Tidak ada kegiatan.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((k) => (
            <li key={k.kegiatanid} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{k.kegiatanname}</div>
                {Array.isArray(k.categories) && k.categories.length > 0 && (
                  <div className="text-xs text-gray-500">Kategori: {k.categories.map((c) => c.categoryname).join(", ")}</div>
                )}
              </div>
              <Link href={`/siswa/${k.kegiatanid}`} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">Buka</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}