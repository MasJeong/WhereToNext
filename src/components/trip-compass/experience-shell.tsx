import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { isIosShellMode } from "@/lib/runtime/shell";
import { testIds } from "@/lib/test-ids";

import { ShellAuthNav } from "./shell-auth-nav";
import { ShellPrimaryNav } from "./shell-primary-nav";

/* Compass icon for 추천 받기 */
function CompassIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[14px] w-[14px]" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 5.5 9 9l-3.5 1.5L7 7l3.5-1.5Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* People icon for 여행 이야기 */
function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[14px] w-[14px]" aria-hidden="true">
      <circle cx="5.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 12.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 8.5c.3-.1.6-.1 1-.1 2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/* Suitcase icon for 내 여행 */
function SuitcaseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[14px] w-[14px]" aria-hidden="true">
      <rect x="3" y="5.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="3" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** Bed icon for the stay showcase entry. */
function StayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[14px] w-[14px]" aria-hidden="true">
      <path d="M2.5 10.5h11v2.5h-1.2v-1h-8.6v1H2.5v-2.5Z" fill="currentColor" />
      <path
        d="M3 10V7.4c0-.8.6-1.4 1.4-1.4h2.2c.8 0 1.4.6 1.4 1.4V10M8 10V6.7c0-.9.7-1.7 1.7-1.7h1.3c1 0 1.7.8 1.7 1.7V10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const primaryNavItems: readonly { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "추천 받기", href: "/?stage=question&step=1", icon: <CompassIcon /> },
  { label: "여행 이야기", href: "/community", icon: <PeopleIcon /> },
  { label: "스테이", href: "/stays", icon: <StayIcon /> },
  { label: "내 여행", href: "/account", icon: <SuitcaseIcon /> },
];

import { brandDisplayName } from "@/lib/brand";
import { isIosShellMode } from "@/lib/runtime/shell";
import { testIds } from "@/lib/test-ids";

import { isIosShellMode } from "@/lib/runtime/shell";
import { testIds } from "@/lib/test-ids";

type ExperienceShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  capsule: string;
  headerAside?: ReactNode;
  hideTopbar?: boolean;
  hideHeader?: boolean;
  bareBody?: boolean;
  children: ReactNode;
};

export function ExperienceShell({
  eyebrow,
  title,
  intro,
  capsule,
  headerAside,
  hideTopbar = false,
  hideHeader = false,
  bareBody = false,
  children,
}: ExperienceShellProps) {
  const hasContextHeader = !hideHeader && Boolean(eyebrow || title || intro || capsule || headerAside);
  const useBareLayout = bareBody || hideHeader;
  const hideAuthNavigation = isIosShellMode();

  return (
    <main
      className={`compass-route-shell compass-shell-stage relative isolate min-h-screen overflow-x-clip ${
        useBareLayout
          ? "px-3 pb-4 pt-2 sm:px-4 sm:pb-5 sm:pt-2.5"
          : "px-3 pb-4 pt-2 sm:px-4 sm:pb-5 sm:pt-2.5 lg:px-5"
      }`}
    >
      <div className={`relative z-10 mx-auto flex max-w-6xl flex-col ${useBareLayout ? "gap-3" : "gap-3.5"}`}>
        {hideTopbar ? null : (
          <div
            data-testid={testIds.shell.header}
            className="compass-shell-topbar compass-stage-reveal compass-stage-reveal-fast rounded-[calc(var(--radius-card)-4px)] px-3 py-2 sm:px-4 sm:py-2.5"
          >
            <div className="compass-shell-topbar-layout min-h-[2.75rem]">
              <ShellPrimaryNav items={primaryNavItems} />

              {hideAuthNavigation ? null : (
                <Suspense fallback={null}>
                  <ShellAuthNav />
                </Suspense>
              )}
            </div>
          </div>
        )}

        {hasContextHeader ? (
          <header className="compass-shell-context compass-stage-reveal compass-stage-reveal-delayed rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-4.5 sm:py-4.5">
            <div
              className={`grid gap-3 ${headerAside ? "lg:grid-cols-[minmax(0,1.08fr)_minmax(15rem,0.92fr)] lg:items-start" : ""}`}
            >
              <div className="min-w-0 space-y-2.5">
                {eyebrow || capsule ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {eyebrow ? (
                      <span className="compass-shell-route-note rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px]">
                        {eyebrow}
                      </span>
                    ) : null}
                    {capsule ? (
                      <p className="text-[11px] leading-5 text-[var(--color-ink-soft)] sm:text-xs">{capsule}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  {title ? (
                    <h1 className="text-[1.2rem] font-bold leading-snug tracking-[-0.02em] text-[var(--color-ink)] sm:text-[1.36rem] lg:text-[1.5rem]">
                      {title}
                    </h1>
                  ) : null}
                  {intro ? (
                    <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[var(--color-ink-soft)]">{intro}</p>
                  ) : null}
                </div>
              </div>

              {headerAside ? <div className="compass-shell-context-aside">{headerAside}</div> : null}
            </div>
          </header>
        ) : null}

        {useBareLayout ? (
          <div className="compass-stage-reveal compass-stage-reveal-slower">{children}</div>
        ) : (
          <div className="compass-shell-body compass-stage-reveal compass-stage-reveal-slower rounded-[calc(var(--radius-shell)-2px)] px-4 py-4 sm:px-4.5 sm:py-4.5 lg:px-5 lg:py-5">
            {children}
          </div>
        )}

        <footer className="compass-stage-reveal compass-stage-reveal-slower px-4 pb-4 pt-6 sm:px-5">
          <div className="flex flex-col gap-2 text-[0.72rem] text-[var(--color-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-semibold text-[var(--color-ink)]">떠나볼까?</span>
              {" "}취향 기반 여행지 추천
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/privacy"
                data-testid={testIds.shell.privacyLink}
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                개인정보처리방침
              </Link>
              <span>&copy; {new Date().getFullYear()} 떠나볼까?</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
