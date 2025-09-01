"use client"

import * as React from "react"
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Student = {
  id: string
  name: string
  class: string
  avatar?: string
}

type Activity = {
  id: string
  title: string
  type: "habit" | "task" | "achievement"
  status: "completed" | "pending" | "missed"
  time: string
  description?: string
  points?: number
}

export function StudentCalendar({
  student,
  onBack,
  activitiesByDate: initialActivitiesByDate,
  initialDate,
}: {
  student: Student
  onBack: () => void
  activitiesByDate: Record<string, Activity[]>
  initialDate?: Date
}) {
  const [currentDate, setCurrentDate] = React.useState<Date>(
    initialDate ?? new Date()
  )
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr)
  const [activitiesByDate, setActivitiesByDate] = React.useState<Record<string, Activity[]>>(
    initialActivitiesByDate || {}
  )
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastDebug, setLastDebug] = React.useState<any>(null)

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]
  const weekDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

  const navigateMonth = (dir: "prev" | "next") => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1))
    setCurrentDate(d)
  }
  const gotoLatest = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/teacher/students/${student.id}/activities?month=latest`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Gagal memuat aktivitas")
      setActivitiesByDate(json.data || {})
      if (json.monthUsed) {
        const [yy, mm] = String(json.monthUsed).split("-").map((n: string) => Number(n))
        setCurrentDate(new Date(yy, mm - 1, 1))
        const keys = Object.keys(json.data || {}).sort()
        if (keys.length > 0) setSelectedDate(keys[keys.length - 1])
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat aktivitas")
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const selectedActivities = activitiesByDate[selectedDate] ?? []
  const totalPoints = Object.values(activitiesByDate)
    .flat()
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.points || 0), 0)

  // Fetch activities when month or student changes
  React.useEffect(() => {
    // When the student changes, first jump to the latest month that has data
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/teacher/students/${student.id}/activities?month=latest`, { cache: "no-store" })
        const json = await res.json()
        if (res.ok && mounted) {
          setActivitiesByDate(json.data || {})
          setLastDebug(json.debug || null)
          console.log("/api activities latest ->", json)
          if (json.monthUsed) {
            const [yy, mm] = String(json.monthUsed).split("-").map((n: string) => Number(n))
            setCurrentDate(new Date(yy, mm - 1, 1))
            // default selected date to first day with activities in that month
            const keys = Object.keys(json.data || {}).sort()
            if (keys.length > 0) setSelectedDate(keys[keys.length - 1])
          }
        } else if (!res.ok) {
          throw new Error(json?.error || "Failed to load activities")
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load activities")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id])

  // Fetch activities for the currently viewed month (navigations)
  React.useEffect(() => {
    let mounted = true
    const y = currentDate.getFullYear()
    const m = String(currentDate.getMonth() + 1).padStart(2, "0")
    const month = `${y}-${m}`
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/teacher/students/${student.id}/activities?month=${month}`, {
          cache: "no-store",
        })
        const json = await res.json()
        if (res.ok && mounted) {
          setActivitiesByDate(json.data || {})
          setLastDebug(json.debug || null)
          console.log("/api activities month ->", json)
          // Choose a sensible selected date within returned data
          const keys = Object.keys(json.data || {}).sort()
          if (keys.length > 0) setSelectedDate(keys[keys.length - 1])
          if (json.monthUsed && json.monthUsed !== month) {
            // Adjust currentDate to the month returned
            const [yy, mm] = String(json.monthUsed).split("-").map((n: string) => Number(n))
            setCurrentDate(new Date(yy, mm - 1, 1))
          }
        } else if (!res.ok) {
          throw new Error(json?.error || "Failed to load activities")
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load activities")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [currentDate])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.avatar} />
                <AvatarFallback>
                  {(student.name || student.class || "?")
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name || student.class || "Tanpa Nama"}</h1>
                <p className="text-gray-600">Kelas {student.class || "-"} • Kalender Aktivitas</p>
              </div>
            </div>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-lg">{totalPoints} Poin</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}> 
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={gotoLatest}>
                  Terbaru
                </Button>
              </div>
            </div>
            {!loading && !error && Object.values(activitiesByDate).flat().length === 0 && (
              <p className="text-xs text-gray-500">Tidak menemukan aktivitas untuk bulan ini. {lastDebug?.requestedMonth ? `(req: ${lastDebug.requestedMonth}, used: ${lastDebug.monthUsed || "-"})` : null}</p>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50">
                {weekDays.map((d, idx) => (
                  <div
                    key={d}
                    className={`p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 ${
                      idx === 0 || idx === 6 ? "bg-red-50 text-red-700" : ""
                    }`}
                  >
                    <div className="hidden md:block">{d}</div>
                    <div className="md:hidden">{d.slice(0, 3)}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: daysInMonth + firstDayOfMonth }, (_, i) => {
                  if (i < firstDayOfMonth) {
                    return (
                      <div key={`empty-${i}`} className="h-28 md:h-32 bg-gray-50 border-r border-b border-gray-200 last:border-r-0" />
                    )
                  }
                  const day = i - firstDayOfMonth + 1
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const list = activitiesByDate[dateStr] || []
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === todayStr
                  const isWeekend = i % 7 === 0 || i % 7 === 6

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-28 md:h-32 p-2 cursor-pointer border-r border-b border-gray-200 last:border-r-0 relative transition-all duration-200 hover:shadow-md hover:z-10 ${
                        isSelected ? "bg-blue-50 ring-2 ring-blue-400 shadow-lg" : "bg-white hover:bg-gray-50"
                      } ${isToday ? "bg-gradient-to-br from-orange-50 to-yellow-50" : ""} ${isWeekend ? "bg-red-25" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-sm ${
                          isSelected ? "text-blue-600" : isToday ? "text-orange-600" : isWeekend ? "text-red-600" : "text-gray-900"
                        }`}>{day}</span>
                        {list.length > 0 && (
                          <div className={`${
                            list.length >= 3
                              ? "bg-green-500 text-white"
                              : list.length >= 2
                              ? "bg-yellow-500 text-white"
                              : "bg-blue-500 text-white"
                          } w-5 h-5 rounded-full text-xs font-medium flex items-center justify-center`}>{list.length}</div>
                        )}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {list.slice(0, 2).map((a) => (
                          <div
                            key={a.id}
                            className={`${
                              a.type === "habit"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-purple-100 text-purple-700 border border-purple-200"
                            } text-xs px-2 py-1 rounded-md truncate font-medium`}
                            title={`${a.title} - ${a.time} (+${a.points ?? 0} poin)`}
                          >
                            {a.title}
                          </div>
                        ))}
                        {list.length > 2 && (
                          <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
                            +{list.length - 2} lagi
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" /> Aktivitas {new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-gray-500 text-center py-4">Memuat aktivitas…</p>
                ) : error ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-red-600">{error}</p>
                    <Button variant="outline" size="sm" onClick={gotoLatest}>Coba muat bulan terbaru</Button>
                  </div>
                ) : (activitiesByDate[selectedDate] ?? []).length > 0 ? (
                  (activitiesByDate[selectedDate] ?? []).map((a) => (
                    <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{a.title}</h4>
                        <Badge>+{a.points ?? 0}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="h-3 w-3" /> {a.time}
                      </div>
                      {a.description && <p className="text-sm text-gray-600">{a.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Tidak ada aktivitas</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistik</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
                  <div className="text-sm text-gray-600">Total Poin</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{Object.keys(activitiesByDate).length}</div>
                  <div className="text-sm text-gray-600">Hari Aktif</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{Object.values(activitiesByDate).flat().length}</div>
                  <div className="text-sm text-gray-600">Total Aktivitas</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
