"use client"

import { CommentSection } from "@/components/komentar/CommentSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useState } from "react"

export default function KomentarTestPage() {
  const { userId: currentUserId, loading: userLoading } = useCurrentUser()
  const [testSiswaId, setTestSiswaId] = useState("05c3061e-e24c-4918-ae00-5fabfa8a2552") // Default test student ID

  if (userLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Anda harus login untuk menggunakan fitur komentar</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Fitur Komentar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siswa-id">ID Siswa untuk Test</Label>
            <div className="flex gap-2">
              <Input
                id="siswa-id"
                value={testSiswaId}
                onChange={(e) => setTestSiswaId(e.target.value)}
                placeholder="Masukkan ID siswa..."
              />
              <Button 
                variant="outline"
                onClick={() => setTestSiswaId("05c3061e-e24c-4918-ae00-5fabfa8a2552")}
              >
                Reset
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Current User ID: <code className="bg-gray-100 px-1 rounded">{currentUserId}</code></p>
            <p>Test Siswa ID: <code className="bg-gray-100 px-1 rounded">{testSiswaId}</code></p>
          </div>
        </CardContent>
      </Card>

      {testSiswaId && (
        <CommentSection 
          siswaId={testSiswaId} 
          currentUserId={currentUserId} 
        />
      )}
    </div>
  )
}
