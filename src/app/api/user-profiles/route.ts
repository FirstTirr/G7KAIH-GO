import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get("page") || 1))
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") || 10)))
  const roleidParam = url.searchParams.get("roleid")
  const excludeRoleParam = url.searchParams.get("excludeRole")
  const q = url.searchParams.get("q")?.trim()

    const supabase = await createClient()
    let query = supabase
      .from("user_profiles")
      .select(
        "userid, username, email, roleid, kelas, parent_of_userid, created_at, updated_at",
        { count: "exact" }
      )

    if (roleidParam !== null) {
      const rid = Number(roleidParam)
      if (!Number.isNaN(rid)) query = query.eq("roleid", rid)
    }
    if (excludeRoleParam !== null) {
      const ex = Number(excludeRoleParam)
      if (!Number.isNaN(ex)) query = query.neq("roleid", ex)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    if (q) {
      const like = `%${q}%`
      const parts = [
        `username.ilike.${like}`,
        `email.ilike.${like}`,
        `kelas.ilike.${like}`,
      ]
      // If q looks like a UUID, match exact userid
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q)
      if (isUuid) parts.push(`userid.eq.${q}`)

      // Also allow searching by role name (map role names -> role IDs)
      const { data: rolesMatch } = await supabase
        .from("role")
        .select("roleid")
        .ilike("rolename", like)
      const roleIds = (rolesMatch || []).map((r: any) => r.roleid).filter((n: any) => typeof n === "number")
      if (roleIds.length > 0) {
        parts.push(`roleid.in.(${roleIds.join(",")})`)
      }

      query = query.or(parts.join(","))
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error
    return NextResponse.json({ data, page, pageSize, total: count ?? 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
  const { username, email, roleid, kelas, userid: bodyUserid } = body ?? {}

  if (!username || typeof roleid === "undefined") {
      return NextResponse.json(
        { error: "username and roleid are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    // Resolve userid: prefer provided value, else current authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const finalUserid = bodyUserid ?? user?.id
    if (!finalUserid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        { userid: finalUserid, username, email, roleid, kelas },
        { onConflict: "userid" }
      )
      .select("userid, username, email, roleid, kelas, created_at, updated_at")
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unexpected error", code: (error as any).code },
        { status: 500 }
      )
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 })
  }
}
