import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const studentId = resolvedParams.id
    console.log('Fetching student detail for ID:', studentId)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('Current user ID:', user.id)

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

    console.log('Student found:', studentProfile.username)

    // Get student's activities with categories
    console.log('Fetching activities for student:', studentId)
    const { data: activities, error: activitiesError } = await supabase
      .from('aktivitas')
      .select(`
        activityid,
        userid,
        created_at,
        kegiatanid,
        categoryid
      `)
      .eq('userid', studentId)
      .order('created_at', { ascending: false })

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json({ 
        error: "Failed to fetch activities",
        debug: activitiesError
      }, { status: 500 })
    }

    console.log('Activities found:', activities?.length || 0)

    // Get categories separately
    const { data: categories, error: categoriesError } = await supabase
      .from('kategori')
      .select('categoryid, categoryname')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }

    console.log('Categories found:', categories?.length || 0)

    // Get kegiatan (activities) separately
    const { data: kegiatan, error: kegiatanError } = await supabase
      .from('kegiatan')
      .select('kegiatanid, kegiatanname')

    if (kegiatanError) {
      console.error('Error fetching kegiatan:', kegiatanError)
    }

    // Map categories and kegiatan to activities
    const categoriesMap = new Map()
    const kegiatanMap = new Map()
    
    if (categories && !categoriesError) {
      categories.forEach(cat => categoriesMap.set(cat.categoryid, cat))
    }
    
    if (kegiatan && !kegiatanError) {
      kegiatan.forEach(keg => kegiatanMap.set(keg.kegiatanid, keg))
    }

    // Add category info to activities
    const activitiesWithCategories = activities?.map(activity => ({
      ...activity,
      judul: kegiatanMap.get(activity.kegiatanid)?.kegiatanname || 'Aktivitas',
      deskripsi: null, // Not available in this structure
      kategori: { 
        nama: categoriesMap.get(activity.categoryid)?.categoryname || 'Tidak diketahui' 
      }
    })) || []

    // Calculate summaries
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const summary = {
      totalActivities: activitiesWithCategories.length,
      thisMonth: activitiesWithCategories.filter(a => new Date(a.created_at) >= thisMonth).length,
      thisWeek: activitiesWithCategories.filter(a => new Date(a.created_at) >= thisWeek).length
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          userid: studentProfile.userid,
          username: studentProfile.username,
          email: studentProfile.email,
          kelas: studentProfile.kelas,
          created_at: studentProfile.created_at
        },
        activities: activitiesWithCategories,
        summary
      }
    })

  } catch (error) {
    console.error('Student detail API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
