"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw authError
        }
        
        setUserId(user?.id || null)
      } catch (err: any) {
        console.error("Error getting current user:", err)
        setError(err.message || "Failed to get current user")
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [])

  return { userId, loading, error }
}
