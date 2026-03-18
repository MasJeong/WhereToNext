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
        name: "어디로 갈지 아직 몰라도, 내 여행 조건으로 목적지를 먼저 추려드려요.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "SooGo는 한국 출발 여행자를 위해 일정, 예산, 비행 부담, 분위기를 바탕으로 해외여행 후보를 빠르게 압축하는 발견형 추천 서비스예요. 검색보다 발견, 감성보다 신뢰, 저장 뒤 비교까지 한 흐름으로 이어집니다.",
      ),
    ).toBeInTheDocument();
  });
});
