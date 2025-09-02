"use client"

import { StudentCalendar } from "@/components/teacher/StudentCalendar"
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ArrowLeft, Calendar, Search, Trophy, User } from "lucide-react"
import * as React from "react"

type Student = {
  id: string
  name: string
  class: string
  avatar?: string
  activitiesCount: number
  lastActivity: string
  status: "active" | "inactive" | "completed"
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

async function fetchStudents(): Promise<Student[]> {
  const res = await fetch("/api/teacher/students", { cache: "no-store" })
  const json = await res.json()
  console.log("Fetched students data:", json.data) // Debug log
  return json.data ?? []
}

export function TeacherDashboard({ onBack }: { onBack: () => void }) {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeView, setActiveView] = React.useState("students")
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchStudents()
        if (mounted) setStudents(data)
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load students")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filteredStudents = React.useMemo(
    () =>
      students.filter((s) => {
        const name = (s.name || "").toLowerCase()
        const cls = (s.class || "").toLowerCase()
        const q = searchTerm.toLowerCase()
        return name.includes(q) || cls.includes(q)
      }),
    [students, searchTerm]
  )

  const getStatusColor = (status: Student["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "inactive":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Student["status"]) => {
    switch (status) {
      case "active":
        return "Aktif"
      case "completed":
        return "Selesai"
      case "inactive":
      default:
        return "Tidak Aktif"
    }
  }

  if (selectedStudent) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <TeacherSidebar activeView={activeView} onViewChange={setActiveView} />
          <main className="flex-1 overflow-auto">
            <StudentCalendar
              student={selectedStudent}
              onBack={() => setSelectedStudent(null)}
              // StudentCalendar will fetch activities by itself when student changes
              activitiesByDate={{}}
              initialDate={new Date()}
            />
          </main>
        </div>
      </SidebarProvider>
    )
  }

  const renderStudentsList = () => (
    <>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
        <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Siswa Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{students.filter((s) => s.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rata-rata Aktivitas</p>
                <p className="text-2xl font-bold text-gray-900">{
                  students.length > 0
                    ? Math.round(
                        students.reduce((acc, s) => acc + s.activitiesCount, 0) /
                          students.length
                      )
                    : 0
                }</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Daftar Siswa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
              onClick={() => setSelectedStudent(student)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {(student.name || student.class || "?")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{student.name || student.class || "Tanpa Nama"}</CardTitle>
                      <p className="text-sm text-gray-500">Kelas {student.class || "-"}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(student.status)}>
                    {getStatusText(student.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Aktivitas</span>
                    <span className="font-semibold">{student.activitiesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Aktivitas Terakhir</span>
                    <span className="text-sm text-gray-500">{student.lastActivity || "-"}</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStudent(student)
                  }}
                >
                  Lihat Kalender Aktivitas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )

  const renderContent = () => {
    switch (activeView) {
      case "students":
        return renderStudentsList()
      case "dashboard":
      case "calendar":
      case "statistics":
      case "reports":
      default:
        return renderStudentsList()
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeacherSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke Home
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Panel Aktivitas</h1>
                    <p className="text-sm text-gray-500">Pantau aktivitas siswa</p>
                  </div>
                </div>
                {activeView === "students" && (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Cari siswa atau kelas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-sm text-gray-500">Memuat data…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
