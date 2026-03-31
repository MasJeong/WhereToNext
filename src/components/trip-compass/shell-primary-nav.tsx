"use client";

import Link from "next/link";

import { brandDisplayName } from "@/lib/brand";
import { shellHomeEvent, shellStartRecommendationEvent } from "@/lib/trip-compass/shell-events";

type PrimaryNavItem = {
  label: string;
  href: string;
  kind?: "primary" | "default";
};

type ShellPrimaryNavProps = {
  items: readonly PrimaryNavItem[];
};

export function ShellPrimaryNav({ items }: ShellPrimaryNavProps) {
  function isHomePath() {
    return typeof window !== "undefined" && window.location.pathname === "/";
  }

  return (
    <>
      <Link
        href="/"
        aria-label={`${brandDisplayName} 홈으로`}
        title="홈으로 돌아가기"
        className="compass-shell-brand compass-soft-press inline-flex min-w-0 items-center gap-2.5 text-[var(--color-ink)]"
        onClick={(event) => {
          if (!isHomePath()) {
            return;
          }

          event.preventDefault();
          window.dispatchEvent(new Event(shellHomeEvent));
        }}
      >
        <span className="compass-shell-brand-lockup inline-flex min-w-0 items-center gap-2.5">
          <span className="compass-shell-brand-mark-wrap inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem]">
            <span className="compass-shell-brand-mark inline-flex h-4 w-4 shrink-0 rounded-full" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[1.02rem] leading-none tracking-[-0.045em] sm:text-[1.08rem]">
              {brandDisplayName}
            </span>
            <span className="compass-shell-brand-caption mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.08em]">
              HOME
            </span>
          </span>
        </span>
      </Link>

      <nav aria-label="주요 메뉴" className="compass-shell-primary-nav">
        {items.map((item) => {
          const isPrimaryAction = item.kind === "primary";

          return (
            <Link
              key={item.label}
              href={item.href}
              className={isPrimaryAction ? "compass-shell-nav-link compass-shell-nav-link-cta" : "compass-shell-nav-link"}
              onClick={(event) => {
                if (!(isHomePath() && item.href === "/?start=1")) {
                  return;
                }

                event.preventDefault();
                window.dispatchEvent(new Event(shellStartRecommendationEvent));
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
