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
      <div className="grid gap-3 xl:items-start">
        <section className="compass-sheet compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-card)] px-5 py-4 sm:px-6 sm:py-5 lg:px-6 lg:py-5 xl:max-w-3xl">
          <div className="flex flex-wrap gap-3 border-b border-[color:var(--color-frame-soft)] pb-4">
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

          <div className="mt-4 max-w-2xl">
            <h2 className="text-[1.2rem] font-semibold leading-tight text-[var(--color-ink)] sm:text-[1.35rem]">로그인</h2>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
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
                className="text-sm leading-6 text-[var(--color-ink-soft)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4"
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
