import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const admin = await createAdminClient()
    
    // Get all teachers (roleid = 2) and guruwali (roleid = 6)
    const { data: teachers, error } = await admin
      .from('user_profiles')
      .select(`
        userid,
        username,
        email,
        kelas,
        roleid,
        is_guruwali,
        is_wali_kelas
      `)
      .in('roleid', [2, 6]) // teacher and guruwali
      .order('username')
    
    if (error) {
      console.error('Error fetching teachers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(teachers || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}