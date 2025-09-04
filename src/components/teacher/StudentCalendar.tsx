"use client"

import { CommentSection } from "@/components/komentar/CommentSection"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ShieldCheck } from "lucide-react"
import * as React from "react"

type Student = {
  id: string
  name: string
  class: string
  avatar?: string
}

type Activity = {
  id: string
  title: string // now category name
  type: "category" | "habit" | "task" | "achievement"
  status?: "completed" | "pending" | "missed" // optional for category summary
  time: string // last time in the day
  description?: string
  points?: number // aggregated points for that category on that day
  count?: number // number of activities in that category that day
  activityIds?: string[]
  validatedByTeacher?: boolean
  validatedByParent?: boolean
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
  const { userId: currentUserId } = useCurrentUser()
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
  const [validatingKey, setValidatingKey] = React.useState<string | null>(null)

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
      const res = await fetch(`/api/teacher/students/${student.id}/activities?month=latest&expandOptions=true&includeAliases=true`, { cache: "no-store" })
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
    .reduce((sum, a) => sum + (a.points || 0), 0)

  // Fetch activities when month or student changes
  React.useEffect(() => {
    // When the student changes, first jump to the latest month that has data
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/teacher/students/${student.id}/activities?month=latest&expandOptions=true&includeAliases=true`, { cache: "no-store" })
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
        const res = await fetch(`/api/teacher/students/${student.id}/activities?month=${month}&expandOptions=true&includeAliases=true`, {
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
  }, [currentDate, student.id])

  async function toggleValidation(a: Activity, by: 'teacher' | 'parent', next: boolean) {
    if (!a.activityIds || a.activityIds.length === 0) return
    const key = `${a.id}:${by}`
    setValidatingKey(key)
    try {
      const res = await fetch(`/api/teacher/students/${student.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: next ? 'validate' : 'invalidate',
          by,
          activityIds: a.activityIds,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Gagal menyimpan validasi')
      // Optimistically update local state for current date
      setActivitiesByDate(prev => {
        const copy = { ...prev }
        const arr = [...(copy[selectedDate] || [])]
        const idx = arr.findIndex(x => x.id === a.id)
        if (idx >= 0) {
          const item = { ...arr[idx] } as Activity
          if (by === 'teacher') item.validatedByTeacher = next
          else item.validatedByParent = next
          arr[idx] = item as any
        }
        copy[selectedDate] = arr as any
        return copy
      })
    } catch (e: any) {
      console.error('Validation error:', e)
    } finally {
      setValidatingKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatar} />
              <AvatarFallback>{student.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-600">{student.class}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar grid and left panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigateMonth("prev")} variant="outline" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigateMonth("next")} variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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
                    const listCount = list.reduce((n, a) => n + (a.count ?? 1), 0)
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
                          {listCount > 0 && (
                            <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              isSelected ? "bg-blue-600 text-white" : "bg-gray-600 text-white"
                            }`}>
                              {listCount}
                            </div>
                          )}
                        </div>
                        {list.length > 0 && (
                          <div className="space-y-1">
                            {list.slice(0, 2).map((activity, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  activity.status === "completed" ? "bg-green-500" : 
                                  activity.status === "pending" ? "bg-yellow-500" : 
                                  "bg-gray-400"
                                }`} />
                                <span className="text-xs text-gray-600 truncate">{activity.title}</span>
                              </div>
                            ))}
                            {list.length > 2 && (
                              <span className="text-xs text-gray-500">+{list.length - 2} lainnya</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: daily activities, comment box, statistics */}
          <div className="w-full md:w-96 flex flex-col gap-4">
            {/* Daily activities card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" /> 
                  Aktivitas {new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
                        {(a.points ?? 0) > 0 && <Badge>+{a.points}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="h-3 w-3" /> {a.time} {a.count ? `• ${a.count} aktivitas` : ""}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant={a.validatedByTeacher ? 'default' : 'outline'}
                          size="sm"
                          disabled={!a.activityIds?.length || validatingKey === `${a.id}:teacher`}
                          onClick={() => toggleValidation(a, 'teacher', !a.validatedByTeacher)}
                          className="h-7 px-2"
                          title={a.validatedByTeacher ? 'Batalkan validasi guru' : 'Validasi oleh guru'}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" /> Guru
                        </Button>
                      </div>
                      {a.description && <p className="text-sm text-gray-600 mt-2">{a.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Tidak ada aktivitas</p>
                )}
              </CardContent>
            </Card>

            {/* Komentar dinamis untuk siswa ini */}
            {currentUserId && (
              <CommentSection siswaId={student.id} currentUserId={currentUserId} />
            )}

            {/* Statistics card */}
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
                  <div className="text-2xl font-bold text-purple-600">{
                    Object.values(activitiesByDate).reduce((sum, arr) => sum + (arr as any[]).reduce((n, a: any) => n + (a.count ?? 1), 0), 0)
                  }</div>
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