import AdminOverview from '@/components/admin-overview';

export const dynamic = 'force-dynamic';

export default function OwnerPortal({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  return (
    <AdminOverview
      basePath="/owner"
      title="የባለቤት አጠቃላይ እይታ"
      searchParams={searchParams}
    />
  );
}
