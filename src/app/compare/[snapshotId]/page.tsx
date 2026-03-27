import { CompareRestoreView } from "@/components/trip-compass/compare-restore-view";
import { resolveCompareRestorePageData } from "@/lib/trip-compass/route-data";

type ComparePageProps = {
  params: Promise<{
    snapshotId: string;
  }>;
};

/**
 * Restores and renders a saved comparison snapshot without login.
 * @param props Dynamic route params
 * @returns Compare snapshot page
 */
export default async function CompareSnapshotPage({ params }: ComparePageProps) {
  const { snapshotId } = await params;
  const data = await resolveCompareRestorePageData(snapshotId);

  return <CompareRestoreView data={data} />;
}
