import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const studentId = resolvedParams.id
    
    // Get current user to verify they are a guru wali
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify current user is a guru wali and this student is assigned to them
    const { data: studentProfile, error: studentError } = await supabase
      .from('user_profiles')
      .select(`
        userid,
        username,
        email,
        kelas,
        roleid,
        created_at,
        guruwali_userid
      `)
      .eq('userid', studentId)
      .eq('roleid', 5) // Must be a student
      .eq('guruwali_userid', user.id) // Must be assigned to current guru wali
      .single()

    if (studentError || !studentProfile) {
      console.log('Student not found or not assigned:', { studentError, studentProfile })
      return NextResponse.json({ 
        error: "Student not found or not assigned to you" 
      }, { status: 404 })
    }

    // Get activity count using admin client
    const adminClient = await createAdminClient()
    const { data: activities, error: activitiesError } = await adminClient
      .from('aktivitas')
      .select('activityid')
      .eq('userid', studentId)

    const activitiesCount = activities?.length || 0

    // Calculate status based on recent activity
    const { data: recentActivity } = await adminClient
      .from('aktivitas')
      .select('created_at')
      .eq('userid', studentId)
      .order('created_at', { ascending: false })
      .limit(1)

    let status = "inactive"
    if (recentActivity && recentActivity.length > 0) {
      const lastActivityDate = new Date(recentActivity[0].created_at)
      const daysSinceLastActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceLastActivity <= 1) {
        status = "active"
      } else if (daysSinceLastActivity <= 7) {
        status = "completed"
      } else {
        status = "inactive"
      }
    }

    const student = {
      id: studentProfile.userid,
      name: studentProfile.username,
      class: studentProfile.kelas || "Tidak diketahui",
      activitiesCount,
      status,
      email: studentProfile.email,
      avatar: null
    }

    return NextResponse.json({
      success: true,
      data: student
    })

  } catch (error) {
    console.error('GuruWali student detail API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
