import Link from "next/link";
import type { ReactNode } from "react";

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
            className="compass-shell-topbar compass-stage-reveal compass-stage-reveal-fast rounded-[calc(var(--radius-card)-16px)] px-3.5 py-2.5 sm:px-4"
          >
            <div className="flex min-h-[3.25rem] flex-wrap items-center justify-between gap-2.5">
              <Link href="/" className="compass-shell-brand inline-flex min-w-0 items-center gap-2.5 text-[var(--color-ink)]">
                <span className="compass-shell-brand-mark inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                  SG
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    <span>한국 출발 여행 추천</span>
                    <span
                      data-testid={testIds.shell.identityCard}
                      className="compass-shell-identity rounded-full px-2.5 py-0.5 text-[0.54rem] font-semibold tracking-[0.12em] normal-case"
                    >
                      추천 우선
                    </span>
                    {eyebrow ? (
                      <span className="compass-shell-route-note rounded-full px-2.5 py-0.5 text-[0.54rem] font-semibold tracking-[0.08em] normal-case">
                        {eyebrow}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-display text-[1rem] leading-none tracking-[-0.045em] sm:text-[1.06rem]">
                    SooGo
                  </span>
                </span>
              </Link>

              {hideAuthNavigation ? null : (
                <nav className="flex flex-wrap items-center gap-2" aria-label="빠른 이동">
                  <Link
                    href="/account"
                    data-testid={testIds.shell.accountLink}
                    className="compass-action-secondary compass-soft-press inline-flex min-h-[2.75rem] items-center rounded-full px-3.5 py-2 text-[11px] font-semibold tracking-[0.04em]"
                  >
                    내 취향
                  </Link>
                  <Link
                    href="/auth"
                    data-testid={testIds.shell.authCta}
                    className="compass-action-primary compass-soft-press inline-flex min-h-[2.75rem] items-center rounded-full px-3.5 py-2 text-[11px] font-semibold tracking-[0.04em]"
                  >
                    로그인
                  </Link>
                </nav>
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
                    <h1 className="font-display text-[1.12rem] leading-[0.98] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.28rem] lg:text-[1.44rem]">
                      {title}
                    </h1>
                  ) : null}
                  {intro ? (
                    <p className="max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">{intro}</p>
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
      </div>
    </main>
  );
}
