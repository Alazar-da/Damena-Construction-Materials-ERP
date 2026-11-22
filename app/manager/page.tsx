import AdminOverview from '@/components/admin-overview';

export const dynamic = 'force-dynamic';

export default async function ManagerOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  return (
    <AdminOverview
      basePath="/manager"
      title="የስራ አስኪያጅ አጠቃላይ እይታ"
      searchParams={searchParams}
    />
  );
}
