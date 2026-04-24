import { createBrowserClient } from '@supabase/ssr';

const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zOn0U6HWMiINle9g7IshIw_bOOYNtRm';

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Lazy-initialized browser Supabase client.
 * Delays `createBrowserClient` until first property access to avoid build-time
 * crashes when env vars are missing during `next build`.
 */
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseBrowserClient() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    _supabase = isSupabaseConfigured
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return _supabase;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    const client = getSupabaseBrowserClient();
    const value = client[prop as keyof ReturnType<typeof createBrowserClient>];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export { supabasePublishableKey };

export type SupabaseClient = ReturnType<typeof createBrowserClient>;
