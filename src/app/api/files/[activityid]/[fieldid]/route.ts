import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { activityid: string; fieldid: string } }
) {
  try {
    console.log('File API request:', params)
    const supabase = await createClient()
    
    // Get file from aktivitas_field_files table
    const { data: files, error } = await supabase
      .from("aktivitas_field_files")
      .select("filename, content_type, file_bytes")
      .eq("activityid", params.activityid)
      .eq("fieldid", params.fieldid)
      .limit(1)

    console.log('File query result:', { 
      filesCount: files?.length || 0, 
      error: error?.message,
      activityid: params.activityid,
      fieldid: params.fieldid
    })

    if (error) {
      console.error("Error fetching file:", error)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (!files || files.length === 0) {
      console.log("No files found for activityid:", params.activityid, "fieldid:", params.fieldid)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]
    console.log('Serving file:', { 
      filename: file.filename, 
      contentType: file.content_type,
      bytesLength: file.file_bytes?.length || 0
    })
    
    // Return the file as a blob response
    return new NextResponse(file.file_bytes, {
      status: 200,
      headers: {
        'Content-Type': file.content_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.filename || 'file'}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (err: any) {
    console.error("GET /api/files error:", err)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
