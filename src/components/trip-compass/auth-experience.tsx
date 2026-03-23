"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { testIds } from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";

type AuthMode = "sign-in" | "sign-up";

type AuthResultLike = {
  error?: {
    message?: string | null;
  } | null;
} | null;

function getAuthErrorMessage(result: AuthResultLike, fallback: string): string {
  return result?.error?.message?.trim() || fallback;
}

export function AuthExperience() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (result.error) {
          setError(getAuthErrorMessage(result, "계정을 만들지 못했어요. 잠시 후 다시 시도해 주세요."));
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });

        if (result.error) {
          setError(
            getAuthErrorMessage(result, "로그인하지 못했어요. 이메일과 비밀번호를 다시 확인해 주세요."),
          );
          return;
        }
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError(
        mode === "sign-up"
          ? "계정을 만들지 못했어요. 잠시 후 다시 시도해 주세요."
          : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
        <aside className="compass-desk rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
          <p className="compass-editorial-kicker">가벼운 로그인</p>
          <h1 className="mt-3 font-display text-[1.48rem] leading-[0.96] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.9rem]">
            추천은 로그인 없이도 충분하고, 계정은 내 취향 기록을 남길 때만 쓰면 돼요.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--color-ink-soft)]">
            SooGo의 핵심은 목적지 탐색과 추천, 저장, 비교예요. 계정은 다녀온 여행 기록과 취향 모드를 남겨 다음 추천을 더 나답게 만드는 보조 루프예요.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">로그인 없이</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">탐색 · 추천 · 저장 · 비교</p>
            </div>
            <div className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">로그인 후</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">취향 모드와 방문 기록 누적</p>
            </div>
            <div className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">효과</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">다음 추천 결과가 더 빨라짐</p>
            </div>
          </div>
        </aside>

        <section className="compass-sheet rounded-[var(--radius-card)] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
            <p className="compass-editorial-kicker">계정 시작</p>
            <h2 className="mt-2 font-display text-[1.24rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.48rem]">
              {mode === "sign-up" ? "내 취향 기록을 시작해요." : "저장한 취향으로 다시 이어가요."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              {mode === "sign-up"
                ? "계정을 만들면 방문 기록과 탐색 모드를 저장해 다음 추천에 반영할 수 있어요."
                : "로그인하면 저장한 여행 기록과 취향 모드를 다시 불러와요."}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-b border-[color:var(--color-frame-soft)] pb-4">
            <button
              type="button"
              data-testid={testIds.auth.modeSignIn}
              onClick={() => {
                setMode("sign-in");
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em] ${mode === "sign-in" ? "compass-selected" : "compass-selection-chip"}`}
            >
              로그인
            </button>
            <button
              type="button"
              data-testid={testIds.auth.modeSignUp}
              onClick={() => {
                setMode("sign-up");
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em] ${mode === "sign-up" ? "compass-selected" : "compass-selection-chip"}`}
            >
              회원가입
            </button>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                <span>이름</span>
                <input
                  data-testid={testIds.auth.nameInput}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                  placeholder="예: 지훈"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-[var(--color-ink)]">
              <span>이메일</span>
              <input
                data-testid={testIds.auth.emailInput}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--color-ink)]">
              <span>비밀번호</span>
              <input
                data-testid={testIds.auth.passwordInput}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                placeholder="8자 이상 입력해 주세요"
              />
            </label>

            {error ? (
              <p
                data-testid={testIds.auth.error}
                className="compass-warning-card rounded-[calc(var(--radius-card)-10px)] px-4 py-3 text-sm leading-6"
              >
                {error}
              </p>
            ) : null}

            <div className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              로그인 없이도 추천 흐름은 그대로 사용할 수 있어요. 계정은 여행 기록과 취향을 남겨 다음 추천을 더 개인화하는 용도예요.
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                data-testid={testIds.auth.submit}
                type="submit"
                disabled={isSubmitting}
                className="compass-action-primary compass-soft-press rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "처리 중..."
                  : mode === "sign-up"
                    ? "계정 만들고 취향 기록 시작"
                    : "로그인하고 취향 이어보기"}
              </button>
              <Link
                href="/"
                className="text-sm leading-5 text-[var(--color-ink-soft)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4"
              >
                로그인 없이 추천 계속 보기
              </Link>
            </div>
          </form>
        </section>
      </div>
    </ExperienceShell>
  );
}
