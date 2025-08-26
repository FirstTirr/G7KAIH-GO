"use client"

import { Pencil, Plus, RefreshCw, Search, Tag, Trash2 } from "lucide-react";
import * as React from "react";

type Category = { categoryid: string; categoryname: string | null }
type Api<T> = { data?: T; error?: string; ok?: boolean }

export default function CategoryTable() {
  const [rows, setRows] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [name, setName] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/category", { cache: "no-store" })
      const json: Api<Category[]> = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load categories")
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

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    const value = name.trim()
    if (!value) return
    if (creating) return
    setCreating(true)
    setError(null)
    const res = await fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryname: value }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to create")
      setCreating(false)
      return
    }
    setName("")
    setOpen(false)
    setCreating(false)
    // Beritahu komponen lain bahwa daftar kategori berubah
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories:changed"))
    }
    load()
  }

  async function updateCategory(id: string, categoryname: string) {
    const res = await fetch(`/api/category/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryname }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to update")
      return
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories:changed"))
    }
    load()
  }

  async function deleteCategory(id: string) {
    if (!confirm("Hapus kategori ini?")) return
    const res = await fetch(`/api/category/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to delete")
      return
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories:changed"))
    }
    load()
  }

  return (
    <section className="rounded-xl border shadow-sm overflow-hidden bg-white">
      {/* Header dengan gradient, ikon, dan aksi */}
      <div className="px-4 py-4 border-b bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-emerald-600 border rounded-md p-2 shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Kategori</h2>
              <p className="text-xs text-gray-500">{rows.length} kategori tersedia</p>
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
              className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded inline-flex items-center gap-2 hover:bg-emerald-700"
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
              placeholder="Cari kategori…"
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
              <th className="px-4 py-2 text-left">Nama Kategori</th>
              <th className="px-4 py-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3" colSpan={2}>Memuat…</td>
              </tr>
            ) : filtered(rows, q).length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={2}>Tidak ada hasil.</td>
              </tr>
            ) : (
              filtered(rows, q).map((row) => (
                <EditableRow
                  key={row.categoryid}
                  value={row.categoryname ?? ""}
                  onSave={(v) => updateCategory(row.categoryid, v)}
                  onDelete={() => deleteCategory(row.categoryid)}
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
        <Modal onClose={() => setOpen(false)} title="Tambah Kategori">
          <form onSubmit={createCategory} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nama kategori</label>
              <input
                autoFocus
                className="border rounded px-3 py-2 text-sm w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kebersihan"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-sm px-3 py-2 rounded border"
                onClick={() => setOpen(false)}
              >
                Batal
              </button>
              <button
                className="bg-black text-white text-sm px-3 py-2 rounded disabled:opacity-50"
                disabled={creating}
              >
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
  value,
  onSave,
  onDelete,
}: {
  value: string
  onSave: (v: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [val, setVal] = React.useState(value)

  React.useEffect(() => setVal(value), [value])

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        {editing ? (
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        ) : (
          value || "-"
        )}
      </td>
      <td className="px-4 py-3 space-x-2">
        {editing ? (
          <>
            <button
              className="bg-black text-white text-xs px-2 py-1 rounded"
              onClick={() => {
                onSave(val.trim())
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

function filtered(rows: Category[], q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return rows
  return rows.filter((r) => (r.categoryname || "").toLowerCase().includes(query))
}
