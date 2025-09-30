"use client"

import SupervisedStudentsList from '@/components/teacher/SupervisedStudentsList'

export default function WaliKelasPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Wali Kelas & Guruwali</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor students under your supervision
        </p>
      </div>
      
      <SupervisedStudentsList />
    </div>
  )
}