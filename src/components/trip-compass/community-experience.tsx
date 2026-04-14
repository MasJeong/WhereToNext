"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { buildApiUrl } from "@/lib/runtime/url";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CommunityPost = {
  historyId: string;
  authorName: string;
  authorImage: string | null;
  destinationName: string;
  rating: number;
  tags: string[];
  memo: string | null;
  imageUrl: string | null;
  commentCount: number;
  createdAt: string;
};

type Comment = {
  id: string;
  authorName: string;
  authorImage: string | null;
  content: string;
  createdAt: string;
};

type FeedPage = {
  items: CommunityPost[];
  nextCursor: string | null;
  totalCount: number;
  photoCount: number;
};

type FeedSort = "recommended" | "latest" | "ratingHigh" | "ratingLow";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  const months = Math.floor(days / 30);
  return `${months}달 전`;
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`별점 ${rating}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-[14px] w-[14px] ${
            i < rating
              ? "text-[#FBBF24]"
              : "text-[var(--color-funnel-border)]"
          }`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 0 0-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
        </svg>
      ))}
    </span>
  );
}

function truncateStory(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function buildQuickSignals(post: CommunityPost): string[] {
  const signals: string[] = [];
  const now = Date.now();
  const createdAt = new Date(post.createdAt).getTime();
  const diffDays = Math.floor((now - createdAt) / 86_400_000);

  if (post.tags[0]) {
    signals.push(post.tags[0]);
  }

  if (post.imageUrl) {
    signals.push("현장 사진 있음");
  }

  if (post.commentCount >= 3) {
    signals.push(`댓글 반응 ${post.commentCount}개`);
  }

  if (post.rating >= 5) {
    signals.push("만족도 높음");
  } else if (post.rating <= 3) {
    signals.push("아쉬운 점 체크");
  }

  if (diffDays <= 7) {
    signals.push("최근 올라온 후기");
  }

  return signals.slice(0, 3);
}

export function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}.${month}.${day}`;
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="mb-5 h-16 w-16 text-[var(--color-funnel-border)]"
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
        <path
          d="M22 38c2 4 6 6 10 6s8-2 10-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="26" r="2" fill="currentColor" />
        <circle cx="40" cy="26" r="2" fill="currentColor" />
      </svg>
      <p className="text-[0.95rem] font-semibold text-[var(--color-funnel-text)]">
        아직 공유된 이야기가 없어요
      </p>
      <p className="mt-1.5 text-[0.82rem] text-[var(--color-funnel-text-soft)]">
        여행을 다녀온 뒤 첫 번째 이야기를 남겨보세요
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comment section                                                    */
/* ------------------------------------------------------------------ */

export function CommentSection({
  historyId,
  isLoggedIn,
}: {
  historyId: string;
  isLoggedIn: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setComments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          buildApiUrl(`/api/community/${historyId}/comments`),
          { credentials: "same-origin" },
        );
        if (!res.ok) throw new Error("fetch-fail");
        const data = (await res.json()) as { comments: Comment[] };
        if (!cancelled) setComments(data.comments);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [historyId, isLoggedIn]);

  const handlePost = useCallback(async () => {
    const text = draft.trim();
    if (!text || posting) return;

    setPosting(true);
    try {
      const res = await fetch(
        buildApiUrl(`/api/community/${historyId}/comments`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ content: text }),
        },
      );

      if (!res.ok) throw new Error("post-fail");
      const created = (await res.json()) as { comment: Comment };
      setComments((prev) => [...prev, created.comment]);
      setDraft("");
    } catch {
      /* silent */
    } finally {
      setPosting(false);
    }
  }, [draft, historyId, posting]);

  return (
    <div className="mt-3 rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)]/40 px-4 py-3.5">
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-funnel-border)] border-t-[var(--color-action-primary)]" />
        </div>
      ) : !isLoggedIn ? (
        <p className="py-2 text-center text-[0.82rem] text-[var(--color-funnel-text-soft)]">
          댓글은 로그인 후 읽고 남길 수 있어요.
        </p>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-[0.82rem] text-[var(--color-funnel-text-soft)]">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-funnel-border)]">
                {c.authorImage ? (
                  <Image
                    src={c.authorImage}
                    alt=""
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[var(--color-funnel-text-soft)]" aria-hidden="true">
                    <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H3Z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[0.78rem] font-semibold text-[var(--color-funnel-text)]">
                    {c.authorName}
                  </span>
                  <span className="text-[0.68rem] text-[var(--color-funnel-text-soft)]">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.82rem] leading-relaxed text-[var(--color-funnel-text)]">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Input or login prompt */}
      <div className="mt-3 border-t border-[color:var(--color-funnel-border)] pt-3">
        {isLoggedIn ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  void handlePost();
                }
              }}
              placeholder="따뜻한 댓글을 남겨보세요"
              className="min-w-0 flex-1 rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2 text-[0.82rem] text-[var(--color-funnel-text)] placeholder:text-[var(--color-funnel-text-soft)] focus:border-[var(--color-action-primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handlePost()}
              disabled={!draft.trim() || posting}
              className="shrink-0 rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[0.82rem] font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {posting ? "..." : "보내기"}
            </button>
          </div>
        ) : (
          <Link
            href="/auth?intent=comment"
            className="block text-center text-[0.82rem] font-semibold text-[var(--color-action-primary)] hover:underline"
          >
            로그인하고 댓글 남기기
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Post card                                                          */
/* ------------------------------------------------------------------ */

function PostCommentActions({
  post,
  isLoggedIn,
}: {
  post: CommunityPost;
  isLoggedIn: boolean;
}) {
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      <div className="mt-4 flex items-center gap-4">
        <Link
          href={`/community/${post.historyId}`}
          className="text-[0.82rem] font-semibold text-[var(--color-action-primary)]"
        >
          상세 보기
        </Link>
        <button
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
          className="text-[0.82rem] font-semibold text-[var(--color-funnel-text-soft)] transition-colors hover:text-[var(--color-funnel-text)]"
        >
          {post.commentCount > 0
            ? `댓글 ${post.commentCount}개`
            : "댓글 쓰기"}
        </button>
      </div>

      {showComments ? (
        <CommentSection historyId={post.historyId} isLoggedIn={isLoggedIn} />
      ) : null}
    </>
  );
}

function HeroPostCard({
  post,
  isLoggedIn,
}: {
  post: CommunityPost;
  isLoggedIn: boolean;
}) {
  const [showFullMemo, setShowFullMemo] = useState(false);
  const hasLongMemo = (post.memo?.length ?? 0) > 150;
  const memoPreview = post.memo
    ? showFullMemo
      ? post.memo
      : truncateStory(post.memo, 150)
    : null;
  const quickSignals = buildQuickSignals(post);

  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--color-funnel-border)] bg-white shadow-[0_4px_16px_rgb(15_23_42_/_0.05)]">
      {post.imageUrl ? (
        <Link
          href={`/community/${post.historyId}`}
          className="group relative block overflow-hidden"
        >
          <div className="relative aspect-[4/3] sm:aspect-[16/9]">
            <Image
              src={post.imageUrl}
              alt={`${post.destinationName} 여행 사진`}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,19,0.12)_0%,rgba(7,10,19,0.12)_28%,rgba(7,10,19,0.72)_100%)]" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
              <span className="rounded-full bg-white/92 px-3 py-1 text-[0.7rem] font-semibold text-[var(--color-funnel-text)]">
                여행자 사진
              </span>
              <span className="rounded-full bg-black/35 px-3 py-1 text-[0.7rem] font-semibold text-white">
                상세 보기
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex items-center gap-2 text-[0.72rem] font-semibold text-white/88">
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span className="h-1 w-1 rounded-full bg-white/70" />
                <span>댓글 {post.commentCount}</span>
              </div>
              <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.7rem]">
                {post.destinationName}
              </h2>
              <div className="mt-2 flex items-center gap-3">
                <StarRating rating={post.rating} />
                <span className="text-[0.82rem] font-medium text-white/88">
                  {post.authorName}님의 실제 후기
                </span>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="space-y-3 bg-gradient-to-b from-[#f7f9ff] to-[#f2f6fe] px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]">
            <span>{formatRelativeTime(post.createdAt)}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-frame-strong)]" />
            <span>댓글 {post.commentCount}</span>
          </div>
          <h2 className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[1.65rem]">
            {post.destinationName}
          </h2>
          <div className="flex items-center gap-3">
            <StarRating rating={post.rating} />
            <span className="text-[0.82rem] font-medium text-[var(--color-funnel-text-soft)]">
              {post.authorName}님의 실제 후기
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-funnel-border)]">
            {post.authorImage ? (
              <Image
                src={post.authorImage}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[var(--color-funnel-text-soft)]" aria-hidden="true">
                <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H3Z" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[0.82rem] font-semibold text-[var(--color-funnel-text)]">
                {post.authorName}
              </p>
              <span className="rounded-full bg-[var(--color-funnel-muted)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-funnel-text-soft)]">
                대표 후기
              </span>
            </div>
            <p className="text-[0.68rem] text-[var(--color-funnel-text-soft)]">
              작성일 {formatAbsoluteDate(post.createdAt)}
            </p>
          </div>
        </div>

        {quickSignals.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]">
              빠르게 보면
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-[var(--color-decision-highlight)] px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-selected-text)]"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--color-funnel-text-soft)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {memoPreview ? (
          <div>
            <p className="text-[0.94rem] leading-8 text-[var(--color-funnel-text)]">
              {memoPreview}
            </p>
            {hasLongMemo ? (
              <button
                type="button"
                onClick={() => setShowFullMemo((prev) => !prev)}
                className="mt-2 text-[0.8rem] font-semibold text-[var(--color-action-primary)]"
              >
                {showFullMemo ? "접기" : "더 보기"}
              </button>
            ) : null}
          </div>
        ) : null}

        <PostCommentActions post={post} isLoggedIn={isLoggedIn} />
      </div>
    </article>
  );
}

function CompactPostCard({
  post,
  isLoggedIn,
}: {
  post: CommunityPost;
  isLoggedIn: boolean;
}) {
  const memoPreview = post.memo ? truncateStory(post.memo, 96) : null;
  const quickSignals = buildQuickSignals(post);

  return (
    <article className="rounded-2xl border border-[color:var(--color-funnel-border)] bg-white px-4 py-4 shadow-[0_2px_10px_rgb(15_23_42_/_0.04)]">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.66rem] font-semibold text-[var(--color-funnel-text-soft)]">
              {formatRelativeTime(post.createdAt)}
            </span>
            {post.imageUrl ? (
              <span className="rounded-full bg-[var(--color-decision-highlight)] px-2.5 py-1 text-[0.66rem] font-semibold text-[var(--color-selected-text)]">
                사진 포함
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-[1.02rem] font-semibold tracking-[-0.03em] text-[var(--color-funnel-text)]">
            {post.destinationName}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={post.rating} />
            <span className="text-[0.78rem] font-medium text-[var(--color-funnel-text-soft)]">
              {post.authorName}
            </span>
          </div>
          {memoPreview ? (
            <p className="mt-3 text-[0.84rem] leading-6 text-[var(--color-funnel-text)]">
              {memoPreview}
            </p>
          ) : null}
          {quickSignals.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]"
                >
                  {signal}
                </span>
              ))}
            </div>
          ) : null}
          {post.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
          <PostCommentActions post={post} isLoggedIn={isLoggedIn} />
        </div>
        {post.imageUrl ? (
          <Link
            href={`/community/${post.historyId}`}
            className="group relative hidden h-[8.5rem] w-[7rem] shrink-0 overflow-hidden rounded-[1rem] sm:block"
          >
            <Image
              src={post.imageUrl}
              alt={`${post.destinationName} 여행 사진`}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main feed component                                                */
/* ------------------------------------------------------------------ */

function buildFeedUrl(params: {
  cursor?: string | null;
  sort?: FeedSort;
  search?: string;
  photosOnly?: boolean;
}): string {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.sort && params.sort !== "recommended") q.set("sort", params.sort);
  if (params.search) q.set("search", params.search);
  if (params.photosOnly) q.set("photosOnly", "true");
  const qs = q.toString();
  return buildApiUrl(`/api/community${qs ? `?${qs}` : ""}`);
}

export function CommunityExperience() {
  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data?.user);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<FeedSort>("recommended");
  const [photosOnly, setPhotosOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  /* Debounce search input (400ms) */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* Fetch posts (re-fetches when sort/search/photosOnly changes) */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const res = await fetch(
          buildFeedUrl({ sort, search: debouncedSearch, photosOnly }),
        );
        if (!res.ok) throw new Error("fetch-fail");
        const data = (await res.json()) as FeedPage;
        if (!cancelled) {
          setPosts(data.items);
          setCursor(data.nextCursor);
          setHasMore(data.nextCursor !== null);
          setTotalCount(data.totalCount);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sort, debouncedSearch, photosOnly]);

  /* Load more */
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const res = await fetch(
        buildFeedUrl({ cursor, sort, search: debouncedSearch, photosOnly }),
      );
      if (!res.ok) throw new Error("fetch-fail");
      const data = (await res.json()) as FeedPage;
      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
      setTotalCount(data.totalCount);
    } catch {
      /* silent */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [cursor, hasMore, sort, debouncedSearch, photosOnly]);

  /* Infinite scroll via IntersectionObserver */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  /* ---- Render ---- */

  const featuredPost = posts[0] ?? null;
  const remainingPosts = featuredPost ? posts.slice(1) : [];
  const isDefaultFeedState =
    !debouncedSearch && sort === "recommended" && photosOnly;
  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-5 space-y-3">
        {/* Search */}
        <label className="relative block">
          <span className="sr-only">여행지 검색</span>
          <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-funnel-text-soft)]" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="여행지, 태그로 검색"
            className="w-full rounded-2xl border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] py-2.5 pl-10 pr-4 text-[0.82rem] text-[var(--color-funnel-text)] outline-none transition-colors placeholder:text-[var(--color-funnel-text-soft)] focus:border-[var(--color-action-primary)] focus:bg-white"
          />
        </label>

        {/* Sort + filter row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {([
            { key: "recommended" as FeedSort, label: "추천" },
            { key: "latest" as FeedSort, label: "최신" },
            { key: "ratingHigh" as FeedSort, label: "별점 높은순" },
            { key: "ratingLow" as FeedSort, label: "별점 낮은순" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSort(tab.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition-colors ${
                sort === tab.key
                  ? "bg-[var(--color-funnel-text)] text-white"
                  : "text-[var(--color-funnel-text-soft)] hover:text-[var(--color-funnel-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="mx-0.5 h-3.5 w-px bg-[var(--color-funnel-border)]" />
          <button
            type="button"
            onClick={() => setPhotosOnly((prev) => !prev)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition-colors ${
              photosOnly
                ? "bg-[var(--color-action-primary)] text-white"
                : "text-[var(--color-funnel-text-soft)] hover:text-[var(--color-funnel-text)]"
            }`}
          >
            사진만
          </button>
          <span className="ml-auto shrink-0 text-[0.72rem] text-[var(--color-funnel-text-soft)]">
            {totalCount}개의 후기
          </span>
        </div>
      </section>

      {!loading && posts.length === 0 ? (
        isDefaultFeedState ? (
          <EmptyState />
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-funnel-border)] px-4 py-10 text-center">
            <p className="text-[0.9rem] font-semibold text-[var(--color-funnel-text)]">
              조건에 맞는 후기가 아직 없어요
            </p>
            <p className="mt-1 text-[0.8rem] text-[var(--color-funnel-text-soft)]">
              검색어를 바꾸거나 사진만 필터를 끄고 다시 찾아보세요.
            </p>
          </div>
        )
      ) : null}

      {loading && posts.length === 0 ? (
        <div className="space-y-6 py-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-full bg-[var(--color-funnel-muted)]" />
                <div className="space-y-1.5">
                  <span className="block h-3 w-20 rounded bg-[var(--color-funnel-muted)]" />
                  <span className="block h-2.5 w-12 rounded bg-[var(--color-funnel-muted)]" />
                </div>
              </div>
              <span className="block h-4 w-40 rounded bg-[var(--color-funnel-muted)]" />
              <span className="block h-3 w-full rounded bg-[var(--color-funnel-muted)]" />
              <span className="block aspect-[4/3] w-full rounded-[1.2rem] bg-[var(--color-funnel-muted)]" />
            </div>
          ))}
        </div>
      ) : null}

      {featuredPost ? (
        <section className="space-y-6">
          <HeroPostCard post={featuredPost} isLoggedIn={isLoggedIn} />

          {remainingPosts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-[0.92rem] font-semibold text-[var(--color-funnel-text)]">
                더 둘러보기
              </h3>
              <div className="space-y-3">
                {remainingPosts.map((post) => (
                  <CompactPostCard key={post.historyId} post={post} isLoggedIn={isLoggedIn} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {loadingMore ? (
        <div className="flex items-center justify-center py-6">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-funnel-border)] border-t-[var(--color-action-primary)]" />
        </div>
      ) : null}

      {!hasMore && posts.length > 0 ? (
        <p className="py-8 text-center text-[0.78rem] text-[var(--color-funnel-text-soft)]">
          모든 이야기를 다 읽었어요
        </p>
      ) : null}
    </div>
  );
}
