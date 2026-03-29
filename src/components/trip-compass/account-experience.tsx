"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type {
  ExplorationPreference,
  RecommendationSnapshot,
  UserDestinationHistory,
  UserFutureTrip,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";
import {
  getAccountFutureTripDeleteTestId,
  getAccountFutureTripEntryTestId,
  getAccountHistoryDeleteTestId,
  getAccountHistoryEditTestId,
  getAccountHistoryEntryTestId,
  getSavedSnapshotTestId,
  testIds,
} from "@/lib/test-ids";
import { formatVibeList } from "@/lib/trip-compass/presentation";

import { ExperienceShell } from "./experience-shell";

type AccountTab = "history" | "future-trips" | "saved" | "preferences";

type AccountExperienceProps = {
  userName: string;
  initialTab: AccountTab;
  initialProfile: UserPreferenceProfile;
  initialHistory: UserDestinationHistory[];
  initialFutureTrips: UserFutureTrip[];
  initialSavedSnapshots: Array<{
    id: string;
    createdAt: string;
    payload: RecommendationSnapshot;
  }>;
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

/**
 * 여행 기록의 목적지 표시 이름을 만든다.
 * @param destinationId 목적지 ID
 * @returns 한국어/영문 이름
 */
function findDestinationCopy(destinationId: string) {
  const destination = launchCatalog.find((item) => item.id === destinationId);
  return {
    nameKo: destination?.nameKo ?? destinationId,
    nameEn: destination?.nameEn ?? destinationId,
  };
}

function findFutureTripCopy(futureTrip: UserFutureTrip) {
  const destination = launchCatalog.find((item) => item.id === futureTrip.destinationId);
  return {
    nameKo: destination?.nameKo ?? futureTrip.destinationNameKo,
    nameEn: destination?.nameEn ?? futureTrip.destinationId,
  };
}

/**
 * 날짜 문자열을 화면용으로 단순화한다.
 * @param value ISO 날짜
 * @returns YYYY-MM-DD 형식
 */
function formatHistoryDate(value: string): string {
  return value.slice(0, 10);
}

export function AccountExperience({
  userName,
  initialTab,
  initialProfile,
  initialHistory,
  initialFutureTrips,
  initialSavedSnapshots,
}: AccountExperienceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [profile, setProfile] = useState(initialProfile);
  const [historyEntries, setHistoryEntries] = useState(initialHistory);
  const [futureTrips, setFutureTrips] = useState(initialFutureTrips);
  const [savedSnapshots] = useState(initialSavedSnapshots);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [deletingFutureTripId, setDeletingFutureTripId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const totalRating = historyEntries.reduce((sum, entry) => sum + entry.rating, 0);
    const revisitCount = historyEntries.filter((entry) => entry.wouldRevisit).length;
    const tagCounts = new Map<string, number>();

    for (const entry of historyEntries) {
      for (const tag of entry.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    return {
      count: historyEntries.length,
      averageRating: historyEntries.length > 0 ? (totalRating / historyEntries.length).toFixed(1) : "-",
      revisitCount,
      topTags: Array.from(tagCounts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3),
    };
  }, [historyEntries]);

  /**
   * 취향 모드를 저장한다.
   * @param explorationPreference 새 추천 탐색 모드
   */
  async function savePreference(explorationPreference: ExplorationPreference) {
    setIsSavingPreference(true);
    setError(null);

    try {
      const response = await fetch("/api/me/preferences", {
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
      setError("추천 모드를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSavingPreference(false);
    }
  }

  /**
   * 여행 기록을 삭제한다.
   * @param historyId 삭제할 여행 기록 ID
   */
  async function deleteHistoryEntry(historyId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/me/history/${historyId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("history-delete-failed");
      }

      setHistoryEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== historyId));
    } catch {
      setError("여행 기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function deleteFutureTripEntry(futureTripId: string) {
    setDeletingFutureTripId(futureTripId);
    setError(null);

    try {
      const response = await fetch(`/api/me/future-trips/${futureTripId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("future-trip-delete-failed");
      }

      setFutureTrips((currentEntries) => currentEntries.filter((entry) => entry.id !== futureTripId));
    } catch {
      setError("앞으로 갈 곳을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeletingFutureTripId((currentId) => (currentId === futureTripId ? null : currentId));
    }
  }

  /**
   * 현재 세션을 종료하고 홈으로 보낸다.
   */
  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const historyHero = summary.topTags.length > 0
    ? summary.topTags.map(([tag]) => formatVibeList([tag])).join(" · ")
    : "아직 기록 전";

  return (
    <ExperienceShell
      eyebrow="여행 기록"
      title="다녀온 여행은 짧게 남기고, 저장한 추천은 빠르게 다시 여세요."
      intro="기록은 리스트로 바로 보고, 새 여행은 별도 step 화면에서 차분하게 남기도록 구조를 다시 정리했어요."
      capsule="기록 리스트 · 저장한 추천 · 추천 모드"
      headerAside={
        <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
          <p className="compass-editorial-kicker">{userName}님의 여행 기록</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            <article className="rounded-[calc(var(--radius-card)-14px)] bg-white/70 px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">남긴 기록</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{summary.count}개</p>
            </article>
            <article className="rounded-[calc(var(--radius-card)-14px)] bg-white/70 px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">평균 만족도</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{summary.averageRating}</p>
            </article>
            <article className="rounded-[calc(var(--radius-card)-14px)] bg-white/70 px-3.5 py-3">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">자주 남긴 결</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{historyHero}</p>
            </article>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/account/history/new"
              data-testid={testIds.account.addHistoryCta}
              className="compass-action-primary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              기록 추가
            </Link>
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
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              로그아웃
            </button>
          </div>
        </div>
      }
    >
      <div data-testid={testIds.account.root} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid={testIds.account.tabHistory}
            onClick={() => setActiveTab("history")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "history" ? "compass-selected" : "compass-selection-chip"
            }`}
          >
            여행 기록
          </button>
          <button
            type="button"
            data-testid={testIds.account.tabFutureTrips}
            onClick={() => setActiveTab("future-trips")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "future-trips" ? "compass-selected" : "compass-selection-chip"
            }`}
          >
            앞으로 갈 곳
          </button>
          <button
            type="button"
            data-testid={testIds.account.tabSaved}
            onClick={() => setActiveTab("saved")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "saved" ? "compass-selected" : "compass-selection-chip"
            }`}
          >
            저장한 추천
          </button>
          <button
            type="button"
            data-testid={testIds.account.tabPreferences}
            onClick={() => setActiveTab("preferences")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "preferences" ? "compass-selected" : "compass-selection-chip"
            }`}
          >
            추천 모드
          </button>
        </div>

        {error ? (
          <p className="compass-warning-card rounded-[var(--radius-card)] px-4 py-3.5 text-sm leading-6">
            {error}
          </p>
        ) : null}

        {activeTab === "history" ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.78fr)_minmax(19rem,0.22fr)]">
            <article className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="compass-editorial-kicker">여행 기록 리스트</p>
                  <h2 className="mt-1.5 font-display text-[1.12rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.3rem]">
                    남겨 둔 기록을 한 화면에서 빠르게 다시 보세요.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                    이미지, 메모, 태그까지 카드 한 장에 묶어 바로 훑을 수 있게 정리했어요.
                  </p>
                </div>

                <Link
                  href="/account/history/new"
                  className="compass-action-primary compass-soft-press inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                >
                  기록 추가
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {historyEntries.length > 0 ? (
                  historyEntries.map((entry, index) => {
                    const destination = findDestinationCopy(entry.destinationId);

                    return (
                      <article
                        key={entry.id}
                        data-testid={getAccountHistoryEntryTestId(index)}
                        className="compass-sheet overflow-hidden rounded-[calc(var(--radius-card)-10px)]"
                      >
                        <div className="grid gap-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
                          <div className="relative min-h-[11rem] bg-[linear-gradient(180deg,rgba(17,24,39,0.05),rgba(17,24,39,0.16))]">
                            {entry.image ? (
                              <Image
                                src={entry.image.dataUrl}
                                alt={`${destination.nameKo} 기록 사진`}
                                fill
                                unoptimized
                                sizes="(max-width: 640px) 100vw, 10rem"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-end p-4">
                                <div className="rounded-2xl bg-white/86 px-3 py-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                                  사진 없음
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="compass-editorial-kicker">{destination.nameKo}</p>
                                <p className="mt-1 font-display text-[1rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                                  {destination.nameEn}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
                                  {formatHistoryDate(entry.visitedAt)} · {entry.rating}점 · {entry.wouldRevisit ? "다시 가고 싶음" : "새 후보 넓히기"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  data-testid={getAccountHistoryEditTestId(index)}
                                  onClick={() => {
                                    router.push(`/account/history/${entry.id}/edit`);
                                  }}
                                  className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                                >
                                  수정
                                </button>
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
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {entry.tags.map((tag) => (
                                <span
                                  key={`${entry.id}-${tag}`}
                                  className="compass-metric-pill rounded-full px-3 py-1 text-xs font-semibold"
                                >
                                  #{formatVibeList([tag])}
                                </span>
                              ))}
                            </div>

                            <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                              {entry.memo?.trim() || "메모 없이도 기록은 저장돼요. 다음에 여행을 다시 떠올릴 때 한 줄씩만 남겨도 충분합니다."}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="compass-note rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                    아직 남겨 둔 여행 기록이 없어요. 한 곳만 먼저 적어 두면 다음 추천이 훨씬 개인 취향에 가까워져요.
                  </div>
                )}
              </div>
            </article>

            <aside className="space-y-4">
              <article data-testid={testIds.account.tasteSummary} className="compass-sheet rounded-[var(--radius-card)] px-4 py-4">
                <p className="compass-editorial-kicker">요약</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-[calc(var(--radius-card)-12px)] bg-white/70 px-4 py-3">
                    <p className="text-xs text-[var(--color-ink-soft)]">남긴 기록</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{summary.count}개</p>
                  </div>
                  <div className="rounded-[calc(var(--radius-card)-12px)] bg-white/70 px-4 py-3">
                    <p className="text-xs text-[var(--color-ink-soft)]">평균 만족도</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{summary.averageRating}</p>
                  </div>
                  <div className="rounded-[calc(var(--radius-card)-12px)] bg-white/70 px-4 py-3">
                    <p className="text-xs text-[var(--color-ink-soft)]">다시 가고 싶은 곳</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{summary.revisitCount}개</p>
                  </div>
                </div>
              </article>

              <article className="compass-sheet rounded-[var(--radius-card)] px-4 py-4">
                <p className="compass-editorial-kicker">빠른 추가</p>
                <h3 className="mt-1.5 text-base font-semibold text-[var(--color-ink)]">
                  여행지는 step으로, 저장은 한 번에 끝내세요.
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  여행지, 날짜, 평점, 태그, 사진, 메모 순서로 따로 묻기 때문에 길게 입력하지 않아도 됩니다.
                </p>
              </article>
            </aside>
          </section>
        ) : null}

        {activeTab === "future-trips" ? (
          <article className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">앞으로 갈 곳</p>
              <h2 className="mt-1.5 font-display text-[1.12rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.3rem]">
                다음에 가고 싶은 여행지만 따로 모아 가볍게 정리해 두세요.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                저장한 추천이나 다녀온 기록과 섞지 않고, 앞으로 검토할 목적지만 따로 보여줘요.
              </p>
            </div>

            <div data-testid={testIds.account.futureTripList} className="mt-4 grid gap-3">
              {futureTrips.length > 0 ? (
                futureTrips.map((futureTrip, index) => {
                  const destination = findFutureTripCopy(futureTrip);
                  const isDeleting = deletingFutureTripId === futureTrip.id;

                  return (
                    <article
                      key={futureTrip.id}
                      data-testid={getAccountFutureTripEntryTestId(index)}
                      className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="compass-editorial-kicker">{destination.nameKo}</p>
                            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase">
                              {futureTrip.countryCode}
                            </span>
                          </div>
                          <p className="mt-1 font-display text-[1rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                            {destination.nameEn}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                            최근 담은 날짜 {formatHistoryDate(futureTrip.updatedAt)} · 다음에 다시 볼 후보만 조용히 모아 둘 수 있어요.
                          </p>
                        </div>

                        <button
                          type="button"
                          data-testid={getAccountFutureTripDeleteTestId(index)}
                          disabled={isDeleting}
                          onClick={() => {
                            void deleteFutureTripEntry(futureTrip.id);
                          }}
                          className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div
                  data-testid={testIds.account.futureTripEmptyState}
                  className="compass-note rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]"
                >
                  아직 앞으로 갈 곳이 없어요. 결과 화면에서 마음에 드는 여행지를 담아 두면 이 탭에서 따로 정리해 볼 수 있어요.
                </div>
              )}
            </div>
          </article>
        ) : null}

        {activeTab === "saved" ? (
          <article className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">저장한 추천</p>
              <h2 className="mt-1.5 font-display text-[1.12rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.3rem]">
                따로 저장해 둔 추천만 모아 빠르게 다시 열어보세요.
              </h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {savedSnapshots.length > 0 ? (
                savedSnapshots.map((snapshot, index) => {
                  const destination = findDestinationCopy(snapshot.payload.destinationIds[0]);

                  return (
                    <article
                      key={snapshot.id}
                      data-testid={getSavedSnapshotTestId(index)}
                      className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
                    >
                      <p className="compass-editorial-kicker">{destination.nameKo}</p>
                      <p className="mt-1 font-display text-[1rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                        {destination.nameEn}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                        저장일 {formatHistoryDate(snapshot.createdAt)} · 다음에 비교하거나 다시 공유할 때 바로 꺼낼 수 있어요.
                      </p>
                      <div className="mt-3">
                        <Link
                          href={`/s/${snapshot.id}`}
                          className="compass-action-primary compass-soft-press inline-flex rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                        >
                          다시 보기
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="compass-note rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                  아직 로그인 후 저장한 추천이 없어요. 결과 화면에서 마음에 드는 추천을 저장하면 이 탭으로 모입니다.
                </div>
              )}
            </div>
          </article>
        ) : null}

        {activeTab === "preferences" ? (
          <article data-testid={testIds.account.tasteMode} className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">추천 모드</p>
              <h2 className="mt-1.5 font-display text-[1.12rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.3rem]">
                익숙한 추천을 더 볼지, 새로운 추천을 넓힐지 따로 정해 두세요.
              </h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
        ) : null}
      </div>
    </ExperienceShell>
  );
}
