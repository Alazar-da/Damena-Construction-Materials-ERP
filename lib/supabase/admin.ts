import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';

  const url = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  const key = rawKey.trim().replace(/^['"]|['"]$/g, '');

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
