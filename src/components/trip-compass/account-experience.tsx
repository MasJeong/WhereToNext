"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type {
  ExplorationPreference,
  UserDestinationHistory,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";
import { getAccountHistoryDeleteTestId, getAccountHistoryEntryTestId, testIds } from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";

type AccountExperienceProps = {
  userName: string;
  initialProfile: UserPreferenceProfile;
  initialHistory: UserDestinationHistory[];
};

type HistoryDraft = {
  destinationId: string;
  rating: number;
  tags: UserDestinationHistory["tags"];
  wouldRevisit: boolean;
  visitedAt: string;
};

const preferenceOptions: Array<{
  value: ExplorationPreference;
  label: string;
  description: string;
  testId: string;
}> = [
  {
    value: "repeat",
    label: "반복형",
    description: "좋았던 여행 감각을 다음 추천에서 더 강하게 이어가요.",
    testId: testIds.account.preferenceRepeat,
  },
  {
    value: "balanced",
    label: "균형형",
    description: "익숙한 취향과 새로운 후보를 자연스럽게 섞어 보여줘요.",
    testId: testIds.account.preferenceBalanced,
  },
  {
    value: "discover",
    label: "발견형",
    description: "이미 다녀온 곳보다는 새로운 후보를 조금 더 먼저 보여줘요.",
    testId: testIds.account.preferenceDiscover,
  },
];

/**
 * 오늘 날짜를 date input 값으로 만든다.
 * @returns YYYY-MM-DD 형식 문자열
 */
function getTodayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 여행 이력 draft를 API 입력 형식으로 변환한다.
 * @param draft 현재 폼 상태
 * @returns API 요청 바디
 */
function buildHistoryBody(draft: HistoryDraft) {
  return {
    destinationId: draft.destinationId,
    rating: draft.rating,
    tags: draft.tags,
    wouldRevisit: draft.wouldRevisit,
    visitedAt: new Date(`${draft.visitedAt}T00:00:00.000Z`).toISOString(),
  };
}

/**
 * 여행 프로필 관리 화면을 렌더링한다.
 * @param props 서버에서 내려준 사용자/선호/이력 데이터
 * @returns 계정 관리 경험 화면
 */
export function AccountExperience({
  userName,
  initialProfile,
  initialHistory,
}: AccountExperienceProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [historyEntries, setHistoryEntries] = useState(initialHistory);
  const [draft, setDraft] = useState<HistoryDraft>({
    destinationId: launchCatalog[0]?.id ?? "tokyo",
    rating: 5,
    tags: ["city"],
    wouldRevisit: false,
    visitedAt: getTodayValue(),
  });
  const [error, setError] = useState<string | null>(null);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [isCreatingHistory, setIsCreatingHistory] = useState(false);

  /**
   * 여행 이력 태그 선택을 토글한다.
   * @param tag 분위기 태그
   */
  function toggleDraftTag(tag: UserDestinationHistory["tags"][number]) {
    setDraft((currentDraft) => {
      if (currentDraft.tags.includes(tag)) {
        const nextTags = currentDraft.tags.filter((item) => item !== tag);
        return { ...currentDraft, tags: nextTags.length > 0 ? nextTags : currentDraft.tags };
      }

      if (currentDraft.tags.length >= 4) {
        return currentDraft;
      }

      return { ...currentDraft, tags: [...currentDraft.tags, tag] };
    });
  }

  /**
   * 사용자의 반복/발견 선호를 저장한다.
   * @param explorationPreference 새 선호값
   */
  async function savePreference(explorationPreference: ExplorationPreference) {
    setIsSavingPreference(true);
    setError(null);

    try {
      const response = await fetch("/api/me/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ explorationPreference }),
      });

      if (!response.ok) {
        throw new Error("preference-update-failed");
      }

      const payload = (await response.json()) as { profile: UserPreferenceProfile };
      setProfile(payload.profile);
    } catch {
      setError("여행 선호를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSavingPreference(false);
    }
  }

  /**
   * 새 여행 이력을 저장한다.
   */
  async function createHistoryEntry() {
    setIsCreatingHistory(true);
    setError(null);

    try {
      const response = await fetch("/api/me/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildHistoryBody(draft)),
      });

      if (!response.ok) {
        throw new Error("history-create-failed");
      }

      const payload = (await response.json()) as { historyEntry: UserDestinationHistory };
      setHistoryEntries((currentEntries) => [payload.historyEntry, ...currentEntries]);
    } catch {
      setError("여행 이력을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCreatingHistory(false);
    }
  }

  /**
   * 기존 여행 이력을 삭제한다.
   * @param historyId 삭제할 이력 ID
   */
  async function deleteHistoryEntry(historyId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/me/history/${historyId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("history-delete-failed");
      }

      setHistoryEntries((currentEntries) =>
        currentEntries.filter((entry) => entry.id !== historyId),
      );
    } catch {
      setError("여행 이력을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  /**
   * 현재 사용자를 로그아웃한다.
   */
  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <ExperienceShell
      eyebrow="Travel Profile"
      title="다녀온 여행의 취향을 남겨 다음 추천까지 연결해 보세요."
      intro="좋았던 여행지와 분위기를 남겨두면 Trip Compass가 익숙한 취향과 새로운 후보의 균형을 더 잘 맞춰줘요."
      capsule="익명 추천 유지 · 로그인은 선택 · 개인화는 가볍게"
      headerAside={
        <div className="compass-panel rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm text-[var(--color-paper)] sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker text-[var(--color-sand)]">
            {userName}님의 여행 기억
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em]"
            >
              홈으로
            </Link>
            <button
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              className="compass-action-primary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em]"
            >
              로그아웃
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
        <section className="space-y-6">
          <article className="instagram-card compass-stage-reveal rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
            <p className="compass-editorial-kicker text-[var(--color-paper)]">
              여행 선호 모드
            </p>
            <div className="mt-6 grid gap-3">
              {preferenceOptions.map((option) => {
                const active = profile.explorationPreference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={option.testId}
                    disabled={isSavingPreference}
                    onClick={() => {
                      void savePreference(option.value);
                    }}
                    className={`rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-left ${
                      active
                        ? "compass-selected"
                        : "border border-[color:var(--color-frame)] bg-[color:rgb(247_239_226_/_0.08)] text-[var(--color-paper)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-sand)]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className={`mt-2 text-xs leading-5 ${active ? "text-[var(--color-ink-soft)]" : "text-[var(--color-paper)]"}`}>
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="compass-card compass-stage-reveal compass-stage-reveal-delayed rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
            <p className="compass-editorial-kicker text-[var(--color-sand)]">
              새 여행 기록 추가
            </p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-paper)]">
                <span>방문한 목적지</span>
                <select
                  data-testid={testIds.account.newHistoryDestination}
                  value={draft.destinationId}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      destinationId: event.target.value,
                    }))
                  }
                  className="compass-form-field rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                >
                  {launchCatalog.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.nameKo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[var(--color-paper)]">
                <span>방문 날짜</span>
                <input
                  data-testid={testIds.account.newHistoryDate}
                  type="date"
                  value={draft.visitedAt}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      visitedAt: event.target.value,
                    }))
                  }
                  className="compass-form-field rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-5">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setDraft((currentDraft) => ({ ...currentDraft, rating }))}
                    className={`rounded-[calc(var(--radius-card)-10px)] px-3 py-3 text-sm font-semibold ${
                      draft.rating === rating
                        ? "compass-selected"
                        : "border border-[color:var(--color-frame)] text-[var(--color-paper)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-sand)]"
                    }`}
                  >
                    {rating}점
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-[var(--color-paper)]">어떤 분위기로 기억하나요?</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    "city",
                    "nature",
                    "food",
                    "shopping",
                    "beach",
                    "culture",
                    "nightlife",
                    "romance",
                  ] as const).map((tag) => {
                    const active = draft.tags.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDraftTag(tag)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          active
                            ? "compass-selected"
                            : "border border-[color:var(--color-frame)] text-[var(--color-paper)] transition hover:-translate-y-0.5 hover:border-[color:var(--color-sand)]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="compass-form-field flex items-center gap-3 rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm text-[var(--color-paper)]">
                <input
                  className="compass-checkbox"
                  type="checkbox"
                  checked={draft.wouldRevisit}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      wouldRevisit: event.target.checked,
                    }))
                  }
                />
                이 여행은 다시 가고 싶은 쪽에 가까워요.
              </label>

              <button
                type="button"
                data-testid={testIds.account.newHistorySubmit}
                disabled={isCreatingHistory}
                onClick={() => {
                  void createHistoryEntry();
                }}
                className="compass-action-primary compass-soft-press rounded-full px-5 py-3 text-sm font-semibold tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingHistory ? "저장 중..." : "여행 기록 저장"}
              </button>
            </div>
          </article>
        </section>

        <section className="space-y-6">
          <article className="compass-desk compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8">
            <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame)] pb-5">
              <p className="compass-editorial-kicker">
                저장한 여행 이력
              </p>
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
                좋았던 여행지의 결을 다음 추천의 기준으로 남겨요.
              </h2>
            </div>

            {error ? (
              <p className="compass-warning-card mt-5 rounded-[calc(var(--radius-card)-10px)] px-4 py-3 text-sm leading-6">
                {error}
              </p>
            ) : null}

            <div className="mt-5 grid gap-4">
              {historyEntries.length > 0 ? (
                historyEntries.map((entry, index) => {
                  const destination = launchCatalog.find(
                    (item) => item.id === entry.destinationId,
                  );

                  return (
                    <article
                      key={entry.id}
                      data-testid={getAccountHistoryEntryTestId(index)}
                      className="compass-sheet compass-lift-card rounded-[calc(var(--radius-card)-10px)] p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="compass-editorial-kicker">
                            {destination?.nameKo ?? entry.destinationId}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
                            평점 {entry.rating}점 · 방문일 {entry.visitedAt.slice(0, 10)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                            {entry.wouldRevisit
                              ? "이 결의 여행은 다시 가고 싶은 쪽으로 반영돼요."
                              : "새로운 여행지를 더 넓게 찾는 기준으로 반영돼요."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={`${entry.id}-${tag}`}
                                className="compass-metric-pill rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid={getAccountHistoryDeleteTestId(index)}
                          onClick={() => {
                            void deleteHistoryEntry(entry.id);
                          }}
                          className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em]"
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="compass-note rounded-[calc(var(--radius-card)-10px)] p-5 text-sm leading-7 text-[var(--color-ink-soft)]">
                  아직 남겨 둔 여행 이력이 없어요. 왼쪽에서 한 곳만 먼저 추가해도 다음 추천이 더 개인 취향에 가까워져요.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </ExperienceShell>
  );
}
