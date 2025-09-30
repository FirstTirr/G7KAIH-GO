import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running this script")
}

const client = createClient(supabaseUrl, anonKey)

async function main() {
  const user = await client.auth.getUser()
  if (!user.data.user) {
    console.log("No session. Go to browser, authenticate as student, copy your access token, then run:\n")
    console.log("  ACCESS_TOKEN=... node scripts/debug-student-kegiatan.js <kegiatanid>\n")
    return
  }

  const kegiatanid = process.argv[2]
  if (!kegiatanid) {
    console.error("Usage: node scripts/debug-student-kegiatan.js <kegiatanid>")
    process.exit(1)
  }

  const { data, error } = await client
    .from("kegiatan_categories")
    .select("categoryid")
    .eq("kegiatanid", kegiatanid)

  console.log({ data, error })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
