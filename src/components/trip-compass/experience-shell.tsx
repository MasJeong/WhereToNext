import type { ReactNode } from "react";

import { isIosShellMode } from "@/lib/runtime/shell";
import { testIds } from "@/lib/test-ids";

import { ShellAuthNav } from "./shell-auth-nav";
import { ShellPrimaryNav } from "./shell-primary-nav";

const primaryNavItems = [
  { label: "추천 받기", href: "/?start=1", kind: "primary" },
  { label: "내 여행", href: "/account" },
] as const;

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
            <div className="compass-shell-topbar-layout min-h-[3.25rem]">
              <ShellPrimaryNav items={primaryNavItems} />

              {hideAuthNavigation ? null : <ShellAuthNav />}
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
      </div>
    </main>
  );
}
