import { beforeEach, describe, expect, it } from "vitest";

import { signUpWithEmailPassword } from "@/lib/auth";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("signUpWithEmailPassword default nickname", () => {
  beforeEach(() => {
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
  });

  it("assigns a random default nickname when the name is omitted", async () => {
    const result = await signUpWithEmailPassword({
      email: "nickname-default@example.com",
      password: "password-1234",
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.user.name).toMatch(/^[가-힣]+[가-힣]+[0-9]{3}$/);
  });
});
