"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { testIds } from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";

type AccountSettingsExperienceProps = {
  userName: string;
};

export function AccountSettingsExperience({ userName }: AccountSettingsExperienceProps) {
  const router = useRouter();
  const [savedDisplayName, setSavedDisplayName] = useState(userName);
  const [displayName, setDisplayName] = useState(userName);
  const [error, setError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);

  async function handleSaveDisplayName() {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    setIsSavingName(true);
    setError(null);

    try {
      const result = await authClient.updateDisplayName(trimmedName);

      if (!result.ok) {
        throw new Error("account-name-update-failed");
      }

      const nextDisplayName = result.payload.data?.user.name ?? trimmedName;
      setSavedDisplayName(nextDisplayName);
      setDisplayName(nextDisplayName);
      router.refresh();
    } catch {
      setError("닉네임을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    setError(null);

    try {
      const result = await authClient.deleteAccount();

      if (!result.ok) {
        throw new Error("account-delete-failed");
      }

      setIsDeleteAccountDialogOpen(false);
      router.push("/?accountDeleted=1");
      router.refresh();
    } catch {
      setError("계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <ExperienceShell
      eyebrow=""
      title=""
      intro=""
      capsule=""
      hideHeader
    >
      <div data-testid={testIds.account.settingsRoot} className="mx-auto max-w-2xl space-y-6 px-4 pt-6 sm:px-5">
        {/* ── 헤더 ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            aria-label="내 여행으로 돌아가기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-frame-soft)] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-sand)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-[1.15rem] font-bold tracking-[-0.02em] text-[var(--color-ink)] sm:text-[1.25rem]">계정 설정</h1>
            <p className="text-[0.78rem] text-[var(--color-ink-soft)]">{savedDisplayName}님</p>
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3">
            <p className="text-sm text-[var(--color-warning-text)]">{error}</p>
          </div>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5">
          <div>
            <p className="text-[0.92rem] font-bold text-[var(--color-ink)]">닉네임</p>
            <p className="mt-1.5 text-[0.82rem] leading-6 text-[var(--color-ink-soft)]">
              회원가입할 때 자동으로 받은 닉네임도 여기서 바로 바꿀 수 있어요.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={60}
              data-testid={testIds.account.settingsNameInput}
              placeholder="닉네임을 입력해 주세요"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-[0.88rem] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-action-primary)] focus:bg-white"
            />
            <button
              type="button"
              data-testid={testIds.account.settingsNameSave}
              disabled={isSavingName || displayName.trim() === savedDisplayName.trim()}
              onClick={() => {
                void handleSaveDisplayName();
              }}
              className="rounded-xl bg-[var(--color-action-primary)] px-5 py-2.5 text-[0.82rem] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSavingName ? "저장 중..." : "저장"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5">
          <p className="text-[0.92rem] font-bold text-[var(--color-ink)]">개인정보처리방침</p>
          <p className="mt-1.5 text-[0.82rem] leading-6 text-[var(--color-ink-soft)]">
            수집 항목과 보관 방식, 계정 삭제 전 확인할 내용을 볼 수 있어요.
          </p>
          <Link
            href="/privacy"
            data-testid={testIds.account.privacyLink}
            className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--color-sand-deep)] transition-opacity hover:opacity-75"
          >
            보러 가기
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>

        <section className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5">
          <p className="text-[0.92rem] font-bold text-[var(--color-ink)]">계정 삭제</p>
          <p className="mt-1.5 text-[0.82rem] leading-6 text-[var(--color-ink-soft)]">
            계정을 삭제하면 로그인 정보와 여행 기록, 예정된 여행, 저장한 추천이 함께 지워져요.
          </p>

          {isDeleteAccountDialogOpen ? (
            <div
              data-testid={testIds.account.deleteAccountDialog}
              className="mt-4 rounded-xl border border-red-200 bg-red-50/50 px-4 py-4"
            >
              <p className="text-[0.84rem] font-semibold text-[var(--color-ink)]">
                정말 계정을 삭제할까요?
              </p>
              <p className="mt-1.5 text-[0.8rem] leading-6 text-[var(--color-ink-soft)]">
                삭제 후에는 로그인 정보와 개인 기록을 되돌릴 수 없어요.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid={testIds.account.deleteAccountCancel}
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteAccountDialogOpen(false)}
                  className="rounded-xl border border-[var(--color-frame-soft)] px-4 py-2 text-[0.8rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  type="button"
                  data-testid={testIds.account.deleteAccountConfirm}
                  disabled={isDeletingAccount}
                  onClick={() => {
                    void handleDeleteAccount();
                  }}
                  className="rounded-xl bg-red-500 px-4 py-2 text-[0.8rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingAccount ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid={testIds.account.deleteAccountOpen}
              onClick={() => setIsDeleteAccountDialogOpen(true)}
              className="mt-4 text-[0.82rem] font-semibold text-red-500 transition-opacity hover:opacity-75"
            >
              계정 삭제
            </button>
          )}
        </section>
      </div>
    </ExperienceShell>
  );
}
