"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Trophy, User } from "lucide-react"
import { usePathname } from "next/navigation"
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

export function ReportsPage() {
  const pathname = usePathname()
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isGuruWali = pathname.startsWith('/guruwali')

  const fetchDailyReport = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = isGuruWali 
        ? `/api/guruwali/reports/daily-inactive?date=${date}`
        : `/api/teacher/reports/daily-inactive?date=${date}`
      
      const response = await fetch(endpoint)
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
    <>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Laporan Aktivitas</h1>
                <p className="text-sm text-gray-500">Generate dan kelola laporan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Laporan Aktivitas Siswa</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </>
  )
}
