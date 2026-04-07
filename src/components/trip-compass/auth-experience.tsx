"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { brandDisplayName } from "@/lib/brand";
import { testIds } from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";

type AuthIntent = "save" | "share" | "account" | "default";
type Provider = "kakao" | "google" | "apple";

type ProviderCta = {
  id: Provider;
  label: string;
  testId: string;
};

const providerCtas: ProviderCta[] = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    testId: testIds.auth.providerKakao,
  },
  {
    id: "google",
    label: "Google로 계속하기",
    testId: testIds.auth.providerGoogle,
  },
  {
    id: "apple",
    label: "Apple로 계속하기",
    testId: testIds.auth.providerApple,
  },
];

function normalizeIntent(value: string | null): AuthIntent {
  if (value === "save" || value === "share" || value === "account") {
    return value;
  }

  return "default";
}

function buildAuthHeading(intent: AuthIntent): { title: string; intro: string } {
  if (intent === "save") {
    return {
      title: "저장한 여행 흐름을 계정에 이어 둘까요?",
      intro: "로그인하면 방금 고른 추천 결과를 내 기록에 남기고, 다음에도 같은 감각으로 다시 꺼내볼 수 있어요.",
    };
  }

  if (intent === "share") {
    return {
      title: "공유할 여행 카드를 이어서 만들어요",
      intro: "로그인하면 저장한 카드와 공유 흐름을 한 계정에서 차분하게 이어갈 수 있어요.",
    };
  }

  if (intent === "account") {
    return {
      title: "내 여행 기록을 이어 보려면 로그인이 필요해요",
      intro: "로그인하면 저장한 추천 결과와 취향 기록을 한곳에서 이어볼 수 있어요.",
    };
  }

  return {
    title: "여행 기록을 가볍게 이어 두는 로그인",
    intro: "로그인하면 저장과 공유, 내 기록을 한 계정에서 이어갈 수 있어요. 추천은 로그인 없이도 받을 수 있어요.",
  };
}

function getCollisionErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  const normalized = errorCode.toLowerCase();

  return normalized.includes("collision") || normalized.includes("mismatch")
    ? "이미 다른 로그인 방식으로 이어진 계정이에요. 이전에 쓰던 방식으로 다시 로그인해 주세요."
    : null;
}

function getSafeAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  if (getCollisionErrorMessage(errorCode)) {
    return null;
  }

  if (errorCode === "access_denied" || errorCode === "cancelled") {
    return "로그인을 마치지 않았어요. 괜찮아요, 원할 때 다시 이어서 시도해 보세요.";
  }

  return "지금은 로그인을 이어 주지 못했어요. 잠시 후 다시 시도해 주세요.";
}

function buildProviderHref(
  provider: Provider,
  next: string | null,
  intent: AuthIntent,
  mockCase: string | null,
): string {
  const params = new URLSearchParams();

  if (next) {
    params.set("next", next);
  }

  if (intent !== "default") {
    params.set("intent", intent);
  }

  if (mockCase) {
    params.set("mockCase", mockCase);
  }

  const query = params.toString();
  return `/api/auth/oauth/${provider}/start${query ? `?${query}` : ""}`;
}

function buildContinueHref(next: string | null): string {
  if (!next || !next.startsWith("/")) {
    return "/";
  }

  return next;
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "kakao") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-[var(--color-ink)]">
        <path
          fill="currentColor"
          d="M12 4.5c-4.7 0-8.5 2.95-8.5 6.6 0 2.33 1.58 4.37 3.97 5.54l-.99 3.51a.42.42 0 0 0 .64.46l4.21-2.77c.22.01.44.02.67.02 4.69 0 8.5-2.96 8.5-6.6S16.69 4.5 12 4.5Z"
        />
      </svg>
    );
  }

  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-[var(--color-ink)]">
        <path
          fill="currentColor"
          d="M20.28 12.23c0-.63-.06-1.23-.16-1.81H12v3.43h4.64a3.95 3.95 0 0 1-1.72 2.6v2.17h2.78c1.63-1.5 2.58-3.72 2.58-6.39Z"
        />
        <path
          fill="currentColor"
          d="M12 20.5c2.33 0 4.28-.77 5.7-2.08l-2.78-2.17c-.78.52-1.77.83-2.92.83-2.25 0-4.15-1.52-4.83-3.56H4.29v2.23A8.5 8.5 0 0 0 12 20.5Z"
        />
        <path
          fill="currentColor"
          d="M7.17 13.52a5.05 5.05 0 0 1 0-3.04V8.25H4.29a8.5 8.5 0 0 0 0 7.5l2.88-2.23Z"
        />
        <path
          fill="currentColor"
          d="M12 6.92c1.27 0 2.41.44 3.3 1.29l2.47-2.47C16.27 4.31 14.32 3.5 12 3.5a8.5 8.5 0 0 0-7.71 4.75l2.88 2.23c.68-2.04 2.58-3.56 4.83-3.56Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-[var(--color-ink)]">
      <path
        fill="currentColor"
        d="M16.71 12.59c0-2.02 1.65-2.99 1.72-3.03-.94-1.37-2.4-1.56-2.91-1.58-1.23-.13-2.42.73-3.05.73-.65 0-1.63-.71-2.68-.69-1.38.02-2.65.8-3.36 2.04-1.44 2.49-.37 6.17 1.03 8.2.69.99 1.51 2.09 2.6 2.05 1.04-.05 1.43-.66 2.69-.66s1.61.66 2.71.64c1.12-.02 1.82-1 2.5-2 .79-1.14 1.11-2.25 1.12-2.31-.03-.01-2.37-.91-2.37-3.39Zm-1.93-5.85c.56-.68.94-1.61.84-2.55-.81.03-1.79.54-2.37 1.21-.52.6-.98 1.56-.86 2.48.91.07 1.83-.46 2.39-1.14Z"
      />
    </svg>
  );
}

export function AuthExperience() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const intent = normalizeIntent(searchParams.get("intent"));
  const mockCase = searchParams.get("mockCase");
  const errorCode = searchParams.get("error") ?? searchParams.get("code");
  const collisionError = getCollisionErrorMessage(errorCode);
  const authError = getSafeAuthErrorMessage(errorCode);
  const heading = buildAuthHeading(intent);

  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgb(74_180_255_/_0.18),_transparent_68%)]" />
            <div className="relative h-18 w-18 rounded-[1.6rem] bg-[linear-gradient(180deg,rgb(86_187_255),rgb(30_136_229))] shadow-[0_16px_34px_rgb(30_136_229_/_0.16)]">
              <span className="absolute left-1/2 top-[0.58rem] h-[2.55rem] w-[2.55rem] -translate-x-1/2 rounded-full border-[3px] border-white" />
              <span className="absolute left-1/2 top-[2.15rem] h-[1.9rem] w-[1.9rem] -translate-x-1/2 rotate-45 rounded-[0.62rem] border-b-[3px] border-r-[3px] border-white" />
              <span className="absolute left-[1.8rem] top-[1.5rem] h-[0.32rem] w-[1.2rem] rounded-full bg-white/95" />
              <span className="absolute left-[2.48rem] top-[1.48rem] h-[0.42rem] w-[0.42rem] rounded-full bg-[rgb(255_212_72)] shadow-[0_0_0_4px_rgb(255_212_72_/_0.16)]" />
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
              {brandDisplayName}
            </p>
            <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.03] tracking-[-0.05em] text-[var(--color-ink)] sm:text-[2.15rem]">
              {heading.title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[0.93rem] leading-6 text-[var(--color-ink-soft)]">{heading.intro}</p>
          </div>

          {collisionError ? (
            <p
              data-testid={testIds.auth.collisionError}
              className="compass-warning-card mt-4 rounded-[1.1rem] px-4 py-3 text-left text-sm leading-6"
            >
              {collisionError}
            </p>
          ) : null}

          {authError ? (
            <p className="compass-warning-card mt-4 rounded-[1.1rem] px-4 py-3 text-left text-sm leading-6">{authError}</p>
          ) : null}

          <div className="mt-6 grid gap-3 text-left">
            {providerCtas.map((provider) => (
              <Link
                key={provider.id}
                href={buildProviderHref(provider.id, next, intent, mockCase)}
                data-testid={provider.testId}
                className="compass-panel compass-soft-press block rounded-[1.3rem] px-4 py-4.5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-frame-soft)] bg-white shadow-[var(--shadow-paper)]">
                    <ProviderIcon provider={provider.id} />
                  </span>
                  <span className="min-w-0 flex-1 self-center">
                    <span className="block text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                      {provider.id}
                    </span>
                    <span className="mt-1 block text-[1rem] font-semibold leading-6 tracking-[-0.02em] text-[var(--color-ink)] sm:text-[1.04rem]">
                      {provider.label}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 self-center text-[0.95rem] font-semibold text-[var(--color-ink-soft)]"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href={buildContinueHref(next)}
              className="inline-flex items-center text-sm font-medium text-[var(--color-ink-soft)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4"
            >
              로그인 없이 계속 보기
            </Link>
          </div>
        </section>
      </div>
    </ExperienceShell>
  );
}
