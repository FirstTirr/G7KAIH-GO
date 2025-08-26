"use client"

import { CalendarClock, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import * as React from "react";

type Category = { categoryid: string; categoryname: string | null }
type Row = {
  kegiatanid: string
  kegiatanname: string | null
  // legacy single category id for backward compat (may be null)
  categoryid?: string | null
  // new many-to-many categories from API
  categories?: Category[]
  created_at?: string | null
}
type Api<T> = { data?: T; error?: string; ok?: boolean }

export default function KegiatanTable() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [name, setName] = React.useState("")
  const [selectedCats, setSelectedCats] = React.useState<string[]>([])
  const [creating, setCreating] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [kegRes, catRes] = await Promise.all([
        fetch("/api/kegiatan", { cache: "no-store" }),
        fetch("/api/category", { cache: "no-store" }),
      ])
      const kegJson: Api<Row[]> = await kegRes.json()
      const catJson: Api<Category[]> = await catRes.json()
      if (!kegRes.ok) throw new Error(kegJson.error || "Failed to load kegiatan")
      if (!catRes.ok) throw new Error(catJson.error || "Failed to load categories")
  setRows(kegJson.data || [])
      setCategories(catJson.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // Refresh categories in real-time when CategoryTable updates
  React.useEffect(() => {
    const handler = () => {
      // reload both to sync label changes in badges
      load()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("categories:changed", handler)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("categories:changed", handler)
      }
    }
  }, [])

  async function createItem(e: React.FormEvent) {
    e.preventDefault()
    const kegiatanname = name.trim()
    if (!kegiatanname) return
    if (creating) return
    setCreating(true)
    const res = await fetch("/api/kegiatan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kegiatanname, categories: selectedCats }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to create")
      setCreating(false)
      return
    }
    setName("")
    setSelectedCats([])
    setCreating(false)
    load()
  }

  async function updateItem(id: string, payload: Partial<Row>) {
    const res = await fetch(`/api/kegiatan/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to update")
      return
    }
    load()
  }

  async function deleteItem(id: string) {
    if (!confirm("Hapus kegiatan ini?")) return
    const res = await fetch(`/api/kegiatan/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to delete")
      return
    }
    load()
  }

  return (
    <section className="rounded-xl border shadow-sm overflow-hidden bg-white">
      {/* Header with gradient, icon, actions */}
      <div className="px-4 py-4 border-b bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-indigo-600 border rounded-md p-2 shadow-sm">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Daftar Kegiatan</h2>
              <p className="text-xs text-gray-500">{rows.length} kegiatan terdaftar</p>
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
            <button
              className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded inline-flex items-center gap-2 hover:bg-indigo-700"
              onClick={() => setOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
              placeholder="Cari berdasarkan nama atau kategori…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm px-4 py-2">{error}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Nama Kegiatan</th>
              <th className="px-4 py-2 text-left">Kategori</th>
              <th className="px-4 py-2 text-left">Dibuat</th>
              <th className="px-4 py-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>Memuat…</td>
              </tr>
            ) : filtered(rows, categories, q).length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>Tidak ada hasil.</td>
              </tr>
            ) : (
              filtered(rows, categories, q).map((row) => (
                <EditableRow
                  key={row.kegiatanid}
                  row={row}
                  categories={categories}
                  onSave={(payload) => updateItem(row.kegiatanid, payload)}
                  onDelete={() => deleteItem(row.kegiatanid)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
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
      {open && (
        <Modal title="Tambah Kegiatan" onClose={() => setOpen(false)}>
          <form onSubmit={createItem} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nama kegiatan</label>
              <input
                autoFocus
                className="border rounded px-3 py-2 text-sm w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kerja bakti"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Kategori (boleh lebih dari satu)</label>
              <div className="max-h-48 overflow-auto border rounded p-2 space-y-1">
                {categories.length === 0 ? (
                  <p className="text-xs text-gray-500">Belum ada kategori.</p>
                ) : (
                  categories.map((c) => (
                    <label key={c.categoryid} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-indigo-600"
                        checked={selectedCats.includes(c.categoryid)}
                        onChange={(e) => {
                          setSelectedCats((prev) =>
                            e.target.checked
                              ? [...prev, c.categoryid]
                              : prev.filter((id) => id !== c.categoryid)
                          )
                        }}
                      />
                      <span>{c.categoryname}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-sm px-3 py-2 rounded border"
                onClick={() => setOpen(false)}
              >
                Batal
              </button>
              <button className="bg-black text-white text-sm px-3 py-2 rounded disabled:opacity-50" disabled={creating}>
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

function EditableRow({
  row,
  categories,
  onSave,
  onDelete,
}: {
  row: Row
  categories: Category[]
  onSave: (payload: any) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(row.kegiatanname ?? "")
  const [cats, setCats] = React.useState<string[]>(
    row.categories?.map((c) => c.categoryid) || (row.categoryid ? [row.categoryid] : [])
  )

  React.useEffect(() => {
    setName(row.kegiatanname ?? "")
    setCats(row.categories?.map((c) => c.categoryid) || (row.categoryid ? [row.categoryid] : []))
  }, [row])

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        {editing ? (
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          row.kegiatanname || "-"
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="max-h-28 overflow-auto border rounded p-2 space-y-1 w-56">
            {categories.length === 0 ? (
              <p className="text-xs text-gray-500">Belum ada kategori.</p>
            ) : (
              categories.map((c) => (
                <label key={c.categoryid} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-indigo-600"
                    checked={cats.includes(c.categoryid)}
                    onChange={(e) =>
                      setCats((prev) =>
                        e.target.checked
                          ? [...prev, c.categoryid]
                          : prev.filter((id) => id !== c.categoryid)
                      )
                    }
                  />
                  <span>{c.categoryname}</span>
                </label>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(row.categories && row.categories.length > 0
              ? row.categories
              : row.categoryid
              ? categories.filter((c) => c.categoryid === row.categoryid)
              : []
            ).map((c) => (
              <span
                key={c.categoryid}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700"
              >
                {c.categoryname}
              </span>
            ))}
            {(!row.categories || row.categories.length === 0) && !row.categoryid && <span>-</span>}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {row.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-"}
      </td>
      <td className="px-4 py-3 space-x-2">
        {editing ? (
          <>
            <button
              className="bg-black text-white text-xs px-2 py-1 rounded"
              onClick={() => {
                onSave({ kegiatanname: name.trim(), categories: cats })
                setEditing(false)
              }}
            >
              Simpan
            </button>
            <button
              className="text-xs px-2 py-1 rounded border"
              onClick={() => setEditing(false)}
            >
              Batal
            </button>
          </>
        ) : (
          <>
            <button
              className="text-xs px-2 py-1 rounded border inline-flex items-center gap-1"
              title="Edit"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              className="text-xs px-2 py-1 rounded border text-red-600 inline-flex items-center gap-1"
              title="Hapus"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </td>
    </tr>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

function filtered(rows: Row[], categories: Category[], q: string): Row[] {
  const query = q.trim().toLowerCase()
  if (!query) return rows
  const nameById = new Map(
    categories.map((c) => [c.categoryid, (c.categoryname || "").toLowerCase()])
  )
  return rows.filter((r) => {
    const name = (r.kegiatanname || "").toLowerCase()
    const catNames: string[] = r.categories && r.categories.length
      ? r.categories.map((c) => (c.categoryname || "").toLowerCase())
      : r.categoryid
      ? [nameById.get(r.categoryid || "") || ""]
      : []
    return name.includes(query) || catNames.some((n) => n.includes(query))
  })
}
