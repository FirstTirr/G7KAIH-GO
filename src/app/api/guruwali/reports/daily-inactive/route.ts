import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a guru wali
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('roleid')
      .eq('userid', user.id)
      .single()

    if (!userProfile || userProfile.roleid !== 6) { // roleid 6 is guru wali
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date") || new Date().toISOString().split('T')[0]

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    // Get only students assigned to this guru wali
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('userid, username, kelas, email')
      .eq('roleid', 5) // Student role
      .eq('guruwali_userid', user.id) // Only students assigned to this guru wali
      .order('username')

    if (studentsError) throw studentsError

    if (!students || students.length === 0) {
      return NextResponse.json({ 
        data: {
          date,
          totalStudents: 0,
          activeStudents: 0,
          inactiveStudents: [],
          activeRate: 0,
          message: "No students assigned to this guru wali"
        }
      })
    }

    const studentIds = students.map(s => s.userid)
    
    // Get activities for the specific date for these students only
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data: activities, error: activitiesError } = await supabase
      .from('aktivitas')
      .select('userid')
      .in('userid', studentIds) // Filter by assigned students
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    if (activitiesError) throw activitiesError

    // Count unique students who were active
    const activeStudentIds = new Set(activities?.map(a => a.userid) || [])
    const activeStudents = activeStudentIds.size

    // Find inactive students
    const inactiveStudents = students.filter(student => 
      !activeStudentIds.has(student.userid)
    ).map(student => ({
      userid: student.userid,
      username: student.username,
      kelas: student.kelas,
      email: student.email
    }))

    const totalStudents = students.length
    const activeRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0

    return NextResponse.json({
      data: {
        date,
        totalStudents,
        activeStudents,
        inactiveStudents,
        activeRate,
        guruWali: userProfile
      }
    })

  } catch (error) {
    console.error("GuruWali daily inactive report error:", error)
    return NextResponse.json({ 
      error: "Failed to generate report" 
    }, { status: 500 })
  }
}
