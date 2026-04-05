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
  const [error, setError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);

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
      eyebrow="계정 설정"
      title={`${userName}님의 계정 설정`}
      intro="정책을 확인하고, 필요할 때만 계정 삭제를 진행할 수 있어요."
      capsule=""
      headerAside={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/account"
            className="compass-action-secondary compass-soft-press rounded-full px-5 py-2.5 text-[0.8rem] font-semibold"
          >
            내 여행으로
          </Link>
        </div>
      }
    >
      <div data-testid={testIds.account.settingsRoot} className="mx-auto max-w-3xl space-y-4">
        {error ? (
          <div role="alert" className="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3">
            <p className="text-sm text-[var(--color-warning-text)]">{error}</p>
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5">
          <p className="text-[0.95rem] font-bold text-[var(--color-ink)]">개인정보처리방침</p>
          <p className="mt-2 text-[0.84rem] leading-6 text-[var(--color-ink-soft)]">
            수집 항목과 보관 방식, 계정 삭제 전 확인할 내용을 볼 수 있어요.
          </p>
          <Link
            href="/privacy"
            data-testid={testIds.account.privacyLink}
            className="mt-4 inline-flex rounded-full border border-[var(--color-frame-soft)] px-4 py-2 text-[0.8rem] font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)]"
          >
            개인정보처리방침 보기
          </Link>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50/60 px-5 py-5">
          <p className="text-[0.95rem] font-bold text-[var(--color-ink)]">계정 삭제</p>
          <p className="mt-2 text-[0.84rem] leading-6 text-[var(--color-ink-soft)]">
            계정을 삭제하면 로그인 정보와 여행 기록, 예정된 여행, 저장한 추천이 함께 지워져요.
          </p>

          {isDeleteAccountDialogOpen ? (
            <div
              data-testid={testIds.account.deleteAccountDialog}
              className="mt-4 rounded-2xl border border-red-200 bg-white px-4 py-4"
            >
              <p className="text-[0.84rem] font-semibold text-[var(--color-ink)]">
                정말 계정을 삭제할까요?
              </p>
              <p className="mt-2 text-[0.8rem] leading-6 text-[var(--color-ink-soft)]">
                삭제 후에는 로그인 정보와 개인 기록을 되돌릴 수 없어요.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid={testIds.account.deleteAccountCancel}
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteAccountDialogOpen(false)}
                  className="rounded-full border border-[var(--color-frame-soft)] px-4 py-2 text-[0.8rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="rounded-full bg-red-500 px-4 py-2 text-[0.8rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingAccount ? "삭제 중..." : "계정 삭제 계속"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid={testIds.account.deleteAccountOpen}
              onClick={() => setIsDeleteAccountDialogOpen(true)}
              className="mt-4 rounded-full border border-red-300 px-4 py-2 text-[0.8rem] font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              계정 삭제
            </button>
          )}
        </section>
      </div>
    </ExperienceShell>
  );
}
