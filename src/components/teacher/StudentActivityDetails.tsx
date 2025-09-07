"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ArrowLeft, Calendar, CheckCircle, Clock, Eye, ShieldCheck, XCircle } from "lucide-react"
import * as React from "react"

type FieldValue = {
  id: string
  field: {
    id: string
    label: string
    type: 'text' | 'time' | 'image' | 'text_image' | 'multiselect'
    required: boolean
  }
  value: any
  files?: Array<{
    id: string
    filename: string
    url: string
  }>
  validation: {
    status: 'pending' | 'teacher_validated' | 'parent_validated' | 'fully_validated'
    byTeacher: boolean
    byParent: boolean
    teacherId?: string
    parentId?: string
  }
  created_at: string
  updated_at: string
}

type Activity = {
  id: string
  activityid?: string // Add this to match API response
  student_id: string
  kegiatan_id: string
  category_id: string
  submission_date: string
  created_at: string
  student_name: string
  kegiatan_name: string
  field_values: FieldValue[]
}

type Student = {
  id: string
  name: string
  class: string
  avatar?: string
}

function getValidationStatus(validation: FieldValue['validation']) {
  if (validation.byTeacher && validation.byParent) {
    return { text: 'Tervalidasi Lengkap', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
  } else if (validation.byTeacher) {
    return { text: 'Tervalidasi Guru', variant: 'secondary' as const, icon: ShieldCheck, color: 'text-blue-600' }
  } else if (validation.byParent) {
    return { text: 'Tervalidasi Orang Tua', variant: 'outline' as const, icon: CheckCircle, color: 'text-yellow-600' }
  } else {
    return { text: 'Menunggu Validasi', variant: 'outline' as const, icon: Clock, color: 'text-gray-600' }
  }
}

function renderFieldValue(field: FieldValue['field'], value: any, files?: any[]) {
  // Handle JSON string values and clean up quotes
  let parsedValue = value
  
  if (typeof value === 'string') {
    // Remove surrounding quotes if they exist
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      parsedValue = value.slice(1, -1)
    } else if (value.startsWith('{') || value.startsWith('[')) {
      // Try to parse JSON objects/arrays
      try {
        parsedValue = JSON.parse(value)
      } catch {
        parsedValue = value
      }
    } else {
      parsedValue = value
    }
  }

  // Handle empty or null values
  if (parsedValue === null || parsedValue === undefined || parsedValue === '' || parsedValue === '""' || parsedValue === "''") {
    // Check if there are files for this field
    if (files && files.length > 0) {
      return (
        <div className="space-y-2">
          <span className="text-gray-500 italic">Tidak ada teks</span>
          {files.map((file, index) => (
            <div key={index} className="mt-2">
              <img 
                src={file.url}
                alt={file.filename || field.label}
                className="max-w-xs max-h-48 object-cover rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(file.url, '_blank')}
              />
            </div>
          ))}
        </div>
      )
    }
    return <span className="text-gray-500 italic">Tidak ada data</span>
  }

  switch (field.type) {
    case 'text':
      return <span className="font-medium text-gray-900">{String(parsedValue)}</span>
    case 'time':
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{String(parsedValue)}</span>
        </div>
      )
    case 'image':
      if (parsedValue && typeof parsedValue === 'string' && parsedValue.length > 0) {
        return (
          <div className="mt-2">
            <img 
              src={parsedValue} 
              alt={field.label}
              className="max-w-xs max-h-48 object-cover rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(parsedValue, '_blank')}
            />
          </div>
        )
      }
      return <span className="text-gray-500">Tidak ada gambar</span>
    case 'text_image':
      if (parsedValue && typeof parsedValue === 'object') {
        return (
          <div className="space-y-3">
            {parsedValue.text && parsedValue.text.trim() && (
              <div className="bg-gray-50 p-3 rounded border">
                <p className="font-medium text-gray-900">{parsedValue.text}</p>
              </div>
            )}
            {parsedValue.image && parsedValue.image.trim() && (
              <img 
                src={parsedValue.image} 
                alt={field.label}
                className="max-w-xs max-h-48 object-cover rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(parsedValue.image, '_blank')}
              />
            )}
          </div>
        )
      } else if (parsedValue && typeof parsedValue === 'string') {
        // Handle simple text input for text_image field
        return (
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded border">
              <p className="font-medium text-gray-900">{parsedValue}</p>
            </div>
            {/* Show files if available */}
            {files && files.length > 0 && files.map((file, index) => (
              <div key={index} className="mt-2">
                <img 
                  src={file.url}
                  alt={file.filename || field.label}
                  className="max-w-xs max-h-48 object-cover rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(file.url, '_blank')}
                />
              </div>
            ))}
          </div>
        )
      } else if (files && files.length > 0) {
        // Only files, no text
        return (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="mt-2">
                <img 
                  src={file.url}
                  alt={file.filename || field.label}
                  className="max-w-xs max-h-48 object-cover rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(file.url, '_blank')}
                />
              </div>
            ))}
          </div>
        )
      }
      return <span className="text-gray-500">Tidak ada data</span>
    case 'multiselect':
      // Handle comma-separated values or array
      let options: string[] = []
      if (typeof parsedValue === 'string') {
        // Split by comma and clean up each option
        options = parsedValue.split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0)
      } else if (Array.isArray(parsedValue)) {
        options = parsedValue.map(item => String(item).trim()).filter(item => item.length > 0)
      }
      
      if (options.length === 0) {
        return <span className="text-gray-500">Tidak ada pilihan</span>
      }
      
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {option}
            </Badge>
          ))}
        </div>
      )
    default:
      return <span className="text-gray-900">{String(parsedValue)}</span>
  }
}

async function toggleValidation(fieldValueId: string, currentStatus: boolean) {
  try {
    const response = await fetch('/api/aktivitas/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field_value_id: fieldValueId,
        validated_by_teacher: !currentStatus
      }),
    })

    if (!response.ok) {
      throw new Error('Gagal mengubah status validasi')
    }

    return await response.json()
  } catch (error) {
    console.error('Validation error:', error)
    throw error
  }
}

export function StudentActivityDetails({
  student,
  activities: initialActivities,
  onBack,
  onRefresh
}: {
  student: Student
  activities: Activity[]
  onBack: () => void
  onRefresh?: () => void
}) {
  const { userId: currentUserId } = useCurrentUser()
  const [validatingFieldId, setValidatingFieldId] = React.useState<string | null>(null)
  const [activities, setActivities] = React.useState<Activity[]>(initialActivities)

  // Update local activities when prop changes
  React.useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  console.log('StudentActivityDetails props:', {
    student,
    activitiesCount: activities.length,
    activities: activities.slice(0, 2) // Show first 2 for debugging
  })

  const handleValidationToggle = async (fieldValue: FieldValue) => {
    if (validatingFieldId) return

    setValidatingFieldId(fieldValue.id)
    try {
      await toggleValidation(fieldValue.id, fieldValue.validation.byTeacher)
      
      // Update local state instead of calling onRefresh
      setActivities(prevActivities => 
        prevActivities.map(activity => ({
          ...activity,
          field_values: activity.field_values.map(fv => 
            fv.id === fieldValue.id 
              ? {
                  ...fv,
                  validation: {
                    ...fv.validation,
                    byTeacher: !fv.validation.byTeacher,
                    status: !fv.validation.byTeacher && fv.validation.byParent
                      ? 'fully_validated'
                      : !fv.validation.byTeacher
                      ? 'teacher_validated'
                      : fv.validation.byParent
                      ? 'parent_validated'
                      : 'pending'
                  }
                }
              : fv
          )
        }))
      )
    } catch (error) {
      console.error('Failed to toggle validation:', error)
    } finally {
      setValidatingFieldId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Group activities by date and kegiatan
  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, Record<string, Activity[]>> = {}
    
    activities.forEach(activity => {
      if (activity.submission_date) {
        const date = activity.submission_date.split('T')[0]
        if (!groups[date]) groups[date] = {}
        if (!groups[date][activity.kegiatan_name]) groups[date][activity.kegiatan_name] = []
        groups[date][activity.kegiatan_name].push(activity)
      }
    })

    return groups
  }, [activities])

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {student.name.split(" ").filter(Boolean).map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{student.name}</h1>
                <p className="text-sm text-gray-500">Detail Aktivitas - Kelas {student.class}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">{activities.length} aktivitas</span>
          </div>
        </div>
      </div>

      {/* Activities by Date */}
      <div className="px-6 space-y-8">
        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-600">
                  Belum Ada Aktivitas
                </h3>
                <p className="text-gray-500">
                  Siswa belum mengisi aktivitas apapun.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-3 sticky top-24 bg-white z-10 py-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">{formatDate(date)}</h2>
                <Badge variant="outline" className="text-xs">
                  {Object.values(groupedActivities[date]).reduce((acc, curr) => acc + curr.length, 0)} aktivitas
                </Badge>
              </div>

              {/* Activities for this date grouped by kegiatan */}
              {Object.entries(groupedActivities[date]).map(([kegiatanName, kegiatanActivities]) => (
                <Card key={kegiatanName} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-blue-700">{kegiatanName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {kegiatanActivities.map(activity => (
                      <div key={activity.id} className="border-l-4 border-blue-200 pl-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(activity.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Field Values */}
                        <div className="space-y-4">
                          {activity.field_values.map(fieldValue => {
                            const validationStatus = getValidationStatus(fieldValue.validation)
                            const IconComponent = validationStatus.icon

                            return (
                              <div key={fieldValue.id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">{fieldValue.field.label}</span>
                                    {fieldValue.field.required && (
                                      <span className="text-red-500 text-xs">*</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={validationStatus.variant} className="text-xs">
                                      <IconComponent className={`h-3 w-3 mr-1 ${validationStatus.color}`} />
                                      {validationStatus.text}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant={fieldValue.validation.byTeacher ? "default" : "outline"}
                                      onClick={() => handleValidationToggle(fieldValue)}
                                      disabled={validatingFieldId === fieldValue.id}
                                      className="text-xs"
                                    >
                                      {validatingFieldId === fieldValue.id ? (
                                        "Loading..."
                                      ) : fieldValue.validation.byTeacher ? (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Tervalidasi
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Validasi
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-2">
                                  {renderFieldValue(fieldValue.field, fieldValue.value, fieldValue.files)}
                                </div>

                                <div className="mt-3 text-xs text-gray-500 flex justify-between">
                                  <span>Diisi: {formatTime(fieldValue.created_at)}</span>
                                  {fieldValue.updated_at !== fieldValue.created_at && (
                                    <span>Diperbarui: {formatTime(fieldValue.updated_at)}</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
