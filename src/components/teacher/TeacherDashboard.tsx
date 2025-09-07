"use client"

import { StudentActivityDetails } from "@/components/teacher/StudentActivityDetails"
import { StudentCalendar } from "@/components/teacher/StudentCalendar"
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Search, Trophy, User } from "lucide-react"
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

// Komponen untuk tab laporan
function ReportsTab({ students }: { students: Student[] }) {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDailyReport = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/teacher/reports/daily-inactive?date=${date}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Gagal memuat laporan")
      }
      
      setReportData(result.data)
    } catch (err: any) {
      setError(err.message || "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDailyReport(selectedDate)
  }, [selectedDate])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Laporan Keaktifan Siswa Harian</h3>
        <p className="text-sm text-blue-600">Pantau aktivitas siswa pada hari tertentu</p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Label htmlFor="report-date" className="font-medium">Pilih Tanggal:</Label>
        <Input
          id="report-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        <Button
          onClick={() => fetchDailyReport(selectedDate)}
          disabled={loading}
          size="sm"
        >
          {loading ? "Memuat..." : "Refresh Data"}
        </Button>
      </div>

      {/* Statistik Ringkas */}
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {reportData.activeStudents}
            </div>
            <div className="text-sm text-green-800">Siswa Aktif</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {reportData.inactiveStudents?.length || 0}
            </div>
            <div className="text-sm text-red-800">Siswa Tidak Aktif</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.totalStudents}
            </div>
            <div className="text-sm text-blue-800">Total Siswa</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.activeRate}%
            </div>
            <div className="text-sm text-purple-800">Tingkat Keaktifan</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Siswa Tidak Aktif - {formatDate(selectedDate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-sm text-gray-500">Memuat data siswa...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          ) : !reportData?.inactiveStudents || reportData.inactiveStudents.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">Semua Siswa Aktif!</h3>
              <p className="text-sm text-green-600">Tidak ada siswa yang melewatkan aktivitas pada tanggal ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  {reportData.inactiveStudents.length} siswa belum melakukan aktivitas pada {formatDate(selectedDate)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.inactiveStudents.map((student: any) => (
                  <div key={student.userid} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{student.username?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{student.username || 'Nama tidak tersedia'}</h4>
                        <p className="text-sm text-gray-600">{student.kelas || 'Kelas tidak tersedia'}</p>
                        {student.email && (
                          <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                        )}
                        <Badge variant="outline" className="mt-2 border-red-300 text-red-700">
                          Tidak Aktif
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Tindakan yang Disarankan:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Hubungi siswa yang tidak aktif melalui WhatsApp atau telepon</li>
                  <li>• Berikan reminder tentang aktivitas yang harus dilakukan</li>
                  <li>• Koordinasi dengan wali kelas atau orang tua siswa</li>
                  <li>• Pantau konsistensi aktivitas dalam jangka waktu yang lebih panjang</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Siswa Aktif */}
      {reportData && reportData.activeStudentsList && reportData.activeStudentsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Siswa Aktif - {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  {reportData.activeStudentsList.length} siswa telah melakukan aktivitas pada {formatDate(selectedDate)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.activeStudentsList.map((student: any) => (
                  <div key={student.userid} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-200 text-green-800">
                          {student.username?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{student.username || 'Nama tidak tersedia'}</h4>
                        <p className="text-sm text-gray-600">{student.kelas || 'Kelas tidak tersedia'}</p>
                        {student.email && (
                          <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                        )}
                        <Badge variant="outline" className="mt-2 border-green-300 text-green-700 bg-green-100">
                          Aktif
                        </Badge>
                        {student.activities && student.activities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-green-600 font-medium">
                              {student.activities.length} aktivitas hari ini
                            </p>
                            <div className="mt-1 space-y-1">
                              {student.activities.slice(0, 2).map((activity: any, index: number) => (
                                <p key={index} className="text-xs text-gray-600 truncate">
                                  • {activity.activityname}
                                </p>
                              ))}
                              {student.activities.length > 2 && (
                                <p className="text-xs text-gray-500">
                                  +{student.activities.length - 2} aktivitas lainnya
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export/Download Options */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Export Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const csvContent = [
                    "Nama,Kelas,Email,Status,Jumlah Aktivitas",
                    ...reportData.inactiveStudents.map((s: any) => 
                      `"${s.username}","${s.kelas}","${s.email}","Tidak Aktif","0"`
                    ),
                    ...(reportData.activeStudentsList || []).map((s: any) => 
                      `"${s.username}","${s.kelas}","${s.email}","Aktif","${s.activities?.length || 0}"`
                    )
                  ].join('\n')
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `laporan-aktivitas-siswa-${selectedDate}.csv`
                  a.click()
                  window.URL.revokeObjectURL(url)
                }}
              >
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [viewMode, setViewMode] = React.useState<"calendar" | "details">("calendar")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeView, setActiveView] = React.useState("students")
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [studentActivities, setStudentActivities] = React.useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = React.useState(false)

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

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return "-"
    
    try {
      const date = new Date(lastActivity)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else if (diffDays === 1) {
        return "Kemarin"
      } else if (diffDays <= 7) {
        return `${diffDays} hari lalu`
      } else {
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }
    } catch (error) {
      console.error('Error formatting date:', error)
      return "-"
    }
  }

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

  const fetchStudentDetails = async (student: Student) => {
    console.log('Fetching details for student:', student.id, student.name)
    setDetailsLoading(true)
    try {
      const response = await fetch(`/api/teacher/students/${student.id}/details`)
      const result = await response.json()
      
      console.log('Student details response:', {
        status: response.status,
        ok: response.ok,
        dataLength: result.data?.length || 0,
        error: result.error,
        firstActivity: result.data?.[0]
      })
      
      if (response.ok) {
        setStudentActivities(result.data || [])
      } else {
        console.error('Failed to fetch student details:', result.error)
        setStudentActivities([])
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
      setStudentActivities([])
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleViewStudent = (student: Student, mode: "calendar" | "details") => {
    setSelectedStudent(student)
    setViewMode(mode)
    if (mode === "details") {
      fetchStudentDetails(student)
    }
  }

  const handleBackFromStudent = () => {
    setSelectedStudent(null)
    setViewMode("calendar")
    setStudentActivities([])
  }

  if (selectedStudent) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <TeacherSidebar activeView={activeView} onViewChange={setActiveView} />
          <main className="flex-1 overflow-auto">
            {viewMode === "details" ? (
              detailsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat detail aktivitas...</p>
                  </div>
                </div>
              ) : (
                <StudentActivityDetails
                  student={selectedStudent}
                  activities={studentActivities}
                  onBack={handleBackFromStudent}
                  onRefresh={() => fetchStudentDetails(selectedStudent)}
                />
              )
            ) : (
              <StudentCalendar
                student={selectedStudent}
                onBack={handleBackFromStudent}
                // StudentCalendar will fetch activities by itself when student changes
                activitiesByDate={{}}
                initialDate={new Date()}
              />
            )}
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
                <Trophy className="h-6 w-6 text-purple-600" />
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
              onClick={() => handleViewStudent(student, "calendar")}
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
                      <CardTitle className="text-base">
                        {student.name && student.name !== "Unknown" ? student.name : 
                         student.class ? `Siswa ${student.class}` : 
                         `Siswa ${student.id.slice(0, 8)}`}
                      </CardTitle>
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
                    <span className="text-sm text-gray-500">{formatLastActivity(student.lastActivity)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewStudent(student, "calendar")
                    }}
                    size="sm"
                  >
                    Kalender
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewStudent(student, "details")
                    }}
                    size="sm"
                  >
                    Detail Field
                  </Button>
                </div>
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
      case "reports":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Aktivitas Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportsTab students={students} />
              </CardContent>
            </Card>
          </div>
        )
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
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {activeView === "students" && "Panel Aktivitas"}
                      {activeView === "reports" && "Laporan Aktivitas"}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {activeView === "students" && "Pantau aktivitas siswa"}
                      {activeView === "reports" && "Generate dan kelola laporan"}
                    </p>
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
