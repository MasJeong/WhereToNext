import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthExperience } from "@/components/trip-compass/auth-experience";

const mockSearchParamsGet = vi.fn<(key: string) => string | null>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

describe("AuthExperience", () => {
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

    expect(screen.getByTestId("auth-return-banner")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider-kakao")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider-google")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider-apple")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-email-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-password-input")).not.toBeInTheDocument();
    expect(screen.getByText("로그인 없이 계속 보기")).toBeInTheDocument();
  });

  it("maps collision errors to safe Korean copy", () => {
    mockSearchParamsGet.mockImplementation((key) => {
      if (key === "error") {
        return "ACCOUNT_COLLISION";
      }
      return null;
    });

    render(<AuthExperience />);

    expect(screen.getByTestId("auth-collision-error")).toHaveTextContent(
      "이미 다른 로그인 방식으로 이어진 계정이에요. 이전에 쓰던 방식으로 다시 로그인해 주세요.",
    );
  });
});
