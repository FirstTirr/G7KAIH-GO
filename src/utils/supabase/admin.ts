import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// WARNING: Only use this on the server. Do not expose the service role key to the client.
export async function createAdminClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      // Do not attempt to set cookies when using the service role
      setAll() {
        /* no-op for admin client */
      },
    },
  })
}
