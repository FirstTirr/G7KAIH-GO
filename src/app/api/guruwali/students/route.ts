import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Lightweight in-memory cache for the full response (helps repeated loads in short bursts)
let CACHE: { data: any; expiresAt: number } | null = null
const CACHE_TTL_MS = 0 // Disable cache for debugging

// Verified duplicate mappings (manually curated to prevent cross-contamination)
const VERIFIED_ALIASES = new Map<string, string[]>([
  // Raditya Alfarisi - verified same person with different userids
  ['6f07ae03-187e-4e25-a519-9f72f96f22ff', ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'eca885ad-1119-48ca-8efe-91efcbfb54b4']],
  ['eca885ad-1119-48ca-8efe-91efcbfb54b4', ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'eca885ad-1119-48ca-8efe-91efcbfb54b4']]
])

// Optional verified display names for known users (improves UX when metadata is missing)
const VERIFIED_DISPLAY_NAMES = new Map<string, string>([
  ['6f07ae03-187e-4e25-a519-9f72f96f22ff', 'Raditya Alfarisi'],
  ['eca885ad-1119-48ca-8efe-91efcbfb54b4', 'Raditya Alfarisi'],
])

function nameFromEmail(email?: string | null): string | null {
  if (!email) return null
  const local = String(email).split('@')[0]
  if (!local) return null
  // Replace separators with spaces, then title-case
  const words = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean)
  if (words.length === 0) return null
  const pretty = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return pretty
}

// Expand a list of userIds with any verified alias groups that intersect the list
function expandWithVerifiedAliases(ids: string[]): string[] {
  const set = new Set(ids)
  for (const [primary, list] of VERIFIED_ALIASES.entries()) {
    // If any id from this alias group is present, add the whole group (including primary)
    const hit = list.some((id) => set.has(id)) || set.has(primary)
    if (hit) {
      set.add(primary)
      for (const id of list) set.add(id)
    }
  }
  return Array.from(set)
}

export async function GET() {
  try {
    console.log("GuruWali Students - Service key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Get current user to verify they are a guru wali
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify current user is a guru wali
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

    console.log("GuruWali verified:", guruWaliProfile.username)

    // Serve from cache when fresh
    if (CACHE && Date.now() < CACHE.expiresAt) {
      console.log("Serving from cache")
      // Filter cache for this guru wali's students only
      const filteredStudents = CACHE.data.filter((student: any) => 
        student.guruWaliId === user.id
      )
      return NextResponse.json({ success: true, data: filteredStudents })
    }

    const adminClient = await createAdminClient()
    console.log("Admin client created successfully")

    // Step 1: Get all student profiles assigned to this guru wali
    const { data: studentProfiles, error: studentError } = await adminClient
      .from('user_profiles')
      .select('userid, username, email, kelas, created_at')
      .eq('roleid', 5) // Students only
      .eq('guruwali_userid', user.id) // Only students assigned to this guru wali

    if (studentError) {
      console.error("Error fetching student profiles:", studentError)
      return NextResponse.json({ error: "Failed to fetch student profiles" }, { status: 500 })
    }

    console.log(`Found ${studentProfiles?.length || 0} students assigned to guru wali`)

    if (!studentProfiles || studentProfiles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: "No students assigned to this guru wali"
      })
    }

    const studentIds = studentProfiles.map(p => p.userid)
    const expandedStudentIds = expandWithVerifiedAliases(studentIds)

    // Step 2: Get activity data for these students
    const { data: activities, error: activitiesError } = await adminClient
      .from('aktivitas')
      .select(`
        activityid,
        userid,
        created_at,
        kegiatanid,
        categoryid
      `)
      .in('userid', expandedStudentIds)

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
    }

    console.log(`Found ${activities?.length || 0} activities`)

    // Step 3: Get kegiatan and category data
    const kegiatanIds = activities?.map(a => a.kegiatanid).filter(Boolean) || []
    const categoryIds = activities?.map(a => a.categoryid).filter(Boolean) || []

    const [kegiatanResult, categoryResult] = await Promise.all([
      kegiatanIds.length > 0 ? adminClient
        .from('kegiatan')
        .select('kegiatanid, kegiatanname')
        .in('kegiatanid', kegiatanIds) : { data: [], error: null },
      categoryIds.length > 0 ? adminClient
        .from('kategori')
        .select('categoryid, categoryname')
        .in('categoryid', categoryIds) : { data: [], error: null }
    ])

    const kegiatanMap = new Map()
    const categoryMap = new Map()

    kegiatanResult.data?.forEach(k => kegiatanMap.set(k.kegiatanid, k))
    categoryResult.data?.forEach(c => categoryMap.set(c.categoryid, c))

    // Step 4: Aggregate activity data by student
    const activityStats = new Map()

    for (const activity of activities || []) {
      const userId = activity.userid
      if (!activityStats.has(userId)) {
        activityStats.set(userId, {
          count: 0,
          lastActivity: null,
          categories: new Set()
        })
      }

      const stats = activityStats.get(userId)
      stats.count++
      
      const activityDate = new Date(activity.created_at)
      if (!stats.lastActivity || activityDate > new Date(stats.lastActivity)) {
        stats.lastActivity = activity.created_at
      }

      const categoryName = categoryMap.get(activity.categoryid)?.categoryname
      if (categoryName) {
        stats.categories.add(categoryName)
      }
    }

    // Step 5: Build the final student list
    const students = studentProfiles.map(profile => {
      const stats = activityStats.get(profile.userid) || { count: 0, lastActivity: null, categories: new Set() }
      
      // Determine status based on activity
      let status = "inactive"
      if (stats.lastActivity) {
        const lastActivityDate = new Date(stats.lastActivity)
        const daysSinceLastActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceLastActivity <= 1) {
          status = "active"
        } else if (daysSinceLastActivity <= 7) {
          status = "completed"
        } else {
          status = "inactive"
        }
      }

      // Format last activity
      const lastActivityFormatted = stats.lastActivity 
        ? new Date(stats.lastActivity).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : "Belum ada aktivitas"

      const displayName = VERIFIED_DISPLAY_NAMES.get(profile.userid) || 
                         profile.username || 
                         nameFromEmail(profile.email) || 
                         "Unknown Student"

      return {
        id: profile.userid,
        name: displayName,
        class: profile.kelas || "Tidak diketahui",
        avatar: null,
        activitiesCount: stats.count,
        lastActivity: lastActivityFormatted,
        status: status as "active" | "inactive" | "completed",
        guruWaliId: user.id, // Add guru wali reference for filtering
        email: profile.email,
        categories: Array.from(stats.categories)
      }
    })

    // Sort by activity count (most active first)
    students.sort((a, b) => b.activitiesCount - a.activitiesCount)

    // Cache the full result
    CACHE = {
      data: students,
      expiresAt: Date.now() + CACHE_TTL_MS
    }

    console.log(`Returning ${students.length} students for guru wali`)
    return NextResponse.json({ success: true, data: students })

  } catch (error) {
    console.error("GuruWali students API error:", error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
