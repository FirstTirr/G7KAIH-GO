import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// GET: /api/orangtua/siswa - Mendapatkan data siswa yang terkait dengan orang tua
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user (orang tua)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get orang tua profile
    const { data: parentProfile, error: parentError } = await supabase
      .from("user_profiles")
      .select("userid, username, roleid, parent_of_userid")
      .eq("userid", user.id)
      .eq("roleid", 3) // Role orang tua
      .single()

    if (parentError || !parentProfile) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    let myStudent = null
    if (parentProfile.parent_of_userid) {
      // Get student data berdasarkan parent_of_userid
      const { data: studentProfile, error: studentError } = await supabase
        .from("user_profiles")
        .select("userid, username, kelas, email")
        .eq("userid", parentProfile.parent_of_userid)
        .eq("roleid", 4) // Role siswa
        .single()

      if (!studentError && studentProfile) {
        myStudent = studentProfile
      }
    }

    // Jika tidak ada relasi, atau fallback untuk development
    if (!myStudent) {
      // Fallback: ambil siswa berdasarkan pattern lain atau untuk demo
      const { data: allStudents, error: studentsError } = await supabase
        .from("user_profiles")
        .select("userid, username, kelas, email")
        .eq("roleid", 4) // Role siswa
        .limit(5)

      if (!studentsError && allStudents && allStudents.length > 0) {
        // Untuk demo, ambil siswa pertama
        myStudent = allStudents[0]
      }

      return NextResponse.json({ 
        data: {
          parent: parentProfile,
          student: myStudent,
          message: "No direct parent-student relationship found. Using fallback student for demo.",
          availableStudents: allStudents
        }
      })
    }

    return NextResponse.json({ 
      data: {
        parent: parentProfile,
        student: myStudent
      }
    })
  } catch (err: any) {
    console.error("GET /api/orangtua/siswa error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: /api/orangtua/siswa - Mengatur relasi orang tua dengan siswa
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_userid } = body

    if (!student_userid || typeof student_userid !== "string") {
      return NextResponse.json({ error: "Student user ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user (orang tua)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is orang tua
    const { data: parentProfile, error: parentError } = await supabase
      .from("user_profiles")
      .select("roleid")
      .eq("userid", user.id)
      .eq("roleid", 3)
      .single()

    if (parentError || !parentProfile) {
      return NextResponse.json({ error: "Only parents can set student relationships" }, { status: 403 })
    }

    // Verify student exists and has correct role
    const { data: studentProfile, error: studentError } = await supabase
      .from("user_profiles")
      .select("userid, roleid")
      .eq("userid", student_userid)
      .eq("roleid", 4) // Role siswa
      .single()

    if (studentError || !studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update parent profile dengan parent_of_userid
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ 
        parent_of_userid: student_userid
      })
      .eq("userid", user.id)

    if (updateError) {
      console.error("Error updating parent-student relationship:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Parent-student relationship updated successfully",
      data: {
        parent_userid: user.id,
        student_userid: student_userid
      }
    })
  } catch (err: any) {
    console.error("POST /api/orangtua/siswa error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
