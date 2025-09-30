"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

export default function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  
  React.useEffect(() => {
    // Redirect to kalender by default
    router.replace(`/guru/siswa/${resolvedParams.id}/kalender`)
  }, [resolvedParams.id, router])

  return (
    <div className="p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Mengarahkan...</p>
        </div>
      </div>
    </div>
  )
}
