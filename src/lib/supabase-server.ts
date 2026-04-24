import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Lazy-initialized Supabase server client with service role key.
 * Used by API routes for admin operations that bypass RLS.
 * No cookie handling needed since service role bypasses auth.
 *
 * We use a Proxy to delay `createClient` until the first actual property access.
 * This prevents build-time crashes when env vars are missing during `next build`.
 */
let _supabaseServer: ReturnType<typeof createClient> | null = null;

function getSupabaseServer() {
  if (!_supabaseServer) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    _supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseServer;
}

export const supabaseServer = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getSupabaseServer();
    const value = client[prop as keyof ReturnType<typeof createClient>];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export type SupabaseServerClient = ReturnType<typeof createClient>;

/**
 * Create a Supabase server client with proper cookie handling.
 * Use this in server components and layouts that need session access.
 * Respects RLS policies since it uses the anon key.
 */
export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // This can fail in server components where cookies can't be set
        }
      },
    },
  });
}
