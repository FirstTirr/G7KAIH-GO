import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// GET /api/teacher/students/[id] - Get single student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 ENDPOINT HIT: /api/teacher/students/[id]")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  
  try {
    console.log("=== Student API Debug Start ===")
    const resolvedParams = await params
    console.log("Resolved params:", resolvedParams)
    
    const supabase = await createAdminClient()
    
    console.log("Fetching student with ID:", resolvedParams.id)

    // First, get roles to find the correct role id for students
    const { data: roles, error: roleErr } = await supabase
      .from("role")
      .select("roleid, rolename")

    if (roleErr) {
      console.error("Role fetch error:", roleErr)
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 }
      )
    }

    console.log("Available roles:", roles)

    const siswaRoleId = roles?.find((r) => 
      String(r.rolename).toLowerCase() === "siswa" || 
      String(r.rolename).toLowerCase() === "student"
    )?.roleid || 5 // Default to 5 if not found

    console.log("Student role ID found:", siswaRoleId)

    // Check if student exists in user_profiles without role filter first
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("user_profiles")
      .select("userid, username, email, roleid, kelas")
      .eq("userid", resolvedParams.id)

    console.log("All profiles query result:", { 
      count: allProfiles?.length || 0, 
      profiles: allProfiles, 
      error: allProfilesError 
    })

    if (allProfilesError) {
      console.error("Profile fetch error:", allProfilesError)
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      )
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.log("No user found with this ID")
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    const profile = allProfiles[0]
    console.log("Found profile:", profile)

    // Check if the user is actually a student
    if (profile.roleid !== siswaRoleId) {
      console.log(`User found but role is ${profile.roleid}, expected ${siswaRoleId}`)
      return NextResponse.json(
        { error: "User is not a student" },
        { status: 404 }
      )
    }

    // Check if the user is actually a student
    if (profile.roleid !== siswaRoleId) {
      console.log(`User found but role is ${profile.roleid}, expected ${siswaRoleId}`)
      return NextResponse.json(
        { error: "User is not a student" },
        { status: 404 }
      )
    }

    // Get student's activity count
    const { count: activitiesCount } = await supabase
      .from("aktivitas")
      .select("*", { count: "exact", head: true })
      .eq("userid", resolvedParams.id)

    console.log("Activities count:", activitiesCount)

    // Get last activity
    const { data: lastActivityData } = await supabase
      .from("aktivitas")
      .select("created_at")
      .eq("userid", resolvedParams.id)
      .order("created_at", { ascending: false })
      .limit(1)

    console.log("Last activity data:", lastActivityData)

    // Determine status based on last activity
    let status = "inactive"
    if (lastActivityData && lastActivityData.length > 0) {
      const lastActivity = new Date(lastActivityData[0].created_at)
      const now = new Date()
      const daysDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff <= 1) {
        status = "active"
      } else if (daysDiff <= 7) {
        status = "completed"
      }
    }

    const studentData = {
      id: profile.userid,
      name: profile.username || "Unknown",
      class: profile.kelas || "",
      email: profile.email,
      activitiesCount: activitiesCount || 0,
      lastActivity: lastActivityData?.[0]?.created_at,
      status,
      roleid: profile.roleid
    }

    console.log("Final student data:", studentData)
    console.log("=== Student API Debug End ===")

    return NextResponse.json({
      success: true,
      data: studentData
    })

  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
