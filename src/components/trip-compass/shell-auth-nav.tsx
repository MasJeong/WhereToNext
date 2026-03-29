"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const session = authClient.useSession();
  const user = session.data?.user;

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
            className="compass-shell-identity compass-soft-press inline-flex min-h-[2.75rem] items-center gap-2.5 rounded-full px-2.5 py-2 text-[var(--color-ink)]"
          >
            <span className="compass-shell-identity-badge inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
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
            className="compass-shell-auth-text-action compass-soft-press inline-flex min-h-[2.75rem] items-center px-1 py-2 text-[12px] font-semibold tracking-[0.02em]"
          >
            로그아웃
          </button>
        </>
      ) : session.isPending ? (
        <span className="inline-flex min-h-[2.75rem] items-center px-1 py-2 text-[12px] font-semibold tracking-[0.02em] text-[var(--color-ink-soft)]">
          확인 중
        </span>
      ) : (
        <>
          <Link
            href="/auth"
            data-testid={testIds.shell.authCta}
            className="compass-shell-auth-text-link inline-flex min-h-[2.75rem] items-center px-1 py-2 text-[12px] font-semibold tracking-[0.02em]"
          >
            로그인
          </Link>
          <Link
            href="/account"
            data-testid={testIds.shell.accountLink}
            className="compass-shell-auth-pill compass-soft-press inline-flex min-h-[2.75rem] items-center rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-[0.02em]"
          >
            내 여행
          </Link>
        </>
      )}
    </nav>
  );
}
