import AdminOverview from '@/components/admin-overview';

export const dynamic = 'force-dynamic';

export default function StaffOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  return (
    <AdminOverview
      basePath="/app"
      title="የአስተዳዳሪ አጠቃላይ እይታ"
      searchParams={searchParams}
    />
  );
}
