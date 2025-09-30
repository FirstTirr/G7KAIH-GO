"use client"

import { RefreshCcw, Search } from "lucide-react";
import React from "react";

type Role = { roleid: number; rolename: string }
type UserProfile = { userid: string; username: string | null; email: string | null; roleid: number | null; kelas: string | null }
type ApiResponse<T> = { data?: T; error?: string }

export default function PendingAccounts() {
  const [rows, setRows] = React.useState<UserProfile[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [total, setTotal] = React.useState(0)
  const [q, setQ] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), roleid: "1" })
  if (q.trim()) params.set("q", q.trim())
      const [r1, r2] = await Promise.all([
        fetch(`/api/user-profiles?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/roles", { cache: "no-store" }),
      ])
      const j1 = await r1.json()
      const j2: ApiResponse<Role[]> = await r2.json()
      if (!r1.ok) throw new Error(j1.error || "Failed to load users")
      if (!r2.ok) throw new Error(j2.error || "Failed to load roles")
      setRows(j1.data || [])
      setTotal(j1.total ?? 0)
      setRoles((j2.data || []).filter((r) => r.roleid !== 1))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, q])

  React.useEffect(() => { load() }, [load])

  async function confirmRole(userid: string, roleid: number) {
    setError(null)
    try {
      const res = await fetch(`/api/user-profiles/${userid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleid }),
      })
      const json: ApiResponse<UserProfile> = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update role")
      setRows((prev) => prev.filter((r) => r.userid !== userid))
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-sky-50 to-indigo-50">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-slate-900">Pending Accounts</h3>
          <p className="text-xs text-slate-600">{total} akun menunggu persetujuan</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-200 text-amber-800">{total} Pending</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px] max-w-[360px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value) }}
              placeholder="Search by name, email, id…"
              className="w-full text-sm pl-8 pr-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button onClick={load} title="Refresh" className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md border hover:bg-gray-50">
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="m-4 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">User ID</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-3 py-3" colSpan={4}>Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td className="px-3 py-3" colSpan={4}>No pending accounts</td></tr>
            )}
            {!loading && rows.map((u) => (
              <tr key={u.userid} className="border-t">
                <td className="px-3 py-2 align-top font-mono" title={u.userid}>{u.userid.slice(0,6)}…{u.userid.slice(-6)}</td>
                <td className="px-3 py-2 align-top">{u.username}</td>
                <td className="px-3 py-2 align-top">{u.email}</td>
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center gap-2">
                    <select 
                      className="border rounded-md px-2 py-1 w-40 bg-white" 
                      defaultValue="" 
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        if (val) {
                          confirmRole(u.userid, val)
                        }
                      }}
                    >
                      <option value="" disabled>Pilih role...</option>
                      {roles.map((r) => (
                        <option key={r.roleid} value={r.roleid}>
                          {r.rolename}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • Total {total}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1.5 border rounded-md bg-white disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >Prev</button>
          <button
            className="px-2 py-1.5 border rounded-md bg-white disabled:opacity-50"
            onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
            disabled={loading || page * pageSize >= total}
          >Next</button>
          <select
            className="ml-2 border rounded-md px-2 py-1.5 bg-white"
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
