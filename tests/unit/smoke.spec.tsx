import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Home", () => {
  it("renders a landing-first funnel and hides results until the journey starts", () => {
    render(<Home />);

    const landing = screen.getByTestId("home-landing");
    const landingScope = within(landing);

    expect(
      landingScope.getByRole("heading", {
        name: /여행지, 바로 추천받기/,
      }),
    ).toBeInTheDocument();
    expect(landingScope.getByTestId("home-hero-visual")).toBeInTheDocument();
    expect(landingScope.getByRole("button", { name: "추천 여정 시작하기" })).toBeInTheDocument();

    expect(screen.queryByTestId("home-step-question")).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-result-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-card-0")).not.toBeInTheDocument();
  });
});
