import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { teacherId, is_guruwali, is_wali_kelas } = await request.json()
    
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }
    
    const admin = await createAdminClient()
    
    // Prepare update object
    const updateData: any = {}
    
    if (typeof is_guruwali === 'boolean') {
      updateData.is_guruwali = is_guruwali
    }
    
    if (typeof is_wali_kelas === 'boolean') {
      updateData.is_wali_kelas = is_wali_kelas
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }
    
    // Update teacher role attributes
    const { error } = await admin
      .from('user_profiles')
      .update(updateData)
      .eq('userid', teacherId)
      .in('roleid', [2, 6]) // Only allow updates for teachers and guruwali
    
    if (error) {
      console.error('Error updating teacher roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Teacher role updated successfully",
      updated: updateData
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}