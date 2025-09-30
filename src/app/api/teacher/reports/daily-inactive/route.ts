import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a teacher
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('roleid')
      .eq('userid', user.id)
      .single()

    if (!userProfile || userProfile.roleid !== 2) { // Assuming roleid 2 is teacher
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date") || new Date().toISOString().split('T')[0]

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    // Get all students (role 5)
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('userid, username, kelas, email')
      .eq('roleid', 5) // Student role
      .order('username')

    if (studentsError) throw studentsError

    if (!students || students.length === 0) {
      return NextResponse.json({ 
        data: {
          date,
          totalStudents: 0,
          activeStudents: 0,
          inactiveStudents: [],
          activeRate: 0
        }
      })
    }

    // Set date range for the specific day
    const startDate = new Date(date + "T00:00:00.000Z")
    const endDate = new Date(date + "T23:59:59.999Z")

    // Get activities for all students on the specified date
    const { data: activities, error: activitiesError } = await supabase
      .from('aktivitas')
      .select('userid, activityid, activityname, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (activitiesError) throw activitiesError

    // Create a set of student IDs who have activities
    const activeStudentIds = new Set((activities || []).map(activity => activity.userid))

    // Find students who don't have activities
    const inactiveStudents = students.filter(student => !activeStudentIds.has(student.userid))
    
    // Find students who have activities  
    const activeStudents = students.filter(student => activeStudentIds.has(student.userid))

    const result = {
      date,
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      inactiveStudents: inactiveStudents.map(student => ({
        userid: student.userid,
        username: student.username,
        kelas: student.kelas,
        email: student.email
      })),
      activeStudentsList: activeStudents.map(student => ({
        userid: student.userid,
        username: student.username,
        kelas: student.kelas,
        email: student.email,
        activities: (activities || []).filter(activity => activity.userid === student.userid)
      })),
      activeRate: students.length > 0 ? Math.round((activeStudents.length / students.length) * 100) : 0
    }

    return NextResponse.json({ data: result })

  } catch (error: any) {
    console.error("Daily inactive report error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
