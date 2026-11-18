import { db } from '@/lib/supabase/server';
import MachineryPage from '@/app/machinery/machinery-page';

export const dynamic = 'force-dynamic';

export default async function StaffMachineryPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const client = await db();
  const { data } = await client.from('machinery').select('id,name,category,quantity,status,location,notes,photo_path,created_at,profiles:created_by(display_name)').order('created_at', { ascending: false });
  const machinery = await Promise.all((data ?? []).map(async (item) => ({ ...item, photo_url: item.photo_path ? (await client.storage.from('machinery-photos').createSignedUrl(item.photo_path, 3600)).data?.signedUrl || null : null })));
  return <MachineryPage machinery={machinery} returnTo="/app/machinery" title="የማሽነሪ ክምችት" description="የምርት ማሽኖችን፣ መሳሪያዎችን እና ተሽከርካሪዎችን ይመዝግቡ።" searchParams={await searchParams} />;
}
