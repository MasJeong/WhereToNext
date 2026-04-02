import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DestinationDetailExperience } from "@/components/trip-compass/destination-detail-experience";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import {
  getDestinationTasteCustomTagRemoveTestId,
  testIds,
} from "@/lib/test-ids";

const mockFetch = vi.fn();

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

describe("DestinationDetailExperience custom hashtags", () => {
  afterEach(() => {
    mockFetch.mockReset();
    vi.unstubAllGlobals();
  });

  it("adds custom hashtags, blocks duplicates, and sends them with taste save", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <DestinationDetailExperience
        destination={launchCatalog[0]}
        evidence={[]}
        allowSave={false}
      />,
    );

    const input = screen.getByTestId(testIds.detail.tasteCustomTagInput);
    const addButton = screen.getByTestId(testIds.detail.tasteCustomTagAdd);

    fireEvent.change(input, { target: { value: "#노을산책" } });
    fireEvent.click(addButton);

    expect(screen.getByText("#노을산책")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "노을산책" } });
    fireEvent.click(addButton);

    expect(screen.getByText("이미 추가한 해시태그예요.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(getDestinationTasteCustomTagRemoveTestId(0)));
    expect(screen.queryByText("#노을산책")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "#심야산책" } });
    fireEvent.click(addButton);
    fireEvent.click(screen.getByTestId(testIds.detail.tasteSubmit));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/me/history",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"customTags":["심야산책"]'),
      }),
    );
  });
});
