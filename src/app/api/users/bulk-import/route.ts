import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type CSVRow = {
  username: string
  email: string
  kelas: string
  password: string
  roleid: string
  rowNumber: number
  errors: string[]
}

type ImportResult = {
  success: number
  failed: number
  errors: Array<{ row: number; username?: string; error: string }>
  tempPasswords?: Array<{ username: string; email: string; password: string }>
}

export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json() as { users: CSVRow[] }

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: "Data users tidak valid" },
        { status: 400 }
      )
    }

    // Ensure caller is authenticated and is an admin
    const supabase = await createClient()
    const {
      data: { user: caller },
    } = await supabase.auth.getUser()

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from("user_profiles")
      .select("roleid")
      .eq("userid", caller.id)
      .maybeSingle()

    if (!callerProfile) {
      return NextResponse.json(
        { error: "Forbidden: profile not found" },
        { status: 403 }
      )
    }

    // Check if caller is admin
    let isAdmin = false
    const envAdminRoleId = Number(process.env.ADMIN_ROLE_ID ?? "")
    if (!Number.isNaN(envAdminRoleId)) {
      isAdmin = callerProfile.roleid === envAdminRoleId
    }

    if (!isAdmin) {
      // Fallback to role name lookup using admin client
      const admin = await createAdminClient()
      const { data: adminRoles } = await admin
        .from("role")
        .select("roleid, rolename")
        .in("rolename", [
          "admin",
          "Admin",
          "administrator", 
          "Administrator",
          "superadmin",
          "Superadmin",
        ])

      if (adminRoles && adminRoles.length > 0) {
        isAdmin = adminRoles.some((r: any) => r.roleid === callerProfile.roleid)
      }

      if (!isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: only admin can bulk import users" },
          { status: 403 }
        )
      }
    }

    // Validate that all provided role IDs exist in the system
    const admin = await createAdminClient()
    const { data: validRoles } = await admin
      .from("role")
      .select("roleid")
    
    if (!validRoles) {
      return NextResponse.json(
        { error: "Failed to fetch valid roles" },
        { status: 500 }
      )
    }

    const validRoleIds = validRoles.map(r => r.roleid)
    
    // Filter only valid users (no validation errors)
    const validUsers = users.filter(user => user.errors.length === 0)

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      tempPasswords: []
    }

    // Process each valid user
    for (const user of validUsers) {
      try {
        // Validate roleid exists in database
        const roleIdNum = parseInt(user.roleid)
        if (!validRoleIds.includes(roleIdNum)) {
          result.failed++
          result.errors.push({
            row: user.rowNumber,
            username: user.username,
            error: `Role ID ${user.roleid} tidak valid. Role yang tersedia: ${validRoleIds.join(', ')}`
          })
          continue
        }
        // Use the provided password (already validated in frontend)
        const userPassword = user.password.trim()

        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await admin.auth.admin.createUser({
          email: user.email,
          password: userPassword,
          email_confirm: true, // Auto-confirm email for bulk import
          user_metadata: {
            username: user.username,
            kelas: user.kelas
          }
        })

        if (authError) {
          result.failed++
          result.errors.push({
            row: user.rowNumber,
            username: user.username,
            error: authError.message
          })
          continue
        }

        if (!authUser.user) {
          result.failed++
          result.errors.push({
            row: user.rowNumber,
            username: user.username,
            error: "Failed to create auth user"
          })
          continue
        }

        // Create user profile using upsert to handle any existing profiles
        const { error: profileError } = await admin
          .from("user_profiles")
          .upsert({
            userid: authUser.user.id,
            username: user.username,
            email: user.email,
            roleid: roleIdNum,
            kelas: user.kelas || null, // kelas is optional now
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: "userid"
          })

        if (profileError) {
          // If profile creation fails, cleanup the auth user
          await admin.auth.admin.deleteUser(authUser.user.id)
          
          result.failed++
          result.errors.push({
            row: user.rowNumber,
            username: user.username,
            error: `Profile creation failed: ${profileError.message}`
          })
          continue
        }

        result.success++
        
        // Store password for admin reference (since they provided it)
        result.tempPasswords?.push({
          username: user.username,
          email: user.email,
          password: userPassword
        })
      } catch (error: any) {
        result.failed++
        result.errors.push({
          row: user.rowNumber,
          username: user.username,
          error: error.message || "Unexpected error during user creation"
        })
      }
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Bulk import error:', err)
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}