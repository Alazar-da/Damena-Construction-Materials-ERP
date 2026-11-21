import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function db() {
  const jar = await cookies();
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://placeholder.supabase.co';
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'placeholder-anon-key';

  const url = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  const key = rawKey.trim().replace(/^['"]|['"]$/g, '');

  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {}
      },
    },
  });
}
