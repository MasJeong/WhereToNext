export const testIds = {
  query: {
    partyTypeCouple: "party-type-couple",
    partyTypeFriends: "party-type-friends",
    partyTypeFamily: "party-type-family",
    budgetMid: "budget-mid",
    budgetBudget: "budget-budget",
    budgetPremium: "budget-premium",
    tripLength3: "trip-length-3",
    tripLength5: "trip-length-5",
    tripLength8: "trip-length-8",
    travelMonth7: "travel-month-7",
    travelMonth10: "travel-month-10",
    vibeRomance: "vibe-romance",
    vibeFood: "vibe-food",
    vibeNature: "vibe-nature",
    departureAirportICN: "departure-airport-ICN",
    flightToleranceShort: "flight-tolerance-short",
    flightToleranceMedium: "flight-tolerance-medium",
    paceBalanced: "pace-balanced",
    submitRecommendation: "submit-recommendation",
  },
  result: {
    card0: "result-card-0",
    instagramVibe0: "instagram-vibe-0",
    emptyState: "empty-state",
    querySummary: "query-summary",
    showMoreResults: "show-more-results",
    relaxableFilters: "relaxable-filters",
    relaxFilterAction0: "relax-filter-action-0",
  },
  snapshot: {
    saveSnapshot: "save-snapshot",
    compareSnapshot: "compare-snapshot",
    shareLink: "share-link",
    copyShareLink: "copy-share-link",
    savedSnapshot0: "saved-snapshot-0",
    compareSelectionCount: "compare-selection-count",
    stickyCompareTray: "sticky-compare-tray",
    stickyCompareAction: "sticky-compare-action",
  },
  compare: {
    column0: "compare-column-0",
    restoreError: "restore-error",
  },
} as const;

/**
 * Returns a stable result card selector for a given index.
 * @param index Result card index
 * @returns Card test id
 */
export function getResultCardTestId(index: number): string {
  return index === 0 ? testIds.result.card0 : `result-card-${index}`;
}

/**
 * Returns a stable Instagram vibe selector for a given index.
 * @param index Result card index
 * @returns Instagram vibe block test id
 */
export function getInstagramVibeTestId(index: number): string {
  return index === 0 ? testIds.result.instagramVibe0 : `instagram-vibe-${index}`;
}

/**
 * Returns a stable save snapshot selector for a given index.
 * @param index Result card index
 * @returns Save button test id
 */
export function getSaveSnapshotTestId(index: number): string {
  return index === 0 ? testIds.snapshot.saveSnapshot : `save-snapshot-${index}`;
}

/**
 * Returns a stable saved snapshot selector for a given index.
 * @param index Saved snapshot index
 * @returns Saved snapshot test id
 */
export function getSavedSnapshotTestId(index: number): string {
  return index === 0 ? testIds.snapshot.savedSnapshot0 : `saved-snapshot-${index}`;
}

/**
 * Returns a stable compare column selector for a given index.
 * @param index Compare column index
 * @returns Compare column test id
 */
export function getCompareColumnTestId(index: number): string {
  return index === 0 ? testIds.compare.column0 : `compare-column-${index}`;
}

/**
 * Returns a stable empty-state relaxation selector for a given index.
 * @param index Relaxation action index
 * @returns Relaxation action test id
 */
export function getRelaxFilterActionTestId(index: number): string {
  return index === 0 ? testIds.result.relaxFilterAction0 : `relax-filter-action-${index}`;
}
