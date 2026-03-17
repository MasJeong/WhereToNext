import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Home", () => {
  it("renders the Trip Compass smoke shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "한국에서 떠나는 해외여행, 취향에 맞는 목적지를 빠르게 골라보세요.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Trip Compass")).toBeInTheDocument();
  });
});
