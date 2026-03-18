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
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="compass-hero rounded-[var(--radius-shell)] px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold tracking-[0.08em] text-[var(--color-sand)]">
                {eyebrow}
              </p>
              <div className="space-y-3">
                <h1 className="font-display max-w-4xl text-5xl leading-none tracking-[-0.04em] text-[var(--color-paper)] sm:text-6xl lg:text-7xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                  {intro}
                </p>
              </div>
            </div>

            <div className="flex max-w-sm flex-col gap-3 self-start lg:self-end">
              <div className="compass-pill px-4 py-4 text-sm leading-6 text-[var(--color-paper)]">
                {capsule}
              </div>
              {headerAside ? headerAside : null}
            </div>
          </div>
        </header>

        <div className="compass-desk rounded-[var(--radius-shell)] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          {children}
        </div>
      </div>
    </main>
  );
}
