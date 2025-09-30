"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, GraduationCap, UserCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Student {
  userid: string
  username: string
  kelas: string
  email: string
  guruwali_userid: string | null
  supervision_type: 'direct' | 'wali_kelas' | 'full_guruwali' | 'none'
  supervisor_name: string
  created_at: string
}

interface Supervisor {
  userid: string
  username: string
  kelas: string
  roleid: number
  is_guruwali: boolean
  is_wali_kelas: boolean
}

interface SupervisedStudentsResponse {
  supervisor: Supervisor
  students: Student[]
  total: number
}

export default function SupervisedStudentsList() {
  const [data, setData] = useState<SupervisedStudentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSupervisedStudents()
  }, [])

  const loadSupervisedStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/supervised-students')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (error) {
      console.error('Error loading supervised students:', error)
      setError('Failed to load supervised students')
    } finally {
      setLoading(false)
    }
  }

  const getSupervisionBadge = (supervisionType: string) => {
    switch (supervisionType) {
      case 'direct':
        return <Badge variant="default">Direct Assignment</Badge>
      case 'wali_kelas':
        return <Badge variant="secondary">Via Guru Wali</Badge>
      case 'full_guruwali':
        return <Badge variant="outline">Full Guruwali</Badge>
      default:
        return <Badge variant="outline">No Supervision</Badge>
    }
  }

  const getRoleDescription = (supervisor: Supervisor) => {
    const roles = []
    if (supervisor.roleid === 2) roles.push('Teacher')
    if (supervisor.roleid === 6) roles.push('Guruwali')
    if (supervisor.is_wali_kelas) roles.push('Guru Wali')
    if (supervisor.is_guruwali && supervisor.roleid !== 6) roles.push('Guru Wali Access')
    
    return roles.join(' • ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading supervised students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button onClick={loadSupervisedStudents} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const { supervisor, students, total } = data

  return (
    <div className="space-y-6">
      {/* Supervisor Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Supervisor Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your role and supervision capabilities
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Name:</strong> {supervisor.username}</p>
            <p><strong>Class:</strong> {supervisor.kelas || 'No class assigned'}</p>
            <p><strong>Role:</strong> {getRoleDescription(supervisor)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supervised Students ({total})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Students directly assigned to you as guru wali
          </p>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No students are directly assigned to you as guru wali</p>
              <p className="text-sm">Contact admin to assign students directly to you</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div 
                  key={student.userid}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{student.username}</h4>
                      {getSupervisionBadge(student.supervision_type)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Class: {student.kelas}</p>
                      {student.email && <p>Email: {student.email}</p>}
                      <p>Joined: {new Date(student.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to student detail page
                        window.location.href = `/guru/siswa/${student.userid}/detail`
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Supervision Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{total}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {students.filter(s => s.supervision_type === 'direct').length}
                </p>
                <p className="text-sm text-muted-foreground">Direct Assignment</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(students.map(s => s.kelas)).size}
                </p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}