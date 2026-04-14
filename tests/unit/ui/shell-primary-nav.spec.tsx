import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { ExperienceShell } from "@/components/trip-compass/experience-shell";

const { mockUsePathname, mockSearchParamsToString, mockUseSession } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
  mockSearchParamsToString: vi.fn(),
  mockUseSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    toString: mockSearchParamsToString,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
  },
}));

describe("ExperienceShell primary navigation", () => {
  it("shows the stay entry in the header", () => {
    mockUsePathname.mockReturnValue("/stays");
    mockSearchParamsToString.mockReturnValue("");
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(
      <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
        <div>body</div>
      </ExperienceShell>,
    );

    expect(screen.getByLabelText("주요 메뉴")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "스테이" })).toHaveAttribute("href", "/stays");
  });
});
