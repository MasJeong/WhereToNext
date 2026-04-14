"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { testIds } from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";

type AuthIntent = "save" | "share" | "account" | "default";
type Provider = "kakao" | "google" | "apple";
type ExistingProvider = Provider | "credentials";

type ProviderCta = {
  id: Provider;
  label: string;
  testId: string;
};

const lastAuthProviderStorageKey = "last-auth-provider";

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
      title: "추천 결과를 저장할까요?",
      intro: "로그인하면 저장한 여행을 언제든 다시 볼 수 있어요.",
    };
  }

  if (intent === "share") {
    return {
      title: "여행 카드를 공유하려면",
      intro: "로그인 후 공유 링크를 만들 수 있어요.",
    };
  }

  if (intent === "account") {
    return {
      title: "내 여행 기록 보기",
      intro: "로그인하면 저장한 추천과 취향 기록을 볼 수 있어요.",
    };
  }

  return {
    title: "로그인하고\n여행을 이어가세요",
    intro: "저장, 공유, 취향 기록을 한곳에서 관리할 수 있어요.",
  };
}

function getSafeAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  const normalized = errorCode.toLowerCase();

  if (normalized.includes("collision") || normalized.includes("mismatch")) {
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

function readLastAuthProvider(): Provider | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(lastAuthProviderStorageKey);
  return stored === "kakao" || stored === "google" || stored === "apple" ? stored : null;
}

function rememberLastAuthProvider(provider: Provider) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(lastAuthProviderStorageKey, provider);
}

function getSuggestedProvider(
  existingProvider: ExistingProvider | null,
  rememberedProvider: Provider | null,
): Provider | null {
  if (
    existingProvider === "kakao" ||
    existingProvider === "google" ||
    existingProvider === "apple"
  ) {
    return existingProvider;
  }

  return rememberedProvider;
}

function getSuggestedProviderChip(
  provider: Provider,
  existingProvider: ExistingProvider | null,
  rememberedProvider: Provider | null,
): string | null {
  if (provider === existingProvider) {
    return "이 계정에 맞는 로그인 방식";
  }

  if (provider === rememberedProvider) {
    return "지난번에 사용한 방식";
  }

  return null;
}

const providerBrandColors: Record<Provider, { bg: string; text: string; icon: string; border: string }> = {
  kakao: { bg: "#F7E025", text: "#1A1A1A", icon: "#1A1A1A", border: "rgb(200 180 20 / 0.3)" },
  google: { bg: "#ffffff", text: "#3c4043", icon: "#4285F4", border: "rgb(218 220 224)" },
  apple: { bg: "#000000", text: "#ffffff", icon: "#ffffff", border: "#000000" },
};

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "kakao") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          fill="currentColor"
          d="M12 4.5c-4.7 0-8.5 2.95-8.5 6.6 0 2.33 1.58 4.37 3.97 5.54l-.99 3.51a.42.42 0 0 0 .64.46l4.21-2.77c.22.01.44.02.67.02 4.69 0 8.5-2.96 8.5-6.6S16.69 4.5 12 4.5Z"
        />
      </svg>
    );
  }

  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path fill="#4285F4" d="M20.28 12.23c0-.63-.06-1.23-.16-1.81H12v3.43h4.64a3.95 3.95 0 0 1-1.72 2.6v2.17h2.78c1.63-1.5 2.58-3.72 2.58-6.39Z" />
        <path fill="#34A853" d="M12 20.5c2.33 0 4.28-.77 5.7-2.08l-2.78-2.17c-.78.52-1.77.83-2.92.83-2.25 0-4.15-1.52-4.83-3.56H4.29v2.23A8.5 8.5 0 0 0 12 20.5Z" />
        <path fill="#FBBC05" d="M7.17 13.52a5.05 5.05 0 0 1 0-3.04V8.25H4.29a8.5 8.5 0 0 0 0 7.5l2.88-2.23Z" />
        <path fill="#EA4335" d="M12 6.92c1.27 0 2.41.44 3.3 1.29l2.47-2.47C16.27 4.31 14.32 3.5 12 3.5a8.5 8.5 0 0 0-7.71 4.75l2.88 2.23c.68-2.04 2.58-3.56 4.83-3.56Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M16.71 12.59c0-2.02 1.65-2.99 1.72-3.03-.94-1.37-2.4-1.56-2.91-1.58-1.23-.13-2.42.73-3.05.73-.65 0-1.63-.71-2.68-.69-1.38.02-2.65.8-3.36 2.04-1.44 2.49-.37 6.17 1.03 8.2.69.99 1.51 2.09 2.6 2.05 1.04-.05 1.43-.66 2.69-.66s1.61.66 2.71.64c1.12-.02 1.82-1 2.5-2 .79-1.14 1.11-2.25 1.12-2.31-.03-.01-2.37-.91-2.37-3.39Zm-1.93-5.85c.56-.68.94-1.61.84-2.55-.81.03-1.79.54-2.37 1.21-.52.6-.98 1.56-.86 2.48.91.07 1.83-.46 2.39-1.14Z"
      />
    </svg>
  );
}

/* Animated compass needle */
function AnimatedCompassIcon() {
  return (
    <div className="relative mx-auto h-28 w-28">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgb(30 136 229 / 0.12), transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main circle */}
      <div className="absolute inset-3 rounded-full bg-gradient-to-b from-[#56bbff] to-[#1e88e5] shadow-[0_12px_32px_rgb(30_136_229_/_0.22)]">
        {/* Compass ring */}
        <div className="absolute inset-2.5 rounded-full border-2 border-white/30" />

        {/* Animated needle */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: [0, 15, -10, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        >
          {/* North needle */}
          <div className="absolute top-[18%] h-[32%] w-[3px] rounded-full bg-white shadow-sm" />
          {/* South needle */}
          <div className="absolute bottom-[18%] h-[32%] w-[3px] rounded-full bg-white/40" />
        </motion.div>

        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(255_212_72)] shadow-[0_0_0_3px_rgb(255_212_72_/_0.2)]" />

        {/* Cardinal markers */}
        <span className="absolute left-1/2 top-[10%] -translate-x-1/2 text-[0.5rem] font-bold text-white/70">N</span>
        <span className="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-[0.5rem] font-bold text-white/30">S</span>
        <span className="absolute left-[10%] top-1/2 -translate-y-1/2 text-[0.5rem] font-bold text-white/30">W</span>
        <span className="absolute right-[10%] top-1/2 -translate-y-1/2 text-[0.5rem] font-bold text-white/30">E</span>
      </div>
    </div>
  );
}

export function AuthExperience() {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const [rememberedProvider] = useState<Provider | null>(() => readLastAuthProvider());
  const next = searchParams.get("next");
  const intent = normalizeIntent(searchParams.get("intent"));
  const mockCase = searchParams.get("mockCase");
  const errorCode = searchParams.get("error") ?? searchParams.get("code");
  const existingProvider = (searchParams.get("existingProvider") as ExistingProvider | null) ?? null;
  const authError = getSafeAuthErrorMessage(errorCode);
  const heading = buildAuthHeading(intent);

  const suggestedProvider = getSuggestedProvider(existingProvider, rememberedProvider);
  const providerCtaList = suggestedProvider
    ? [
        ...providerCtas.filter((provider) => provider.id === suggestedProvider),
        ...providerCtas.filter((provider) => provider.id !== suggestedProvider),
      ]
    : providerCtas;
  const fallbackReturnBanner = existingProvider === "credentials"
    ? "이 계정은 이전에 이메일로 로그인했어요. 이메일 로그인으로 다시 이어 주세요."
    : null;

  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center px-4 py-8 sm:px-6">
        <motion.section
          className="w-full text-center"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Animated compass logo */}
          <AnimatedCompassIcon />

          {/* Header */}
          <motion.div
            className="mt-6"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <h1 className="whitespace-pre-line text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[2.15rem]">
              {heading.title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[0.93rem] leading-6 text-[var(--color-ink-soft)]">
              {heading.intro}
            </p>
          </motion.div>

          {fallbackReturnBanner ? (
            <p
              data-testid={testIds.auth.returnBanner}
              className="mt-4 rounded-[1.1rem] border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-left text-sm leading-6 text-[var(--color-ink)]"
            >
              {fallbackReturnBanner}
            </p>
          ) : null}

          {authError ? (
            <p className="compass-warning-card mt-4 rounded-[1.1rem] px-4 py-3 text-left text-sm leading-6">
              {authError}
            </p>
          ) : null}

          <motion.div
            className="mt-7 grid gap-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          >
            {providerCtaList.map((provider, index) => {
              const brand = providerBrandColors[provider.id];
              const isSuggested = provider.id === suggestedProvider;
              const suggestedChip = getSuggestedProviderChip(
                provider.id,
                existingProvider,
                rememberedProvider,
              );
              const isFirstNonSuggested = !isSuggested && index === 1 && suggestedProvider;
              return (
                <motion.div
                  key={provider.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + index * 0.08, ease: "easeOut" }}
                >
                  {/* 추천 provider와 나머지 사이 구분선 */}
                  {isFirstNonSuggested ? (
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[var(--color-frame-soft)]" />
                      <span className="text-[0.7rem] text-[var(--color-ink-soft)]">또는</span>
                      <div className="h-px flex-1 bg-[var(--color-frame-soft)]" />
                    </div>
                  ) : null}

                  {/* 추천 provider 배지 */}
                  {isSuggested && suggestedChip ? (
                    <p
                      id={`${provider.id}-provider-hint`}
                      className="mb-2 text-[0.75rem] font-semibold text-[var(--color-sand-deep)]"
                    >
                      {suggestedChip}
                    </p>
                  ) : null}

                  <Link
                    href={buildProviderHref(provider.id, next, intent, mockCase)}
                    data-testid={provider.testId}
                    onClick={() => rememberLastAuthProvider(provider.id)}
                    aria-describedby={isSuggested && suggestedChip ? `${provider.id}-provider-hint` : undefined}
                    className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                      isSuggested
                        ? "ring-2 ring-[var(--color-action-primary)] ring-offset-2"
                        : ""
                    }`}
                    style={{
                      backgroundColor: brand.bg,
                      color: brand.text,
                      borderColor: brand.border,
                    }}
                  >
                    <span style={{ color: brand.icon }}>
                      <ProviderIcon provider={provider.id} />
                    </span>
                    <span className="text-[0.95rem] font-semibold leading-6">
                      {provider.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Continue without login */}
          <motion.div
            className="mt-6"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
          >
            <Link
              href={buildContinueHref(next)}
              className="inline-flex items-center text-[0.85rem] font-medium text-[var(--color-ink-soft)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
            >
              로그인 없이 계속 보기
            </Link>
          </motion.div>
        </motion.section>
      </div>
    </ExperienceShell>
  );
}
