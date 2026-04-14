import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthExperience } from "@/components/trip-compass/auth-experience";
import { testIds } from "@/lib/test-ids";

const mockSearchParamsGet = vi.fn<(key: string) => string | null>();

const storage = (() => {
  let values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => {
      values = new Map<string, string>();
    },
  };
})();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/auth",
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: null,
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}));

describe("AuthExperience", () => {
  beforeEach(() => {
    mockSearchParamsGet.mockReset();
    vi.stubGlobal("localStorage", storage);
    storage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders only social providers and an optional browsing message", () => {
    mockSearchParamsGet.mockImplementation((key) => {
      if (key === "next") {
        return "/results";
      }
      if (key === "intent") {
        return "save";
      }
      return null;
    });

    render(<AuthExperience />);

    expect(screen.getByText("추천 결과를 저장할까요?")).toBeInTheDocument();
    expect(screen.getByTestId(testIds.auth.providerKakao)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.auth.providerGoogle)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.auth.providerApple)).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.auth.emailInput)).not.toBeInTheDocument();
    expect(screen.queryByTestId(testIds.auth.passwordInput)).not.toBeInTheDocument();
    expect(screen.getByText("로그인 없이 계속 보기")).toBeInTheDocument();
  });

  it("highlights the previous login method button on provider mismatch", () => {
    mockSearchParamsGet.mockImplementation((key) => {
      if (key === "error") {
        return "ACCOUNT_COLLISION";
      }
      if (key === "existingProvider") {
        return "kakao";
      }
      if (key === "attemptedProvider") {
        return "google";
      }
      return null;
    });

    render(<AuthExperience />);

    const kakaoButton = screen.getByTestId(testIds.auth.providerKakao);
    expect(kakaoButton).toHaveAttribute("aria-describedby", "kakao-provider-hint");
    expect(screen.getByText("이 계정에 맞는 로그인 방식")).toBeInTheDocument();
  });

  it("highlights the last used provider button on the auth screen", async () => {
    mockSearchParamsGet.mockReturnValue(null);
    window.localStorage.setItem("last-auth-provider", "google");

    render(<AuthExperience />);

    await waitFor(() => {
      const googleButton = screen.getByTestId(testIds.auth.providerGoogle);
      expect(googleButton).toHaveAttribute("aria-describedby", "google-provider-hint");
      expect(screen.getByText("지난번에 사용한 방식")).toBeInTheDocument();
    });
  });

  it("remembers the provider the user clicks", () => {
    mockSearchParamsGet.mockReturnValue(null);

    render(<AuthExperience />);
    fireEvent.click(screen.getByTestId(testIds.auth.providerKakao));

    expect(window.localStorage.getItem("last-auth-provider")).toBe("kakao");
  });
});
