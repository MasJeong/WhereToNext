import type { ReactNode } from "react";

type ExperienceShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  capsule: string;
  children: ReactNode;
};

/**
 * Renders the shared editorial shell used across home, restore, and compare pages.
 * @param props Shell copy and content slots
 * @returns Framed Trip Compass page layout
 */
export function ExperienceShell({
  eyebrow,
  title,
  intro,
  capsule,
  children,
}: ExperienceShellProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="compass-panel rounded-[var(--radius-shell)] px-6 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-sand)]">
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

            <div className="compass-pill max-w-sm self-start px-4 py-4 text-sm leading-6 text-[var(--color-paper)] lg:self-end">
              {capsule}
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
