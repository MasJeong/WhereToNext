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

    if (href === "/community") {
      return pathname.startsWith("/community");
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
        <span className="text-[1.1rem] font-extrabold leading-none tracking-[-0.035em] text-[var(--color-action-primary)]">
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
