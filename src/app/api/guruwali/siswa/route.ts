import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's profile to verify they are a guruwali
    const { data: guruWaliProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('userid, username, roleid')
      .eq('userid', user.id)
      .eq('roleid', 6) // Guru wali role
      .single()

    if (profileError || !guruWaliProfile) {
      return NextResponse.json({ 
        error: "Only guru wali can access this endpoint" 
      }, { status: 403 })
    }

    // Get students assigned to this guru wali
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select(`
        userid,
        username,
        email,
        kelas,
        roleid,
        created_at
      `)
      .eq('guruwali_userid', user.id)
      .eq('roleid', 5) // Only students
      .order('username', { ascending: true })

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ 
        error: "Failed to fetch students" 
      }, { status: 500 })
    }

    // Get recent activities for these students
    const studentIds = students?.map(s => s.userid) || []
    let recentActivities: any[] = []
    
    if (studentIds.length > 0) {
      const { data: activities, error: activitiesError } = await supabase
        .from('aktivitas')
        .select(`
          activityid,
          userid,
          categoryid,
          kegiatanid,
          created_at
        `)
        .in('userid', studentIds)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!activitiesError && activities) {
        // Get user profiles for these activities
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('userid, username, kelas')
          .in('userid', activities.map(a => a.userid))

        // Get kegiatan names
        const kegiatanIds = activities.map(a => a.kegiatanid).filter(Boolean)
        const { data: kegiatanList } = await supabase
          .from('kegiatan')
          .select('kegiatanid, kegiatanname')
          .in('kegiatanid', kegiatanIds)

        // Map user profiles and kegiatan to activities
        const userProfilesMap = new Map()
        const kegiatanMap = new Map()
        
        userProfiles?.forEach(profile => userProfilesMap.set(profile.userid, profile))
        kegiatanList?.forEach(keg => kegiatanMap.set(keg.kegiatanid, keg))

        recentActivities = activities.map(activity => ({
          ...activity,
          judul: kegiatanMap.get(activity.kegiatanid)?.kegiatanname || 'Aktivitas',
          user_profiles: userProfilesMap.get(activity.userid) || { username: 'Unknown', kelas: null }
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        guruWali: {
          id: guruWaliProfile.userid,
          name: guruWaliProfile.username
        },
        students: students || [],
        recentActivities,
        summary: {
          totalStudents: students?.length || 0,
          totalActivities: recentActivities.length
        }
      }
    })

  } catch (error) {
    console.error('Guru wali students API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
