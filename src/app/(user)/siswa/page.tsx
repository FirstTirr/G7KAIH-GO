"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import LogoutButton from "@/components/ui/logoutButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import * as React from "react"

type Kegiatan = {
  kegiatanid: string
  kegiatanname: string
  created_at?: string
  categories?: { categoryid: string; categoryname: string }[]
}

export default function Page() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<Kegiatan[]>([])
  const [windowState, setWindowState] = React.useState<{ open: boolean; updatedAt?: string | null } | null>(null)
  const [windowMessage, setWindowMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      setWindowMessage(null)
      try {
        const statusRes = await fetch("/api/submission-window", { cache: "no-store" })
        const statusJson = await statusRes.json()
        if (!statusRes.ok) throw new Error(statusJson?.error || "Gagal memuat status pengumpulan")
        const open = !!statusJson?.data?.open
        if (mounted) {
          setWindowState({ open, updatedAt: statusJson?.data?.updatedAt ?? null })
        }

        if (!open) {
          if (mounted) {
            setRows([])
            setWindowMessage("Pengumpulan belum dibuka. Silakan tunggu hingga jam yang ditetapkan.")
          }
          return
        }

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-40%] h-[520px] rounded-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_60%)]"
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10">
        <Card className="border-emerald-100/70 bg-white/80 shadow-xl shadow-emerald-100/50 backdrop-blur">
          <CardHeader className="flex flex-col gap-6 border-0 pb-0 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl text-slate-900">Kegiatan Harianmu</CardTitle>
              <p className="max-w-2xl text-sm text-slate-600">
                Tetap konsisten mengisi aktivitas setiap hari. Lihat daftar kegiatan yang sedang berlangsung dan unggah progresmu ketika pengumpulan dibuka.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {windowState && (
                <Badge
                  className={windowState.open ? "border border-emerald-200 bg-emerald-100 text-emerald-700" : "border border-rose-200 bg-rose-100 text-rose-700"}
                >
                  {windowState.open ? "Pengumpulan terbuka" : "Pengumpulan tertutup"}
                </Badge>
              )}
              <LogoutButton />
            </div>
          </CardHeader>
          {windowState?.updatedAt && (
            <CardContent className="pt-6 text-xs text-slate-600">
              Terakhir diperbarui: {new Date(windowState.updatedAt).toLocaleString("id-ID")}
            </CardContent>
          )}
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 rounded-2xl border border-emerald-100/60 bg-white/60" />
            <Skeleton className="h-32 rounded-2xl border border-emerald-100/60 bg-white/60" />
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 text-red-700">
            <CardContent className="py-5 text-sm">{error}</CardContent>
          </Card>
        ) : windowMessage ? (
          <Card className="border-amber-200 bg-amber-50/90 text-amber-800">
            <CardContent className="space-y-3 py-5 text-sm">
              <p>{windowMessage}</p>
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-white/80">
            <CardContent className="py-10 text-center text-sm text-slate-600">
              Belum ada kegiatan yang bisa kamu isi saat ini.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {rows.map((k) => (
              <li key={k.kegiatanid} className="group relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-white/80 shadow transition-shadow hover:border-emerald-200 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-sky-400 opacity-80" aria-hidden />
                <div className="flex h-full flex-col gap-4 p-5">
                  <div className="flex flex-1 flex-col gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600">
                      {k.kegiatanname}
                    </h2>
                    {Array.isArray(k.categories) && k.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {k.categories.map((c) => (
                          <Badge key={c.categoryid} variant="secondary" className="border border-emerald-100 bg-emerald-50 text-emerald-700">
                            {c.categoryname}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">Tidak ada kategori terlampir.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      Dimulai {k.created_at ? new Date(k.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long" }) : "-"}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/siswa/${k.kegiatanid}`} className="font-medium">
                        Buka
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && windowState?.open && !windowMessage && rows.length > 0 && (
          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/70">
            <CardContent className="flex flex-col gap-3 py-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-slate-700">Tips supaya lebih cepat selesai:</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                  <li>Siapkan foto pendukung sebelum membuka detail kegiatan.</li>
                  <li>Catat poin penting tiap kategori agar tidak terlewat.</li>
                </ul>
              </div>
              <Button asChild className="bg-emerald-600 shadow-md hover:bg-emerald-700">
                <Link href={`/siswa/${rows[0]?.kegiatanid || ""}`}>Lanjut isi aktivitas pertama</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}