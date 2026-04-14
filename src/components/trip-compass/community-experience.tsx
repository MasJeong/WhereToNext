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
};

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
      <p className="text-[0.95rem] font-semibold text-[var(--color-ink)]">
        아직 공유된 이야기가 없어요
      </p>
      <p className="mt-1.5 text-[0.82rem] text-[var(--color-ink-soft)]">
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
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          buildApiUrl(`/api/community/${historyId}/comments`),
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
  }, [historyId]);

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
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-[0.82rem] text-[var(--color-ink-soft)]">
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
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[var(--color-ink-soft)]" aria-hidden="true">
                    <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H3Z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[0.78rem] font-semibold text-[var(--color-ink)]">
                    {c.authorName}
                  </span>
                  <span className="text-[0.68rem] text-[var(--color-ink-soft)]">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.82rem] leading-relaxed text-[var(--color-ink)]">
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
              className="min-w-0 flex-1 rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2 text-[0.82rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-action-primary)] focus:outline-none"
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

function PostCard({
  post,
  isLoggedIn,
}: {
  post: CommunityPost;
  isLoggedIn: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const localCommentCount = post.commentCount;

  return (
    <article className="py-5">
      {/* Author row */}
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
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[var(--color-ink-soft)]" aria-hidden="true">
              <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H3Z" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.82rem] font-semibold text-[var(--color-ink)]">
            {post.authorName}
          </p>
          <p className="text-[0.68rem] text-[var(--color-ink-soft)]">
            {formatRelativeTime(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Destination heading */}
      <h3 className="mt-3 text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-[var(--color-ink)]">
        {post.destinationName}
      </h3>

      {/* Rating */}
      <div className="mt-1.5">
        <StarRating rating={post.rating} />
      </div>

      {/* Tags */}
      {post.tags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[color:var(--color-funnel-border)] bg-white/80 px-2.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-ink-soft)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Memo */}
      {post.memo ? (
        <p className="mt-3 text-[0.88rem] leading-relaxed text-[var(--color-ink)]">
          {post.memo}
        </p>
      ) : null}

      {/* Image */}
      {post.imageUrl ? (
        <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[1.2rem]">
          <Image
            src={post.imageUrl}
            alt={`${post.destinationName} 여행 사진`}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
          />
        </div>
      ) : null}

      {/* Comment toggle button */}
      <button
        type="button"
        onClick={() => setShowComments((prev) => !prev)}
        className="mt-3 text-[0.82rem] font-semibold text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
      >
        {localCommentCount > 0
          ? `댓글 ${localCommentCount}개`
          : "댓글 쓰기"}
      </button>

      {/* Inline comment section */}
      {showComments ? (
        <CommentSection historyId={post.historyId} isLoggedIn={isLoggedIn} />
      ) : null}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main feed component                                                */
/* ------------------------------------------------------------------ */

export function CommunityExperience() {
  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data?.user);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  /* Initial fetch */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(buildApiUrl("/api/community"));
        if (!res.ok) throw new Error("fetch-fail");
        const data = (await res.json()) as FeedPage;
        if (!cancelled) {
          setPosts(data.items);
          setCursor(data.nextCursor);
          setHasMore(data.nextCursor !== null);
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
  }, []);

  /* Load more */
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const res = await fetch(
        buildApiUrl(`/api/community?cursor=${encodeURIComponent(cursor)}`),
      );
      if (!res.ok) throw new Error("fetch-fail");
      const data = (await res.json()) as FeedPage;
      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch {
      /* silent */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [cursor, hasMore]);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
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
    );
  }

  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="divide-y divide-[var(--color-funnel-border)]">
        {posts.map((post) => (
          <PostCard key={post.historyId} post={post} isLoggedIn={isLoggedIn} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {loadingMore ? (
        <div className="flex items-center justify-center py-6">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-funnel-border)] border-t-[var(--color-action-primary)]" />
        </div>
      ) : null}

      {!hasMore && posts.length > 0 ? (
        <p className="py-8 text-center text-[0.78rem] text-[var(--color-ink-soft)]">
          모든 이야기를 다 읽었어요
        </p>
      ) : null}
    </div>
  );
}
