"use client"

import { CalendarClock, RefreshCw, Search } from "lucide-react"
import * as React from "react"

type Row = {
  activityid: string
  activityname: string | null
  activitycontent: string | null
  kegiatanid: string | null
  userid: string | null
  status: string | null
  created_at?: string | null
  updated_at?: string | null
  kegiatan?: { kegiatanid: string; kegiatanname: string | null } | null
  profile?: { username: string | null } | null
}

type Api<T> = { data?: T; error?: string }

export default function AktivitasTable() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [q, setQ] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/aktivitas", { cache: "no-store" })
      const json: Api<Row[]> = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load aktivitas")
      setRows(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const data = React.useMemo(() => filter(rows, q), [rows, q])

  return (
    <section className="rounded-xl border shadow-sm overflow-hidden bg-white">
      <div className="px-4 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-cyan-700 border rounded-md p-2 shadow-sm">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Aktivitas</h2>
              <p className="text-xs text-gray-500">{rows.length} aktivitas terekam</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load()}
              className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
              placeholder="Cari aktivitas atau kegiatan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm px-4 py-2">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Nama Aktivitas</th>
              <th className="px-4 py-2 text-left">Kegiatan</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3" colSpan={5}>Memuat…</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={5}>Tidak ada hasil.</td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.activityid} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.activityname || "-"}</div>
                    {row.activitycontent && (
                      <div className="text-xs text-gray-600 line-clamp-1">{row.activitycontent}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.kegiatan?.kegiatanname || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {row.profile?.username || row.userid || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700">
                      {row.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t text-xs text-gray-600 flex items-center justify-between">
        <span>Page 1 of 1 • Total {rows.length}</span>
        <div className="space-x-2">
          <button className="px-3 py-1.5 rounded border text-gray-400 cursor-not-allowed" disabled>
            Prev
          </button>
          <button className="px-3 py-1.5 rounded border text-gray-400 cursor-not-allowed" disabled>
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

function filter(rows: Row[], q: string): Row[] {
  const query = q.trim().toLowerCase()
  if (!query) return rows
  return rows.filter((r) => {
    const a = (r.activityname || "").toLowerCase()
    const k = (r.kegiatan?.kegiatanname || "").toLowerCase()
    const u = (r.profile?.username || "").toLowerCase()
    return a.includes(query) || k.includes(query) || u.includes(query)
  })
}
