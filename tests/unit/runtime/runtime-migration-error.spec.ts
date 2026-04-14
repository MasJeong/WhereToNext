import { describe, expect, it } from "vitest";

import { isIgnorablePostgresMigrationError } from "@/lib/db/runtime";

describe("isIgnorablePostgresMigrationError", () => {
  it("returns true for duplicate postgres object errors", () => {
    expect(isIgnorablePostgresMigrationError({ code: "42710", message: 'type "history_visibility" already exists' })).toBe(true);
    expect(isIgnorablePostgresMigrationError({ code: "42P07", message: 'relation "community_comments" already exists' })).toBe(true);
    expect(isIgnorablePostgresMigrationError({ code: "42701", message: 'column "visibility" of relation "user_destination_history" already exists' })).toBe(true);
    expect(
      isIgnorablePostgresMigrationError({
        message: 'Failed query: CREATE TYPE "public"."history_visibility" AS ENUM(\'public\', \'private\');',
        cause: { code: "42710", message: 'type "history_visibility" already exists' },
      }),
    ).toBe(true);
  });

  it("returns false for unrelated runtime errors", () => {
    expect(isIgnorablePostgresMigrationError({ code: "23503", message: "insert or update violates foreign key constraint" })).toBe(false);
    expect(isIgnorablePostgresMigrationError(new Error("connection terminated unexpectedly"))).toBe(false);
    expect(isIgnorablePostgresMigrationError(null)).toBe(false);
  });
});
