"use client"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { GitMerge, Pencil, RefreshCcw, Search, Trash2, UserPlus } from "lucide-react"
import React from "react"

type UserProfile = {
  userid: string
  username: string | null
  email: string | null
  roleid: number | null
  kelas: string | null
  parent_of_userid?: string | null
  created_at?: string
  updated_at?: string
}

type ApiResponse<T> = { data?: T; error?: string; ok?: boolean }

function truncateId(id: string, len = 6) {
  if (!id) return ""
  return id.length <= len * 2 + 1
    ? id
    : `${id.slice(0, len)}…${id.slice(-len)}`
}

function roleName(id?: number | null) {
  if (!id || id === 1) return "" // hide unknown
  switch (id) {
    case 2:
      return "teacher"
    case 3:
      return "admin"
    case 4:
      return "parent"
    case 5:
      return "student"
    default:
      return String(id)
  }
}

function roleBadge(name?: string) {
  if (!name) return null
  const color =
    name === "admin" ? "bg-blue-100 text-blue-700" :
    name === "teacher" ? "bg-indigo-100 text-indigo-700" :
    name === "parent" ? "bg-amber-100 text-amber-700" :
    name === "student" ? "bg-green-100 text-green-700" :
    "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {name}
    </span>
  )
}

export default function UsersTable() {
  const [rows, setRows] = React.useState<UserProfile[] | null>(null)
  const [students, setStudents] = React.useState<UserProfile[]>([])
  const [parents, setParents] = React.useState<UserProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [total, setTotal] = React.useState(0)
  const [q, setQ] = React.useState("")

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState<null | string>(null) // userid
  const [editParentValue, setEditParentValue] = React.useState<string>("")
  const [mergeOpen, setMergeOpen] = React.useState<null | string>(null) // fromUserid
  const [mergeTarget, setMergeTarget] = React.useState<string>("")
  const [mergePreferSourceName, setMergePreferSourceName] = React.useState<boolean>(true)
  const [form, setForm] = React.useState<{
    username: string
    email: string
    roleid: string
    kelas: string
    password: string
  }>({ username: "", email: "", roleid: "", kelas: "", password: "" })

  const fetchRows = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        excludeRole: "1",
      })
      if (q.trim()) params.set("q", q.trim())
      const res = await fetch(`/api/user-profiles?${params.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load users")
      setRows(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, q])

  const fetchStudents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/user-profiles?roleid=5&pageSize=100", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load students")
      setStudents(json.data ?? [])
    } catch (e: any) {
      console.error("Error fetching students:", e)
    }
  }, [])

  const fetchParents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/user-profiles?roleid=4&pageSize=100", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load parents")
      setParents(json.data ?? [])
    } catch (e: any) {
      console.error("Error fetching parents:", e)
    }
  }, [])

  React.useEffect(() => {
    fetchRows()
  }, [fetchRows])

  React.useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  React.useEffect(() => {
    fetchParents()
  }, [fetchParents])

  // Reset edit parent value when dialog opens/closes
  React.useEffect(() => {
    if (editOpen && rows) {
      const user = rows.find(r => r.userid === editOpen)
      if (user?.roleid === 5) {
        // For students, find which parent is watching them
        const watchingParent = parents.find(p => p.parent_of_userid === user.userid)
        setEditParentValue(watchingParent?.userid || "")
      } else {
        setEditParentValue("")
      }
    } else {
      setEditParentValue("")
    }
  }, [editOpen, rows, parents])

  const visibleRows = React.useMemo(() => {
    if (!rows) return [] as UserProfile[]
    return rows
  }, [rows])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        roleid: form.roleid ? Number(form.roleid) : 1,
        kelas: form.kelas.trim() || null,
        password: form.password,
      }
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json: ApiResponse<UserProfile> = await res.json()
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized: login dulu sebagai admin")
        if (res.status === 403) throw new Error("Forbidden: hanya admin yang bisa membuat akun")
        throw new Error(json.error || "Failed to create user")
      }
      setForm({ username: "", email: "", roleid: "", kelas: "", password: "" })
      setRows((prev) => {
        const list = prev ? [...prev] : []
        const idx = list.findIndex((r) => r.userid === json.data!.userid)
        if (idx >= 0) {
          list[idx] = json.data!
          return list
        }
        return [json.data!, ...list]
      })
      setCreateOpen(false)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleUpdate(userid: string, patch: Partial<UserProfile>) {
    setError(null)
    setRows((prev) =>
      prev?.map((r) => (r.userid === userid ? { ...r, ...patch } : r)) || prev
    )
    try {
      const res = await fetch(`/api/user-profiles/${userid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
  const json: ApiResponse<UserProfile> = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update user")
      setRows((prev) =>
        prev?.map((r) => (r.userid === userid ? { ...r, ...json.data! } : r)) || prev
      )
      // Refresh parents data to update parent_of_userid relationships
      fetchParents()
      setEditOpen(null)
    } catch (e: any) {
      setError(e.message)
      fetchRows()
    }
  }

  async function handleDelete(userid: string) {
    setError(null)
    // optimistic
    const prevRows = rows
    setRows((cur) => cur?.filter((r) => r.userid !== userid) || null)
    try {
      const res = await fetch(`/api/user-profiles/${userid}`, { method: "DELETE" })
      const json: ApiResponse<unknown> = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to delete user")
    } catch (e: any) {
      setError(e.message)
      setRows(prevRows)
    }
  }

  async function handleMerge(fromUserid: string) {
    setError(null)
    try {
      if (!mergeTarget || mergeTarget === fromUserid) {
        throw new Error("Target userid harus diisi dan berbeda")
      }
      const res = await fetch("/api/admin/merge-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserid, toUserid: mergeTarget, preferSourceName: mergePreferSourceName }),
      })
      const json: ApiResponse<any> = await res.json()
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized: login dulu sebagai admin")
        if (res.status === 403) throw new Error("Forbidden: hanya admin yang bisa merge")
        throw new Error(json.error || "Gagal merge user")
      }
      // Optimistic: remove source row and refresh
      setRows((cur) => cur?.filter((r) => r.userid !== fromUserid) || null)
  setMergeOpen(null)
  setMergeTarget("")
  setMergePreferSourceName(true)
      fetchRows()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-emerald-100">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-emerald-900">User Profiles</h2>
          <p className="text-xs text-emerald-700">{total} pengguna aktif terdaftar</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-200 text-emerald-800">{total} Active</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px] max-w-[360px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value) }}
              placeholder="Search by name, email, role, id…"
              className="w-full text-sm pl-8 pr-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRows}
              title="Refresh"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={async () => {
                setError(null)
                try {
                  const res = await fetch('/api/admin/auto-merge', { method: 'POST' })
                  const json = await res.json()
                  if (!res.ok) {
                    if (res.status === 401) throw new Error('Unauthorized: login dulu sebagai admin')
                    if (res.status === 403) throw new Error('Forbidden: hanya admin yang bisa auto-merge')
                    throw new Error(json.error || 'Gagal auto-merge')
                  }
                  await fetchRows()
                } catch (e: any) {
                  setError(e.message)
                }
              }}
              title="Auto merge duplikat (username/email)"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              <GitMerge className="h-4 w-4" />
              <span className="hidden sm:inline">Auto Merge</span>
            </button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1 bg-emerald-600 text-white text-sm px-3 py-2 rounded-md hover:bg-emerald-700">
                  <UserPlus className="h-4 w-4" />
                  <span>New User</span>
                </button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
        <form onSubmit={handleCreate} className="grid gap-3">
                <label className="grid gap-1 text-sm">
          <span>Username</span>
                  <input
                    required
        value={form.username}
        onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                    placeholder="username"
                    className="border rounded-md px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Email (opsional)</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="border rounded-md px-3 py-2"
                  /> 
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Role ID</span>
                  <input
                    required
                    type="number"
                    value={form.roleid}
                    onChange={(e) => setForm((s) => ({ ...s, roleid: e.target.value }))}
                    placeholder="roleid"
                    className="border rounded-md px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Kelas (opsional)</span>
                  <input
                    value={form.kelas}
                    onChange={(e) => setForm((s) => ({ ...s, kelas: e.target.value }))}
                    placeholder="kelas"
                    className="border rounded-md px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Password</span>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    placeholder="password untuk akun baru"
                    className="border rounded-md px-3 py-2"
                  />
                </label>
                <DialogFooter>
                  <DialogClose asChild>
                    <button type="button" className="px-3 py-2 rounded-md border text-sm">Cancel</button>
                  </DialogClose>
                  <button type="submit" className="bg-black text-white px-3 py-2 rounded-md text-sm hover:bg-black/90">Create</button>
                </DialogFooter>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {error && (
          <div className="mt-3 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Table */}
      <div className="m-4 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">User ID</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Kelas</th>
              <th className="px-3 py-2 text-left">Relationship</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-3" colSpan={7}>Loading…</td>
              </tr>
            )}
            {!loading && visibleRows.length === 0 && (
              <tr>
                <td className="px-3 py-3" colSpan={7}>No users</td>
              </tr>
            )}
            {!loading && visibleRows.map((r) => (
              <tr key={r.userid} className="border-t">
                <td className="px-3 py-2 align-top">
                  <div className="font-mono" title={r.userid}>{truncateId(r.userid)}</div>
                </td>
                <td className="px-3 py-2 align-top">{r.username}</td>
                <td className="px-3 py-2 align-top">{r.email ?? ""}</td>
                <td className="px-3 py-2 align-top">{roleBadge(roleName(r.roleid))}</td>
                <td className="px-3 py-2 align-top">{r.kelas ?? "-"}</td>
                <td className="px-3 py-2 align-top">
                  {r.roleid === 4 && r.parent_of_userid ? (
                    // Parent watching a student
                    <div className="text-xs">
                      <div className="text-blue-600 font-medium">Parent of:</div>
                      <div className="font-mono" title={r.parent_of_userid}>
                        {truncateId(r.parent_of_userid)}
                      </div>
                      <div className="text-gray-500">
                        {students.find(s => s.userid === r.parent_of_userid)?.username || 'Unknown'}
                      </div>
                    </div>
                  ) : r.roleid === 5 ? (
                    // Student - show which parent is watching them
                    (() => {
                      const watchingParent = parents.find(p => p.parent_of_userid === r.userid)
                      return watchingParent ? (
                        <div className="text-xs">
                          <div className="text-green-600 font-medium">Watched by:</div>
                          <div className="font-mono" title={watchingParent.userid}>
                            {truncateId(watchingParent.userid)}
                          </div>
                          <div className="text-gray-500">
                            {watchingParent.username}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No parent assigned</span>
                      )
                    })()
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-right">
                  <div className="inline-flex gap-2">
                    <Dialog open={mergeOpen === r.userid} onOpenChange={(o) => { setMergeOpen(o ? r.userid : null); setMergeTarget(""); setMergePreferSourceName(true) }}>
                      <DialogTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 px-2 py-1 text-sm" title="Merge into target user">
                          <GitMerge className="h-4 w-4" />
                          <span className="hidden sm:inline">Merge</span>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Merge Pengguna</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleMerge(r.userid) }}
                          className="grid gap-3"
                        >
                          <p className="text-sm text-gray-600">Gabungkan data dari
                            <span className="font-mono"> {truncateId(r.userid)} </span>
                            ke userid tujuan berikut. Semua aktivitas akan dipindahkan ke userid tujuan. Profil sumber akan dihapus.
                          </p>
                          <div className="grid gap-1 text-sm">
                            <span>Target User ID</span>
                            <input
                              value={mergeTarget}
                              onChange={(e) => setMergeTarget(e.target.value)}
                              placeholder="contoh: eca885ad-…"
                              className="border rounded-md px-3 py-2 font-mono"
                              required
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={mergePreferSourceName}
                              onChange={(e) => setMergePreferSourceName(e.target.checked)}
                            />
                            <span>Utamakan nama dari sumber (mis. "Raditya Alfarisi")</span>
                          </label>
                          <DialogFooter>
                            <DialogClose asChild>
                              <button type="button" className="px-3 py-2 rounded-md border text-sm">Cancel</button>
                            </DialogClose>
                            <button type="submit" className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm hover:bg-emerald-700">Merge</button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={editOpen === r.userid} onOpenChange={(o) => setEditOpen(o ? r.userid : null)}>
                      <DialogTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 px-2 py-1 text-sm">
                          <Pencil className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget as HTMLFormElement)
                            
                            if (r.roleid === 5) {
                              // For students, handle parent-student relationship
                              const currentParent = parents.find(p => p.parent_of_userid === r.userid)
                              const newParentId = editParentValue || null
                              
                              // Remove old relationship
                              if (currentParent && currentParent.userid !== newParentId) {
                                await handleUpdate(currentParent.userid, { parent_of_userid: null })
                              }
                              
                              // Set new relationship
                              if (newParentId && newParentId !== currentParent?.userid) {
                                await handleUpdate(newParentId, { parent_of_userid: r.userid })
                              }
                              
                              // Update student basic info
                              const studentPayload: Partial<UserProfile> = {
                                username: String(fd.get("username") || ""),
                                email: String(fd.get("email") || "").trim() || null,
                                roleid: fd.get("roleid") ? Number(fd.get("roleid")) : null,
                                kelas: (String(fd.get("kelas") || "").trim() || null) as any,
                              }
                              handleUpdate(r.userid, studentPayload)
                            } else {
                              // For non-students, use original logic
                              const payload: Partial<UserProfile> = {
                                username: String(fd.get("username") || ""),
                                email: String(fd.get("email") || "").trim() || null,
                                roleid: fd.get("roleid") ? Number(fd.get("roleid")) : null,
                                kelas: (String(fd.get("kelas") || "").trim() || null) as any,
                                parent_of_userid: editParentValue || null,
                              }
                              handleUpdate(r.userid, payload)
                            }
                          }}
                          className="grid gap-3"
                        >
                          <div className="grid gap-1 text-sm">
                            <span>Username</span>
                            <input name="username" defaultValue={r.username ?? ""} className="border rounded-md px-3 py-2" />
                          </div>
                          <div className="grid gap-1 text-sm">
                            <span>Email</span>
                            <input name="email" type="email" defaultValue={r.email ?? ""} className="border rounded-md px-3 py-2" />
                          </div>
                          <div className="grid gap-1 text-sm">
                            <span>Role ID</span>
                            <input name="roleid" type="number" defaultValue={r.roleid ?? undefined} className="border rounded-md px-3 py-2" />
                          </div>
                          <div className="grid gap-1 text-sm">
                            <span>Kelas</span>
                            <input name="kelas" defaultValue={r.kelas ?? ""} className="border rounded-md px-3 py-2" />
                          </div>
                          {/* Parent selection - Show when editing student (role 5) */}
                          {r.roleid === 5 && (
                            <div className="grid gap-1 text-sm">
                              <span>Dipantau oleh Orang Tua</span>
                              <select 
                                value={editParentValue} 
                                onChange={(e) => {
                                  setEditParentValue(e.target.value)
                                }}
                                className="border rounded-md px-3 py-2"
                              >
                                <option value="">-- Tidak ada --</option>
                                {parents.map((parent) => (
                                  <option key={parent.userid} value={parent.userid}>
                                    {parent.username} {parent.email ? `(${parent.email})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <DialogFooter>
                            <DialogClose asChild>
                              <button type="button" className="px-3 py-2 rounded-md border text-sm">Cancel</button>
                            </DialogClose>
                            <button type="submit" className="bg-black text-white px-3 py-2 rounded-md text-sm hover:bg-black/90">Save</button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => handleDelete(r.userid)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 px-2 py-1 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • Total {total}
        </div>
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
