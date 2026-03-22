export const testIds = {
  shell: {
    identityCard: "identity-card",
    authCta: "auth-cta",
    accountLink: "account-link",
    personalizedNote: "personalized-note",
    heroStartCta: "hero-start-cta",
    advancedFiltersToggle: "advanced-filters-toggle",
    advancedFiltersPanel: "advanced-filters-panel",
  },
  auth: {
    modeSignIn: "auth-mode-sign-in",
    modeSignUp: "auth-mode-sign-up",
    nameInput: "auth-name-input",
    emailInput: "auth-email-input",
    passwordInput: "auth-password-input",
    submit: "auth-submit",
    error: "auth-error",
  },
  query: {
    intentFirstEurope: "intent-first-europe",
    intentShortFlightCity: "intent-short-flight-city",
    intentCoupleNightView: "intent-couple-night-view",
    intentFamilyReset: "intent-family-reset",
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
    restoreBrief: "restore-brief",
    savedSnapshot0: "saved-snapshot-0",
    compareSelectionCount: "compare-selection-count",
    stickyCompareTray: "sticky-compare-tray",
    stickyCompareAction: "sticky-compare-action",
  },
  compare: {
    column0: "compare-column-0",
    summary: "compare-summary",
    restoreError: "restore-error",
    differencesToggle: "compare-differences-toggle",
    mobilePrev: "compare-mobile-prev",
    mobileNext: "compare-mobile-next",
    verdictRow: "compare-verdict-row",
  },
  account: {
    preferenceRepeat: "preference-repeat",
    preferenceBalanced: "preference-balanced",
    preferenceDiscover: "preference-discover",
    newHistoryDestination: "new-history-destination",
    newHistoryDate: "new-history-date",
    newHistorySubmit: "new-history-submit",
    historyEntry0: "history-entry-0",
    historySave0: "history-save-0",
    historyDelete0: "history-delete-0",
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

/**
 * Returns a stable account history card selector for a given index.
 * @param index History entry index
 * @returns History entry test id
 */
export function getAccountHistoryEntryTestId(index: number): string {
  return index === 0 ? testIds.account.historyEntry0 : `history-entry-${index}`;
}

/**
 * Returns a stable account history save selector for a given index.
 * @param index History entry index
 * @returns Save action test id
 */
export function getAccountHistorySaveTestId(index: number): string {
  return index === 0 ? testIds.account.historySave0 : `history-save-${index}`;
}

/**
 * Returns a stable account history delete selector for a given index.
 * @param index History entry index
 * @returns Delete action test id
 */
export function getAccountHistoryDeleteTestId(index: number): string {
  return index === 0 ? testIds.account.historyDelete0 : `history-delete-${index}`;
}
