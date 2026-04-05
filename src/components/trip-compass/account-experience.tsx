"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { buildApiUrl } from "@/lib/runtime/url";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type {
  ExplorationPreference,
  UserDestinationHistory,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";
import { formatVibeList } from "@/lib/trip-compass/presentation";
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
    description: "이미 다녀온 곳보다 새로운 후보를 조금 더 먼저 보여줘요.",
    testId: testIds.account.preferenceDiscover,
  },
];

function getTodayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildHistoryBody(draft: HistoryDraft) {
  return {
    destinationId: draft.destinationId,
    rating: draft.rating,
    tags: draft.tags,
    wouldRevisit: draft.wouldRevisit,
    visitedAt: new Date(`${draft.visitedAt}T00:00:00.000Z`).toISOString(),
  };
}

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

  const tasteSummary = useMemo(() => {
    const totalRating = historyEntries.reduce((sum, entry) => sum + entry.rating, 0);
    const revisitCount = historyEntries.filter((entry) => entry.wouldRevisit).length;
    const tagCounts = new Map<string, number>();

    for (const entry of historyEntries) {
      for (const tag of entry.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    return {
      averageRating: historyEntries.length > 0 ? (totalRating / historyEntries.length).toFixed(1) : "-",
      revisitCount,
      topTags: Array.from(tagCounts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4),
    };
  }, [historyEntries]);

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

  async function savePreference(explorationPreference: ExplorationPreference) {
    setIsSavingPreference(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl("/api/me/preferences"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ explorationPreference }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("preference-update-failed");
      }

      const payload = (await response.json()) as { profile: UserPreferenceProfile };
      setProfile(payload.profile);
    } catch {
      setError("취향 모드를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSavingPreference(false);
    }
  }

  async function createHistoryEntry() {
    setIsCreatingHistory(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl("/api/me/history"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildHistoryBody(draft)),
        credentials: "include",
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

  async function deleteHistoryEntry(historyId: string) {
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`/api/me/history/${historyId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("history-delete-failed");
      }

      setHistoryEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== historyId));
    } catch {
      setError("여행 이력을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <ExperienceShell
      eyebrow="내 취향"
      title="좋아했던 여행의 결을 쌓아 두면 다음 추천이 더 나답게 좁혀져요."
      intro="내 페이지는 설정 화면보다 가깝게, 취향과 방문 기록을 누적하는 공간이에요. 탐색 모드와 다녀온 곳만 정리해도 다음 추천 결과가 훨씬 또렷해져요."
      capsule="탐색 모드 · 방문 기록 · 별점 · 해시태그 · 재방문 의사"
      headerAside={
        <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
          <p className="compass-editorial-kicker">{userName}님의 취향 기록</p>
          <p className="mt-2.5 text-sm leading-6 text-[var(--color-ink-soft)]">
            지금은 {profile.explorationPreference} 모드예요. 남긴 기록 {historyEntries.length}개가 다음 추천의 출발점을 정리해 줘요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              평균 만족도 {tasteSummary.averageRating}
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              다시 가고 싶은 곳 {tasteSummary.revisitCount}개
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              홈으로
            </Link>
            <button
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              className="compass-action-primary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              로그아웃
            </button>
          </div>
        </div>
      }
    >
      <div data-testid={testIds.account.root} className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)]">
        <section className="space-y-4">
          <article data-testid={testIds.account.tasteSummary} className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-2.5 border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">취향 요약</p>
              <h2 className="font-display text-[1.16rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.34rem]">
                취향이 쌓일수록 홈에서 바로 좁혀지는 후보가 더 또렷해져요.
              </h2>
            </div>

            <div className="compass-fact-grid-compact mt-3.5 xl:grid-cols-2">
              <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">탐색 모드</p>
                <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{profile.explorationPreference}</p>
              </article>
              <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">방문 기록</p>
                <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{historyEntries.length}개</p>
              </article>
              <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">평균 만족도</p>
                <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{tasteSummary.averageRating}</p>
              </article>
              <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">자주 남긴 해시태그</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                  {tasteSummary.topTags.length > 0
                    ? tasteSummary.topTags.map(([tag]) => formatVibeList([tag])).join(" · ")
                    : "아직 없어요"}
                </p>
              </article>
            </div>
          </article>

          <article data-testid={testIds.account.tasteMode} className="compass-sheet rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">탐색 모드</p>
              <h2 className="mt-1.5 font-display text-[1.12rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.28rem]">
                익숙한 추천을 더 볼지, 새로운 추천을 더 넓힐지 정해 보세요.
              </h2>
            </div>

            <div className="mt-3.5 grid gap-2.5">
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
                      active ? "compass-selected" : "compass-selection-chip"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{option.label}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="compass-sheet rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">새 방문 기록 추가</p>
              <h2 className="mt-1.5 font-display text-[1.12rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.28rem]">
                별점, 해시태그, 재방문 의사를 남겨 다음 추천에 연결하세요.
              </h2>
            </div>

            <div className="mt-3.5 grid gap-3.5">
              <label className="grid gap-2 text-sm text-[var(--color-ink)]">
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
                  className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                >
                  {launchCatalog.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.nameKo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[var(--color-ink)]">
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
                  className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">별점</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setDraft((currentDraft) => ({ ...currentDraft, rating }))}
                      className={`rounded-[calc(var(--radius-card)-10px)] px-3 py-3 text-sm font-semibold ${
                        draft.rating === rating ? "compass-selected" : "compass-selection-chip"
                      }`}
                    >
                      {rating}점
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">해시태그</p>
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
                        className={`rounded-full px-3 py-2 text-xs font-semibold ${
                          active ? "compass-selected" : "compass-selection-chip"
                        }`}
                      >
                        #{formatVibeList([tag])}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="compass-open-info flex items-center gap-3 rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm text-[var(--color-ink)]">
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
                이 목적지는 다음에도 다시 가고 싶은 쪽에 가까워요.
              </label>

              <div data-testid={testIds.account.historySave0}>
                <button
                  type="button"
                  data-testid={testIds.account.newHistorySubmit}
                  disabled={isCreatingHistory}
                  onClick={() => {
                    void createHistoryEntry();
                  }}
                  className="compass-action-primary compass-soft-press rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingHistory ? "저장 중..." : "내 취향에 기록 저장"}
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          {error ? (
            <p className="compass-warning-card rounded-[var(--radius-card)] px-4 py-3.5 text-sm leading-6">
              {error}
            </p>
          ) : null}

          <article className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">방문 기록</p>
              <h2 className="mt-1.5 font-display text-[1.16rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.34rem]">
                다녀온 여행지의 감각이 다음 후보를 더 정확하게 좁히는 기준이 돼요.
              </h2>
            </div>

            <div className="mt-3.5 grid gap-3">
              {historyEntries.length > 0 ? (
                historyEntries.map((entry, index) => {
                  const destination = launchCatalog.find((item) => item.id === entry.destinationId);

                  return (
                    <article
                      key={entry.id}
                      data-testid={getAccountHistoryEntryTestId(index)}
                      className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="compass-editorial-kicker">{destination?.nameKo ?? entry.destinationId}</p>
                          <p className="mt-1.5 font-display text-[1rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                            {destination?.nameEn ?? entry.destinationId}
                          </p>
                          <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink)]">
                            평점 {entry.rating}점 · 방문일 {entry.visitedAt.slice(0, 10)}
                          </p>
                          <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                            {entry.wouldRevisit
                              ? "다음 추천에서 익숙한 결을 이어가는 쪽으로 반영돼요."
                              : "다음 추천에서 새로운 후보를 더 넓게 보는 기준으로 반영돼요."}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={`${entry.id}-${tag}`}
                                className="compass-metric-pill rounded-full px-3 py-1 text-xs font-semibold"
                              >
                                #{formatVibeList([tag])}
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
                          className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="compass-note rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                  아직 남겨 둔 방문 기록이 없어요. 한 곳만 먼저 남겨도 다음 추천이 더 개인 취향에 가까워져요.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </ExperienceShell>
  );
}
