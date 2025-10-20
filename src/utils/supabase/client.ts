// Lightweight shim to satisfy existing imports while migrating off Supabase.
// Components import `createClient()` and call `supabase.auth.signOut()` or
// `supabase.auth.signInWithOAuth(...)`. This file provides a minimal API that
// delegates to the backend or returns safe defaults.

export function createClient() {
  return {
    auth: {
      // signOut -> call backend logout endpoint (if exists) or no-op
      signOut: async () => {
        try {
          const res = await fetch('/api/auth/logout', { method: 'POST' })
          if (!res.ok) return { error: new Error('logout failed') }
          return { error: null }
        } catch (err) {
          return { error: err }
        }
      },

      // signInWithOAuth -> redirect the browser to backend OAuth if configured
      signInWithOAuth: async ({ provider, options }: { provider: string; options?: any }) => {
        // If a redirectTo option is provided, just navigate there from the client
        if (options?.redirectTo) {
          // In Next client components this will trigger a navigation
          if (typeof window !== 'undefined') {
            window.location.href = options.redirectTo
            return { data: null, error: null }
          }
        }

        // Otherwise return a not-implemented error object
        return { data: null, error: new Error('OAuth not configured in shim') }
      },

      // onAuthStateChange stub - no-op for now
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        // no-op; return unsubscribe function
        return { data: null, error: null, unsubscribe: () => {} }
      },
    },
  }
}

export default createClient
