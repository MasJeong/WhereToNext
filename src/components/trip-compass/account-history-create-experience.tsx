"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import {
  type DestinationProfile,
  userDestinationHistoryImageContentTypeValues,
  userDestinationHistoryCustomTagSchema,
  userDestinationHistoryImageExtensionValues,
  userDestinationHistoryImageMaxBytes,
  userDestinationHistoryImageMaxCount,
  type UserDestinationHistory,
  type UserDestinationHistoryImage,
} from "@/lib/domain/contracts";
import {
  getAccountHistoryCustomTagRemoveTestId,
  getAccountHistoryDestinationResultTestId,
  getAccountHistoryImageRemoveTestId,
  getAccountHistoryImageThumbTestId,
  testIds,
} from "@/lib/test-ids";
import { getCountryMetadata } from "@/lib/travel-support/country-metadata";
import { formatVibeList } from "@/lib/trip-compass/presentation";

import { ExperienceShell } from "./experience-shell";

type HistoryCreateStep = "destination" | "date" | "rating" | "tags" | "image" | "memo";

type HistoryDraft = {
  id?: string;
  destinationId: string;
  rating: number;
  tags: UserDestinationHistory["tags"];
  customTags: UserDestinationHistory["customTags"];
  wouldRevisit: boolean;
  visitedAt: string;
  memo: string;
  images: UserDestinationHistoryImage[];
  visibility: "private" | "public";
};

type HistoryDestinationOption = Pick<DestinationProfile, "id" | "nameKo" | "nameEn" | "countryCode">;

const historyRecommendedTags = ["city", "nature", "food", "shopping", "beach", "culture", "nightlife", "romance"] as const;
const maxCustomHistoryTags = 10;

function normalizeCustomHistoryTagInput(value: string): string {
  return value.trim().replace(/^#+/, "").trim();
}

function getCustomHistoryTagErrorMessage(value: string): string | null {
  const parsedTag = userDestinationHistoryCustomTagSchema.safeParse(value);

  if (parsedTag.success) {
    return null;
  }

  const issueMessage = parsedTag.error.issues[0]?.message;

  if (issueMessage === "CUSTOM_TAG_TOO_LONG") {
    return "해시태그는 24자 이하로 입력해 주세요.";
  }

  return "한글, 영문, 숫자, 밑줄, 하이픈만 사용할 수 있어요.";
}

const historySteps: Array<{
  id: HistoryCreateStep;
  label: string;
  title: string;
  helper: string;
}> = [
  {
    id: "destination",
    label: "여행지",
    title: "어디를 다녀왔나요?",
    helper: "여행지를 검색해서 선택하세요.",
  },
  {
    id: "date",
    label: "날짜",
    title: "언제 다녀왔나요?",
    helper: "정확하지 않아도 괜찮습니다.",
  },
  {
    id: "rating",
    label: "평점",
    title: "이번 여행은 어떠셨나요?",
    helper: "전체 만족도를 남겨 주세요.",
  },
  {
    id: "tags",
    label: "태그",
    title: "어떤 점이 좋았나요?",
    helper: "추천 태그를 고르고, 직접 태그는 따로 남겨 주세요.",
  },
  {
    id: "image",
    label: "사진",
    title: "사진을 추가하시겠어요?",
    helper: "선택 사항이에요. 건너뛰어도 됩니다.",
  },
  {
    id: "memo",
    label: "메모",
    title: "한 줄 메모를 남겨 보세요.",
    helper: "기억에 남는 장면을 짧게 적어 주세요.",
  },
];

const quickDateChoices = [
  { label: "오늘", offsetDays: 0 },
  { label: "1주 전", offsetDays: 7 },
  { label: "1달 전", offsetDays: 30 },
] as const;

const historyImageAccept = [...userDestinationHistoryImageExtensionValues, ...userDestinationHistoryImageContentTypeValues].join(",");

function isAllowedHistoryImageFile(file: File): boolean {
  const normalizedName = file.name.trim().toLowerCase();
  const hasAllowedContentType = userDestinationHistoryImageContentTypeValues.some(
    (contentType) => contentType === file.type,
  );
  const hasAllowedExtension = userDestinationHistoryImageExtensionValues.some((extension) =>
    normalizedName.endsWith(extension),
  );

  return hasAllowedContentType && hasAllowedExtension;
}

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
 * YYYY-MM-DD 입력값을 읽기 쉬운 날짜 문구로 바꾼다.
 * @param value 날짜 입력값
 * @returns 한국어 날짜 문구
 */
function formatHistoryDraftDate(value: string): string {
  if (!value) {
    return "날짜를 선택해 주세요.";
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return "날짜를 선택해 주세요.";
  }

  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 선택한 파일을 data URL 이미지로 읽는다.
 * @param file 브라우저 파일 객체
 * @returns 업로드용 이미지 객체
 */
function readImageFile(file: File): Promise<UserDestinationHistoryImage> {
  return new Promise((resolve, reject) => {
    if (!isAllowedHistoryImageFile(file)) {
      reject(new Error("IMAGE_TYPE_INVALID"));
      return;
    }

    const allowedContentType = userDestinationHistoryImageContentTypeValues.find(
      (contentType) => contentType === file.type,
    );

    if (!allowedContentType) {
      reject(new Error("IMAGE_TYPE_INVALID"));
      return;
    }

    if (file.size > userDestinationHistoryImageMaxBytes) {
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
        contentType: allowedContentType,
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
    customTags: draft.customTags,
    wouldRevisit: draft.wouldRevisit,
    visitedAt: new Date(`${draft.visitedAt}T00:00:00.000Z`).toISOString(),
    memo: draft.memo.trim() || null,
    images: draft.images,
    visibility: draft.visibility,
  };
}

function getHistoryDraftValidationError(
  draft: HistoryDraft,
  selectedDestination: HistoryDestinationOption | undefined,
): string | null {
  if (!selectedDestination) {
    return "목적지를 목록에서 선택해 주세요.";
  }

  if (!draft.visitedAt) {
    return "방문 날짜를 입력해 주세요.";
  }

  if (draft.rating < 1 || draft.rating > 5) {
    return "평점을 1~5 사이로 선택해 주세요.";
  }

  if (draft.tags.length < 1 || draft.tags.length > 4) {
    return "태그를 1~4개 선택해 주세요.";
  }

  return null;
}

function normalizeDestinationSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchesDestinationSearch(destination: HistoryDestinationOption, normalizedQuery: string): boolean {
  const countryMetadata = getCountryMetadata(destination.countryCode);
  const nameTargets = [
    normalizeDestinationSearchValue(destination.nameKo),
    normalizeDestinationSearchValue(destination.nameEn),
  ];

  if (normalizedQuery.length === 1) {
    return nameTargets.some((value) => value.startsWith(normalizedQuery));
  }

  const countryTargets = [
    normalizeDestinationSearchValue(destination.countryCode),
    normalizeDestinationSearchValue(countryMetadata?.countryNameKo ?? ""),
    normalizeDestinationSearchValue(countryMetadata?.countryName ?? ""),
  ];

  return [...nameTargets, ...countryTargets].some((value) => value.includes(normalizedQuery));
}

function rankDestinationSearchMatch(destination: HistoryDestinationOption, normalizedQuery: string): number {
  const countryMetadata = getCountryMetadata(destination.countryCode);
  const searchTargets = [
    normalizeDestinationSearchValue(destination.nameKo),
    normalizeDestinationSearchValue(destination.nameEn),
    normalizeDestinationSearchValue(destination.countryCode),
    normalizeDestinationSearchValue(countryMetadata?.countryNameKo ?? ""),
    normalizeDestinationSearchValue(countryMetadata?.countryName ?? ""),
  ];

  if (searchTargets.some((value) => value === normalizedQuery)) {
    return 0;
  }

  if (searchTargets.some((value) => value.startsWith(normalizedQuery))) {
    return 1;
  }

  return 2;
}

function formatDestinationSearchLabel(destination: HistoryDestinationOption | undefined): string {
  if (!destination) {
    return "";
  }

  return `${destination.nameKo} · ${destination.nameEn}`;
}

export function AccountHistoryCreateExperience({
  mode = "create",
  initialEntry,
  destinations = launchCatalog,
}: {
  mode?: "create" | "edit";
  initialEntry?: UserDestinationHistory;
  destinations?: HistoryDestinationOption[];
}) {
  const router = useRouter();
  const initialDraft: HistoryDraft = {
    id: initialEntry?.id,
    destinationId: initialEntry?.destinationId ?? "",
    rating: initialEntry?.rating ?? 5,
    tags: initialEntry?.tags ?? ["city"],
    customTags: initialEntry?.customTags ?? [],
    wouldRevisit: initialEntry?.wouldRevisit ?? false,
    visitedAt: initialEntry ? initialEntry.visitedAt.slice(0, 10) : getTodayValue(),
    memo: initialEntry?.memo ?? "",
    images: initialEntry?.images ?? [],
    visibility: initialEntry?.visibility ?? "private",
  };
  const initialDestination = destinations.find((item) => item.id === initialDraft.destinationId);
  const initialDestinationQuery = formatDestinationSearchLabel(initialDestination);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<HistoryDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const [customTagError, setCustomTagError] = useState<string | null>(null);
  const [isCustomTagComposing, setIsCustomTagComposing] = useState(false);
  const [shouldAddCustomTagAfterComposition, setShouldAddCustomTagAfterComposition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const currentStep = historySteps[stepIndex];
  const selectedDestination = destinations.find((item) => item.id === draft.destinationId);
  const [destinationQuery, setDestinationQuery] = useState(initialDestinationQuery);
  const filteredDestinations = useMemo(() => {
    const normalizedQuery = normalizeDestinationSearchValue(destinationQuery);

    if (!normalizedQuery) {
      return [];
    }

    return destinations
      .filter((destination) => matchesDestinationSearch(destination, normalizedQuery))
      .filter((destination, index, destinations) =>
        destinations.findIndex((candidate) => candidate.id === destination.id) === index,
      )
      .sort((left, right) => {
        const leftRank = rankDestinationSearchMatch(left, normalizedQuery);
        const rightRank = rankDestinationSearchMatch(right, normalizedQuery);

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return left.nameKo.localeCompare(right.nameKo, "ko");
      })
      .slice(0, 8);
  }, [destinationQuery, destinations]);
  const hasDestinationQuery = normalizeDestinationSearchValue(destinationQuery).length > 0;
  const hasDestinationSelection = Boolean(selectedDestination);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft)
    || destinationQuery !== initialDestinationQuery
    || customTagInput.trim().length > 0;

  function leaveHistoryFlow() {
    router.push("/account?tab=history");
  }

  /**
   * 작성 화면 이탈을 처리한다.
   */
  function handleCancel() {
    if (!isDirty) {
      leaveHistoryFlow();
      return;
    }

    setShowCancelConfirm(true);
  }

  /**
   * 태그 선택을 토글한다.
   * @param tag 바꿀 태그
   */
  function toggleTag(tag: UserDestinationHistory["tags"][number]) {
    setCustomTagError(null);
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

  function addCustomTagFromInput(rawValue: string) {
    const normalizedTag = normalizeCustomHistoryTagInput(rawValue);

    if (!normalizedTag) {
      setCustomTagError("해시태그를 입력해 주세요.");
      return;
    }

    if (draft.customTags.length >= maxCustomHistoryTags) {
      setCustomTagError("직접 등록 태그는 최대 10개까지예요.");
      return;
    }

    const duplicateExists = draft.customTags.some(
      (tag) => tag.toLocaleLowerCase() === normalizedTag.toLocaleLowerCase(),
    );

    if (duplicateExists) {
      setCustomTagError("이미 추가한 해시태그예요.");
      return;
    }

    const validationMessage = getCustomHistoryTagErrorMessage(normalizedTag);

    if (validationMessage) {
      setCustomTagError(validationMessage);
      return;
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      customTags: [...currentDraft.customTags, normalizedTag],
    }));
    setCustomTagInput("");
    setCustomTagError(null);
  }

  function addCustomTag() {
    if (isCustomTagComposing) {
      setShouldAddCustomTagAfterComposition(true);
      return;
    }

    addCustomTagFromInput(customTagInput);
  }

  function removeCustomTag(tagToRemove: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      customTags: currentDraft.customTags.filter((tag) => tag !== tagToRemove),
    }));
    setCustomTagError(null);
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

  function selectDestination(destination: HistoryDestinationOption) {
    setDestinationQuery(formatDestinationSearchLabel(destination));
    setDraft((currentDraft) => ({
      ...currentDraft,
      destinationId: destination.id,
    }));
    moveNextSoon();
  }

  /**
   * 선택한 이미지를 draft에 반영한다.
   * @param fileList 입력 요소에서 받은 파일 목록
   */
  async function handleImageChange(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) {
      return;
    }

    setError(null);

    try {
      const nextImages = await Promise.all(files.map((file) => readImageFile(file)));
      setDraft((currentDraft) => {
        const remainingSlots = Math.max(userDestinationHistoryImageMaxCount - currentDraft.images.length, 0);
        const appendedImages = nextImages.slice(0, remainingSlots);

        if (appendedImages.length === 0) {
          setError(`사진은 최대 ${userDestinationHistoryImageMaxCount}장까지 올릴 수 있어요.`);
          return currentDraft;
        }

        if (appendedImages.length < nextImages.length) {
          setError(`사진은 최대 ${userDestinationHistoryImageMaxCount}장까지 올릴 수 있어요.`);
        }

        const images = [...currentDraft.images, ...appendedImages];
        setSelectedImageIndex(images.length === appendedImages.length ? 0 : selectedImageIndex);

        return {
          ...currentDraft,
          images,
        };
      });
    } catch (imageError) {
      if (imageError instanceof Error && imageError.message === "IMAGE_TYPE_INVALID") {
        setError("PNG, JPG, WEBP, HEIC/HEIF 사진만 올려 주세요.");
        return;
      }

      if (imageError instanceof Error && imageError.message === "IMAGE_TOO_LARGE") {
        setError("사진 한 장은 10MB 이하 파일로 올려 주세요.");
        return;
      }

      setError("이미지를 읽지 못했어요. 다른 파일로 다시 시도해 주세요.");
    }
  }

  function removeImage(index: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      images: currentDraft.images.filter((_, imageIndex) => imageIndex !== index),
    }));

    setSelectedImageIndex((currentIndex) => {
      if (currentIndex > index) {
        return currentIndex - 1;
      }

      return currentIndex === index ? Math.max(currentIndex - 1, 0) : currentIndex;
    });
  }

  /**
   * 여행 기록을 저장하거나 수정하고 목록 화면으로 돌려보낸다.
   */
  async function submitHistory() {
    const validationError = getHistoryDraftValidationError(draft, selectedDestination);
    if (validationError) {
      setError(validationError);
      return;
    }

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
        const errorPayload = (await response.json().catch(() => null)) as
          | { code?: string; error?: string; issues?: Array<{ path?: Array<string | number>; message?: string }> }
          | null;

        if (response.status === 400 && errorPayload?.code === "INVALID_HISTORY") {
          const destinationIssue = errorPayload.issues?.find((issue) => issue.path?.[0] === "destinationId");

          if (destinationIssue?.message === "UNKNOWN_DESTINATION") {
            throw new Error("UNKNOWN_DESTINATION");
          }

          throw new Error(errorPayload.error ?? "INVALID_HISTORY");
        }

        throw new Error("HISTORY_SAVE_FAILED");
      }

      leaveHistoryFlow();
      router.refresh();
    } catch (error) {
      if (error instanceof Error && (error.message === "UNKNOWN_DESTINATION" || error.message === "여행 이력 형식이 올바르지 않습니다.")) {
        setError("입력 내용을 확인해 주세요. 목적지는 목록에서 선택해야 합니다.");
        return;
      }

      setError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
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
      title={mode === "edit" ? "여행 기록 수정" : "새 여행 기록"}
      intro={mode === "edit" ? "필요한 항목만 수정하세요." : "항목별로 짧게 입력하면 됩니다."}
      capsule={`${stepIndex + 1} / ${historySteps.length}`}
      headerAside={
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              data-testid={testIds.account.newHistoryCancel}
              onClick={handleCancel}
              className="cursor-pointer rounded-lg px-3 py-2 text-[0.82rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
            >
              {mode === "edit" ? "수정 그만하기" : "다음에 기록하기"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {selectedDestination ? (
              <span className="text-[0.85rem] font-semibold text-[var(--color-ink)]">{selectedDestination.nameKo}</span>
            ) : null}
            <div className="h-1.5 min-w-[6rem] flex-1 rounded-full bg-[var(--color-frame-soft)]">
              <div
                className="h-full rounded-full bg-[var(--color-sand)] transition-[width] duration-300"
                style={{ width: `${((stepIndex + 1) / historySteps.length) * 100}%` }}
              />
            </div>
            <span className="text-[0.75rem] font-medium text-[var(--color-ink-soft)]">{stepIndex + 1}/{historySteps.length}</span>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-5" data-testid={testIds.account.root}>
        {showCancelConfirm ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color:rgb(37_28_22_/_0.38)] px-4 pb-4 pt-12 sm:items-center sm:px-6 sm:py-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-cancel-title"
              aria-describedby="history-cancel-description"
              data-testid={testIds.account.newHistoryCancelDialog}
              className="w-full max-w-md rounded-[1.4rem] border border-[var(--color-frame-soft)] bg-white p-5 shadow-[0_18px_50px_rgba(30,24,19,0.18)]"
            >
              <div className="space-y-2">
                <h2 id="history-cancel-title" className="text-[1rem] font-semibold text-[var(--color-ink)]">
                  {mode === "edit" ? "수정을 그만할까요?" : "다음에 기록할까요?"}
                </h2>
                <p id="history-cancel-description" className="text-[0.86rem] leading-6 text-[var(--color-ink-soft)]">
                  {mode === "edit"
                    ? "여기서 나가면 방금 바꾼 내용은 저장되지 않아요."
                    : "여기서 나가면 지금까지 적은 기록은 저장되지 않아요."}
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  data-testid={testIds.account.newHistoryCancelStay}
                  onClick={() => setShowCancelConfirm(false)}
                  className="compass-action-secondary min-h-[44px] rounded-xl px-4 py-2.5 text-[0.82rem] font-semibold"
                >
                  계속 작성
                </button>
                <button
                  type="button"
                  data-testid={testIds.account.newHistoryCancelLeave}
                  onClick={leaveHistoryFlow}
                  className="min-h-[44px] cursor-pointer rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {mode === "edit" ? "수정 그만하기" : "다음에 기록하기"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── 스텝 네비게이션 ── */}
        <nav className="flex gap-0.5 overflow-x-auto" aria-label="입력 단계">
          {historySteps.map((step, index) => {
            const isCurrent = stepIndex === index;
            const isPast = index < stepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => jumpToStep(index)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[0.78rem] font-medium transition-colors cursor-pointer min-h-[36px] ${
                  isCurrent
                    ? "bg-[var(--color-sand)] text-white"
                    : isPast
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-sand-deep)]"
                      : "text-[var(--color-ink-soft)] hover:bg-slate-50"
                }`}
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                  isCurrent
                    ? "bg-white/30 text-white"
                    : isPast
                      ? "bg-[var(--color-sand-deep)] text-white"
                      : "bg-[var(--color-frame-soft)] text-[var(--color-ink-soft)]"
                }`}>
                  {isPast ? "✓" : index + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </nav>

        {/* ── 현재 스텝 본문 ── */}
        <article className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5 sm:px-6 sm:py-6">
          <div className="mb-5">
            <h2 data-testid={testIds.account.newHistoryStep} className="text-[1.1rem] font-bold text-[var(--color-ink)] sm:text-[1.2rem]">
              {currentStep.title}
            </h2>
            <p className="mt-1 text-[0.85rem] text-[var(--color-ink-soft)]">
              {currentStep.helper}
            </p>
          </div>

          <div className="space-y-4">
            {currentStep.id === "destination" ? (
              <div className="space-y-3">
                <input
                  data-testid={testIds.account.newHistoryDestinationSearch}
                  type="text"
                  value={destinationQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDestinationQuery(nextValue);
                    setDraft((currentDraft) =>
                      formatDestinationSearchLabel(selectedDestination) === nextValue
                        ? currentDraft
                        : {
                            ...currentDraft,
                            destinationId: "",
                          },
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    const firstDestination = filteredDestinations[0];

                    if (!firstDestination) {
                      return;
                    }

                    event.preventDefault();
                    selectDestination(firstDestination);
                  }}
                  placeholder="도시, 국가명, 영문명, 국가코드로 검색"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="여행지 검색"
                  className="w-full rounded-xl border border-[var(--color-frame-soft)] bg-white px-4 py-3.5 text-[0.9rem] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sand)]/20"
                />

                <div className="space-y-1.5">
                  {filteredDestinations.length > 0 ? (
                    filteredDestinations.map((destination, index) => {
                      const isSelected = draft.destinationId === destination.id;

                      return (
                        <button
                          key={destination.id}
                          type="button"
                          data-testid={getAccountHistoryDestinationResultTestId(index)}
                          onClick={() => selectDestination(destination)}
                          className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors min-h-[44px] ${
                            isSelected
                              ? "border-[var(--color-sand)] bg-[var(--color-accent-soft)]"
                              : "border-[var(--color-frame-soft)] bg-white hover:border-[var(--color-sand)] hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[0.88rem] font-semibold text-[var(--color-ink)]">{destination.nameKo}</p>
                            <p className="text-[0.78rem] text-[var(--color-ink-soft)]">
                              {destination.nameEn} · {destination.countryCode}
                            </p>
                          </div>
                          {isSelected ? (
                            <span className="shrink-0 text-[0.75rem] font-semibold text-[var(--color-sand-deep)]">
                              선택됨
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  ) : hasDestinationQuery ? (
                    <p className="px-1 py-3 text-[0.85rem] text-[var(--color-ink-soft)]">
                      검색 결과가 없습니다. 다른 이름으로 시도해 보세요.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep.id === "date" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[0.78rem] font-semibold text-[var(--color-ink-soft)]">선택한 날짜</p>
                      <p className="mt-1 text-[1.08rem] font-bold text-[var(--color-ink)] sm:text-[1.22rem]">
                        {formatHistoryDraftDate(draft.visitedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        dateInputRef.current?.showPicker?.();
                        dateInputRef.current?.focus();
                      }}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary)] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-[var(--color-action-primary-strong)]"
                    >
                      달력 열기
                    </button>
                  </div>

                  <input
                    ref={dateInputRef}
                    data-testid={testIds.account.newHistoryDate}
                    type="date"
                    value={draft.visitedAt}
                    aria-label="방문 날짜"
                    onChange={(event) => {
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        visitedAt: event.target.value,
                      }));
                      if (event.target.value) {
                        moveNextSoon();
                      }
                    }}
                    className="mt-4 min-h-[56px] w-full rounded-2xl border border-[var(--color-frame-soft)] bg-white px-4 py-3.5 text-[1rem] font-semibold text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sand)]/20 sm:text-[1.05rem]"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
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
                        className={`min-h-[52px] cursor-pointer rounded-2xl border px-4 py-3 text-left transition-colors ${
                          draft.visitedAt === value
                            ? "border-[var(--color-sand)] bg-[var(--color-accent-soft)] text-[var(--color-sand-deep)]"
                            : "border-[var(--color-frame-soft)] bg-white text-[var(--color-ink)] hover:border-[var(--color-sand)]"
                        }`}
                      >
                        <span className="block text-[0.85rem] font-semibold">{choice.label}</span>
                        <span className="mt-1 block text-[0.76rem] font-medium text-[var(--color-ink-soft)]">
                          {formatHistoryDraftDate(value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep.id === "rating" ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => {
                        setDraft((currentDraft) => ({ ...currentDraft, rating }));
                      }}
                      className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl text-lg font-bold transition-all ${
                        draft.rating === rating
                          ? "bg-[var(--color-sand)] text-white shadow-md"
                          : draft.rating >= rating
                            ? "bg-[var(--color-accent-soft)] text-[var(--color-sand-deep)]"
                            : "border border-[var(--color-frame-soft)] text-[var(--color-ink-soft)] hover:border-[var(--color-sand)]"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-frame-soft)] px-4 py-3.5 text-[0.88rem] text-[var(--color-ink)] transition-colors hover:border-[var(--color-sand)]">
                  <input
                    type="checkbox"
                    checked={draft.wouldRevisit}
                    onChange={(event) => {
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        wouldRevisit: event.target.checked,
                      }));
                      if (event.target.checked && draft.rating >= 1) {
                        moveNextSoon();
                      }
                    }}
                    className="h-4.5 w-4.5 rounded border-[var(--color-frame)] accent-[var(--color-sand)]"
                  />
                  다시 가고 싶은 곳이에요
                </label>
              </div>
            ) : null}

            {currentStep.id === "tags" ? (
              <div className="space-y-4">
                <section className="space-y-2.5">
                  <div>
                    <p className="text-[0.78rem] font-semibold text-[var(--color-ink)]">여행 스타일 태그</p>
                    <p className="mt-1 text-[0.78rem] text-[var(--color-ink-soft)]">다음 추천에 참고돼요.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {historyRecommendedTags.map((tag) => {
                      const active = draft.tags.includes(tag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleTag(tag)}
                          className={`min-h-[44px] rounded-full px-4 py-2.5 text-[0.85rem] font-medium ${
                            active ? "compass-selected" : "compass-selection-chip"
                          }`}
                        >
                          #{formatVibeList([tag])}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-4">
                  <div>
                    <p className="text-[0.78rem] font-semibold text-[var(--color-ink)]">나만의 태그</p>
                    <p className="mt-1 text-[0.78rem] text-[var(--color-ink-soft)]">자유롭게 기록하고 나중에 다시 찾아보세요.</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      data-testid={testIds.account.newHistoryCustomTagInput}
                      type="text"
                      value={customTagInput}
                      onChange={(event) => {
                        setCustomTagInput(event.target.value);
                        setCustomTagError(null);
                      }}
                      onCompositionStart={() => {
                        setIsCustomTagComposing(true);
                      }}
                      onCompositionEnd={(event) => {
                        const nextValue = event.currentTarget.value;
                        setIsCustomTagComposing(false);
                        setCustomTagInput(nextValue);

                        if (!shouldAddCustomTagAfterComposition) {
                          return;
                        }

                        setShouldAddCustomTagAfterComposition(false);
                        addCustomTagFromInput(nextValue);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") {
                          return;
                        }

                        if (event.nativeEvent.isComposing || isCustomTagComposing) {
                          return;
                        }

                        event.preventDefault();
                        addCustomTag();
                      }}
                      placeholder="#노을맛집 처럼 추가"
                      aria-label="직접 등록 해시태그"
                      className="w-full rounded-xl border border-[var(--color-frame-soft)] bg-white px-4 py-3 text-[0.88rem] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sand)]/20"
                    />
                    <button
                      data-testid={testIds.account.newHistoryCustomTagAdd}
                      type="button"
                      onClick={addCustomTag}
                      className="compass-action-secondary min-h-[44px] rounded-xl px-4 py-2.5 text-[0.82rem] font-semibold"
                    >
                      추가
                    </button>
                  </div>

                  <p className={`text-[0.76rem] ${customTagError ? "text-[var(--color-warning-text)]" : "text-[var(--color-ink-soft)]"}`}>
                    {customTagError ?? `직접 등록 태그는 최대 ${maxCustomHistoryTags}개까지 남길 수 있어요.`}
                  </p>

                  {draft.customTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {draft.customTags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--color-frame-soft)] bg-white px-3.5 py-2 text-[0.82rem] font-medium text-[var(--color-ink)]"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            data-testid={getAccountHistoryCustomTagRemoveTestId(index)}
                            onClick={() => removeCustomTag(tag)}
                            className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full border border-[var(--color-frame-soft)] text-[0.75rem] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)]"
                            aria-label={`${tag} 삭제`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            {currentStep.id === "image" ? (
              <div className="space-y-4">
                <label
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-frame)] bg-slate-50/50 px-6 py-8 text-center transition-colors hover:border-[var(--color-sand)] hover:bg-[var(--color-accent-soft)]"
                >
                  <span className="text-2xl text-[var(--color-ink-soft)]">+</span>
                  <span className="text-[0.85rem] font-medium text-[var(--color-ink-soft)]">사진 선택</span>
                  <span className="text-[0.75rem] text-[var(--color-ink-soft)]">최대 {userDestinationHistoryImageMaxCount}장, 10MB 이하</span>
                  <input
                    data-testid={testIds.account.newHistoryImageInput}
                    type="file"
                    multiple
                    accept={historyImageAccept}
                    onChange={(event) => {
                      void handleImageChange(event.target.files);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>

                {draft.images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative h-64 overflow-hidden rounded-2xl border border-[var(--color-frame-soft)] bg-gradient-to-b from-slate-50 to-slate-100">
                      <Image
                        data-testid={testIds.account.newHistoryImagePreview}
                        src={draft.images[selectedImageIndex]?.dataUrl ?? draft.images[0].dataUrl}
                        alt={`선택한 여행 사진 ${selectedImageIndex + 1}번 미리보기`}
                        fill
                        unoptimized
                        sizes="100vw"
                        className="object-cover"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[0.75rem] font-semibold text-[var(--color-ink)] backdrop-blur-sm">
                        {selectedImageIndex + 1} / {draft.images.length}
                      </div>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {draft.images.map((image, index) => {
                        const isSelected = index === selectedImageIndex;

                        return (
                          <div key={`${image.name}-${index}`} className="relative shrink-0">
                            <button
                              type="button"
                              data-testid={getAccountHistoryImageThumbTestId(index)}
                              onClick={() => {
                                setSelectedImageIndex(index);
                              }}
                              className={`relative h-18 w-18 cursor-pointer overflow-hidden rounded-xl border-2 transition-colors ${
                                isSelected
                                  ? "border-[var(--color-sand)]"
                                  : "border-transparent hover:border-[var(--color-frame)]"
                              }`}
                            >
                              <Image
                                src={image.dataUrl}
                                alt={`선택한 여행 사진 ${index + 1}번 썸네일`}
                                fill
                                unoptimized
                                sizes="4.5rem"
                                className="object-cover"
                              />
                            </button>
                            <button
                              type="button"
                              data-testid={getAccountHistoryImageRemoveTestId(index)}
                              onClick={() => {
                                removeImage(index);
                              }}
                              className="absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white shadow-sm"
                              aria-label={`${index + 1}번 사진 삭제`}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentStep.id === "memo" ? (
              <div className="space-y-3">
                <textarea
                  data-testid={testIds.account.newHistoryMemo}
                  value={draft.memo}
                  maxLength={500}
                  aria-label="메모"
                  onChange={(event) => {
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      memo: event.target.value,
                    }));
                  }}
                  rows={4}
                  placeholder="기억에 남는 장면이나 다음에 참고할 점을 적어 주세요."
                  className="w-full rounded-xl border border-[var(--color-frame-soft)] bg-white px-4 py-3.5 text-[0.9rem] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sand)]/20"
                />
                <div className="text-right text-[0.75rem] text-[var(--color-ink-soft)]">{draft.memo.length}/500</div>

                <div className="rounded-xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                  <p className="text-[0.76rem] font-semibold text-[var(--color-ink-soft)]">메모 예시</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      "다음엔 가을에 다시 가고 싶어요.",
                      "현장 분위기가 사진보다 좋았어요.",
                      "맛집 동선이 좋아서 또 가고 싶어요.",
                    ].map((suggestion) => (
                      <span
                        key={suggestion}
                        className="rounded-full border border-[var(--color-frame-soft)] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-[var(--color-ink-soft)]"
                      >
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── 공개 설정 ── */}
                <div className="rounded-xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                  <p className="mb-2.5 text-[0.78rem] font-semibold text-[var(--color-ink)]">
                    다른 여행자들과 이야기를 나눌까요?
                  </p>
                  <div className="inline-flex rounded-lg border border-[var(--color-frame-soft)] bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, visibility: "private" }))}
                      className={`min-h-[36px] rounded-md px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors ${
                        draft.visibility === "private"
                          ? "bg-[var(--color-sand)] text-white"
                          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      🔒 나만 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, visibility: "public" }))}
                      className={`min-h-[36px] rounded-md px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors ${
                        draft.visibility === "public"
                          ? "bg-[var(--color-sand)] text-white"
                          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      🌏 모두에게 공개
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3">
              <p className="text-[0.85rem] text-[var(--color-warning-text)]">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="알림 닫기"
                className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-[0.78rem] font-medium text-[var(--color-warning-text)] transition-opacity hover:opacity-70"
              >
                닫기
              </button>
            </div>
          ) : null}

          {/* ── 하단 네비게이션 ── */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--color-frame-soft)] pt-5">
            <div className="flex gap-2">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  data-testid={testIds.account.newHistoryBack}
                  onClick={moveBack}
                  className="cursor-pointer rounded-lg border border-[var(--color-frame-soft)] px-4 py-2.5 text-[0.82rem] font-medium text-[var(--color-ink-soft)] transition-colors min-h-[44px] hover:border-[var(--color-sand)] hover:text-[var(--color-sand-deep)]"
                >
                  이전
                </button>
              ) : null}
            </div>

            {stepIndex < historySteps.length - 1 ? (
              <button
                type="button"
                data-testid={testIds.account.newHistoryNext}
                onClick={moveNext}
                disabled={currentStep.id === "destination" && !hasDestinationSelection}
                className="compass-action-primary cursor-pointer rounded-lg px-6 py-2.5 text-[0.85rem] font-semibold min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="compass-action-primary cursor-pointer rounded-lg px-6 py-2.5 text-[0.85rem] font-semibold min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (mode === "edit" ? "수정 중..." : "저장 중...") : mode === "edit" ? "수정 완료" : "저장"}
              </button>
            )}
          </div>
        </article>
      </div>
    </ExperienceShell>
  );
}
