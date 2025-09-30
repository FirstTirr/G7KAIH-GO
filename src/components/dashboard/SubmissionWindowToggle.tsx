"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/utils/lib/util"
import { Loader2, Lock, Unlock } from "lucide-react"
import * as React from "react"

type SubmissionWindowPayload = {
  open: boolean
  updatedAt: string | null
  updatedBy?: {
    userid: string
    username: string | null
    role?: { rolename: string | null } | null
  } | null
}

export function SubmissionWindowToggle({ className }: { className?: string }) {
  const [state, setState] = React.useState<SubmissionWindowPayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/submission-window", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Gagal memuat status")
      setState(json.data)
    } catch (err: any) {
      setError(err?.message || "Gagal memuat status")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const toggle = async () => {
    if (!state) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/submission-window", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !state.open }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Gagal memperbarui status")
      setState(json.data)
    } catch (err: any) {
      setError(err?.message || "Gagal memperbarui status")
    } finally {
      setSubmitting(false)
    }
  }

  const open = state?.open ?? false
  const formattedDate = state?.updatedAt ? new Date(state.updatedAt).toLocaleString("id-ID") : null
  const updaterName = state?.updatedBy?.username || state?.updatedBy?.userid || "-"

  return (
    <div className={cn("rounded-xl border bg-white shadow-sm", className)}>
      <div className="px-5 py-4 border-b bg-gradient-to-r from-emerald-50 to-sky-50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Kontrol Pengumpulan</h2>
          <p className="text-xs text-slate-600">Atur akses siswa untuk membuka aktivitas</p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            open ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}
        >
          {open ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
          {open ? "Terbuka" : "Tertutup"}
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {error && <div className="text-sm text-rose-600">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" />
            Memuat status…
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700">
              Ketika <span className="font-semibold">Terbuka</span>, siswa dapat melihat dan mengisi aktivitas.
              Saat <span className="font-semibold">Tertutup</span>, halaman aktivitas siswa dinonaktifkan.
            </p>
            <div className="text-xs text-slate-500">
              Terakhir diperbarui: {formattedDate || "-"} oleh {updaterName}
            </div>
            <div className="pt-1">
              <Button onClick={toggle} disabled={submitting} variant={open ? "destructive" : "default"}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {open ? "Tutup Pengumpulan" : "Buka Pengumpulan"}
              </Button>
            </div>
          </>
        )}
        {!loading && (
          <button
            onClick={load}
            className="text-xs text-slate-500 hover:text-slate-700"
            disabled={loading || submitting}
          >
            Muat ulang status
          </button>
        )}
      </div>
    </div>
  )
}
