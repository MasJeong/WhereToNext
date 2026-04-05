import { describe, expect, it } from "vitest";

import {
  SHELL_ABSOLUTE_TTL_SECONDS,
  SHELL_IDLE_TTL_SECONDS,
  WEB_ABSOLUTE_TTL_SECONDS,
  WEB_IDLE_TTL_SECONDS,
  classifyClientTypeForSessionIssuance,
  getSessionPolicyForClientType,
} from "@/lib/auth";

describe("session lifetime policy", () => {
  it("freezes TTL constants", () => {
    expect(WEB_IDLE_TTL_SECONDS).toBe(60 * 60 * 24 * 14);
    expect(WEB_ABSOLUTE_TTL_SECONDS).toBe(60 * 60 * 24 * 90);
    expect(SHELL_IDLE_TTL_SECONDS).toBe(60 * 60 * 24 * 30);
    expect(SHELL_ABSOLUTE_TTL_SECONDS).toBe(60 * 60 * 24 * 180);
  });

  it("defaults issuance-time client classification to web when missing or ambiguous", () => {
    expect(classifyClientTypeForSessionIssuance()).toBe("web");
    expect(classifyClientTypeForSessionIssuance({ clientType: undefined })).toBe("web");
    expect(classifyClientTypeForSessionIssuance({ clientType: "ios-shell" })).toBe("web");
    expect(classifyClientTypeForSessionIssuance({ clientType: "totally-not-a-client" })).toBe("web");
  });

  it("classifies ios-shell only through an explicit issuance path", () => {
    expect(
      classifyClientTypeForSessionIssuance({
        clientType: "ios-shell",
        allowIosShell: true,
      }),
    ).toBe("ios-shell");
  });

  it("maps policy by immutable client type", () => {
    expect(getSessionPolicyForClientType("web")).toEqual({
      idleTtlSeconds: WEB_IDLE_TTL_SECONDS,
      absoluteTtlSeconds: WEB_ABSOLUTE_TTL_SECONDS,
    });
    expect(getSessionPolicyForClientType("ios-shell")).toEqual({
      idleTtlSeconds: SHELL_IDLE_TTL_SECONDS,
      absoluteTtlSeconds: SHELL_ABSOLUTE_TTL_SECONDS,
    });
  });
});
