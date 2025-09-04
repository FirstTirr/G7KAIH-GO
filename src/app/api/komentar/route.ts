import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// GET: /api/komentar?siswa_id=<uuid>
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const siswa_id = url.searchParams.get("siswa_id")
    
    if (!siswa_id) {
      return NextResponse.json({ error: "Missing siswa_id parameter" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify current user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, get all comments for the student
    const { data: komentar, error: errKomentar } = await supabase
      .from("komentar")
      .select("komentarid, content, created_at, updated_at, userid")
      .eq("siswaid", siswa_id)
      .is("deleteat", null)
      .order("created_at", { ascending: true })

    if (errKomentar) {
      console.error("Error fetching comments:", errKomentar)
      return NextResponse.json({ error: errKomentar.message }, { status: 500 })
    }

    // If we have comments, get user profiles separately
    let enrichedComments: any[] = []
    if (komentar && komentar.length > 0) {
      const userIds = [...new Set(komentar.map(k => k.userid))]
      
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("userid, username, roleid")
        .in("userid", userIds)

      if (profileError) {
        console.error("Error fetching user profiles:", profileError)
        // Still return comments without profiles if profile fetch fails
        enrichedComments = komentar.map(comment => ({
          ...comment,
          user_profiles: null
        }))
      } else {
        // Map profiles to comments
        const profileMap = new Map(profiles.map(p => [p.userid, p]))
        
        enrichedComments = komentar.map(comment => ({
          ...comment,
          user_profiles: profileMap.get(comment.userid) || null
        }))
      }
    }

    return NextResponse.json({ data: enrichedComments })
  } catch (err: any) {
    console.error("GET /api/komentar error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: /api/komentar
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, siswaid } = body

    // Validation
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!siswaid || typeof siswaid !== "string") {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert comment
    const { data, error } = await supabase
      .from("komentar")
      .insert([{ 
        content: content.trim(), 
        userid: user.id, 
        siswaid 
      }])
      .select("komentarid, content, created_at, updated_at, userid")
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user profile for the created comment
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("userid, username, roleid")
      .eq("userid", user.id)
      .single()

    // Return the comment with user profile
    const enrichedComment = {
      ...data,
      user_profiles: profile || null
    }

    return NextResponse.json({ data: enrichedComment, message: "Comment created successfully" })
  } catch (err: any) {
    console.error("POST /api/komentar error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: /api/komentar?comment_id=<uuid>
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const comment_id = url.searchParams.get("comment_id")
    
    if (!comment_id) {
      return NextResponse.json({ error: "Missing comment_id parameter" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if comment exists and user has permission to delete it
    const { data: comment, error: fetchError } = await supabase
      .from("komentar")
      .select("userid, content")
      .eq("komentarid", comment_id)
      .is("deleteat", null)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Only allow the comment author to delete their own comment
    if (comment.userid !== user.id) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 })
    }

    // Soft delete by setting deleteat timestamp
    const { error: deleteError } = await supabase
      .from("komentar")
      .update({ deleteat: new Date().toISOString() })
      .eq("komentarid", comment_id)

    if (deleteError) {
      console.error("Error deleting comment:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (err: any) {
    console.error("DELETE /api/komentar error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
