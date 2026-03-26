import { afterEach, describe, expect, it } from "vitest";

import { buildApiUrl, buildPublicUrl } from "../../../src/lib/runtime/url";

const originalAppOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;
const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, "window");
}

afterEach(() => {
  if (originalAppOrigin === undefined) {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_APP_ORIGIN");
  } else {
    Reflect.set(process.env, "NEXT_PUBLIC_APP_ORIGIN", originalAppOrigin);
  }

  if (originalApiBaseUrl === undefined) {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_API_BASE_URL");
  } else {
    Reflect.set(process.env, "NEXT_PUBLIC_API_BASE_URL", originalApiBaseUrl);
  }

  if (originalNodeEnv === undefined) {
    Reflect.deleteProperty(process.env, "NODE_ENV");
  } else {
    Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
  }

  restoreWindow();
});

describe("runtime url helpers", () => {
  it("builds canonical public URLs from NEXT_PUBLIC_APP_ORIGIN", () => {
    Reflect.set(process.env, "NEXT_PUBLIC_APP_ORIGIN", "https://example.com/");

    expect(buildPublicUrl("/s/demo-id")).toBe("https://example.com/s/demo-id");
  });

  it("falls back to window.location.origin in local browser development", () => {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_APP_ORIGIN");
    Reflect.set(process.env, "NODE_ENV", "development");

    expect(buildPublicUrl("/destinations/tokyo-japan")).toBe(
      `${window.location.origin}/destinations/tokyo-japan`,
    );
  });

  it("throws a clear error when no public origin exists outside the browser fallback", () => {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_APP_ORIGIN");
    Reflect.set(process.env, "NODE_ENV", "production");
    Reflect.deleteProperty(globalThis, "window");

    expect(() => buildPublicUrl("/s/demo-id")).toThrow(
      "NEXT_PUBLIC_APP_ORIGIN is required outside local dev/test browser runtime.",
    );
  });

  it("keeps relative API paths on normal web when no api base is configured", () => {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_API_BASE_URL");

    expect(buildApiUrl("/api/recommendations")).toBe("/api/recommendations");
  });

  it("builds absolute API URLs when NEXT_PUBLIC_API_BASE_URL is set", () => {
    Reflect.set(process.env, "NEXT_PUBLIC_API_BASE_URL", "https://api.example.com/");

    expect(buildApiUrl("/api/snapshots")).toBe("https://api.example.com/api/snapshots");
  });
});
