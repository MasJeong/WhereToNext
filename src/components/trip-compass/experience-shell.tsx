import type { ReactNode } from "react";

type ExperienceShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  capsule: string;
  headerAside?: ReactNode;
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
  children,
}: ExperienceShellProps) {
  return (
    <main className="compass-route-shell compass-shell-stage relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="compass-orbit top-16 right-[max(1.5rem,calc(50%-34rem))] h-40 w-40"
      />
      <div
        aria-hidden="true"
        className="compass-orbit bottom-24 left-[max(1rem,calc(50%-38rem))] h-28 w-28"
      />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 lg:gap-8 xl:gap-10">
        <header className="compass-hero compass-stage-shell compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-shell)] px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)] lg:items-end xl:gap-10">
            <div className="max-w-4xl space-y-5">
              <p className="compass-editorial-kicker text-[var(--color-sand)]">
                {eyebrow}
              </p>
              <div className="space-y-4">
                <h1 className="font-display max-w-5xl text-[2.9rem] leading-[0.94] tracking-[-0.05em] text-[var(--color-paper)] sm:text-[4.25rem] lg:text-[5.35rem]">
                  {title}
                </h1>
                <div className="compass-editorial-rule max-w-3xl" />
                <p className="max-w-2xl text-sm leading-7 text-[var(--color-paper-soft)] sm:text-base sm:leading-8">
                  {intro}
                </p>
              </div>
            </div>

            <div className="compass-shell-header-aside flex max-w-md flex-col gap-3 self-start lg:self-end">
              <div className="compass-hero-meta rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink)] sm:px-5 sm:py-5">
                {capsule}
              </div>
              <div className="compass-stage-reveal compass-stage-reveal-delayed">
                {headerAside ? headerAside : null}
              </div>
            </div>
          </div>
        </header>

        <div className="compass-shell-body compass-stage-shell compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-shell)] px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7 xl:px-8 xl:py-8">
          {children}
        </div>
      </div>
    </main>
  );
}
