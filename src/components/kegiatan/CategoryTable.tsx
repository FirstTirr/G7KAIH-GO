"use client"

import { FormBuilder } from "@/components/builder/FormBuilder"
import { validateCategoryInputs } from "@/utils/lib/category-inputs"
import { Pencil, Plus, RefreshCw, Search, Trash2, Wrench } from "lucide-react"
import * as React from "react"

type Category = { categoryid: string; categoryname: string | null; inputs?: any[] }
type Api<T> = { data?: T; error?: string; ok?: boolean }

export default function CategoryTable() {
  const [rows, setRows] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [createInputsOpen, setCreateInputsOpen] = React.useState(false)
  const [inputsText, setInputsText] = React.useState("")
  // FormBuilder modal state (lifted out of table body)
  const [builderOpen, setBuilderOpen] = React.useState(false)
  const [builderFor, setBuilderFor] = React.useState<Category | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/category", { cache: "no-store" })
      const json: Api<Category[]> = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal memuat kategori")
      setRows(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
    const handler = () => load()
    if (typeof window !== "undefined") {
      window.addEventListener("categories:changed", handler)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("categories:changed", handler)
      }
    }
  }, [load])

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    const value = name.trim()
    if (!value || creating) return
    setCreating(true)
    setError(null)
    // Optional inputs parsing & validation
    let inputsPayload: any | undefined = undefined
    if (inputsText.trim()) {
      try {
        const parsed = JSON.parse(inputsText)
        const res = validateCategoryInputs(parsed)
        if (!res.ok) throw new Error(res.error || "Invalid inputs schema")
        inputsPayload = res.value
      } catch (err: any) {
        setError(`Inputs tidak valid: ${err.message}`)
        setCreating(false)
        return
      }
    }
    const res = await fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryname: value, inputs: inputsPayload }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any).error || "Gagal membuat kategori")
      setCreating(false)
      return
    }
    setName("")
    setInputsText("")
    setOpen(false)
    setCreating(false)
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
      const json = await res.json().catch(() => ({}))
      alert((json as any).error || "Gagal memperbarui kategori")
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
      const json = await res.json().catch(() => ({}))
      alert((json as any).error || "Gagal menghapus kategori")
      return
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories:changed"))
    }
    load()
  }

  function openBuilderFor(row: Category) {
    setBuilderFor(row)
    setBuilderOpen(true)
  }

  async function saveFromBuilder(fields: { id: string; key: string; label: string; type: string; required?: boolean; options?: string[] }[]) {
    if (!builderFor) return
    const payload = fields.map((f, idx) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, order: idx, config: f.options ? { options: f.options } : undefined }))
    try {
      const resp = await fetch(`/api/category/${builderFor.categoryid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: payload }),
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error((json as any)?.error || "Gagal menyimpan inputs")
      setBuilderOpen(false)
      setBuilderFor(null)
      if (typeof window !== "undefined") window.dispatchEvent(new Event("categories:changed"))
      load()
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan inputs")
    }
  }

  return (
    <section className="border rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Kategori</h2>
          <p className="text-xs text-gray-500">Kelola kategori dan input dinamis</p>
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

      <div className="px-4 py-3">
        {/* Search */}
        <div className="mb-4">
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

        {error && <p className="text-red-600 text-sm px-1 py-2">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Nama Kategori</th>
                <th className="px-4 py-2 text-left">Input</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Memuat…</td>
                </tr>
              ) : filtered(rows, q).length === 0 ? (
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Tidak ada hasil.</td>
                </tr>
              ) : (
                filtered(rows, q).map((row) => (
                  <EditableRow
                    key={row.categoryid}
                    row={row}
                    onSave={(v) => updateCategory(row.categoryid, v)}
                    onDelete={() => deleteCategory(row.categoryid)}
                    onOpenBuilder={() => openBuilderFor(row)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-1 py-3 text-xs text-gray-600 flex items-center justify-between">
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
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setCreateInputsOpen((v) => !v)}
                  className="text-xs px-2 py-1 border rounded"
                >
                  {createInputsOpen ? "Sembunyikan input (opsional)" : "Tambahkan input (opsional)"}
                </button>
              </div>
              {createInputsOpen && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">Inputs JSON</label>
                  <textarea
                    className="border rounded px-3 py-2 text-sm w-full font-mono min-h-32"
                    placeholder='[
  { "key": "jam", "label": "Jam", "type": "time", "required": true },
  { "key": "catatan", "label": "Catatan", "type": "text" }
]'
                    value={inputsText}
                    onChange={(e) => setInputsText(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tipe: text, time, image, text_image, multiselect.
                  </p>
                </div>
              )}
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
      {/* Render FormBuilder outside of <table> to avoid invalid DOM inside <tbody> */}
      <FormBuilder
        categoryName={builderFor?.categoryname || "-"}
        isOpen={builderOpen}
        initial={(Array.isArray(builderFor?.inputs) ? (builderFor?.inputs as any[]) : []).map((f: any, idx: number) => ({ id: `f-${idx}`, key: f.key, label: f.label, type: f.type, required: !!f.required, options: f?.config?.options }))}
        onClose={() => {
          setBuilderOpen(false)
          setBuilderFor(null)
        }}
        onSave={saveFromBuilder}
      />
    </section>
  )
}

function EditableRow({
  row,
  onSave,
  onDelete,
  onOpenBuilder,
}: {
  row: Category
  onSave: (v: string) => void
  onDelete: () => void
  onOpenBuilder: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [val, setVal] = React.useState(row.categoryname ?? "")
  const [inputsOpen, setInputsOpen] = React.useState(false)
  const [inputsText, setInputsText] = React.useState<string>("")
  const [savingInputs, setSavingInputs] = React.useState(false)

  React.useEffect(() => setVal(row.categoryname ?? ""), [row.categoryname])
  React.useEffect(() => {
    if (inputsOpen) {
      const json = row.inputs && Array.isArray(row.inputs) ? JSON.stringify(row.inputs, null, 2) : ""
      setInputsText(json)
    }
  }, [inputsOpen, row.inputs])

  async function saveInputs() {
    if (!inputsOpen) return
    setSavingInputs(true)
    try {
      const trimmed = inputsText.trim()
      let payload: any = []
      if (trimmed) {
        const parsed = JSON.parse(trimmed)
        const res = validateCategoryInputs(parsed)
        if (!res.ok) throw new Error(res.error || "Skema inputs tidak valid")
        payload = res.value
      }
      const resp = await fetch(`/api/category/${row.categoryid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: payload }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || "Gagal menyimpan inputs")
      setInputsOpen(false)
      // refresh list via event so parent reloads
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("categories:changed"))
      }
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan inputs")
    } finally {
      setSavingInputs(false)
    }
  }

  // FormBuilder is now rendered by parent to avoid invalid DOM structure.

  return (
    <>
      <tr className="border-t">
        <td className="px-4 py-3">
          {editing ? (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          ) : (
            row.categoryname || "-"
          )}
        </td>
        <td className="px-4 py-3">
          {Array.isArray(row.inputs) && row.inputs.length > 0 ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {row.inputs.length} field
              </span>
              <span className="text-gray-500 hidden md:inline">
                {summarizeInputs(row.inputs)}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">Belum ada</span>
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
                className="text-xs px-2 py-1 rounded border inline-flex items-center gap-1"
                title="Kelola Input"
                onClick={() => setInputsOpen(true)}
              >
                <Wrench className="w-4 h-4" />
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
      {inputsOpen && (
        <tr className="bg-white">
          <td className="px-4 py-3" colSpan={3}>
            <div className="mt-3 p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                <strong className="text-sm">Kelola Input untuk: {row.categoryname}</strong>
                <div className="flex items-center gap-2">
                  <button className="text-xs px-2 py-1 border rounded" onClick={onOpenBuilder}>Buka Form Builder</button>
                  <button className="text-xs px-2 py-1 border rounded" onClick={() => setInputsOpen(false)}>Tutup</button>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mb-1">Masukkan array JSON field. Tipe: text, time, image, text_image, multiselect.</p>
              <textarea
                className="w-full min-h-32 border rounded px-2 py-1 text-xs font-mono"
                value={inputsText}
                onChange={(e) => setInputsText(e.target.value)}
                placeholder='[
  { "key": "jam", "label": "Jam", "type": "time", "required": true },
  { "key": "catatan", "label": "Catatan", "type": "text" }
]'
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  className="bg-black text-white text-xs px-3 py-1 rounded disabled:opacity-50"
                  onClick={saveInputs}
                  disabled={savingInputs}
                >
                  Simpan Input
                </button>
                <button
                  className="text-xs px-3 py-1 border rounded"
                  onClick={() => setInputsOpen(false)}
                >
                  Batal
                </button>
                {row.inputs === undefined && (
                  <span className="text-[11px] text-amber-600">Kolom "inputs" belum ada di database. Jalankan migrasi untuk mengaktifkan fitur ini.</span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
  {/* FormBuilder moved to parent component */}
    </>
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

function summarizeInputs(inputs: any[]): string {
  try {
    const keys = inputs
      .filter((f: any) => f && typeof f.key === "string")
      .map((f: any) => f.key)
    if (keys.length === 0) return ""
    if (keys.length <= 2) return keys.join(", ")
    return `${keys.slice(0, 2).join(", ")} +${keys.length - 2} lagi`
  } catch {
    return ""
  }
}
