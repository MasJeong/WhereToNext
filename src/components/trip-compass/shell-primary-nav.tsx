"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { brandDisplayName } from "@/lib/brand";
import { shellHomeEvent, shellStartRecommendationEvent } from "@/lib/trip-compass/shell-events";

type PrimaryNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type ShellPrimaryNavProps = {
  items: readonly PrimaryNavItem[];
};

export function ShellPrimaryNav({ items }: ShellPrimaryNavProps) {
  const pathname = usePathname() ?? "";

  function isHomePath() {
    return pathname === "/";
  }

  function isActivePath(href: string): boolean {
    if (href === "/account") {
      return pathname.startsWith("/account");
    }

    if (href.startsWith("/?")) {
      return pathname === "/";
    }

    return pathname === href;
  }

  return (
    <>
      <Link
        href="/"
        aria-label={`${brandDisplayName} 홈으로`}
        title="홈으로 돌아가기"
        className="compass-shell-brand compass-soft-press inline-flex min-w-0 items-center gap-2 text-[var(--color-ink)]"
        onClick={(event) => {
          if (!isHomePath()) {
            return;
          }

          event.preventDefault();
          window.dispatchEvent(new Event(shellHomeEvent));
        }}
      >
        {/* Brand icon */}
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.6rem] bg-[linear-gradient(135deg,var(--color-action-primary),var(--color-action-primary-strong))] shadow-[0_2px_8px_rgb(30_136_229_/_0.25)]">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.8" fill="none" />
            <circle cx="10" cy="10" r="2.5" fill="white" />
            <line x1="10" y1="4.5" x2="10" y2="15.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" transform="rotate(38 10 10)" />
          </svg>
        </span>
        <span className="text-[0.95rem] font-bold leading-none tracking-[-0.04em] text-[var(--color-ink-strong)] sm:text-[1.02rem]">
          {brandDisplayName}
        </span>
      </Link>

      <nav aria-label="주요 메뉴" className="compass-shell-primary-nav">
        {items.map((item) => {
          const isActive = isActivePath(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`compass-shell-nav-link${isActive ? " compass-shell-nav-link-active" : ""}`}
              onClick={(event) => {
                if (!(isHomePath() && item.href.startsWith("/?"))) {
                  return;
                }

                event.preventDefault();
                window.dispatchEvent(new Event(shellStartRecommendationEvent));
              }}
            >
              <span className="compass-shell-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
