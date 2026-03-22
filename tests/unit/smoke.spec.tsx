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
        name: "이번 여행, 누구와 떠나나요?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "커플 기준으로 바로 추천 받기" })).toBeInTheDocument();
  });
});
