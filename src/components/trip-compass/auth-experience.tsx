"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

/**
 * Renders the lightweight auth experience for optional Trip Compass identity.
 * @returns Sign-in and sign-up UI
 */
export function AuthExperience() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () =>
      mode === "sign-in"
        ? "여행 기억을 다시 불러오세요."
        : "취향과 여행 이력을 다음 추천까지 이어보세요.",
    [mode],
  );

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
      eyebrow="Trip Memory"
      title="로그인 없이 추천, 로그인하면 기억만 더해집니다."
      intro="Trip Compass의 핵심 추천 흐름은 그대로 익명으로 열려 있어요. 계정은 취향과 여행 이력을 이어붙여 다음 추천을 더 나답게 만드는 선택형 레이어예요."
      capsule="익명 추천 유지 · 계정은 선택 사항 · 한국어 중심 흐름"
      headerAside={
        <Link
          href="/"
          className="compass-panel compass-soft-press rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm leading-6 text-[var(--color-paper)]"
        >
          추천부터 먼저 둘러볼게요
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.22fr)]">
        <section className="space-y-6">
          <article className="instagram-card compass-stage-reveal rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
            <p className="compass-editorial-kicker text-[var(--color-paper)]">
              선택형 계정 레이어
            </p>
            <h2 className="font-display mt-6 text-4xl leading-none tracking-[-0.05em] text-[var(--color-paper)] sm:text-5xl">
              좋아했던 여행의 결을 다음 추천에 남겨둘 수 있어요.
            </h2>
            <div className="mt-6 space-y-3 text-sm leading-7 text-[var(--color-paper)]">
              <p>반복형, 균형형, 발견형 중 어떤 여행 감각인지 먼저 고를 수 있어요.</p>
              <p>다녀온 목적지의 만족도와 분위기 태그를 남겨 개인화 추천에 바로 반영해요.</p>
              <p>그래도 추천 탐색 자체는 계속 익명으로 사용할 수 있어 부담이 적어요.</p>
            </div>
          </article>

          <article className="compass-note compass-stage-reveal compass-stage-reveal-delayed rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
            <p className="compass-editorial-kicker">
              신뢰 우선 원칙
            </p>
            <div className="mt-4 grid gap-3">
              <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                추천 로직은 그대로 설명 가능하게 유지되고, 개인화는 동점 조정과 이유 문구에만 가볍게 더해져요.
              </div>
              <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                계정을 만들면 바로 여행 프로필 페이지로 이동해 선호와 방문 기록을 정리할 수 있어요.
              </div>
            </div>
          </article>
        </section>

        <section className="compass-panel compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
          <div className="flex flex-wrap gap-3 border-b border-[color:var(--color-frame)] pb-5">
            <button
              type="button"
              data-testid={testIds.auth.modeSignIn}
              onClick={() => {
                setMode("sign-in");
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] ${
                mode === "sign-in"
                  ? "compass-selected"
                  : "border border-[color:var(--color-frame)] text-[var(--color-paper)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-sand)]"
              }`}
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
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] ${
                mode === "sign-up"
                  ? "compass-selected"
                  : "border border-[color:var(--color-frame)] text-[var(--color-paper)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-sand)]"
              }`}
            >
              회원가입
            </button>
          </div>

          <div className="mt-5 max-w-2xl">
            <p className="compass-editorial-kicker text-[var(--color-sand)]">
              Optional Identity
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-paper)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-paper-soft)]">
              {mode === "sign-in"
                ? "저장해 둔 여행 선호와 방문 기록을 다시 불러와요."
                : "한 번만 계정을 만들면 다음부터는 여행 취향과 이력을 가볍게 이어서 관리할 수 있어요."}
            </p>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <label className="grid gap-2 text-sm text-[var(--color-paper)]">
                <span>이름</span>
                <input
                  data-testid={testIds.auth.nameInput}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                className="compass-form-field rounded-[calc(var(--radius-card)-10px)] px-4 py-3 placeholder:text-[var(--color-muted)]"
                placeholder="예: 지훈"
              />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-[var(--color-paper)]">
              <span>이메일</span>
              <input
                data-testid={testIds.auth.emailInput}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="compass-form-field rounded-[calc(var(--radius-card)-10px)] px-4 py-3 placeholder:text-[var(--color-muted)]"
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--color-paper)]">
              <span>비밀번호</span>
              <input
                data-testid={testIds.auth.passwordInput}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="compass-form-field rounded-[calc(var(--radius-card)-10px)] px-4 py-3 placeholder:text-[var(--color-muted)]"
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

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                data-testid={testIds.auth.submit}
                type="submit"
                disabled={isSubmitting}
                className="compass-action-primary compass-soft-press rounded-full px-5 py-3 text-sm font-semibold tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "처리 중..."
                  : mode === "sign-up"
                    ? "계정 만들고 시작하기"
                    : "로그인하고 이어서 보기"}
              </button>
              <Link
                href="/"
                className="text-sm leading-6 text-[var(--color-paper-soft)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4"
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
