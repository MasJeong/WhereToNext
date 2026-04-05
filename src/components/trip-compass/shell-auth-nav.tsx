"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { testIds } from "@/lib/test-ids";

/**
 * 사용자 이름에서 헤더용 이니셜을 만든다.
 * @param name 로그인 사용자 이름
 * @returns 1글자 이니셜
 */
function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 1).toUpperCase() : "?";
}

/**
 * 상단 헤더에서 현재 인증 상태에 맞는 빠른 이동/행동을 노출한다.
 * @returns 세션 기반 헤더 액션
 */
export function ShellAuthNav() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const session = authClient.useSession();
  const user = session.data?.user;
  const isAccountPath = pathname.startsWith("/account");
  const isAuthPath = pathname.startsWith("/auth");

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="compass-shell-auth-nav" aria-label="계정 메뉴">
      {user ? (
        <>
          <Link
            href="/account"
            data-testid={testIds.shell.identityCard}
            aria-current={isAccountPath ? "page" : undefined}
            className={`compass-shell-identity compass-soft-press inline-flex min-h-[2.25rem] items-center gap-2 rounded-full px-2 py-1.5 text-[var(--color-ink)]${isAccountPath ? " compass-shell-identity-active" : ""}`}
          >
            <span className="compass-shell-identity-badge inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white">
              {getInitial(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold leading-4">
                {user.name}
              </span>
              <span className="block text-[10px] leading-4 text-[var(--color-ink-soft)]">
                내 여행
              </span>
            </span>
          </Link>

          <button
            type="button"
            data-testid={testIds.shell.authCta}
            onClick={() => {
              void handleSignOut();
            }}
            className="compass-shell-auth-text-action compass-soft-press inline-flex min-h-[2.25rem] items-center px-1 py-1.5 text-[11px] font-semibold tracking-[0.02em]"
          >
            로그아웃
          </button>
        </>
      ) : session.isPending ? (
        <span className="inline-flex min-h-[2.25rem] items-center px-1 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-[var(--color-ink-soft)]">
          확인 중
        </span>
      ) : (
        <>
          <Link
            href="/auth"
            data-testid={testIds.shell.authCta}
            aria-current={isAuthPath ? "page" : undefined}
            className={`compass-shell-auth-text-link inline-flex min-h-[2.25rem] items-center px-1 py-1.5 text-[11px] font-semibold tracking-[0.02em]${isAuthPath ? " compass-shell-auth-text-link-active" : ""}`}
          >
            로그인
          </Link>
        </>
      )}
    </nav>
  );
}
