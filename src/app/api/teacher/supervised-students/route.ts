import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role, class, and guruwali status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('roleid, kelas, is_guruwali, is_wali_kelas, username')
      .eq('userid', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user is teacher or has guruwali privileges
    const isTeacherOrGuruwali = profile.roleid === 2 || profile.roleid === 6 || profile.is_guruwali
    if (!isTeacherOrGuruwali) {
      return NextResponse.json({ error: "Forbidden - Not authorized" }, { status: 403 })
    }

    // Build query for supervised students
    let query = supabase
      .from('user_profiles')
      .select(`
        userid,
        username,
        kelas,
        email,
        guruwali_userid,
        created_at
      `)
      .eq('roleid', 5) // student roleid

        // For supervised students endpoint, only show DIRECT ASSIGNMENTS
    // Filter to only show students directly assigned to this teacher as guruwali
    query = query.eq('guruwali_userid', user.id)

    const { data: students, error: studentsError } = await query.order('kelas', { ascending: true })

    if (studentsError) {
      console.error('Error fetching supervised students:', studentsError)
      return NextResponse.json({ error: "Failed to fetch supervised students" }, { status: 500 })
    }

    // Add supervision info for each student
    const studentsWithSupervisionInfo = (students || []).map(student => {
      let supervisionType = 'none'
      if (student.guruwali_userid === user.id) {
        supervisionType = 'direct'
      } else if (profile.is_wali_kelas && student.kelas === profile.kelas) {
        supervisionType = 'wali_kelas'
      } else if (profile.roleid === 6) {
        supervisionType = 'full_guruwali'
      }

      return {
        ...student,
        supervision_type: supervisionType,
        supervisor_name: profile.username
      }
    })

    return NextResponse.json({
      supervisor: {
        userid: user.id,
        username: profile.username,
        kelas: profile.kelas,
        roleid: profile.roleid,
        is_guruwali: profile.is_guruwali,
        is_wali_kelas: profile.is_wali_kelas
      },
      students: studentsWithSupervisionInfo,
      total: studentsWithSupervisionInfo.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}