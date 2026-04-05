import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import { getAccountHistoryDestinationResultTestId, testIds } from "@/lib/test-ids";

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/account/history/new",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,MOCK`;
    this.onload?.();
  }
}

async function goToImageStep() {
  await act(async () => {
    fireEvent.change(screen.getByTestId(testIds.account.newHistoryDestinationSearch), {
      target: { value: "도쿄" },
    });
    fireEvent.click(screen.getByTestId(getAccountHistoryDestinationResultTestId(0)));
  });

  await act(async () => {
    vi.advanceTimersByTime(130);
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
  });
}

describe("AccountHistoryCreateExperience image validation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockReset();
    mockRefresh.mockReset();
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("rejects unsupported file types with a clear message", async () => {
    render(<AccountHistoryCreateExperience />);
    await goToImageStep();

    const input = screen.getByTestId(testIds.account.newHistoryImageInput);
    const invalidFile = new File(["<svg></svg>"], "weird.svg", { type: "image/svg+xml" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [invalidFile] } });
    });

    expect(screen.getByText("PNG, JPG, WEBP, HEIC/HEIF 사진만 올려 주세요.")).toBeInTheDocument();
  });

  it("rejects oversized files before reading them", async () => {
    render(<AccountHistoryCreateExperience />);
    await goToImageStep();

    const input = screen.getByTestId(testIds.account.newHistoryImageInput);
    const oversizedFile = new File(["a".repeat(10 * 1024 * 1024 + 1)], "too-large.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [oversizedFile] } });
    });

    expect(screen.getByText("사진 한 장은 10MB 이하 파일로 올려 주세요.")).toBeInTheDocument();
  });

  it("limits one history entry to ten images", async () => {
    render(<AccountHistoryCreateExperience />);
    await goToImageStep();

    const input = screen.getByTestId(testIds.account.newHistoryImageInput);

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: Array.from({ length: 11 }, (_, index) =>
            new File([`${index}`], `trip-${index}.jpg`, { type: "image/jpeg" }),
          ),
        },
      });
    });

    expect(screen.getByText("사진은 최대 10장까지 올릴 수 있어요.")).toBeInTheDocument();
  });
});
