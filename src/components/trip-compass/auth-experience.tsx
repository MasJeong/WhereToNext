"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { brandDisplayName } from "@/lib/brand";
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
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgb(74_180_255_/_0.18),_transparent_68%)]" />
            <div className="relative h-18 w-18 rounded-[1.6rem] bg-[linear-gradient(180deg,rgb(86_187_255),rgb(30_136_229))] shadow-[0_16px_34px_rgb(30_136_229_/_0.16)]">
              <span className="absolute left-1/2 top-3.5 h-7 w-7 -translate-x-1/2 rounded-full border-[3px] border-white" />
              <span className="absolute left-1/2 top-7 h-8 w-[3px] -translate-x-1/2 rounded-full bg-white" />
              <span className="absolute left-1/2 top-4 h-9 w-[3px] -translate-x-1/2 rotate-45 rounded-full bg-white" />
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
              {brandDisplayName}
            </p>
            <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.03] tracking-[-0.05em] text-[var(--color-ink)] sm:text-[2.15rem]">
              {mode === "sign-up" ? "여행 기록을 시작해요" : "기록을 불러와 이어볼까요?"}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[0.93rem] leading-6 text-[var(--color-ink-soft)]">
              {mode === "sign-up"
                ? "계정을 만들면 저장한 여행 기록과 취향을 다음 추천에 이어서 반영할 수 있어요."
                : "로그인하면 저장한 여행 기록과 취향 모드를 다시 불러올 수 있어요."}
            </p>
          </div>

          <div className="mx-auto mt-6 inline-flex rounded-full border border-[color:var(--color-frame-soft)] bg-white p-1 shadow-[var(--shadow-paper)]">
            <button
              type="button"
              data-testid={testIds.auth.modeSignIn}
              onClick={() => {
                setMode("sign-in");
                setError(null);
              }}
              className={`min-w-[7rem] rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.01em] ${
                mode === "sign-in" ? "bg-[var(--color-action-primary)] text-white shadow-[0_10px_20px_rgb(11_99_206_/_0.16)]" : "text-[var(--color-ink-soft)]"
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
              className={`min-w-[7rem] rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.01em] ${
                mode === "sign-up" ? "bg-[var(--color-action-primary)] text-white shadow-[0_10px_20px_rgb(11_99_206_/_0.16)]" : "text-[var(--color-ink-soft)]"
              }`}
            >
              회원가입
            </button>
          </div>

          <form className="mt-6 grid gap-3 text-left" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                <span className="font-medium">이름</span>
                <input
                  data-testid={testIds.auth.nameInput}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="compass-form-field-light rounded-[1.1rem] px-4 py-3.5"
                  placeholder="예: 지훈"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-[var(--color-ink)]">
              <span className="font-medium">이메일</span>
              <input
                data-testid={testIds.auth.emailInput}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="compass-form-field-light rounded-[1.1rem] px-4 py-3.5"
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--color-ink)]">
              <span className="font-medium">비밀번호</span>
              <input
                data-testid={testIds.auth.passwordInput}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="compass-form-field-light rounded-[1.1rem] px-4 py-3.5"
                placeholder="8자 이상 입력해 주세요"
              />
            </label>

            {error ? (
              <p
                data-testid={testIds.auth.error}
                className="compass-warning-card rounded-[1.1rem] px-4 py-3 text-sm leading-6"
              >
                {error}
              </p>
            ) : null}

            <button
              data-testid={testIds.auth.submit}
              type="submit"
              disabled={isSubmitting}
              className="compass-action-primary compass-soft-press mt-1 min-h-[3.35rem] rounded-[1.1rem] px-5 py-3 text-sm font-semibold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "처리 중..." : mode === "sign-up" ? "계정 만들기" : "이메일로 로그인"}
            </button>
          </form>

            <div className="mt-5 space-y-2.5">
              <p className="text-[0.93rem] leading-6 text-[var(--color-ink-soft)]">
                로그인 없이도 추천, 저장, 비교는 그대로 사용할 수 있어요.
              </p>
            <Link
              href="/"
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
