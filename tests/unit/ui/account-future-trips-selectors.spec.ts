import { describe, expect, it } from "vitest";

import {
  getAccountFutureTripDeleteTestId,
  getAccountFutureTripEntryTestId,
  getAccountHistoryDeleteTestId,
  getAccountHistoryEntryTestId,
  testIds,
} from "@/lib/test-ids";

describe("account future trip selector contract", () => {
  it("exports stable future trip selectors", () => {
    expect(testIds.account.tabFutureTrips).toBe("account-tab-future-trips");
    expect(testIds.account.futureTripList).toBe("future-trip-list");
    expect(testIds.account.futureTripEntry0).toBe("future-trip-entry-0");
    expect(testIds.account.futureTripDelete0).toBe("future-trip-delete-0");
    expect(testIds.account.futureTripEmptyState).toBe("future-trip-empty-state");
    expect(getAccountFutureTripEntryTestId(0)).toBe("future-trip-entry-0");
    expect(getAccountFutureTripEntryTestId(3)).toBe("future-trip-entry-3");
    expect(getAccountFutureTripDeleteTestId(0)).toBe("future-trip-delete-0");
    expect(getAccountFutureTripDeleteTestId(2)).toBe("future-trip-delete-2");
  });

  it("keeps existing account selectors unchanged", () => {
    expect(testIds.account.tabHistory).toBe("account-tab-history");
    expect(testIds.account.tabSaved).toBe("account-tab-saved");
    expect(testIds.account.tabPreferences).toBe("account-tab-preferences");
    expect(getAccountHistoryEntryTestId(0)).toBe("history-entry-0");
    expect(getAccountHistoryDeleteTestId(0)).toBe("history-delete-0");
  });

  it("keeps future trip selectors unique", () => {
    const selectorValues = [
      testIds.account.tabFutureTrips,
      testIds.account.futureTripList,
      testIds.account.futureTripEntry0,
      testIds.account.futureTripDelete0,
      testIds.account.futureTripEmptyState,
    ];

    expect(new Set(selectorValues).size).toBe(selectorValues.length);
  });
});
