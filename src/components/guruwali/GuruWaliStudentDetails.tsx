"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, BookOpen, Calendar, Clock, FileText, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Student = {
  userid: string
  username: string
  email: string | null
  kelas: string | null
  created_at: string
}

type Activity = {
  activityid: string
  judul: string
  deskripsi: string | null
  kategoriid: string
  created_at: string
  kategori: {
    nama: string
  }
}

type StudentDetailData = {
  student: Student
  activities: Activity[]
  summary: {
    totalActivities: number
    thisMonth: number
    thisWeek: number
  }
}

interface GuruWaliStudentDetailsProps {
  studentId: string
}

export function GuruWaliStudentDetails({ studentId }: GuruWaliStudentDetailsProps) {
  const [data, setData] = useState<StudentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/guruwali/siswa/${studentId}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('API Error:', result)
        throw new Error(result.error || "Failed to fetch student data")
      }

      if (result.success && result.data) {
        setData(result.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error fetching student detail:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchData()
    }
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
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
          <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Data siswa tidak ditemukan</p>
            <Button 
              variant="outline" 
              onClick={() => router.back()} 
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-medium text-blue-700">
                  {data.student.username.charAt(0).toUpperCase()}
                </span>
              </div>
              {data.student.username}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {data.student.kelas && (
                <Badge variant="secondary">
                  Kelas {data.student.kelas}
                </Badge>
              )}
              {data.student.email && (
                <span className="text-sm text-gray-600">
                  {data.student.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aktivitas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Semua aktivitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Aktivitas bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minggu Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Aktivitas minggu ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Riwayat Aktivitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.activities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">Belum ada aktivitas</p>
              <p className="text-sm">Siswa ini belum melakukan aktivitas apapun</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.activities.map((activity) => (
                <div
                  key={activity.activityid}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {activity.judul}
                      </h3>
                      {activity.deskripsi && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {activity.deskripsi}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {activity.kategori.nama}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
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
  )
}
