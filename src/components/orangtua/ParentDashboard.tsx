"use client"

import { CommentSection } from "@/components/komentar/CommentSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Calendar, User, GraduationCap, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import React, { useEffect, useState } from "react"

type Student = {
  userid: string
  username: string
  kelas: string | null
  email: string | null
}

type Parent = {
  userid: string
  username: string
  roleid: number
}

type Activity = {
  id: string
  title: string
  type: "category" | "habit" | "task" | "achievement"
  status?: "completed" | "pending" | "missed"
  time: string
  description?: string
  points?: number
  count?: number
  activityIds?: string[]
  validatedByTeacher?: boolean
  validatedByParent?: boolean
}

type ParentStudentData = {
  parent: Parent
  student: Student | null
  allStudents?: Student[]
  message?: string
  availableStudents?: Student[]
}

export function ParentDashboard() {
  const { userId: currentUserId, loading: userLoading } = useCurrentUser()
  const [data, setData] = useState<ParentStudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activitiesByDate, setActivitiesByDate] = useState<Record<string, Activity[]>>({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [activeTab, setActiveTab] = useState<"calendar" | "comments">("calendar")

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  const weekDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

  const fetchParentStudentData = async () => {
    try {
      setError(null)
      const response = await fetch("/api/orangtua/siswa")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch parent-student data")
      }

      setData(result.data)
    } catch (err: any) {
      console.error("Error fetching parent-student data:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentActivities = async (studentId: string) => {
    try {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
      const response = await fetch(`/api/teacher/students/${studentId}/activities?month=${monthStr}&expandOptions=true&includeAliases=true`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch activities")
      }

      setActivitiesByDate(result.data || {})
    } catch (err: any) {
      console.error("Error fetching activities:", err)
      // Don't show error for activities, just keep empty state
    }
  }

  useEffect(() => {
    if (currentUserId) {
      fetchParentStudentData()
    }
  }, [currentUserId])

  useEffect(() => {
    if (data?.student) {
      fetchStudentActivities(data.student.userid)
    }
  }, [data?.student, currentDate])

  const navigateMonth = (dir: "prev" | "next") => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1))
    setCurrentDate(d)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const getActivitiesForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return activitiesByDate[dateStr] || []
  }

  if (userLoading || loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Anda harus login untuk mengakses halaman ini</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchParentStudentData} className="mt-4">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data?.student) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Siswa Terkait</h3>
            <p className="text-gray-600 mb-4">
              Belum ada siswa yang terkait dengan akun orang tua Anda.
            </p>
            {data?.message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                <p className="text-sm text-blue-600">{data.message}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Silakan hubungi admin untuk mengatur relasi dengan siswa.
            </p>
          </CardContent>
        </Card>

        {/* Debug info untuk development */}
        {data?.availableStudents && data.availableStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug: Siswa yang Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.availableStudents.map((student) => (
                  <div key={student.userid} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">{student.username}</div>
                    <div className="text-gray-600">ID: {student.userid}</div>
                    <div className="text-gray-600">Kelas: {student.kelas}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const student = data.student
  const days = getDaysInMonth()

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dashboard Orang Tua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.username}`} />
              <AvatarFallback>{student.username?.charAt(0) || "S"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{student.username}</h3>
              <p className="text-sm text-gray-600">Kelas: {student.kelas || "Tidak diketahui"}</p>
              <Badge variant="outline">Siswa</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "calendar" ? "default" : "outline"}
          onClick={() => setActiveTab("calendar")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Kalender Aktivitas
        </Button>
        <Button
          variant={activeTab === "comments" ? "default" : "outline"}
          onClick={() => setActiveTab("comments")}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Komentar
        </Button>
      </div>

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kalender Aktivitas {student.username}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[120px] text-center font-medium">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day.slice(0, 3)}
                </div>
              ))}
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={index} className="p-2"></div>
                }

                const activities = getActivitiesForDate(day)
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const isSelected = selectedDate === dateStr
                const isToday = dateStr === new Date().toISOString().split("T")[0]

                return (
                  <div
                    key={day}
                    className={`p-2 min-h-[60px] border rounded cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-100 border-blue-300" : 
                      isToday ? "bg-yellow-50 border-yellow-300" :
                      activities.length > 0 ? "bg-green-50 border-green-200" : 
                      "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {activities.length > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        {activities.length} aktivitas
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selected Date Activities */}
            {selectedDate && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">
                  Aktivitas tanggal {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </h4>
                {getActivitiesForDate(parseInt(selectedDate.split("-")[2])).length === 0 ? (
                  <p className="text-gray-500 text-sm">Tidak ada aktivitas pada tanggal ini</p>
                ) : (
                  <div className="space-y-2">
                    {getActivitiesForDate(parseInt(selectedDate.split("-")[2])).map((activity, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.title}</span>
                          <div className="flex items-center gap-2">
                            {activity.validatedByTeacher && (
                              <Badge variant="default" className="text-xs">Divalidasi Guru</Badge>
                            )}
                            {activity.validatedByParent && (
                              <Badge variant="secondary" className="text-xs">Divalidasi Ortu</Badge>
                            )}
                          </div>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Waktu: {activity.time} | Tipe: {activity.type}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments Tab */}
      {activeTab === "comments" && (
        <CommentSection siswaId={student.userid} currentUserId={currentUserId} />
      )}
    </div>
  )
}
