"use client"

import { StudentCalendar } from "@/components/teacher/StudentCalendar"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
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

async function fetchStudentById(id: string): Promise<Student | null> {
  try {
    const res = await fetch(`/api/teacher/students/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export default function StudentCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [student, setStudent] = React.useState<Student | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      setLoading(true)
      const studentData = await fetchStudentById(resolvedParams.id)
      setStudent(studentData)
      setLoading(false)
    })()
  }, [resolvedParams.id])

  const handleBack = () => {
    router.push('/guruwali/siswa')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data siswa...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Siswa tidak ditemukan</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Siswa
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="mr-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Kalender - {student.name || `Siswa ${student.class}`}
              </h1>
              <p className="text-sm text-gray-500">Kelas {student.class}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <StudentCalendar
          student={student}
          onBack={handleBack}
          activitiesByDate={{}}
          initialDate={new Date()}
        />
      </div>
    </>
  )
}
