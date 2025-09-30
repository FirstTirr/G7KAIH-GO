"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, GraduationCap, Search, UserCheck, Users, BookOpen, Shield, X } from "lucide-react"
import { useEffect, useState } from "react"

type Teacher = {
  userid: string
  username: string
  email: string | null
  kelas: string | null
  roleid: number
  is_guruwali: boolean
  is_wali_kelas: boolean
}

type Student = {
  userid: string
  username: string
  email: string | null
  kelas: string | null
  guruwali_userid: string | null
}

type Assignment = {
  student: Student
  guruwali: Teacher | null
}

export default function TeacherRoleManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedGuruWali, setSelectedGuruWali] = useState<string>("")
  const [processingAssignment, setProcessingAssignment] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Search states
  const [searchTerm, setSearchTerm] = useState("")
  const [studentSearchTerm, setStudentSearchTerm] = useState("")
  const [teacherRoleFilter, setTeacherRoleFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [guruWaliFilter, setGuruWaliFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch teachers
      const teachersRes = await fetch("/api/admin/teachers-roles")
      if (teachersRes.ok) {
        const data = await teachersRes.json()
        setTeachers(data)
      }

      // Fetch assignments
      const assignmentsRes = await fetch("/api/admin/guruwali-assignments")
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json()
        setAssignments(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleGuruwali = async (teacherId: string, isGuruwali: boolean) => {
    try {
      setSaving(teacherId)
      
      const response = await fetch("/api/admin/teacher-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          is_guruwali: isGuruwali
        })
      })

      if (response.ok) {
        setTeachers(prev => prev.map(teacher => 
          teacher.userid === teacherId 
            ? { ...teacher, is_guruwali: isGuruwali }
            : teacher
        ))
        setSuccess("Status guru wali berhasil diperbarui")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      setError("Gagal memperbarui status guru wali")
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(null)
    }
  }

  const handleToggleWaliKelas = async (teacherId: string, isWaliKelas: boolean) => {
    try {
      setSaving(teacherId)
      
      const response = await fetch("/api/admin/teacher-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          is_wali_kelas: isWaliKelas
        })
      })

      if (response.ok) {
        setTeachers(prev => prev.map(teacher => 
          teacher.userid === teacherId 
            ? { ...teacher, is_wali_kelas: isWaliKelas }
            : teacher
        ))
        setSuccess("Status wali kelas berhasil diperbarui")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      setError("Gagal memperbarui status wali kelas")
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(null)
    }
  }

  const handleAssignGuruWali = async (studentId: string, guruWaliId: string | null) => {
    try {
      setSaving(studentId)
      
      const response = await fetch("/api/admin/assign-guruwali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          guruWaliId: guruWaliId || null
        })
      })

      if (response.ok) {
        setAssignments(prev => prev.map(assignment => 
          assignment.student.userid === studentId 
            ? {
                ...assignment,
                guruwali: guruWaliId 
                  ? teachers.find(t => t.userid === guruWaliId) || null
                  : null
              }
            : assignment
        ))
        setSuccess("Assignment berhasil diperbarui")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error("Failed to assign")
      }
    } catch (error) {
      setError("Gagal memperbarui assignment")
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(null)
    }
  }

  // Filter functions
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = 
      teacherRoleFilter === "all" ||
      (teacherRoleFilter === "guru_wali" && (teacher.is_guruwali || teacher.roleid === 6)) ||
      (teacherRoleFilter === "wali_kelas" && teacher.is_wali_kelas) ||
      (teacherRoleFilter === "neither" && !teacher.is_guruwali && teacher.roleid !== 6 && !teacher.is_wali_kelas)
    
    return matchesSearch && matchesRole
  })

  const filteredStudentsWithAssignments = assignments.filter(assignment => {
    const student = assignment.student
    const matchesSearch = 
      student.username?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
    
    const matchesClass = classFilter === "all" || student.kelas === classFilter
    const matchesGuruWali = guruWaliFilter === "all" || 
      (guruWaliFilter === "assigned" && assignment.guruwali) ||
      (guruWaliFilter === "unassigned" && !assignment.guruwali)
    
    return matchesSearch && matchesClass && matchesGuruWali
  })

  const getUniqueClasses = () => {
    const classes = [...new Set(assignments.map(a => a.student.kelas).filter(Boolean))] as string[]
    return classes.sort()
  }

  const getGuruWaliTeachers = () => {
    return teachers.filter(t => t.is_guruwali || t.roleid === 6)
  }

  const getStats = () => {
    const totalTeachers = teachers.length
    const guruWaliCount = teachers.filter(t => t.is_guruwali || t.roleid === 6).length
    const waliKelasCount = teachers.filter(t => t.is_wali_kelas).length
    const totalStudents = assignments.length
    const assignedStudents = assignments.filter(a => a.guruwali).length
    
    return { totalTeachers, guruWaliCount, waliKelasCount, totalStudents, assignedStudents }
  }

  const stats = getStats()
  const availableGuruWali = teachers.filter(t => t.is_guruwali || t.roleid === 6)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Peran Guru</h1>
        <p className="text-gray-600">Kelola peran guru sebagai wali kelas dan guru wali</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <UserCheck className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Guru terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guru Wali</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.guruWaliCount}</div>
            <p className="text-xs text-muted-foreground">Memiliki akses guru wali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wali Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.waliKelasCount}</div>
            <p className="text-xs text-muted-foreground">Wali kelas aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Siswa terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Ditugaskan</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.assignedStudents}</div>
            <p className="text-xs text-muted-foreground">Memiliki guru wali</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teachers" className="w-full">
        <TabsList>
          <TabsTrigger value="teachers">Peran Guru</TabsTrigger>
          <TabsTrigger value="assignments">Assignment Siswa</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Guru dan Peran</CardTitle>
              <p className="text-sm text-gray-600">Atur peran guru sebagai wali kelas dan guru wali</p>
            </CardHeader>
            
            {/* Search and Filter for Teachers */}
            <div className="px-6 pb-4 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari guru berdasarkan nama atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={teacherRoleFilter} onValueChange={setTeacherRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Guru</SelectItem>
                    <SelectItem value="guru_wali">Guru Wali</SelectItem>
                    <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                    <SelectItem value="neither">Tanpa Peran</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || teacherRoleFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setTeacherRoleFilter("all")
                    }}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Search Results Summary */}
              {(searchTerm || teacherRoleFilter !== "all") && (
                <div className="mt-3 text-sm text-gray-600">
                  Menampilkan {filteredTeachers.length} dari {teachers.length} guru
                  {searchTerm && (
                    <span> yang cocok dengan "{searchTerm}"</span>
                  )}
                  {teacherRoleFilter !== "all" && (
                    <span> dengan filter "{
                      teacherRoleFilter === "guru_wali" ? "Guru Wali" :
                      teacherRoleFilter === "wali_kelas" ? "Wali Kelas" :
                      "Tanpa Peran"
                    }"</span>
                  )}
                </div>
              )}
            </div>
            
            <CardContent>
              <div className="space-y-4">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.userid}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {teacher.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{teacher.username}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{teacher.email}</span>
                          {teacher.kelas && (
                            <>
                              <span>•</span>
                              <span>Kelas {teacher.kelas}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Guru Wali:</label>
                        <Switch
                          checked={teacher.is_guruwali || teacher.roleid === 6}
                          onCheckedChange={(checked) => handleToggleGuruwali(teacher.userid, checked)}
                          disabled={saving === teacher.userid || teacher.roleid === 6}
                        />
                        {teacher.roleid === 6 && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Wali Kelas:</label>
                        <Switch
                          checked={teacher.is_wali_kelas}
                          onCheckedChange={(checked) => handleToggleWaliKelas(teacher.userid, checked)}
                          disabled={saving === teacher.userid}
                        />
                      </div>

                      {saving === teacher.userid && (
                        <div className="flex items-center text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Menyimpan...
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {teachers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Belum ada data guru</p>
                    <p className="text-sm">Guru akan muncul di sini setelah terdaftar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Guru Wali ke Siswa</CardTitle>
              <p className="text-sm text-gray-600">
                Siswa akan otomatis di-assign ke wali kelas mereka. Assignment manual akan override assignment otomatis.
              </p>
              {availableGuruWali.length === 0 && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-700">
                    ⚠️ Belum ada guru dengan akses guru wali. Aktifkan akses guru wali di tab "Peran Guru" terlebih dahulu.
                  </p>
                </div>
              )}
            </CardHeader>
            
            {/* Search and Filter for Students */}
            <div className="px-6 pb-4 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari siswa berdasarkan nama atau email..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {getUniqueClasses().map((kelas) => (
                      <SelectItem key={kelas} value={kelas}>
                        Kelas {kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={guruWaliFilter} onValueChange={setGuruWaliFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Status Assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="assigned">Sudah Assigned</SelectItem>
                    <SelectItem value="unassigned">Belum Assigned</SelectItem>
                  </SelectContent>
                </Select>
                {(studentSearchTerm || classFilter !== "all" || guruWaliFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStudentSearchTerm("")
                      setClassFilter("all")
                      setGuruWaliFilter("all")
                    }}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Search Results Summary */}
              {(studentSearchTerm || classFilter !== "all" || guruWaliFilter !== "all") && (
                <div className="mt-3 text-sm text-gray-600">
                  Menampilkan hasil pencarian dari {assignments.length} siswa
                  {studentSearchTerm && (
                    <span> yang cocok dengan "{studentSearchTerm}"</span>
                  )}
                  {classFilter !== "all" && (
                    <span> di Kelas {classFilter}</span>
                  )}
                  {guruWaliFilter !== "all" && (
                    <span> dengan status "{guruWaliFilter === "assigned" ? "Sudah Assigned" : "Belum Assigned"}"</span>
                  )}
                </div>
              )}
            </div>
            
            <CardContent>
              <div className="space-y-3">
                {assignments.filter(assignment => {
                  const student = assignment.student
                  const matchesSearch = 
                    student.username?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  const matchesClass = classFilter === "all" || student.kelas === classFilter
                  const matchesGuruWali = guruWaliFilter === "all" || 
                    (guruWaliFilter === "assigned" && assignment.guruwali) ||
                    (guruWaliFilter === "unassigned" && !assignment.guruwali)
                  return matchesSearch && matchesClass && matchesGuruWali
                }).map((assignment) => (
                  <div
                    key={assignment.student.userid}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium text-sm">
                            {assignment.student.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {assignment.student.username}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{assignment.student.email}</span>
                            {assignment.student.kelas && (
                              <>
                                <span>•</span>
                                <span>Kelas {assignment.student.kelas}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {assignment.guruwali ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          {assignment.guruwali.username}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                          Belum Ditugaskan
                        </Badge>
                      )}

                      <div className="w-52">
                        <Select 
                          value={assignment.guruwali?.userid || ""} 
                          onValueChange={(value) => 
                            handleAssignGuruWali(assignment.student.userid, value || null)
                          }
                          disabled={saving === assignment.student.userid}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Pilih Guru Wali --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Otomatis (Wali Kelas) --</SelectItem>
                            {availableGuruWali.map((teacher) => (
                              <SelectItem key={teacher.userid} value={teacher.userid}>
                                {teacher.username} {teacher.kelas && `(Kelas ${teacher.kelas})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {saving === assignment.student.userid && (
                        <div className="flex items-center text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Menyimpan...
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {assignments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Belum ada data siswa</p>
                    <p className="text-sm">Siswa akan muncul di sini setelah terdaftar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}