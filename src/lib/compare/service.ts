import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { readRecommendationSnapshots } from "@/lib/snapshots/service";

/**
 * 비교 스냅샷 ID 목록을 검증한다.
 * @param snapshotIds 비교 대상 스냅샷 목록
 * @returns 검증된 ID 목록
 */
function assertComparisonBounds(snapshotIds: string[]) {
  if (snapshotIds.length < 2 || snapshotIds.length > 4) {
    throw new Error("COMPARE_SNAPSHOT_BOUNDS");
  }
}

/**
 * 추천 스냅샷들을 목적지 비교 행으로 변환한다.
 * @param snapshotIds 비교할 스냅샷 ID 목록
 * @returns 비교 매트릭스 행 목록
 */
export async function resolveComparisonMatrix(snapshotIds: string[]) {
  assertComparisonBounds(snapshotIds);

  const snapshots = await readRecommendationSnapshots(snapshotIds);
  if (snapshots.length !== snapshotIds.length) {
    throw new Error("COMPARE_SNAPSHOT_NOT_FOUND");
  }

  return snapshots.map((snapshot) => {
    const topDestination = launchCatalog.find((destination) => destination.id === snapshot.payload.destinationIds[0]);
    if (!topDestination) {
      throw new Error("COMPARE_DESTINATION_NOT_FOUND");
    }

    return {
      snapshotId: snapshot.id,
      destinationId: topDestination.id,
      destinationNameKo: topDestination.nameKo,
      budget: topDestination.budgetBand,
      flight: topDestination.flightBand,
      bestMonths: topDestination.bestMonths,
      vibes: topDestination.vibeTags,
      whyThisFits: topDestination.summary,
      watchOuts: topDestination.watchOuts,
      instagramVibeSummary: snapshot.payload.trendSnapshotIds,
    };
  });
}
