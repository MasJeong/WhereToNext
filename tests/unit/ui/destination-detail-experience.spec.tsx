import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DestinationDetailExperience } from "@/components/trip-compass/destination-detail-experience";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type { RecommendationQuery } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

const mockSendBeacon = vi.fn();

const recommendationQuery: RecommendationQuery = {
  partyType: "couple",
  partySize: 2,
  budgetBand: "mid",
  tripLengthDays: 5,
  departureAirport: "ICN",
  travelMonth: 10,
  pace: "balanced",
  flightTolerance: "medium",
  vibes: ["romance", "food"],
};

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      isPending: false,
      data: {
        user: {
          id: "user-1",
          name: "테스트 사용자",
        },
      },
    }),
  },
}));

describe("DestinationDetailExperience", () => {
  afterEach(() => {
    mockSendBeacon.mockReset();
    vi.unstubAllGlobals();
  });

  it("keeps the first screen compact and hides long-form details by default", () => {
    render(
      <DestinationDetailExperience
        destination={launchCatalog[0]}
        evidence={[]}
        query={recommendationQuery}
        allowSave={false}
      />,
    );

    expect(screen.getByTestId(testIds.detail.root)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "도쿄 · 일본" })).toBeInTheDocument();
    expect(screen.getByTestId(testIds.detail.watchOuts)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.detail.travelSupport)).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.detail.fitReason)).not.toBeInTheDocument();
    expect(screen.queryByTestId(testIds.detail.evidence)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("자세히 보기"));

    expect(screen.getByTestId(testIds.detail.fitReason)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.detail.evidence)).toBeInTheDocument();
  });

  it("shows the flight affiliate panel and logs a click with sponsored disclosure", () => {
    vi.stubGlobal("navigator", {
      sendBeacon: mockSendBeacon,
      clipboard: {
        writeText: vi.fn(),
      },
    });

    render(
      <DestinationDetailExperience
        destination={launchCatalog[0]}
        evidence={[]}
        query={recommendationQuery}
        allowSave={false}
      />,
    );

    expect(screen.getByTestId(testIds.detail.flightAffiliate)).toBeInTheDocument();
    expect(screen.getByText("외부 예약 링크")).toBeInTheDocument();
    expect(screen.getByText("Skyscanner")).toBeInTheDocument();

    const cta = screen.getByTestId(testIds.detail.flightAffiliateCta);
    expect(cta.textContent).toBe("인천(ICN) 출발 10월 항공권 보기");
    expect(cta).toHaveAttribute(
      "href",
      "https://www.skyscanner.co.kr/routes/icn/tyoa/incheon-international-airport-to-tokyo.html",
    );

    fireEvent.click(cta);

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon.mock.calls[0]?.[0]).toBe("/api/affiliate/clicks");
  });
});
