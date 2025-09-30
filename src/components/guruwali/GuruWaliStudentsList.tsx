"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Clock, Eye, GraduationCap, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

type Student = {
  userid: string
  username: string
  email: string | null
  kelas: string | null
  roleid: number
  created_at: string
}

type Activity = {
  activityid: string
  userid: string
  kategoriid: string
  judul: string
  created_at: string
  user_profiles: {
    username: string
    kelas: string
  }
}

type GuruWaliData = {
  guruWali: {
    id: string
    name: string
  }
  students: Student[]
  recentActivities: Activity[]
  summary: {
    totalStudents: number
    totalActivities: number
  }
}

export function GuruWaliStudentsList() {
  const [data, setData] = useState<GuruWaliData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/guruwali/siswa")
      const result = await response.json()

      if (!response.ok) {
        console.error('API Error:', result)
        throw new Error(result.error || "Failed to fetch data")
      }

      if (result.success && result.data) {
        setData(result.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error fetching guru wali data:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-3 w-[120px] mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-sm font-medium">Error:</span>
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Tidak ada data tersedia</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Siswa Bimbingan</h1>
          <p className="text-muted-foreground">
            Daftar siswa yang dibimbing oleh {data.guruWali.name}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Siswa yang dibimbing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Terbaru</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Aktivitas dalam 10 terbaru
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktif</div>
            <p className="text-xs text-muted-foreground">
              Guru wali aktif
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Siswa Bimbingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">Belum ada siswa</p>
                <p className="text-sm">Belum ada siswa yang ditugaskan untuk dibimbing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.students.map((student) => (
                  <div
                    key={student.userid}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {student.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {student.kelas && (
                            <Badge variant="secondary" className="text-xs">
                              Kelas {student.kelas}
                            </Badge>
                          )}
                          {student.email && (
                            <span className="text-xs text-gray-500 truncate">
                              {student.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Siswa
                      </Badge>
                      <Link href={`/guruwali/siswa/${student.userid}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Aktivitas Terbaru Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">Belum ada aktivitas</p>
                <p className="text-sm">Siswa belum melakukan aktivitas apapun</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentActivities.map((activity) => (
                  <div
                    key={activity.activityid}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.judul}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            oleh {activity.user_profiles.username}
                          </span>
                          {activity.user_profiles.kelas && (
                            <Badge variant="secondary" className="text-xs">
                              Kelas {activity.user_profiles.kelas}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
