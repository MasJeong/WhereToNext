import type { ReactNode } from "react";

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

/**
 * Renders the shared editorial shell used across home, restore, and compare pages.
 * @param props Shell copy and content slots
 * @returns Framed SooGo page layout
 */
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
  const isCompactHeader = !intro && !capsule && !headerAside;

  return (
    <main className={`compass-route-shell compass-shell-stage relative isolate min-h-screen overflow-x-clip ${bareBody ? "px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4" : "px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8 lg:py-5"}`}>
      {bareBody ? null : (
        <>
          <div
            aria-hidden="true"
            className="compass-orbit top-16 right-[max(1.5rem,calc(50%-34rem))] h-40 w-40"
          />
          <div
            aria-hidden="true"
            className="compass-orbit bottom-24 left-[max(1rem,calc(50%-38rem))] h-28 w-28"
          />
        </>
      )}

        <div className={`relative z-10 mx-auto flex max-w-7xl flex-col ${bareBody ? "gap-0" : "gap-2.5 lg:gap-3.5 xl:gap-4"}`}>
        {hideHeader ? null : (
          <header className={`${isCompactHeader ? "compass-stage-shell rounded-[var(--radius-shell)] border border-[color:var(--color-frame-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,247,253,0.92))] px-4 py-2.5 shadow-[var(--shadow-paper)]" : "compass-hero compass-stage-shell rounded-[var(--radius-shell)] px-4 py-3.5 sm:px-5 sm:py-4 lg:px-6 lg:py-4.5 xl:px-7"} compass-stage-reveal compass-stage-reveal-fast`}>
            <div className={`${isCompactHeader ? "flex items-center justify-between gap-4" : "grid gap-4 lg:grid-cols-[minmax(0,1.28fr)_minmax(15rem,0.72fr)] lg:items-start xl:gap-6"}`}>
              <div className={`${isCompactHeader ? "min-w-0" : "max-w-4xl space-y-2.5"}`}>
                {eyebrow ? <p className="compass-editorial-kicker text-[var(--color-sand)]">{eyebrow}</p> : null}
                <div className={isCompactHeader ? "mt-1" : "space-y-2"}>
                  <h1 className={`${isCompactHeader ? "max-w-none text-[1.15rem] leading-tight tracking-[-0.015em] text-[var(--color-ink)] sm:text-[1.3rem] lg:text-[1.45rem]" : "max-w-3xl text-[1.45rem] leading-[1.04] tracking-[-0.02em] text-[var(--color-paper)] sm:text-[1.7rem] lg:text-[2.05rem]"} font-display`}>
                    {title}
                  </h1>
                  {intro ? (
                    <p className="max-w-2xl text-[13px] leading-5 text-[var(--color-paper-soft)] sm:text-sm sm:leading-6">
                      {intro}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className={`${isCompactHeader ? "hidden" : "compass-shell-header-aside flex max-w-sm flex-col gap-2 self-start lg:self-start"}`}>
                {capsule ? (
                  <div className="compass-hero-meta rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-xs leading-5 text-[var(--color-ink)] sm:px-4 sm:py-3">
                    {capsule}
                  </div>
                ) : null}
                <div className="compass-stage-reveal compass-stage-reveal-delayed">
                  {headerAside ? headerAside : null}
                </div>
              </div>
            </div>
          </header>
        )}

        {bareBody ? (
          <div className="compass-stage-reveal compass-stage-reveal-slower">{children}</div>
        ) : (
          <div className="compass-shell-body compass-stage-shell compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-shell)] px-4 py-3.5 sm:px-5 sm:py-4.5 lg:px-6 lg:py-5 xl:px-6 xl:py-5">
            {children}
          </div>
        )}
      </div>
    </main>
  );
}
