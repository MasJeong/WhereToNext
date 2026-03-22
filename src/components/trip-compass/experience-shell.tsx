import Link from "next/link";
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
  const shellPillLabels = ["선택한 조건", "추천 결과", "안전한 복원"] as const;

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

      <div className={`relative z-10 mx-auto flex max-w-7xl flex-col ${bareBody ? "gap-0" : "gap-3 lg:gap-4 xl:gap-5"}`}>
        {hideHeader ? null : (
          <div className="compass-shell-masthead compass-stage-reveal compass-stage-reveal-fast rounded-full px-4 py-2.5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/" className="compass-shell-brand inline-flex items-center gap-3 text-[var(--color-ink)]">
                  <span className="compass-shell-brand-mark inline-flex h-9 w-9 items-center justify-center rounded-full">
                    SG
                  </span>
                  <span>
                    <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                      한국 출발 해외여행 추천
                    </span>
                    <span className="mt-1 block font-display text-[1.05rem] leading-none tracking-[-0.03em] sm:text-[1.15rem]">
                      SooGo
                    </span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                <span className="compass-shell-masthead-pill rounded-full px-3 py-1.5">로그인 없이 시작</span>
                <span className="compass-shell-masthead-pill rounded-full px-3 py-1.5">저장 후 복원</span>
                <span className="compass-shell-masthead-pill rounded-full px-3 py-1.5">후보 비교</span>
              </div>
            </div>
          </div>
        )}

        {hideHeader ? null : (
          <header className={`${isCompactHeader ? "compass-stage-shell compass-shell-compact rounded-[var(--radius-shell)] px-4 py-3 sm:px-5" : "compass-hero compass-stage-shell rounded-[var(--radius-shell)] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6 xl:px-8 xl:py-7"} compass-stage-reveal compass-stage-reveal-delayed`}>
            <div className={`${isCompactHeader ? "flex items-center justify-between gap-4" : "compass-shell-hero-grid"}`}>
              <div className={`${isCompactHeader ? "min-w-0" : "compass-shell-hero-copy max-w-4xl space-y-4"}`}>
                {eyebrow ? (
                  <div className="compass-stage-meta">
                    <span className="compass-stage-index">추천</span>
                    <p className="compass-editorial-kicker text-[var(--color-sand)]">{eyebrow}</p>
                  </div>
                ) : null}
                <div className={isCompactHeader ? "mt-1" : "space-y-4"}>
                  <h1 className={`${isCompactHeader ? "max-w-none text-[1.15rem] leading-tight tracking-[-0.015em] text-[var(--color-ink)] sm:text-[1.3rem] lg:text-[1.45rem]" : "max-w-3xl text-[1.6rem] leading-[0.98] tracking-[-0.035em] text-[var(--color-paper)] sm:text-[1.95rem] lg:text-[2.45rem] xl:text-[2.85rem]"} font-display`}>
                    {title}
                  </h1>
                  {intro ? (
                    <p className="max-w-2xl text-[0.94rem] leading-7 text-[var(--color-paper-soft)] sm:text-[1rem]">
                      {intro}
                    </p>
                  ) : null}
                </div>

                {isCompactHeader ? null : (
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    {capsule ? (
                      <div className="compass-hero-meta rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5 text-sm leading-6 text-[var(--color-ink)] sm:px-5 sm:py-4">
                        {capsule}
                      </div>
                    ) : null}
                    <div className="compass-shell-hero-notes flex flex-wrap gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-paper-soft)]">
                      {shellPillLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-3 py-1.5"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`${isCompactHeader ? "hidden" : "compass-shell-header-aside flex max-w-sm flex-col gap-3 self-start lg:self-start"}`}>
                <div className="compass-stage-panel rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5 text-[var(--color-paper)] sm:px-5 sm:py-4">
                  <p className="compass-editorial-kicker text-[var(--color-sand)]">이용 흐름</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-paper-soft)]">
                    같은 조건으로 추천을 보고 저장하고 다시 열어 보거나 비교할 수 있게 흐름을 맞춰 두었어요.
                  </p>
                </div>
                <div className="compass-stage-reveal compass-stage-reveal-slower">
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
