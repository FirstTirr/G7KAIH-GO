import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type SubmissionWindowRow = {
  is_open: boolean
  updated_at: string | null
  updated_by: string | null
}

type ProfileRow = {
  userid: string
  username: string | null
  role?: { rolename: string | null } | null
}

async function getCurrentRoleName(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, roleName: null }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("userid, roleid, role:roleid(rolename)")
    .eq("userid", user.id)
    .maybeSingle()

  let roleName: string | null = null
  const linkedRole = (profile as any)?.role
  if (linkedRole) {
    if (Array.isArray(linkedRole)) {
      roleName = linkedRole[0]?.rolename ?? null
    } else {
      roleName = linkedRole.rolename ?? null
    }
  }

  return { user, roleName }
}

async function fetchState(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("submission_window")
    .select("is_open, updated_at, updated_by")
    .eq("id", 1)
    .maybeSingle<SubmissionWindowRow>()

  if (error && error.code !== "PGRST116") throw error

  let updater: ProfileRow | null = null
  if (data?.updated_by) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("userid, username, role:roleid(rolename)")
      .eq("userid", data.updated_by)
      .maybeSingle()
    if (profile) {
      const role = (profile as any)?.role
      updater = {
        userid: profile.userid,
        username: profile.username,
        role: Array.isArray(role) ? role[0] ?? null : role ?? null,
      }
    }
  }

  return {
    open: data?.is_open ?? false,
    updatedAt: data?.updated_at ?? null,
    updatedBy: updater,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const payload = await fetchState(supabase)
    return NextResponse.json({ data: payload })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { user, roleName } = await getCurrentRoleName(supabase)

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }

    if (roleName !== "admin") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as { open?: boolean }
    if (typeof body.open !== "boolean") {
      return NextResponse.json({ error: "Parameter 'open' wajib bertipe boolean" }, { status: 400 })
    }

    const { error } = await supabase
      .from("submission_window")
      .update({ is_open: body.open })
      .eq("id", 1)

    if (error) throw error

    const payload = await fetchState(supabase)
    return NextResponse.json({ data: payload })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 })
  }
}
