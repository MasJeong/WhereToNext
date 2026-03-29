export const testIds = {
  shell: {
    header: "app-header",
    identityCard: "identity-card",
    authCta: "auth-cta",
    accountLink: "account-link",
    personalizedNote: "personalized-note",
  },
  home: {
    landing: "home-landing",
    searchEntry: "home-search-entry",
    cta: "home-cta",
    heroVisual: "home-hero-visual",
    resultPage: "home-result-page",
    progress: "home-step-progress",
    question: "home-step-question",
    helper: "home-step-helper",
    browseStrip: "home-browse-strip",
    searchTrigger: "home-search-trigger",
    choice0: "home-step-choice-0",
    choice1: "home-step-choice-1",
    choice2: "home-step-choice-2",
    choice3: "home-step-choice-3",
    next: "home-step-next",
    previous: "home-step-prev",
    topSummary: "home-top-summary",
  },
  auth: {
    modeSignIn: "auth-mode-sign-in",
    modeSignUp: "auth-mode-sign-up",
    nameInput: "auth-name-input",
    emailInput: "auth-email-input",
    passwordInput: "auth-password-input",
    submit: "auth-submit",
    error: "auth-error",
    providerKakao: "auth-provider-kakao",
    providerGoogle: "auth-provider-google",
    providerApple: "auth-provider-apple",
    returnBanner: "auth-return-banner",
    collisionError: "auth-collision-error",
  },
  query: {
    submitRecommendation: "submit-recommendation",
  },
  result: {
    card0: "result-card-0",
    futureTripCta0: "future-trip-cta-0",
    filterBar: "result-filter-bar",
    filterChip0: "result-filter-chip-0",
    instagramVibe0: "instagram-vibe-0",
    emptyState: "empty-state",
    querySummary: "query-summary",
    topList: "result-top-list",
    topItem0: "result-top-item-0",
    showMoreResults: "show-more-results",
    relaxableFilters: "relaxable-filters",
    relaxFilterAction0: "relax-filter-action-0",
  },
  socialVideo: {
    block: "social-video-block",
    thumbnail: "social-video-thumbnail",
    title: "social-video-title",
    link: "social-video-link",
    fallbackBlock: "social-video-fallback",
    fallbackLink0: "social-video-fallback-link-0",
  },
  detail: {
    root: "destination-detail-root",
    coreFacts: "destination-core-facts",
    travelSupport: "destination-travel-support",
    fitReason: "destination-fit-reason",
    evidence: "destination-evidence",
    watchOuts: "destination-watch-outs",
    itineraryCta: "destination-itinerary-cta",
    tasteLogger: "destination-taste-logger",
    tasteRating: "destination-taste-rating",
    tasteTag0: "destination-taste-tag-0",
    tasteRevisit: "destination-taste-revisit",
    tasteDate: "destination-taste-date",
    tasteSubmit: "destination-taste-submit",
    tasteLoginCta: "destination-taste-login-cta",
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
    root: "my-taste-root",
    tabHistory: "account-tab-history",
    tabFutureTrips: "account-tab-future-trips",
    tabSaved: "account-tab-saved",
    tabPreferences: "account-tab-preferences",
    tasteMode: "my-taste-mode",
    tasteSummary: "my-taste-summary",
    addHistoryCta: "add-history-cta",
    preferenceRepeat: "preference-repeat",
    preferenceBalanced: "preference-balanced",
    preferenceDiscover: "preference-discover",
    newHistoryDestinationSearch: "new-history-destination-search",
    newHistoryDestinationResult0: "new-history-destination-result-0",
    newHistoryDate: "new-history-date",
    newHistoryBack: "new-history-back",
    newHistoryNext: "new-history-next",
    newHistoryStep: "new-history-step",
    newHistoryImageInput: "new-history-image-input",
    newHistoryImagePreview: "new-history-image-preview",
    newHistoryMemo: "new-history-memo",
    newHistorySubmit: "new-history-submit",
    historyEntry0: "history-entry-0",
    historySave0: "history-save-0",
    historyEdit0: "history-edit-0",
    historyDelete0: "history-delete-0",
    futureTripList: "future-trip-list",
    futureTripEntry0: "future-trip-entry-0",
    futureTripDelete0: "future-trip-delete-0",
    futureTripEmptyState: "future-trip-empty-state",
    savedPlan0: "saved-plan-0",
  },
} as const;

export function getHomeChoiceTestId(index: number): string {
  return `home-step-choice-${index}`;
}

/**
 * Returns a stable result card selector for a given index.
 * @param index Result card index
 * @returns Card test id
 */
export function getResultCardTestId(index: number): string {
  return index === 0 ? testIds.result.card0 : `result-card-${index}`;
}

export function getFutureTripCtaTestId(index: number): string {
  return index === 0 ? testIds.result.futureTripCta0 : `future-trip-cta-${index}`;
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

export function getResultTopItemTestId(index: number): string {
  return index === 0 ? testIds.result.topItem0 : `result-top-item-${index}`;
}

export function getResultFilterChipTestId(index: number): string {
  return index === 0 ? testIds.result.filterChip0 : `result-filter-chip-${index}`;
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

/**
 * Returns a stable account history edit selector for a given index.
 * @param index 여행 기록 카드 인덱스
 * @returns 수정 버튼 test id
 */
export function getAccountHistoryEditTestId(index: number): string {
  return index === 0 ? testIds.account.historyEdit0 : `history-edit-${index}`;
}

export function getAccountHistoryDestinationResultTestId(index: number): string {
  return index === 0
    ? testIds.account.newHistoryDestinationResult0
    : `new-history-destination-result-${index}`;
}

export function getAccountFutureTripEntryTestId(index: number): string {
  return index === 0 ? testIds.account.futureTripEntry0 : `future-trip-entry-${index}`;
}

export function getAccountFutureTripDeleteTestId(index: number): string {
  return index === 0 ? testIds.account.futureTripDelete0 : `future-trip-delete-${index}`;
}

export function getSavedSnapshotPlanTestId(index: number): string {
  return index === 0 ? testIds.account.savedPlan0 : `saved-plan-${index}`;
}

export function getDestinationTasteTagTestId(index: number): string {
  return index === 0 ? testIds.detail.tasteTag0 : `destination-taste-tag-${index}`;
}
