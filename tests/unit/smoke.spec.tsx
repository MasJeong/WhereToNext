import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Home", () => {
  it("renders the SooGo smoke shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "조건만 고르면 추천이 시작돼요.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이 조건으로 여행지 추천 받기" })).toBeInTheDocument();
  });
});
