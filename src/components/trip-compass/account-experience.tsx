"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
  getAccountHistoryLightboxImageTestId,
  getAccountHistoryGalleryToggleTestId,
  getSavedSnapshotDeleteCancelTestId,
  getSavedSnapshotDeleteConfirmTestId,
  getSavedSnapshotDeleteDialogTestId,
  getSavedSnapshotDeleteTestId,
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
 * ISO 날짜를 한국식 표기로 변환한다.
 * @example "2026-03-15T00:00:00Z" → "2026. 3. 15."
 */
function formatHistoryDate(value: string): string {
  const d = new Date(value);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

/**
 * ISO 날짜를 상대 시간으로 변환한다.
 * @example 3일 전, 2주 전, 1달 전
 */
function formatRelativeDate(value: string): string {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}달 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
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

/**
 * 저장한 추천 카드에서 다시 보여줄 한 줄 요약을 만든다.
 * @param payload 저장된 추천 payload
 * @returns 다시 보기 전용 요약 문구
 */
function getSavedSnapshotSummary(payload: RecommendationSnapshot): string {
  const leadResult = payload.results[0];
  return leadResult?.reasons[0] ?? leadResult?.whyThisFits ?? "결정 이유를 다시 보면서 다음 행동을 이어갈 수 있어요.";
}

export function AccountExperience({
  userName,
  initialTab,
  initialProfile,
  initialHistory,
  initialSavedSnapshots,
}: AccountExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [profile, setProfile] = useState(initialProfile);
  const [historyEntries, setHistoryEntries] = useState(initialHistory);
  const [savedSnapshots, setSavedSnapshots] = useState(initialSavedSnapshots);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [updatingSnapshotId, setUpdatingSnapshotId] = useState<string | null>(null);
  const [deletingSavedSnapshotId, setDeletingSavedSnapshotId] = useState<string | null>(null);
  const [savedDeleteDialogSnapshotId, setSavedDeleteDialogSnapshotId] = useState<string | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [openHistoryGalleryId, setOpenHistoryGalleryId] = useState<string | null>(null);
  const [historyLightboxState, setHistoryLightboxState] = useState<{
    entryId: string;
    imageIndex: number;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

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

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      setError("설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
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
      setError("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
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
      setError("변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUpdatingSnapshotId((currentId) => (currentId === snapshotId ? null : currentId));
    }
  }

  async function deleteSavedSnapshot(snapshotId: string) {
    setDeletingSavedSnapshotId(snapshotId);
    setError(null);

    try {
      const response = await fetch(`/api/me/snapshots/${snapshotId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("saved-snapshot-delete-failed");
      }

      setSavedSnapshots((currentSnapshots) =>
        currentSnapshots.filter((snapshot) => snapshot.id !== snapshotId),
      );
      setSavedDeleteDialogSnapshotId((currentId) => (currentId === snapshotId ? null : currentId));
    } catch {
      setError("저장한 추천을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeletingSavedSnapshotId((currentId) => (currentId === snapshotId ? null : currentId));
    }
  }

  function openHistoryLightbox(entryId: string, imageIndex: number) {
    setHistoryLightboxState({ entryId, imageIndex });
  }

  function closeHistoryLightbox() {
    setHistoryLightboxState(null);
  }

  function moveHistoryLightbox(step: -1 | 1) {
    setHistoryLightboxState((currentState) => {
      if (!currentState) {
        return null;
      }

      const entry = historyEntries.find((item) => item.id === currentState.entryId);
      if (!entry || entry.images.length === 0) {
        return null;
      }

      const nextIndex = currentState.imageIndex + step;
      if (nextIndex < 0 || nextIndex >= entry.images.length) {
        return currentState;
      }

      return {
        entryId: currentState.entryId,
        imageIndex: nextIndex,
      };
    });
  }

  const tabItems: Array<{ key: AccountTab; label: string; testId: string; count?: number }> = [
    { key: "history", label: "여행 기록", testId: testIds.account.tabHistory, count: summary.count },
    { key: "future-trips", label: "예정된 여행", testId: testIds.account.tabFutureTrips, count: plannedSnapshots.length },
    { key: "saved", label: "저장한 추천", testId: testIds.account.tabSaved, count: savedCandidateSnapshots.length },
    { key: "preferences", label: "추천 설정", testId: testIds.account.tabPreferences },
  ];

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function navigateToTab(nextTab: AccountTab) {
    setActiveTab(nextTab);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("tab", nextTab);
    router.replace(`/account?${nextSearchParams.toString()}`, { scroll: false });
  }

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
        </div>
      }
    >
      <div data-testid={testIds.account.root} className="space-y-6">
        {/* ── 통계 요약 카드 ── */}
        {summary.count > 0 ? (
          <div data-testid={testIds.account.tasteSummary} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
              <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">기록</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">{summary.count}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
              <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">평균 평점</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                {summary.averageRating}<span className="text-sm font-medium text-[var(--color-ink-soft)]">/5</span>
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
              <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">재방문 희망</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">{summary.revisitCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white/80 px-4 py-4">
              <p className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">자주 쓴 태그</p>
              <p className="mt-1.5 text-base font-bold tracking-tight text-[var(--color-ink)]">
                {summary.topTags.map(([tag]) => formatVibeList([tag])).join(" · ")}
              </p>
            </div>
          </div>
        ) : null}

        {/* ── 탭 네비게이션 ── */}
        <nav
          role="tablist"
          aria-label="계정 탭"
          className="grid grid-cols-2 gap-2 overflow-y-hidden border-b border-[var(--color-frame-soft)] pb-2 sm:flex sm:gap-1 sm:overflow-x-auto sm:pb-0"
        >
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              data-testid={tab.testId}
              onClick={() => navigateToTab(tab.key)}
              id={`tab-${tab.key}`}
              aria-controls={`tabpanel-${tab.key}`}
              className={`relative min-h-[44px] w-full min-w-0 cursor-pointer rounded-xl px-4 py-3 text-left text-[0.85rem] font-semibold transition-colors sm:w-auto sm:shrink-0 sm:rounded-none sm:pb-3 sm:pt-2 ${
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
                <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--color-sand-deep)]" />
              ) : null}
            </button>
          ))}
        </nav>

        {error ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3">
            <p className="text-sm text-[var(--color-warning-text)]">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="알림 닫기"
              className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-[var(--color-warning-text)] transition-opacity hover:opacity-70"
            >
              닫기
            </button>
          </div>
        ) : null}

        {/* ── 여행 기록 탭 ── */}
        {activeTab === "history" ? (
          <section role="tabpanel" id="tabpanel-history" aria-labelledby="tab-history" className="space-y-3">
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

                      <div className="min-w-0 space-y-3 px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-[var(--color-ink)]">
                              {destination.nameKo}
                              <span className="ml-2 text-sm font-normal text-[var(--color-ink-soft)]">{destination.nameEn}</span>
                            </h3>
                            <p className="mt-1 text-[0.82rem] text-[var(--color-ink-soft)]">
                              {formatHistoryDate(entry.visitedAt)} · {entry.rating}/5 · {entry.wouldRevisit ? "재방문 희망" : "한 번으로 충분"}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-1.5">
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

                        {entry.tags.length > 0 || entry.customTags.length > 0 ? (
                          <div className="space-y-2">
                            {entry.tags.length > 0 ? (
                              <div className="space-y-1.5">
                                <p className="text-[0.72rem] font-semibold text-[var(--color-ink-soft)]">추천 태그</p>
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
                              </div>
                            ) : null}

                            {entry.customTags.length > 0 ? (
                              <div className="space-y-1.5">
                                <p className="text-[0.72rem] font-semibold text-[var(--color-ink-soft)]">직접 등록</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {entry.customTags.map((tag, customTagIndex) => (
                                    <span
                                      key={`${entry.id}-custom-${customTagIndex}-${tag}`}
                                      className="rounded-full border border-[var(--color-frame-soft)] bg-white px-2.5 py-0.5 text-[0.75rem] font-medium text-[var(--color-ink)]"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {entry.memo?.trim() ? (
                          <p className="text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">{entry.memo}</p>
                        ) : null}

                        {isGalleryOpen && entry.images.length > 0 ? (
                          <div className="rounded-xl border border-[var(--color-frame-soft)] bg-slate-50/60 p-3">
                            <div className="flex gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-1">
                              {entry.images.map((image, imageIndex) => (
                                <button
                                  type="button"
                                  key={`${entry.id}-gallery-${imageIndex}`}
                                  data-testid={getAccountHistoryGalleryImageTestId(imageIndex)}
                                  onClick={() => {
                                    openHistoryLightbox(entry.id, imageIndex);
                                  }}
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
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {isClient && historyLightboxState?.entryId === entry.id && entry.images[historyLightboxState.imageIndex]
                          ? createPortal(
                              <div
                                data-testid={testIds.account.historyLightbox}
                                onClick={closeHistoryLightbox}
                                className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgb(15_23_42_/_0.18)] p-4 backdrop-blur-md"
                              >
                                <div className="relative w-full max-w-4xl px-2">
                                  <div
                                    className="overflow-hidden rounded-[1.5rem] border border-[var(--color-frame-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.96))] shadow-[0_28px_60px_rgba(15,23,42,0.18)]"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                    }}
                                  >
                                    <button
                                      type="button"
                                      data-testid={testIds.account.historyLightboxClose}
                                      onClick={closeHistoryLightbox}
                                      className="absolute right-5 top-5 z-10 rounded-full border border-[var(--color-frame-soft)] bg-white/92 px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--color-ink)] shadow-[var(--shadow-paper)] backdrop-blur-sm transition-colors hover:bg-white"
                                    >
                                      닫기
                                    </button>
                                    <div
                                      data-testid={getAccountHistoryLightboxImageTestId(historyLightboxState.imageIndex)}
                                      className="relative aspect-[4/5] w-full bg-[linear-gradient(180deg,#f8fafc,#eef4fb)] sm:aspect-[16/10]"
                                    >
                                      <Image
                                        src={entry.images[historyLightboxState.imageIndex]!.dataUrl}
                                        alt={`${destination.nameKo} 기록 사진 크게 보기 ${historyLightboxState.imageIndex + 1}`}
                                        fill
                                        unoptimized
                                        sizes="100vw"
                                        className="object-contain"
                                        draggable={false}
                                      />
                                      {entry.images.length > 1 ? (
                                        <>
                                          <button
                                            type="button"
                                            data-testid={testIds.account.historyLightboxPrev}
                                            onClick={() => {
                                              moveHistoryLightbox(-1);
                                            }}
                                            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/42 text-lg font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-colors hover:bg-black/56"
                                            aria-label="이전 사진 보기"
                                          >
                                            ‹
                                          </button>
                                          <button
                                            type="button"
                                            data-testid={testIds.account.historyLightboxNext}
                                            onClick={() => {
                                              moveHistoryLightbox(1);
                                            }}
                                            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/42 text-lg font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-colors hover:bg-black/56"
                                            aria-label="다음 사진 보기"
                                          >
                                            ›
                                          </button>
                                        </>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center justify-between gap-3 border-t border-[var(--color-frame-soft)] bg-white/94 px-4 py-3 text-[var(--color-ink)]">
                                      <div>
                                        <p className="text-[0.85rem] font-semibold">{destination.nameKo} 사진</p>
                                        <p className="text-[0.75rem] text-[var(--color-ink-soft)]">
                                          {historyLightboxState.imageIndex + 1} / {entry.images.length}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>,
                              document.body,
                            )
                          : null}
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

        {/* ── 예정된 여행 탭 ── */}
        {activeTab === "future-trips" ? (
          <section role="tabpanel" id="tabpanel-future-trips" aria-labelledby="tab-future-trips">
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
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[var(--color-ink)]">
                          {destination.nameKo}
                          <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-ink-soft)]">
                            {destination.countryCode}
                          </span>
                        </h3>
                        <p className="mt-1 text-[0.82rem] text-[var(--color-ink-soft)]">
                          {destination.nameEn} · {formatRelativeDate(snapshot.createdAt)} 저장
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

        {/* ── 저장 목록 탭 ── */}
        {activeTab === "saved" ? (
          <section role="tabpanel" id="tabpanel-saved" aria-labelledby="tab-saved">
            <p className="mb-4 text-[0.85rem] text-[var(--color-ink-soft)]">
              결과 화면에서 담아 둔 추천을 여기서 다시 보고 정리하세요.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedCandidateSnapshots.length > 0 ? (
                savedCandidateSnapshots.map((snapshot, index) => {
                  const destination = findDestinationCopy(snapshot.payload.destinationIds[0]);
                  const isUpdating = updatingSnapshotId === snapshot.id;
                  const summaryCopy = getSavedSnapshotSummary(snapshot.payload);

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
                          {formatRelativeDate(snapshot.createdAt)} 저장
                        </p>
                        <p className="mt-2 text-[0.84rem] leading-6 text-[var(--color-ink)]">
                          {summaryCopy}
                        </p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/s/${snapshot.id}`}
                          className="compass-action-primary compass-soft-press rounded-lg px-4 py-2 text-[0.78rem] font-semibold"
                        >
                          공유 페이지
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
                      <div className="mt-2">
                        <button
                          type="button"
                          data-testid={getSavedSnapshotDeleteTestId(index)}
                          onClick={() => {
                            setSavedDeleteDialogSnapshotId((currentId) => currentId === snapshot.id ? null : snapshot.id);
                          }}
                          className="text-[0.78rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:text-red-500"
                        >
                          삭제
                        </button>
                        {savedDeleteDialogSnapshotId === snapshot.id ? (
                          <div
                            data-testid={getSavedSnapshotDeleteDialogTestId(index)}
                            className="mt-3 rounded-xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] p-3"
                          >
                            <p className="text-[0.82rem] font-semibold text-[var(--color-ink)]">저장한 추천을 삭제할까요?</p>
                            <p className="mt-1 text-[0.78rem] text-[var(--color-ink-soft)]">
                              삭제하면 이 추천은 저장 목록과 예정된 여행에서 함께 사라져요.
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                data-testid={getSavedSnapshotDeleteCancelTestId(index)}
                                onClick={() => {
                                  setSavedDeleteDialogSnapshotId(null);
                                }}
                                className="rounded-lg border border-[var(--color-frame-soft)] px-3 py-2 text-[0.78rem] font-medium text-[var(--color-ink-soft)]"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                data-testid={getSavedSnapshotDeleteConfirmTestId(index)}
                                disabled={deletingSavedSnapshotId === snapshot.id}
                                onClick={() => {
                                  void deleteSavedSnapshot(snapshot.id);
                                }}
                                className="rounded-lg bg-[var(--color-warning-text)] px-3 py-2 text-[0.78rem] font-semibold text-white disabled:opacity-50"
                              >
                                {deletingSavedSnapshotId === snapshot.id ? "삭제 중..." : "삭제"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-frame)] bg-[var(--color-surface-muted)] px-6 py-10 text-center">
                  <p className="text-[0.9rem] font-medium text-[var(--color-ink-soft)]">
                    아직 저장한 추천이 없습니다
                  </p>
                  <p className="mt-1.5 text-[0.82rem] text-[var(--color-ink-soft)]">
                    추천 결과에서 마음에 드는 여행지를 저장해 보세요.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── 추천 설정 탭 ── */}
        {activeTab === "preferences" ? (
          <section role="tabpanel" id="tabpanel-preferences" aria-labelledby="tab-preferences" data-testid={testIds.account.tasteMode}>
            <p className="mb-4 text-[0.85rem] text-[var(--color-ink-soft)]">
              추천 방식을 선택하세요. 언제든 변경할 수 있습니다.
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
