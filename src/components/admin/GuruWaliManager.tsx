"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectEmpty, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-improved"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Search, UserCheck, Users, X } from "lucide-react"
import { useEffect, useState } from "react"

type User = {
  userid: string
  username: string
  email: string | null
  roleid: number
  kelas: string | null
  guruwali_userid?: string | null
}

type GuruWali = {
  userid: string
  username: string
  email: string | null
  students: User[]
}

type Assignment = {
  student: User
  guruwali: User | null
}

export function GuruWaliManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [guruWaliList, setGuruWaliList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "unassigned">("all")

  useEffect(() => {
    fetchData()
  }, [])

  // Filter assignments based on search query and status filter
  useEffect(() => {
    let filtered = assignments

    // Filter by search query (name, email, class, guru wali)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(assignment => {
        const student = assignment.student
        const guruwali = assignment.guruwali
        
        return (
          student.username.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query) ||
          student.kelas?.toLowerCase().includes(query) ||
          guruwali?.username.toLowerCase().includes(query) ||
          guruwali?.email?.toLowerCase().includes(query)
        )
      })
    }

    // Filter by assignment status
    if (filterStatus === "assigned") {
      filtered = filtered.filter(assignment => assignment.guruwali !== null)
    } else if (filterStatus === "unassigned") {
      filtered = filtered.filter(assignment => assignment.guruwali === null)
    }

    setFilteredAssignments(filtered)
  }, [assignments, searchQuery, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch assignments
      const assignmentsRes = await fetch("/api/admin/guruwali-assignments")
      const assignmentsData = await assignmentsRes.json()
      
      if (assignmentsRes.ok && assignmentsData.ok) {
        setAssignments(assignmentsData.data || [])
      } else {
        console.error("Failed to fetch assignments:", assignmentsData.error)
        setAssignments([])
      }

      // Fetch guruwali list
      const guruWaliRes = await fetch("/api/user-profiles?roleid=6")
      const guruWaliData = await guruWaliRes.json()
      
      if (guruWaliRes.ok && (guruWaliData.ok || guruWaliData.data)) {
        setGuruWaliList(guruWaliData.data || [])
      } else {
        console.error("Failed to fetch guru wali list:", guruWaliData.error)
        setGuruWaliList([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setAssignments([])
      setGuruWaliList([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssignGuruWali = async (studentId: string, guruWaliId: string | null) => {
    try {
      setSaving(studentId)
      setError(null)
      
      const response = await fetch("/api/admin/assign-guruwali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          guruWaliId: guruWaliId || null
        })
      })

      const result = await response.json()
      
      if (result.ok) {
        // Update local state
        setAssignments(prev => prev.map(assignment => 
          assignment.student.userid === studentId 
            ? {
                ...assignment,
                guruwali: guruWaliId 
                  ? guruWaliList.find(gw => gw.userid === guruWaliId) || null
                  : null
              }
            : assignment
        ))
        setSuccess(result.message || "Penugasan berhasil diperbarui")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(result.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error("Error assigning guruwali:", error)
      setError("Gagal memperbarui penugasan. Silakan coba lagi.")
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(null)
    }
  }

  const getAssignmentStats = () => {
    const totalStudents = assignments.length
    const assignedStudents = assignments.filter(a => a.guruwali).length
    const unassignedStudents = totalStudents - assignedStudents
    
    return { totalStudents, assignedStudents, unassignedStudents }
  }

  const stats = getAssignmentStats()

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Guru Wali</h1>
          <p className="text-gray-600">Atur pembagian siswa ke guru wali</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-9 w-48" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Guru Wali - Siswa</h1>
        <p className="text-gray-600">Atur pembagian siswa ke guru wali kelas</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.assignedStudents}</div>
            <p className="text-xs text-muted-foreground">Memiliki guru wali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Ditugaskan</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unassignedStudents}</div>
            <p className="text-xs text-muted-foreground">Perlu ditugaskan</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian dan Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari siswa, email, kelas, atau guru wali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | "assigned" | "unassigned")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="assigned">Sudah Ditugaskan</SelectItem>
                  <SelectItem value="unassigned">Belum Ditugaskan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Search Results Info */}
          {(searchQuery || filterStatus !== "all") && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                Menampilkan {filteredAssignments.length} dari {assignments.length} siswa
                {searchQuery && <span> • Pencarian: "{searchQuery}"</span>}
                {filterStatus !== "all" && <span> • Filter: {filterStatus === "assigned" ? "Sudah Ditugaskan" : "Belum Ditugaskan"}</span>}
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterStatus("all")
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Reset Filter
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Penugasan Guru Wali</CardTitle>
          <p className="text-sm text-gray-600">Pilih guru wali untuk setiap siswa</p>
          {guruWaliList.length === 0 && (
            <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-700">
                ⚠️ Belum ada pengguna dengan role "guruwali" (roleid: 6) di sistem. 
                Silakan buat akun guru wali terlebih dahulu di halaman Manajemen Akun.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.student.userid}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
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
                      <SelectContent searchable searchPlaceholder="Cari guru wali...">
                        <SelectItem value="">
                          -- Tidak Ada Guru Wali --
                        </SelectItem>
                        {guruWaliList.length === 0 ? (
                          <SelectEmpty>Tidak ada guru wali tersedia</SelectEmpty>
                        ) : (
                          guruWaliList.map((guruwali) => (
                            <SelectItem 
                              key={guruwali.userid} 
                              value={guruwali.userid}
                              searchableText={`${guruwali.username} ${guruwali.email}`}
                            >
                              {guruwali.username} ({guruwali.email})
                            </SelectItem>
                          ))
                        )}
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

            {filteredAssignments.length === 0 && assignments.length > 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">Tidak ada hasil yang ditemukan</p>
                <p className="text-sm">Coba ubah kata kunci pencarian atau filter</p>
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterStatus("all")
                  }}
                  className="mt-3 text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Reset Pencarian
                </button>
              </div>
            )}

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
    </div>
  )
}
