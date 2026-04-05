import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";

import { account, recommendationSnapshots, user } from "@/lib/db/schema";

describe("auth account schema", () => {
  it("allows nullable user email while keeping provider identity uniqueness", () => {
    const userColumns = getTableColumns(user);
    const accountColumns = getTableColumns(account);
    const accountConfig = getTableConfig(account);

    expect(userColumns.email.notNull).toBe(false);
    expect(accountColumns.providerEmail).toBeDefined();
    expect(accountColumns.providerEmailVerified).toBeDefined();
    expect(accountColumns.lastLoginAt).toBeDefined();

    const uniqueConstraintNames = accountConfig.indexes.map((index) => index.config.name);
    expect(uniqueConstraintNames).toContain("account_provider_account_unique");
    expect(uniqueConstraintNames).toContain("account_user_provider_unique");
  });

  it("adds snapshot ownership and visibility columns", () => {
    const snapshotColumns = getTableColumns(recommendationSnapshots);

    expect(snapshotColumns.visibility).toBeDefined();
    expect(snapshotColumns.ownerUserId).toBeDefined();
  });
});
