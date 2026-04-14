"use client";

import Image from "next/image";

import { authClient } from "@/lib/auth-client";

import {
  type CommunityPost,
  CommentSection,
  StarRating,
  formatRelativeTime,
} from "./community-experience";

type CommunityDetailExperienceProps = {
  post: CommunityPost;
};

/**
 * 로그인한 사용자가 읽는 여행 이야기 상세 화면이다.
 * @param props 공개 여행 이야기 상세 데이터
 * @returns 상세 콘텐츠 렌더 결과
 */
export function CommunityDetailExperience({ post }: CommunityDetailExperienceProps) {
  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data?.user);

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-3 border-b border-[color:var(--color-funnel-border)] pb-5">
        <div className="flex items-center gap-2.5">
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
            <p className="text-[0.72rem] text-[var(--color-ink-soft)]">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
            {post.destinationName}
          </h2>
          <StarRating rating={post.rating} />
        </div>

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-ink-soft)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {post.imageUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem]">
          <Image
            src={post.imageUrl}
            alt={`${post.destinationName} 여행 사진`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      {post.memo ? (
        <section className="compass-story-card space-y-2 px-5 py-5">
          <h3 className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            여행 이야기
          </h3>
          <p className="text-[0.94rem] leading-8 text-[var(--color-ink)]">{post.memo}</p>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[0.95rem] font-semibold text-[var(--color-ink)]">댓글</h3>
        <CommentSection historyId={post.historyId} isLoggedIn={isLoggedIn} />
      </section>
    </article>
  );
}
