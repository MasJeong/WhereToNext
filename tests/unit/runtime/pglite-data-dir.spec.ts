import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolvePGliteDataDir", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses a stable default directory outside test mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PGLITE_DATA_DIR", "");

    const { resolvePGliteDataDir } = await import("@/lib/db/runtime");

    expect(resolvePGliteDataDir()).toBe(
      `${process.cwd()}/.data/trip-compass`,
    );
  });

  it("converts file URL data dirs to filesystem paths", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PGLITE_DATA_DIR", "file:///tmp/trip-compass-pglite");

    const { resolvePGliteDataDir } = await import("@/lib/db/runtime");

    expect(resolvePGliteDataDir()).toBe("/tmp/trip-compass-pglite");
  });

  it("returns null in test mode so unit tests keep using in-memory pglite", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PGLITE_DATA_DIR", ".data/custom");

    const { resolvePGliteDataDir } = await import("@/lib/db/runtime");

    expect(resolvePGliteDataDir()).toBeNull();
  });
});
