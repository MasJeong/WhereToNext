"use client";

import Image from "next/image";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

import {
  type CommunityPost,
  CommentSection,
  StarRating,
  formatAbsoluteDate,
  formatRelativeTime,
} from "./community-experience";

type CommunityDetailExperienceProps = {
  post: CommunityPost;
};

const helpfulStorageKeyPrefix = "community-helpful:";

/**
 * 로그인한 사용자가 읽는 여행 이야기 상세 화면이다.
 * @param props 공개 여행 이야기 상세 데이터
 * @returns 상세 콘텐츠 렌더 결과
 */
export function CommunityDetailExperience({ post }: CommunityDetailExperienceProps) {
  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data?.user);
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="overflow-hidden rounded-[1.65rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)] shadow-[0_18px_38px_rgb(15_23_42_/_0.05)]">
          {post.imageUrl ? (
            <div>
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="group block w-full text-left"
              >
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9]">
                  <Image
                    src={post.imageUrl}
                    alt={`${post.destinationName} 여행 사진`}
                    fill
                    sizes="(max-width: 960px) 100vw, 960px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,19,0.12)_0%,rgba(7,10,19,0.18)_38%,rgba(7,10,19,0.76)_100%)]" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[0.7rem] font-semibold text-[var(--color-ink)]">
                      여행자 사진
                    </span>
                    <span className="rounded-full bg-black/35 px-3 py-1 text-[0.7rem] font-semibold text-white">
                      크게 보기
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-white/78">
                      {post.authorName}님의 여행 이야기
                    </p>
                    <h1 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.9rem]">
                      {post.destinationName}
                    </h1>
                    <div className="mt-2 flex items-center gap-3">
                      <StarRating rating={post.rating} />
                      <span className="text-[0.82rem] text-white/88">
                        {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
              <div className="border-t border-[color:var(--color-funnel-border)] bg-white px-5 py-3 sm:px-6">
                <p className="text-[0.78rem] leading-relaxed text-[var(--color-ink-soft)]">
                  현장 사진으로 먼저 분위기를 확인하고, 아래 후기에서 동선과 팁을 이어서 읽어보세요.
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-funnel-border)]">
                {post.authorImage ? (
                  <Image
                    src={post.authorImage}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[var(--color-ink-soft)]" aria-hidden="true">
                    <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H3Z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[0.88rem] font-semibold text-[var(--color-ink)]">{post.authorName}</p>
                <p className="text-[0.72rem] text-[var(--color-ink-soft)]">
                  작성일 {formatAbsoluteDate(post.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.2rem] bg-white px-4 py-4 shadow-[var(--shadow-paper)] sm:grid-cols-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                  만족도
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold text-[var(--color-ink)]">
                  별점 {post.rating}.0
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                  대화
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold text-[var(--color-ink)]">
                  댓글 {post.commentCount}개
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                  사진
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold text-[var(--color-ink)]">
                  현장 분위기 포함
                </p>
              </div>
            </div>

            {post.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--color-ink-soft)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <HelpfulReaction key={post.historyId} historyId={post.historyId} />
          </div>
        </header>

        {post.memo ? (
          <section className="compass-story-card space-y-3 px-5 py-5 sm:px-6">
            <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
              여행 메모
            </h2>
            <p className="text-[1rem] leading-8 text-[var(--color-ink)]">{post.memo}</p>
          </section>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.98rem] font-semibold text-[var(--color-ink)]">대화</h2>
            <p className="text-[0.76rem] text-[var(--color-ink-soft)]">
              여행 팁을 이어서 물어볼 수 있어요
            </p>
          </div>
          <CommentSection historyId={post.historyId} isLoggedIn={isLoggedIn} />
        </section>
      </article>

      {isImageOpen && post.imageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="여행 사진 크게 보기"
          onClick={() => setIsImageOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/12 px-3 py-2 text-[0.8rem] font-semibold text-white"
            onClick={() => setIsImageOpen(false)}
          >
            닫기
          </button>
          <div
            className="relative h-full max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={post.imageUrl}
              alt={`${post.destinationName} 여행 사진 크게 보기`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

type HelpfulReactionProps = {
  historyId: string;
};

/**
 * 현재 브라우저에서만 유지되는 후기 도움 반응 상태를 렌더링한다.
 * @param props 여행 이력 식별자
 * @returns 도움 반응 토글 UI
 */
function HelpfulReaction({ historyId }: HelpfulReactionProps) {
  const [isHelpful, setIsHelpful] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(`${helpfulStorageKeyPrefix}${historyId}`) === "true";
  });

  const handleHelpfulToggle = () => {
    const nextValue = !isHelpful;
    setIsHelpful(nextValue);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `${helpfulStorageKeyPrefix}${historyId}`,
        nextValue ? "true" : "false",
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)]/45 px-4 py-3">
      <button
        type="button"
        onClick={handleHelpfulToggle}
        aria-pressed={isHelpful}
        className={`rounded-full px-4 py-2 text-[0.82rem] font-semibold transition-colors ${
          isHelpful
            ? "bg-[var(--color-action-primary)] text-white"
            : "border border-[color:var(--color-funnel-border)] bg-white text-[var(--color-ink)]"
        }`}
      >
        {isHelpful ? "도움이 됐어요" : "이 후기가 도움됐어요"}
      </button>
      <p className="text-[0.76rem] text-[var(--color-ink-soft)]">
        {isHelpful
          ? "이 브라우저에 유용한 후기로 저장했어요."
          : "나중에 다시 보기 쉽게 이 브라우저에만 표시해 둘 수 있어요."}
      </p>
    </div>
  );
}
