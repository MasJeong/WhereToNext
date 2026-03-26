import { SnapshotRestoreView } from "@/components/trip-compass/snapshot-restore-view";
import { resolveSnapshotRestorePageData } from "@/lib/trip-compass/route-data";

type SnapshotPageProps = {
  params: Promise<{
    snapshotId: string;
  }>;
};

export default async function SnapshotRestorePage({ params }: SnapshotPageProps) {
  const { snapshotId } = await params;
  const data = await resolveSnapshotRestorePageData(snapshotId);

  return <SnapshotRestoreView data={data} />;
}
