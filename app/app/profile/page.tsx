import { db } from '@/lib/supabase/server';
import ProfilePage from '@/app/profile/profile-page';

export const dynamic = 'force-dynamic';

export default async function StaffProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const client = await db();
  const { data: { user } } = await client.auth.getUser();
  const { data: profile } = await client.from('profiles').select('display_name').eq('id', user?.id || '').maybeSingle();
  return <ProfilePage backHref="/app" profilePath="/app/profile" user={user || {}} profile={profile} searchParams={await searchParams} />;
}
