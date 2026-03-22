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

/**
 * Extracts a readable error message from a Better Auth client response.
 * @param result Better Auth client response
 * @param fallback Fallback copy when the response has no message
 * @returns User-facing error text
 */
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

  /**
   * Submits the current auth form through Better Auth.
   * @param event Form submit event
   */
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
          setError(getAuthErrorMessage(result, "로그인하지 못했어요. 이메일과 비밀번호를 다시 확인해 주세요."));
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
    <ExperienceShell
      eyebrow=""
      title=""
      intro=""
      capsule=""
      hideHeader
      bareBody
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-start">
        <aside className="compass-panel compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-5 py-6 text-[var(--color-paper)] sm:px-6 sm:py-7 lg:px-7 lg:py-8">
          <p className="compass-editorial-kicker text-[var(--color-sand)]">선택형 identity</p>
          <h1 className="mt-3 font-display text-[1.5rem] leading-[0.98] tracking-[-0.035em] text-[var(--color-paper)] sm:text-[1.9rem]">
            로그인은 선택이고, 여행 기록을 남길 때만 더 깊은 개인화가 열려요.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--color-paper-soft)]">
            SooGo는 로그인 없이도 추천, 저장, 복원, 비교를 이어갈 수 있어요. 계정을 만들면 다녀온 여행의 결을 남겨 다음 shortlist를 더 내 취향에 가깝게 다듬을 수 있어요.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-4 py-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-paper-soft)]">기본 흐름</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-paper)]">로그인 없이 추천</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-paper-soft)]">바로 brief를 세우고 결과를 저장하고 비교할 수 있어요.</p>
            </div>
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-4 py-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-paper-soft)]">로그인 후</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-paper)]">여행 기록 반영</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-paper-soft)]">좋았던 목적지와 분위기를 남기면 추천의 방향이 더 정교해져요.</p>
            </div>
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-4 py-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-paper-soft)]">안심 포인트</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-paper)]">가벼운 계정 경험</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-paper-soft)]">추천의 핵심 흐름은 그대로 두고, 취향 메모만 더해지는 구조예요.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--color-paper)]">익명 사용 유지</span>
            <span className="rounded-full border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--color-paper)]">선택형 개인화</span>
          </div>
        </aside>

        <section className="compass-sheet compass-form-stage compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-card)] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
            <p className="compass-editorial-kicker">계정 워크스페이스</p>
            <h2 className="mt-2 font-display text-[1.28rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.48rem]">
              {mode === "sign-up" ? "여행 취향을 남길 준비를 해요." : "저장한 취향으로 다시 이어가요."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              {mode === "sign-up"
                ? "가벼운 계정을 만들면 여행 기록과 선호를 저장해 다음 추천에 반영할 수 있어요."
                : "이메일과 비밀번호로 들어오면 저장한 여행 기록과 선호를 다시 불러와요."}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 border-b border-[color:var(--color-frame-soft)] pb-4">
            <button
              type="button"
              data-testid={testIds.auth.modeSignIn}
              onClick={() => {
                setMode("sign-in");
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] ${mode === "sign-in" ? "compass-selected" : "compass-selection-chip"}`}
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
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] ${mode === "sign-up" ? "compass-selected" : "compass-selection-chip"}`}
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
                  className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3 placeholder:text-[var(--color-muted)]"
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
                className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3 placeholder:text-[var(--color-muted)]"
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
                className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3 placeholder:text-[var(--color-muted)]"
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
              로그인 없이도 추천 흐름은 그대로 사용할 수 있어요. 계정은 여행 이력과 선호를 남겨 다음 추천을 더 나답게 만드는 용도예요.
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                data-testid={testIds.auth.submit}
                type="submit"
                disabled={isSubmitting}
                className="compass-action-primary compass-soft-press rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "처리 중..."
                  : mode === "sign-up"
                    ? "계정 만들고 시작하기"
                    : "로그인하고 이어서 보기"}
              </button>
              <Link
                href="/"
                className="text-sm leading-5 text-[var(--color-ink-soft)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4"
              >
                아니면 로그인 없이 추천 계속 보기
              </Link>
            </div>
          </form>
        </section>
      </div>
    </ExperienceShell>
  );
}
