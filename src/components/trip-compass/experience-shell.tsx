import Link from "next/link";
import type { ReactNode } from "react";

import { testIds } from "@/lib/test-ids";

type ExperienceShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  capsule: string;
  headerAside?: ReactNode;
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
  hideHeader = false,
  bareBody = false,
  children,
}: ExperienceShellProps) {
  const hasContextHeader = !hideHeader && Boolean(eyebrow || title || intro || capsule || headerAside);

  return (
    <main
      className={`compass-route-shell compass-shell-stage relative isolate min-h-screen overflow-x-clip ${bareBody ? "px-2.5 pb-3 pt-2 sm:px-3.5 sm:pb-4 sm:pt-2.5 lg:px-4" : "px-2.5 pb-3 pt-2 sm:px-3.5 sm:pb-4 sm:pt-2.5 lg:px-4 lg:pb-5"}`}
    >
      <div className={`relative z-10 mx-auto flex max-w-6xl flex-col ${bareBody ? "gap-2.5" : "gap-3 sm:gap-3.5"}`}>
        <div className="compass-shell-masthead compass-stage-reveal compass-stage-reveal-fast rounded-[calc(var(--radius-card)-12px)] px-3 py-2.5 sm:px-3.5 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <Link href="/" className="compass-shell-brand inline-flex min-w-0 items-center gap-2 text-[var(--color-ink)]">
              <span className="compass-shell-brand-mark inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:h-9 sm:w-9 sm:text-xs">
                SG
              </span>
              <span className="min-w-0">
                <span className="block text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)] sm:text-[0.58rem]">
                  한국 출발 여행 추천
                </span>
                <span className="mt-0.5 block font-display text-[0.96rem] leading-none tracking-[-0.04em] sm:text-[1.06rem]">
                  SooGo
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/account"
                data-testid={testIds.shell.accountLink}
                className="compass-action-secondary compass-soft-press rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] sm:px-3.5 sm:py-2"
              >
                내 취향
              </Link>
              <Link
                href="/auth"
                data-testid={testIds.shell.authCta}
                className="compass-action-primary compass-soft-press rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] sm:px-3.5 sm:py-2"
              >
                로그인
              </Link>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              data-testid={testIds.shell.identityCard}
              className="compass-shell-masthead-pill rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px]"
            >
              홈에서 바로 추천 흐름 시작
            </span>
            {eyebrow ? (
              <span className="compass-shell-route-pill rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px]">
                {eyebrow}
              </span>
            ) : null}
          </div>
        </div>

        {hasContextHeader ? (
          <header
            className="compass-shell-context compass-stage-reveal compass-stage-reveal-delayed rounded-[calc(var(--radius-card)-8px)] px-3.5 py-3.5 sm:px-4 sm:py-4"
          >
            <div
              className={`grid gap-3 ${headerAside ? "lg:grid-cols-[minmax(0,1.08fr)_minmax(15rem,0.92fr)] lg:items-start" : ""}`}
            >
              <div className="min-w-0 space-y-2.5">
                {eyebrow || capsule ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {eyebrow ? (
                      <span className="compass-shell-context-kicker rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px]">
                        {eyebrow}
                      </span>
                    ) : null}
                    {capsule ? (
                      <p className="text-[11px] leading-5 text-[var(--color-ink-soft)] sm:text-xs">{capsule}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  {title ? (
                    <h1 className="font-display text-[1.14rem] leading-[1.02] tracking-[-0.035em] text-[var(--color-ink)] sm:text-[1.28rem] lg:text-[1.48rem]">
                      {title}
                    </h1>
                  ) : null}
                  {intro ? (
                    <p className="max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                      {intro}
                    </p>
                  ) : null}
                </div>
              </div>

              {headerAside ? <div className="compass-shell-header-aside">{headerAside}</div> : null}
            </div>
          </header>
        ) : null}

        {bareBody ? (
          <div className="compass-stage-reveal compass-stage-reveal-slower">{children}</div>
        ) : (
          <div className="compass-shell-body compass-stage-shell compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-shell)] px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-5">
            {children}
          </div>
        )}
      </div>
    </main>
  );
}
