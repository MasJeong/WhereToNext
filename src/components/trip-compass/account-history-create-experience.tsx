"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type { UserDestinationHistory, UserDestinationHistoryImage } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";
import { formatVibeList } from "@/lib/trip-compass/presentation";

import { ExperienceShell } from "./experience-shell";

type HistoryCreateStep = "destination" | "date" | "rating" | "tags" | "image" | "memo";

type HistoryDraft = {
  id?: string;
  destinationId: string;
  rating: number;
  tags: UserDestinationHistory["tags"];
  wouldRevisit: boolean;
  visitedAt: string;
  memo: string;
  image: UserDestinationHistoryImage | null;
};

const historySteps: Array<{
  id: HistoryCreateStep;
  title: string;
  helper: string;
}> = [
  {
    id: "destination",
    title: "어디를 다녀왔나요?",
    helper: "가장 먼저 여행지를 고르면 나머지 입력이 훨씬 가벼워져요.",
  },
  {
    id: "date",
    title: "언제 다녀왔나요?",
    helper: "정확한 날짜가 아니어도 괜찮아요. 빠른 날짜 제안으로 바로 넘어갈 수 있어요.",
  },
  {
    id: "rating",
    title: "이번 여행은 몇 점이었나요?",
    helper: "전체 만족도를 먼저 남겨 두면 다음 추천이 더 빠르게 맞춰져요.",
  },
  {
    id: "tags",
    title: "어떤 결이 좋았나요?",
    helper: "해시태그는 최대 4개까지 고를 수 있어요.",
  },
  {
    id: "image",
    title: "사진도 남길까요?",
    helper: "대표 사진 한 장만 올려도 나중에 기록을 훨씬 빨리 떠올릴 수 있어요.",
  },
  {
    id: "memo",
    title: "마지막으로 한 줄 메모를 남겨 보세요.",
    helper: "기억에 남았던 장면이나 다음에 참고할 점만 짧게 적어도 충분해요.",
  },
];

const quickDateChoices = [
  { label: "오늘", offsetDays: 0 },
  { label: "1주 전", offsetDays: 7 },
  { label: "1달 전", offsetDays: 30 },
] as const;

/**
 * 오늘 날짜 입력값을 만든다.
 * @returns YYYY-MM-DD
 */
function getTodayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 오늘 기준 상대 날짜를 YYYY-MM-DD로 만든다.
 * @param offsetDays 오늘에서 뺄 일 수
 * @returns YYYY-MM-DD
 */
function getRelativeDateValue(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().slice(0, 10);
}

/**
 * 선택한 파일을 data URL 이미지로 읽는다.
 * @param file 브라우저 파일 객체
 * @returns 업로드용 이미지 객체
 */
function readImageFile(file: File): Promise<UserDestinationHistoryImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("IMAGE_TYPE_INVALID"));
      return;
    }

    if (file.size > 2_000_000) {
      reject(new Error("IMAGE_TOO_LARGE"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("IMAGE_READ_FAILED"));
        return;
      }

      resolve({
        name: file.name,
        contentType: file.type,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * step 입력을 API 바디 형식으로 변환한다.
 * @param draft 현재 입력 상태
 * @returns 여행 기록 생성 요청 바디
 */
function buildHistoryBody(draft: HistoryDraft) {
  return {
    destinationId: draft.destinationId,
    rating: draft.rating,
    tags: draft.tags,
    wouldRevisit: draft.wouldRevisit,
    visitedAt: new Date(`${draft.visitedAt}T00:00:00.000Z`).toISOString(),
    memo: draft.memo.trim() || null,
    image: draft.image,
  };
}

export function AccountHistoryCreateExperience({
  mode = "create",
  initialEntry,
}: {
  mode?: "create" | "edit";
  initialEntry?: UserDestinationHistory;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<HistoryDraft>({
    id: initialEntry?.id,
    destinationId: initialEntry?.destinationId ?? launchCatalog[0]?.id ?? "tokyo",
    rating: initialEntry?.rating ?? 5,
    tags: initialEntry?.tags ?? ["city"],
    wouldRevisit: initialEntry?.wouldRevisit ?? false,
    visitedAt: initialEntry ? initialEntry.visitedAt.slice(0, 10) : getTodayValue(),
    memo: initialEntry?.memo ?? "",
    image: initialEntry?.image ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = historySteps[stepIndex];
  const selectedDestination = launchCatalog.find((item) => item.id === draft.destinationId);
  const stepSummary = [
    selectedDestination?.nameKo ?? "목적지",
    draft.visitedAt,
    `${draft.rating}점`,
    `${draft.tags.length}개 태그`,
    draft.image ? "사진 있음" : "사진 없음",
    draft.memo.trim() ? "메모 있음" : "메모 없음",
  ];

  /**
   * 태그 선택을 토글한다.
   * @param tag 바꿀 태그
   */
  function toggleTag(tag: UserDestinationHistory["tags"][number]) {
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
   * 다음 step으로 이동한다.
   */
  function moveNext() {
    setStepIndex((current) => Math.min(current + 1, historySteps.length - 1));
  }

  /**
   * 이전 step으로 이동한다.
   */
  function moveBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  /**
   * 가벼운 선택 직후 자동으로 다음 단계로 보낸다.
   */
  function moveNextSoon() {
    window.setTimeout(() => {
      setStepIndex((current) => Math.min(current + 1, historySteps.length - 1));
    }, 120);
  }

  /**
   * 선택한 이미지를 draft에 반영한다.
   * @param fileList 입력 요소에서 받은 파일 목록
   */
  async function handleImageChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      setDraft((currentDraft) => ({ ...currentDraft, image: null }));
      return;
    }

    setError(null);

    try {
      const image = await readImageFile(file);
      setDraft((currentDraft) => ({ ...currentDraft, image }));
    } catch (imageError) {
      if (imageError instanceof Error && imageError.message === "IMAGE_TOO_LARGE") {
        setError("이미지는 2MB 이하 파일로 올려 주세요.");
        return;
      }

      setError("이미지를 읽지 못했어요. 다른 파일로 다시 시도해 주세요.");
    }
  }

  /**
   * 여행 기록을 저장하거나 수정하고 목록 화면으로 돌려보낸다.
   */
  async function submitHistory() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        mode === "edit" && draft.id ? `/api/me/history/${draft.id}` : "/api/me/history",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(buildHistoryBody(draft)),
        },
      );

      if (!response.ok) {
        throw new Error("HISTORY_SAVE_FAILED");
      }

      router.push("/account?tab=history");
      router.refresh();
    } catch {
      setError(
        mode === "edit"
          ? "여행 기록을 수정하지 못했어요. 잠시 후 다시 시도해 주세요."
          : "여행 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * 원하는 단계로 바로 점프한다.
   * @param nextStepIndex 이동할 단계 인덱스
   */
  function jumpToStep(nextStepIndex: number) {
    setStepIndex(nextStepIndex);
  }

  return (
    <ExperienceShell
      eyebrow={mode === "edit" ? "기록 수정" : "기록 추가"}
      title={mode === "edit" ? "남겨 둔 기록을 바로 고쳐 두세요." : "여행 기록은 길게 쓰지 않아도 됩니다."}
      intro={
        mode === "edit"
          ? "Polarsteps처럼 카드에서 바로 수정으로 들어와 필요한 단계만 빠르게 고칠 수 있게 정리했어요."
          : "Apple Journal이나 Day One처럼 처음부터 긴 폼을 보여주지 않고, 바로 답하기 쉬운 항목부터 순서대로 묻게 바꿨어요."
      }
      capsule={`${stepIndex + 1} / ${historySteps.length} 단계`}
      headerAside={
        <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
          <p className="compass-editorial-kicker">{mode === "edit" ? "수정 중인 기록" : "현재 기록"}</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
            {selectedDestination?.nameKo ?? draft.destinationId}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{currentStep.title}</p>
          <div className="mt-3 h-2 rounded-full bg-[color:var(--color-frame-soft)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand-primary)] transition-[width]"
              style={{ width: `${((stepIndex + 1) / historySteps.length) * 100}%` }}
            />
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-4" data-testid={testIds.account.root}>
        <div className="flex flex-wrap gap-2">
          {historySteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => jumpToStep(index)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                stepIndex === index ? "compass-selected" : "compass-selection-chip"
              }`}
            >
              {index + 1}. {stepSummary[index]}
            </button>
          ))}
        </div>

        <article className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
            <p data-testid={testIds.account.newHistoryStep} className="compass-editorial-kicker">
              {stepIndex + 1}단계 · {currentStep.title}
            </p>
            <h2 className="mt-1.5 font-display text-[1.18rem] leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.36rem]">
              {currentStep.helper}
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            {currentStep.id === "destination" ? (
              <div className="space-y-3">
                <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                  <span>방문한 목적지</span>
                  <select
                    data-testid={testIds.account.newHistoryDestination}
                    value={draft.destinationId}
                    onChange={(event) => {
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        destinationId: event.target.value,
                      }));
                      moveNextSoon();
                    }}
                    className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                  >
                    {launchCatalog.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.nameKo}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  {launchCatalog.slice(0, 6).map((destination) => (
                    <button
                      key={destination.id}
                      type="button"
                      onClick={() => {
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          destinationId: destination.id,
                        }));
                        moveNextSoon();
                      }}
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${
                        draft.destinationId === destination.id ? "compass-selected" : "compass-selection-chip"
                      }`}
                    >
                      {destination.nameKo}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep.id === "date" ? (
              <div className="space-y-3">
                <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                  <span>방문 날짜</span>
                  <input
                    data-testid={testIds.account.newHistoryDate}
                    type="date"
                    value={draft.visitedAt}
                    onChange={(event) => {
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        visitedAt: event.target.value,
                      }));
                    }}
                    className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {quickDateChoices.map((choice) => {
                    const value = getRelativeDateValue(choice.offsetDays);
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => {
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            visitedAt: value,
                          }));
                          moveNextSoon();
                        }}
                        className={`rounded-full px-3 py-2 text-xs font-semibold ${
                          draft.visitedAt === value ? "compass-selected" : "compass-selection-chip"
                        }`}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep.id === "rating" ? (
              <div className="grid gap-3 sm:grid-cols-5">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => {
                      setDraft((currentDraft) => ({ ...currentDraft, rating }));
                      moveNextSoon();
                    }}
                    className={`rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-center text-sm font-semibold ${
                      draft.rating === rating ? "compass-selected" : "compass-selection-chip"
                    }`}
                  >
                    {rating}점
                  </button>
                ))}

                <label className="sm:col-span-5 compass-open-info flex items-center gap-3 rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm text-[var(--color-ink)]">
                  <input
                    className="compass-checkbox"
                    type="checkbox"
                    checked={draft.wouldRevisit}
                    onChange={(event) => {
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        wouldRevisit: event.target.checked,
                      }));
                    }}
                  />
                  다음에도 다시 가고 싶은 곳이면 체크해 두세요.
                </label>
              </div>
            ) : null}

            {currentStep.id === "tags" ? (
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
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
                        active ? "compass-selected" : "compass-selection-chip"
                      }`}
                    >
                      #{formatVibeList([tag])}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {currentStep.id === "image" ? (
              <div className="space-y-3">
                <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                  <span>대표 사진</span>
                  <input
                    data-testid={testIds.account.newHistoryImageInput}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      void handleImageChange(event.target.files);
                    }}
                    className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                  />
                </label>

                {draft.image ? (
                  <div className="relative h-64 overflow-hidden rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame-soft)]">
                    <Image
                      data-testid={testIds.account.newHistoryImagePreview}
                      src={draft.image.dataUrl}
                      alt="선택한 여행 사진 미리보기"
                      fill
                      unoptimized
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="compass-note rounded-[calc(var(--radius-card)-10px)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                    사진 없이도 저장할 수 있어요. 바로 다음으로 넘어가도 됩니다.
                  </div>
                )}
              </div>
            ) : null}

            {currentStep.id === "memo" ? (
              <div className="space-y-3">
                <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                  <span>메모</span>
                  <textarea
                    data-testid={testIds.account.newHistoryMemo}
                    value={draft.memo}
                    maxLength={500}
                    onChange={(event) => {
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        memo: event.target.value,
                      }));
                    }}
                    rows={5}
                    placeholder="예: 야시장과 골목 카페가 특히 좋았고, 다음엔 가을에 다시 가고 싶어요."
                    className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    "다음엔 가을에 다시 가고 싶어요.",
                    "사진보다 현장 분위기가 더 좋았어요.",
                    "맛집 동선이 좋아서 다시 가고 싶어요.",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          memo: currentDraft.memo.trim() ? currentDraft.memo : suggestion,
                        }));
                      }}
                      className="rounded-full px-3 py-2 text-xs font-semibold compass-selection-chip"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="compass-warning-card mt-4 rounded-[calc(var(--radius-card)-10px)] px-4 py-3 text-sm leading-6">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  data-testid={testIds.account.newHistoryBack}
                  onClick={moveBack}
                  className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                >
                  이전
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  router.push("/account?tab=history");
                }}
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
              >
                목록으로
              </button>
            </div>

            {stepIndex < historySteps.length - 1 ? (
              <button
                type="button"
                data-testid={testIds.account.newHistoryNext}
                onClick={moveNext}
                className="compass-action-primary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                data-testid={testIds.account.newHistorySubmit}
                disabled={isSubmitting}
                onClick={() => {
                  void submitHistory();
                }}
                className="compass-action-primary compass-soft-press rounded-full px-5 py-2 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (mode === "edit" ? "수정 중..." : "저장 중...") : mode === "edit" ? "여행 기록 수정" : "여행 기록 저장"}
              </button>
            )}
          </div>
        </article>
      </div>
    </ExperienceShell>
  );
}
