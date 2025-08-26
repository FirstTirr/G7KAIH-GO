import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("category")
      .select("categoryid, categoryname")
      .order("categoryname", { ascending: true })
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { categoryname } = (await request.json()) as {
      categoryname?: string
    }
    if (!categoryname || !categoryname.trim()) {
      return NextResponse.json(
        { error: "categoryname is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    // Check duplicate by exact name to avoid spam inserts
    const name = categoryname.trim()
    const { data: existsData, error: existsErr } = await supabase
      .from("category")
      .select("categoryid")
      .eq("categoryname", name)
      .limit(1)
    if (existsErr) throw existsErr
    if (Array.isArray(existsData) && existsData.length > 0) {
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 })
    }
    const { data, error } = await supabase
      .from("category")
      .insert({ categoryname: name })
      .select("categoryid, categoryname")
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    )
  }
}
