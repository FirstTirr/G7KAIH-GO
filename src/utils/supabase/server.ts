// Minimal server-side Supabase shim for migration.
// The goal: provide a `.from(table).select(...).order(...)` fluent API
// that returns { data, error } and proxies to the Go backend REST endpoints.

type QueryResult<T = any> = Promise<{ data: T | null; error: Error | null }>

function mapTableToEndpoint(table: string) {
  // basic mapping - extend as needed
  const m: Record<string, string> = {
    role: '/api/v1/roles',
    category: '/api/v1/categories',
    kegiatan: '/api/v1/kegiatan',
    komentar: '/api/v1/comments',
    'user_profiles': '/api/v1/admin/users',
    files: '/api/v1/files',
  }
  return m[table] ?? `/api/v1/${table}`
}

export async function createClient() {
  return {
    from(table: string) {
      const endpoint = mapTableToEndpoint(table)

      // internal state for query building
      const state: any = {
        filters: [] as string[],
        selectFields: undefined as string | undefined,
        orderBy: undefined as { col: string; opts?: any } | undefined,
        range: undefined as { from: number; to: number } | undefined,
        orExpr: undefined as string | undefined,
      }

      function buildUrl() {
        const url = new URL((process.env.NEXT_PUBLIC_API_URL || '') + endpoint)
        if (state.selectFields) url.searchParams.set('select', state.selectFields)
        if (state.filters.length > 0) url.searchParams.set('filters', state.filters.join(','))
        if (state.orExpr) url.searchParams.set('or', state.orExpr)
        if (state.orderBy) url.searchParams.set('order', JSON.stringify(state.orderBy))
        if (state.range) url.searchParams.set('range', `${state.range.from}-${state.range.to}`)
        return url.toString()
      }

      const qb: any = {
        select(fields?: string, _opts?: any) {
          if (fields) state.selectFields = fields
          return qb
        },

        eq(col: string, val: any) {
          state.filters.push(`${col}.eq.${val}`)
          return qb
        },

        neq(col: string, val: any) {
          state.filters.push(`${col}.neq.${val}`)
          return qb
        },

        ilike(col: string, pattern: string) {
          state.filters.push(`${col}.ilike.${pattern}`)
          return qb
        },

        in(col: string, list: any[]) {
          state.filters.push(`${col}.in.(${list.join(',')})`)
          return qb
        },

        or(expr: string) {
          state.orExpr = expr
          return qb
        },

        order(col: string, opts?: any) {
          state.orderBy = { col, opts }
          return qb
        },

        range(from: number, to: number) {
          state.range = { from, to }
          return qb
        },

        async single() {
          try {
            const url = buildUrl()
            const res = await fetch(url, { cache: 'no-store' })
            if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
            const json = await res.json()
            // Expect backend to return object or { data } shape; normalize
            const data = Array.isArray(json) ? json[0] ?? null : json?.data ?? json
            return { data, error: null }
          } catch (err: any) {
            return { data: null, error: err }
          }
        },

        async maybeSingle() {
          try {
            const url = buildUrl()
            const res = await fetch(url, { cache: 'no-store' })
            if (!res.ok) return { data: null, error: null }
            const json = await res.json()
            const data = Array.isArray(json) ? json[0] ?? null : json?.data ?? json
            return { data, error: null }
          } catch (err: any) {
            return { data: null, error: err }
          }
        },

        

        // terminal execution used in many routes: await query.order(...).range(...)
        async then(onFulfilled: any, onRejected: any) {
          // allow promises to work by executing range without explicit call
          try {
            const url = buildUrl()
            const res = await fetch(url, { cache: 'no-store' })
            if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
            const json = await res.json()
            const data = json?.data ?? json
            return onFulfilled ? onFulfilled({ data, error: null }) : { data, error: null }
          } catch (err: any) {
            return onRejected ? onRejected(err) : { data: null, error: err }
          }
        },

        // insert/upsert/update/delete proxied to POST/PUT/DELETE
        async insert(payload: any) {
          try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
            const data = await res.json()
            return { data, error: null }
          } catch (err: any) {
            return { data: null, error: err }
          }
        },

        upsert(payload: any, _opts?: any) {
          // For upsert we perform a POST to endpoint + '/upsert' if backend supports it,
          // otherwise post to endpoint and let backend handle onConflict.
          qb._upsertPayload = payload
          qb._upsertOpts = _opts
          return {
            select: (fields?: string) => ({
              single: async () => {
                try {
                  const url = (process.env.NEXT_PUBLIC_API_URL || '') + endpoint
                  const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(qb._upsertPayload),
                  })
                  if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
                  const json = await res.json()
                  const data = json?.data ?? json
                  return { data, error: null }
                } catch (err: any) {
                  return { data: null, error: err }
                }
              },
            }),
          }
        },

        async update(payload: any) {
          try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + endpoint, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
            const data = await res.json()
            return { data, error: null }
          } catch (err: any) {
            return { data: null, error: err }
          }
        },

        async delete() {
          try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + endpoint, {
              method: 'DELETE',
            })
            if (!res.ok) throw new Error(`Upstream error: ${res.status}`)
            const data = await res.json()
            return { data, error: null }
          } catch (err: any) {
            return { data: null, error: err }
          }
        },
      }

      return qb
    },

    // minimal auth API for server-side routes that call supabase.auth.getUser()
    auth: {
      async getUser() {
        try {
          // Read the auth-token cookie from Next server-side environment and forward it
          // as a Bearer token to the Go backend so /auth/me can validate it.
          // Use next/headers cookies() which is available in server components and routes.
          try {
            // dynamic import to avoid runtime errors in non-Next environments
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const { cookies } = await import('next/headers')
            // cookies() may return a ReadonlyRequestCookies or a promise-like value in some runtimes.
            // Use `any` and await if thenable to be robust across environments.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            let cookieStoreAny: any = cookies()
            if (cookieStoreAny && typeof cookieStoreAny.then === 'function') cookieStoreAny = await cookieStoreAny
            const authCookie = cookieStoreAny?.get ? cookieStoreAny.get('auth-token') : undefined
            const headers: Record<string, string> = {}
            if (authCookie?.value) headers['Authorization'] = `Bearer ${authCookie.value}`

            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/auth/me', { cache: 'no-store', headers })
            if (!res.ok) return { data: { user: null }, error: new Error('not authenticated') }
            const data = await res.json()
            return { data: { user: data }, error: null }
          } catch (innerErr) {
            // Fallback: try calling backend without forwarding cookie
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/auth/me', { cache: 'no-store' })
            if (!res.ok) return { data: { user: null }, error: new Error('not authenticated') }
            const data = await res.json()
            return { data: { user: data }, error: null }
          }
        } catch (err: any) {
          return { data: { user: null }, error: err }
        }
      },
    },
  }
}

export default createClient
