import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StayShowcaseExperience } from "@/components/trip-compass/stay-showcase-experience";
import { testIds } from "@/lib/test-ids";

describe("StayShowcaseExperience", () => {
  it("renders the Airbnb-inspired stay browsing sample", () => {
    render(<StayShowcaseExperience />);

    expect(screen.getByTestId(testIds.stays.root)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이번 주말, 오래 머물고 싶은 스테이" })).toBeInTheDocument();
    expect(screen.getByTestId(testIds.stays.card0)).toBeInTheDocument();
    expect(screen.getByText("파도 소리로 하루가 정리되는 오션 스테이")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "찾기" })).toBeInTheDocument();
  });
});
