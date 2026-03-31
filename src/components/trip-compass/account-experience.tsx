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
  UserPreferenceProfile,
} from "@/lib/domain/contracts";
import {
  getAccountFutureTripEntryTestId,
  getAccountHistoryDeleteTestId,
  getAccountHistoryEditTestId,
  getAccountHistoryEntryTestId,
  getAccountHistoryGalleryImageTestId,
  getAccountHistoryGalleryToggleTestId,
  getSavedSnapshotPlanTestId,
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
    description: "좋았던 여행지 위주로 추천해요.",
    testId: testIds.account.preferenceRepeat,
  },
  {
    value: "balanced",
    label: "균형형",
    description: "익숙한 곳과 새로운 곳을 섞어 추천해요.",
    testId: testIds.account.preferenceBalanced,
  },
  {
    value: "discover",
    label: "발견형",
    description: "아직 안 가본 곳을 우선 추천해요.",
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
    countryCode: destination?.countryCode ?? "--",
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

function getHistoryCoverImage(entry: UserDestinationHistory) {
  return entry.images[0] ?? null;
}

/**
 * 저장한 추천의 상태를 안전하게 읽는다.
 * @param payload 저장된 추천 payload
 * @returns 저장 상태
 */
function getSnapshotStatus(payload: RecommendationSnapshot): "saved" | "planned" {
  return payload.meta?.status ?? "saved";
}

export function AccountExperience({
  userName,
  initialTab,
  initialProfile,
  initialHistory,
  initialSavedSnapshots,
}: AccountExperienceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [profile, setProfile] = useState(initialProfile);
  const [historyEntries, setHistoryEntries] = useState(initialHistory);
  const [savedSnapshots, setSavedSnapshots] = useState(initialSavedSnapshots);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [updatingSnapshotId, setUpdatingSnapshotId] = useState<string | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [openHistoryGalleryId, setOpenHistoryGalleryId] = useState<string | null>(null);

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

  const plannedSnapshots = useMemo(
    () => savedSnapshots.filter((snapshot) => getSnapshotStatus(snapshot.payload) === "planned"),
    [savedSnapshots],
  );
  const savedCandidateSnapshots = useMemo(
    () => savedSnapshots.filter((snapshot) => getSnapshotStatus(snapshot.payload) === "saved"),
    [savedSnapshots],
  );

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
    setDeletingHistoryId(historyId);
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
    } finally {
      setDeletingHistoryId((currentId) => (currentId === historyId ? null : currentId));
    }
  }

  async function updateSnapshotStatus(snapshotId: string, status: "saved" | "planned") {
    setUpdatingSnapshotId(snapshotId);
    setError(null);

    try {
      const response = await fetch(`/api/me/snapshots/${snapshotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("snapshot-status-update-failed");
      }

      const payload = (await response.json()) as {
        snapshot: {
          id: string;
          createdAt: string;
          payload: RecommendationSnapshot;
        };
      };

      setSavedSnapshots((currentEntries) =>
        currentEntries.map((entry) => (
          entry.id === payload.snapshot.id
            ? {
                ...entry,
                payload: payload.snapshot.payload,
              }
            : entry
        )),
      );
    } catch {
      setError("저장 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUpdatingSnapshotId((currentId) => (currentId === snapshotId ? null : currentId));
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

  const tabItems: Array<{ key: AccountTab; label: string; testId: string; count?: number }> = [
    { key: "history", label: "여행 기록", testId: testIds.account.tabHistory, count: summary.count },
    { key: "future-trips", label: "예정된 여행", testId: testIds.account.tabFutureTrips, count: plannedSnapshots.length },
    { key: "saved", label: "저장 목록", testId: testIds.account.tabSaved, count: savedCandidateSnapshots.length },
    { key: "preferences", label: "추천 설정", testId: testIds.account.tabPreferences },
  ];

  return (
    <ExperienceShell
      eyebrow="내 여행"
      title={`${userName}님의 여행 관리`}
      intro="여행 기록을 남기고, 저장한 추천을 비교해 보세요."
      capsule=""
      headerAside={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/account/history/new"
            data-testid={testIds.account.addHistoryCta}
            className="compass-action-primary compass-soft-press rounded-full px-5 py-2.5 text-[0.8rem] font-semibold"
          >
            기록 추가
          </Link>
          <Link
            href="/"
            className="compass-action-secondary compass-soft-press rounded-full px-5 py-2.5 text-[0.8rem] font-semibold"
          >
            홈으로
          </Link>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="rounded-full px-4 py-2.5 text-[0.8rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
          >
            로그아웃
          </button>
        </div>
      }
    >
      <div data-testid={testIds.account.root} className="space-y-6">
        {/* ── 통계 요약 카드 ── */}
        <div data-testid={testIds.account.tasteSummary} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
            <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">기록</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">{summary.count}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
            <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">평균 평점</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">{summary.averageRating}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
            <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">재방문 희망</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">{summary.revisitCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
            <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">자주 쓴 태그</p>
            <p className="mt-1.5 text-base font-bold tracking-tight text-[var(--color-ink)]">
              {summary.topTags.length > 0
                ? summary.topTags.map(([tag]) => formatVibeList([tag])).join(" · ")
                : "아직 기록 전"}
            </p>
          </div>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <nav role="tablist" aria-label="계정 탭" className="flex gap-1 overflow-x-auto border-b border-[var(--color-frame-soft)]">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              data-testid={tab.testId}
              onClick={() => setActiveTab(tab.key)}
              className={`relative shrink-0 cursor-pointer px-4 pb-3 pt-2 text-[0.85rem] font-semibold transition-colors min-h-[44px] ${
                activeTab === tab.key
                  ? "text-[var(--color-sand-deep)]"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.count !== undefined ? (
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-bold ${
                    activeTab === tab.key
                      ? "bg-[var(--color-sand-deep)] text-white"
                      : "bg-[var(--color-frame-soft)] text-[var(--color-ink-soft)]"
                  }`}>
                    {tab.count}
                  </span>
                ) : null}
              </span>
              {activeTab === tab.key ? (
                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--color-sand-deep)]" />
              ) : null}
            </button>
          ))}
        </nav>

        {error ? (
          <p className="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning-text)]">
            {error}
          </p>
        ) : null}

        {/* ── 여행 기록 탭 ── */}
        {activeTab === "history" ? (
          <section className="space-y-3">
            {historyEntries.length > 0 ? (
              historyEntries.map((entry, index) => {
                const destination = findDestinationCopy(entry.destinationId);
                const coverImage = getHistoryCoverImage(entry);
                const isGalleryOpen = openHistoryGalleryId === entry.id;

                return (
                  <article
                    key={entry.id}
                    data-testid={getAccountHistoryEntryTestId(index)}
                    className="overflow-hidden rounded-2xl border border-[var(--color-frame-soft)] bg-white transition-shadow hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="grid gap-0 sm:grid-cols-[12rem_minmax(0,1fr)]">
                      <div className="relative min-h-[10rem] bg-gradient-to-b from-slate-50 to-slate-100 sm:min-h-full">
                        {coverImage ? (
                          <Image
                            src={coverImage.dataUrl}
                            alt={`${destination.nameKo} 기록 사진`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, 12rem"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-sm text-[var(--color-ink-soft)]">사진 없음</span>
                          </div>
                        )}
                        {entry.images.length > 1 ? (
                          <div className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white backdrop-blur-sm">
                            +{entry.images.length - 1}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3 px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-bold text-[var(--color-ink)]">
                              {destination.nameKo}
                              <span className="ml-2 text-sm font-normal text-[var(--color-ink-soft)]">{destination.nameEn}</span>
                            </h3>
                            <p className="mt-1 text-[0.82rem] text-[var(--color-ink-soft)]">
                              {formatHistoryDate(entry.visitedAt)} · {entry.rating}점 · {entry.wouldRevisit ? "다시 가고 싶음" : "새 후보 넓히기"}
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-1.5">
                            {entry.images.length > 0 ? (
                              <button
                                type="button"
                                data-testid={getAccountHistoryGalleryToggleTestId(index)}
                                onClick={() => {
                                  setOpenHistoryGalleryId((currentId) =>
                                    currentId === entry.id ? null : entry.id,
                                  );
                                }}
                                className="min-h-[36px] cursor-pointer rounded-lg border border-[var(--color-frame-soft)] px-3 py-1.5 text-[0.78rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)]"
                              >
                                {isGalleryOpen ? "닫기" : `사진 ${entry.images.length}`}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              data-testid={getAccountHistoryEditTestId(index)}
                              onClick={() => {
                                router.push(`/account/history/${entry.id}/edit`);
                              }}
                              className="min-h-[36px] cursor-pointer rounded-lg border border-[var(--color-frame-soft)] px-3 py-1.5 text-[0.78rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)]"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              data-testid={getAccountHistoryDeleteTestId(index)}
                              disabled={deletingHistoryId === entry.id}
                              onClick={() => {
                                void deleteHistoryEntry(entry.id);
                              }}
                              className="min-h-[36px] cursor-pointer rounded-lg border border-[var(--color-frame-soft)] px-3 py-1.5 text-[0.78rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingHistoryId === entry.id ? "삭제 중..." : "삭제"}
                            </button>
                          </div>
                        </div>

                        {entry.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {entry.tags.map((tag) => (
                              <span
                                key={`${entry.id}-${tag}`}
                                className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-[0.75rem] font-medium text-[var(--color-sand-deep)]"
                              >
                                #{formatVibeList([tag])}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {entry.memo?.trim() ? (
                          <p className="text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">{entry.memo}</p>
                        ) : null}

                        {isGalleryOpen && entry.images.length > 0 ? (
                          <div className="rounded-xl border border-[var(--color-frame-soft)] bg-slate-50/60 p-3">
                            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
                              {entry.images.map((image, imageIndex) => (
                                <div
                                  key={`${entry.id}-gallery-${imageIndex}`}
                                  data-testid={getAccountHistoryGalleryImageTestId(imageIndex)}
                                  className="relative h-48 w-[min(16rem,75vw)] shrink-0 snap-start overflow-hidden rounded-xl bg-slate-100"
                                >
                                  <Image
                                    src={image.dataUrl}
                                    alt={`${destination.nameKo} 기록 사진 ${imageIndex + 1}`}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 640px) 75vw, 16rem"
                                    className="object-cover"
                                  />
                                  <div className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-ink)] backdrop-blur-sm">
                                    {imageIndex + 1} / {entry.images.length}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-frame)] bg-[var(--color-surface-muted)] px-6 py-10 text-center">
                <p className="text-[0.9rem] font-medium text-[var(--color-ink-soft)]">
                  아직 여행 기록이 없습니다
                </p>
                <p className="mt-1.5 text-[0.82rem] text-[var(--color-ink-soft)]">
                  다녀온 여행을 기록하면 더 정확한 추천을 받을 수 있어요.
                </p>
                <Link
                  href="/account/history/new"
                  className="compass-action-primary compass-soft-press mt-4 inline-flex rounded-full px-5 py-2.5 text-[0.8rem] font-semibold"
                >
                  첫 여행 기록하기
                </Link>
              </div>
            )}
          </section>
        ) : null}

        {/* ── 앞으로 갈 곳 탭 ── */}
        {activeTab === "future-trips" ? (
          <section>
            <p className="mb-4 text-[0.85rem] text-[var(--color-ink-soft)]">
              실제로 갈 여행지를 모아 두세요.
            </p>
            <div data-testid={testIds.account.futureTripList} className="grid gap-3">
              {plannedSnapshots.length > 0 ? (
                plannedSnapshots.map((snapshot, index) => {
                  const destination = findDestinationCopy(snapshot.payload.destinationIds[0]);
                  const isUpdating = updatingSnapshotId === snapshot.id;

                  return (
                    <article
                      key={snapshot.id}
                      data-testid={getAccountFutureTripEntryTestId(index)}
                      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="text-base font-bold text-[var(--color-ink)]">
                          {destination.nameKo}
                          <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-ink-soft)]">
                            {destination.countryCode}
                          </span>
                        </h3>
                        <p className="mt-1 text-[0.82rem] text-[var(--color-ink-soft)]">
                          {destination.nameEn} · 저장일 {formatHistoryDate(snapshot.createdAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          void updateSnapshotStatus(snapshot.id, "saved");
                        }}
                        className="shrink-0 rounded-lg border border-[var(--color-frame-soft)] px-4 py-2 text-[0.8rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? "이동 중..." : "저장 목록으로"}
                      </button>
                    </article>
                  );
                })
              ) : (
                <div
                  data-testid={testIds.account.futureTripEmptyState}
                  className="rounded-2xl border border-dashed border-[var(--color-frame)] bg-[var(--color-surface-muted)] px-6 py-10 text-center"
                >
                  <p className="text-[0.9rem] font-medium text-[var(--color-ink-soft)]">
                    아직 예정된 여행이 없습니다
                  </p>
                  <p className="mt-1.5 text-[0.82rem] text-[var(--color-ink-soft)]">
                    저장 목록에서 가고 싶은 여행지를 올려 보세요.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── 저장한 추천 탭 ── */}
        {activeTab === "saved" ? (
          <section>
            <p className="mb-4 text-[0.85rem] text-[var(--color-ink-soft)]">
              관심 있는 추천을 한곳에서 비교하세요.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedCandidateSnapshots.length > 0 ? (
                savedCandidateSnapshots.map((snapshot, index) => {
                  const destination = findDestinationCopy(snapshot.payload.destinationIds[0]);
                  const isUpdating = updatingSnapshotId === snapshot.id;

                  return (
                    <article
                      key={snapshot.id}
                      data-testid={getSavedSnapshotTestId(index)}
                      className="flex flex-col justify-between rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-4 transition-shadow hover:shadow-[var(--shadow-card)]"
                    >
                      <div>
                        <h3 className="text-base font-bold text-[var(--color-ink)]">{destination.nameKo}</h3>
                        <p className="mt-0.5 text-[0.82rem] text-[var(--color-ink-soft)]">{destination.nameEn}</p>
                        <p className="mt-2 text-[0.78rem] text-[var(--color-ink-soft)]">
                          저장일 {formatHistoryDate(snapshot.createdAt)}
                        </p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/s/${snapshot.id}`}
                          className="compass-action-primary compass-soft-press rounded-lg px-4 py-2 text-[0.78rem] font-semibold"
                        >
                          다시 보기
                        </Link>
                        <button
                          type="button"
                          data-testid={getSavedSnapshotPlanTestId(index)}
                          disabled={isUpdating}
                          onClick={() => {
                            void updateSnapshotStatus(snapshot.id, "planned");
                          }}
                          className="rounded-lg border border-[var(--color-frame-soft)] px-4 py-2 text-[0.78rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdating ? "이동 중..." : "예정 여행으로"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-frame)] bg-[var(--color-surface-muted)] px-6 py-10 text-center">
                  <p className="text-[0.9rem] font-medium text-[var(--color-ink-soft)]">
                    저장한 추천이 없어요
                  </p>
                  <p className="mt-1.5 text-[0.82rem] text-[var(--color-ink-soft)]">
                    결과 화면에서 마음에 드는 추천을 저장해 보세요.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── 추천 모드 탭 ── */}
        {activeTab === "preferences" ? (
          <section data-testid={testIds.account.tasteMode}>
            <p className="mb-4 text-[0.85rem] text-[var(--color-ink-soft)]">
              익숙한 추천을 더 볼지, 새로운 추천을 넓힐지 정해 두세요.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
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
                    className={`rounded-2xl px-5 py-5 text-left transition-all ${
                      active
                        ? "border-2 border-[var(--color-sand)] bg-[var(--color-selected)] shadow-[0_0_0_1px_var(--color-sand)]"
                        : "border border-[var(--color-frame-soft)] bg-white hover:border-[var(--color-sand)] hover:shadow-[var(--shadow-card)]"
                    }`}
                  >
                    <p className={`text-[0.95rem] font-bold ${active ? "text-[var(--color-sand-deep)]" : "text-[var(--color-ink)]"}`}>
                      {option.label}
                    </p>
                    <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--color-ink-soft)]">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </ExperienceShell>
  );
}
