import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"
import React, { useEffect, useState } from "react"

type Comment = {
  komentarid: string
  content: string
  created_at: string
  updated_at: string
  userid: string
  user_profiles?: {
    username?: string
    roleid?: number
  }
}

interface CommentSectionProps {
  siswaId: string
  currentUserId: string
}

function getRoleName(roleid?: number): string {
  switch (roleid) {
    case 2: return "Guru"
    case 3: return "Admin"
    case 4: return "Orang Tua"
    case 5: return "Siswa"
    default: return "Pengguna"
  }
}

function getRoleBadgeVariant(roleid?: number): "default" | "secondary" | "outline" {
  switch (roleid) {
    case 2: return "default" // Guru - darker
    case 3: return "secondary" // Admin - gray
    case 4: return "outline" // Orang Tua - outlined
    case 5: return "outline" // Siswa - outlined
    default: return "outline"
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function CommentSection({ siswaId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/komentar?siswa_id=${siswaId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch comments")
      }
      
      setComments(result.data || [])
    } catch (err: any) {
      console.error("Error fetching comments:", err)
      setError(err.message || "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (siswaId) {
      fetchComments()
    }
  }, [siswaId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError("Komentar tidak boleh kosong")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/komentar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: content.trim(), 
          siswaid: siswaId 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit comment")
      }

      setContent("")
      // Reload comments to get the new one
      await fetchComments()
    } catch (err: any) {
      console.error("Error submitting comment:", err)
      setError(err.message || "Failed to submit comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus komentar ini?")) {
      return
    }

    setDeletingId(commentId)
    setError(null)

    try {
      const response = await fetch(`/api/komentar?comment_id=${commentId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete comment")
      }

      // Reload comments to update the list
      await fetchComments()
    } catch (err: any) {
      console.error("Error deleting comment:", err)
      setError(err.message || "Failed to delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Komentar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Komentar untuk Siswa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form untuk menambah komentar */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Tulis Komentar</Label>
            <Textarea
              id="comment"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis komentar Anda di sini..."
              required
              rows={3}
              disabled={submitting}
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={submitting || !content.trim()}
            className="w-full"
          >
            {submitting ? "Mengirim..." : "Kirim Komentar"}
          </Button>
        </form>

        <Separator />

        {/* Daftar komentar */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700">
            {comments.length > 0 ? `${comments.length} Komentar` : "Belum ada komentar"}
          </h4>
          
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada komentar. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.komentarid} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.user_profiles?.username || "Pengguna"}
                      </span>
                      <Badge variant={getRoleBadgeVariant(comment.user_profiles?.roleid)}>
                        {getRoleName(comment.user_profiles?.roleid)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                      {/* Only show delete button for own comments */}
                      {comment.userid === currentUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(comment.komentarid)}
                          disabled={deletingId === comment.komentarid}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingId === comment.komentarid ? (
                            <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
