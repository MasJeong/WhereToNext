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
        name: "누구와 떠나세요?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "지금 추천 보기" })).toBeInTheDocument();
  });
});
