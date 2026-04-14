import { randomUUID } from "node:crypto";

import { and, asc, count, desc, eq, ilike, lt, or, sql } from "drizzle-orm";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { getRuntimeDatabase } from "@/lib/db/runtime";
import {
  communityComments,
  destinationProfiles,
  user as userTable,
  userDestinationHistory,
} from "@/lib/db/schema";
import type { CommunityComment } from "@/lib/domain/contracts";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";

const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

const PAGE_SIZE = 20;

export type CommunityPostRow = {
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

export type CommentRow = {
  id: string;
  authorName: string;
  authorImage: string | null;
  content: string;
  createdAt: string;
};

/**
 * 특정 여행 이야기가 현재 공개 상태로 읽을 수 있는지 확인한다.
 * @param historyId 여행 이력 식별자
 * @returns 공개 상태 여부
 */
export async function isPublicPostVisible(historyId: string): Promise<boolean> {
  if (!usePersistentDatabase) {
    const historyEntries = useLocalFileStore
      ? Object.values((await readLocalStore()).history)
      : [...memoryStore.history.values()];

    return historyEntries.some(
      (entry) => entry.id === historyId && entry.visibility === "public",
    );
  }

  const { db } = await getRuntimeDatabase();
  const [entry] = await db
    .select({ id: userDestinationHistory.id })
    .from(userDestinationHistory)
    .where(
      and(
        eq(userDestinationHistory.id, historyId),
        eq(userDestinationHistory.visibility, "public"),
      ),
    )
    .limit(1);

  return Boolean(entry);
}

/* ------------------------------------------------------------------ */
/*  Community feed                                                     */
/* ------------------------------------------------------------------ */

export type FeedSort = "recommended" | "latest" | "ratingHigh" | "ratingLow";

export type FeedFilter = {
  cursor?: string;
  sort?: FeedSort;
  search?: string;
  photosOnly?: boolean;
};

export async function listPublicPosts(filter?: FeedFilter): Promise<{
  items: CommunityPostRow[];
  nextCursor: string | null;
  totalCount: number;
  photoCount: number;
}> {
  if (!usePersistentDatabase) {
    return listPublicPostsInMemory(filter);
  }

  return listPublicPostsFromDb(filter);
}

function matchesSearch(
  entry: { destinationId: string; memo?: string | null; customTags?: string[] | null },
  term: string,
): boolean {
  const destination = launchCatalog.find((d) => d.id === entry.destinationId);
  const searchable = [
    destination?.nameKo ?? entry.destinationId,
    entry.memo ?? "",
    ...(entry.customTags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(term);
}

function sortPostRows(items: CommunityPostRow[], sort: FeedSort): CommunityPostRow[] {
  const sorted = [...items];
  if (sort === "latest") {
    return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  if (sort === "ratingHigh") {
    return sorted.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
  }
  if (sort === "ratingLow") {
    return sorted.sort((a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt));
  }
  // recommended
  return sorted.sort((a, b) => {
    const ai = Number(Boolean(a.imageUrl));
    const bi = Number(Boolean(b.imageUrl));
    if (ai !== bi) return bi - ai;
    if (a.commentCount !== b.commentCount) return b.commentCount - a.commentCount;
    if (a.rating !== b.rating) return b.rating - a.rating;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

async function listPublicPostsInMemory(filter?: FeedFilter): Promise<{
  items: CommunityPostRow[];
  nextCursor: string | null;
  totalCount: number;
  photoCount: number;
}> {
  const historyEntries = useLocalFileStore
    ? Object.values((await readLocalStore()).history)
    : [...memoryStore.history.values()];

  const users = useLocalFileStore
    ? (await readLocalStore()).users
    : Object.fromEntries(memoryStore.users.entries());

  const allComments = useLocalFileStore
    ? Object.values((await readLocalStore()).communityComments)
    : [...memoryStore.communityComments.values()];

  const cursor = filter?.cursor;
  const sort = filter?.sort ?? "recommended";
  const search = filter?.search?.trim().toLowerCase() ?? "";
  const photosOnly = filter?.photosOnly ?? false;

  let publicEntries = historyEntries.filter((entry) => entry.visibility === "public");

  if (search) {
    publicEntries = publicEntries.filter((entry) => matchesSearch(entry, search));
  }

  if (photosOnly) {
    publicEntries = publicEntries.filter((entry) => Boolean(entry.images?.[0]?.dataUrl));
  }

  const totalCount = publicEntries.length;
  const photoCount = publicEntries.filter((entry) => Boolean(entry.images?.[0]?.dataUrl)).length;

  // Build rows first, then sort
  const allRows: CommunityPostRow[] = publicEntries.map((entry) => {
    const author = users[entry.userId];
    const destination = launchCatalog.find((d) => d.id === entry.destinationId);
    const entryComments = allComments.filter((c) => c.historyId === entry.id);

    return {
      historyId: entry.id,
      authorName: author?.name ?? "여행자",
      authorImage: author?.image ?? null,
      destinationName: destination?.nameKo ?? entry.destinationId,
      rating: entry.rating,
      tags: entry.customTags ?? [],
      memo: entry.memo ?? null,
      imageUrl: entry.images?.[0]?.dataUrl ?? null,
      commentCount: entryComments.length,
      createdAt: entry.createdAt,
    };
  });

  const sorted = sortPostRows(allRows, sort);

  let startIndex = 0;
  if (cursor) {
    const cursorIdx = sorted.findIndex((row) => row.createdAt < cursor);
    startIndex = cursorIdx >= 0 ? cursorIdx : sorted.length;
  }

  const page = sorted.slice(startIndex, startIndex + PAGE_SIZE);

  const lastItem = page[page.length - 1];
  const nextCursor =
    page.length === PAGE_SIZE && lastItem ? lastItem.createdAt : null;

  return { items: page, nextCursor, totalCount, photoCount };
}

async function listPublicPostsFromDb(filter?: FeedFilter): Promise<{
  items: CommunityPostRow[];
  nextCursor: string | null;
  totalCount: number;
  photoCount: number;
}> {
  const { db } = await getRuntimeDatabase();

  const cursor = filter?.cursor;
  const sort = filter?.sort ?? "recommended";
  const search = filter?.search?.trim() ?? "";
  const photosOnly = filter?.photosOnly ?? false;

  const whereConditions = [eq(userDestinationHistory.visibility, "public")];

  if (cursor) {
    whereConditions.push(lt(userDestinationHistory.createdAt, new Date(cursor)));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(destinationProfiles.nameKo, `%${search}%`),
        ilike(userDestinationHistory.memo, `%${search}%`),
        sql`${userDestinationHistory.customTags}::text ILIKE ${"%" + search + "%"}`,
      )!,
    );
  }

  if (photosOnly) {
    whereConditions.push(sql`jsonb_array_length(COALESCE(${userDestinationHistory.images}, '[]'::jsonb)) > 0`);
  }

  const countConditions = [eq(userDestinationHistory.visibility, "public")];

  if (search) {
    countConditions.push(
      or(
        ilike(destinationProfiles.nameKo, `%${search}%`),
        ilike(userDestinationHistory.memo, `%${search}%`),
        sql`${userDestinationHistory.customTags}::text ILIKE ${"%" + search + "%"}`,
      )!,
    );
  }

  if (photosOnly) {
    countConditions.push(sql`jsonb_array_length(COALESCE(${userDestinationHistory.images}, '[]'::jsonb)) > 0`);
  }

  const [totals] = await db
    .select({
      totalCount: count(),
      photoCount: sql<number>`count(*) filter (where jsonb_array_length(COALESCE(${userDestinationHistory.images}, '[]'::jsonb)) > 0)`,
    })
    .from(userDestinationHistory)
    .innerJoin(destinationProfiles, eq(destinationProfiles.id, userDestinationHistory.destinationId))
    .where(and(...countConditions));

  // Order by sort
  const orderClauses = [];
  if (sort === "ratingHigh") {
    orderClauses.push(desc(userDestinationHistory.rating));
    orderClauses.push(desc(userDestinationHistory.createdAt));
  } else if (sort === "ratingLow") {
    orderClauses.push(asc(userDestinationHistory.rating));
    orderClauses.push(desc(userDestinationHistory.createdAt));
  } else {
    // latest and recommended both sort by createdAt desc for DB query
    orderClauses.push(desc(userDestinationHistory.createdAt));
  }

  const rows = await db
    .select({
      historyId: userDestinationHistory.id,
      authorName: userTable.name,
      authorImage: userTable.image,
      destinationNameKo: destinationProfiles.nameKo,
      destinationId: userDestinationHistory.destinationId,
      rating: userDestinationHistory.rating,
      customTags: userDestinationHistory.customTags,
      memo: userDestinationHistory.memo,
      images: userDestinationHistory.images,
      createdAt: userDestinationHistory.createdAt,
    })
    .from(userDestinationHistory)
    .leftJoin(userTable, eq(userDestinationHistory.userId, userTable.id))
    .leftJoin(
      destinationProfiles,
      eq(userDestinationHistory.destinationId, destinationProfiles.id),
    )
    .where(and(...whereConditions))
    .orderBy(...orderClauses)
    .limit(PAGE_SIZE);

  const historyIds = rows.map((r) => r.historyId);

  const commentCounts = new Map<string, number>();
  if (historyIds.length > 0) {
    for (const hid of historyIds) {
      const [result] = await db
        .select({ cnt: count() })
        .from(communityComments)
        .where(eq(communityComments.historyId, hid));
      commentCounts.set(hid, result?.cnt ?? 0);
    }
  }

  let items: CommunityPostRow[] = rows.map((row) => {
    const images = row.images as
      | Array<{ name: string; contentType: string; dataUrl: string }>
      | null;

    return {
      historyId: row.historyId,
      authorName: row.authorName ?? "여행자",
      authorImage: row.authorImage ?? null,
      destinationName: row.destinationNameKo ?? row.destinationId,
      rating: row.rating,
      tags: (row.customTags as string[] | null) ?? [],
      memo: row.memo ?? null,
      imageUrl: images?.[0]?.dataUrl ?? null,
      commentCount: commentCounts.get(row.historyId) ?? 0,
      createdAt: row.createdAt.toISOString(),
    };
  });

  // recommended sort needs post-processing (image + comments + rating)
  if (sort === "recommended") {
    items = sortPostRows(items, "recommended");
  }

  const lastItem = items[items.length - 1];
  const nextCursor =
    items.length === PAGE_SIZE && lastItem ? lastItem.createdAt : null;

  return {
    items,
    nextCursor,
    totalCount: totals?.totalCount ?? 0,
    photoCount: totals?.photoCount ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Single post                                                        */
/* ------------------------------------------------------------------ */

export async function readPublicPost(
  historyId: string,
): Promise<CommunityPostRow | null> {
  if (!usePersistentDatabase) {
    return readPublicPostInMemory(historyId);
  }

  return readPublicPostFromDb(historyId);
}

async function readPublicPostInMemory(
  historyId: string,
): Promise<CommunityPostRow | null> {
  const historyEntries = useLocalFileStore
    ? Object.values((await readLocalStore()).history)
    : [...memoryStore.history.values()];

  const entry = historyEntries.find(
    (e) => e.id === historyId && e.visibility === "public",
  );
  if (!entry) return null;

  const users = useLocalFileStore
    ? (await readLocalStore()).users
    : Object.fromEntries(memoryStore.users.entries());

  const comments = useLocalFileStore
    ? Object.values((await readLocalStore()).communityComments)
    : [...memoryStore.communityComments.values()];

  const author = users[entry.userId];
  const destination = launchCatalog.find((d) => d.id === entry.destinationId);
  const entryComments = comments.filter((c) => c.historyId === entry.id);

  return {
    historyId: entry.id,
    authorName: author?.name ?? "여행자",
    authorImage: author?.image ?? null,
    destinationName: destination?.nameKo ?? entry.destinationId,
    rating: entry.rating,
    tags: entry.customTags ?? [],
    memo: entry.memo ?? null,
    imageUrl: entry.images?.[0]?.dataUrl ?? null,
    commentCount: entryComments.length,
    createdAt: entry.createdAt,
  };
}

async function readPublicPostFromDb(
  historyId: string,
): Promise<CommunityPostRow | null> {
  const { db } = await getRuntimeDatabase();

  const [row] = await db
    .select({
      historyId: userDestinationHistory.id,
      authorName: userTable.name,
      authorImage: userTable.image,
      destinationNameKo: destinationProfiles.nameKo,
      destinationId: userDestinationHistory.destinationId,
      rating: userDestinationHistory.rating,
      customTags: userDestinationHistory.customTags,
      memo: userDestinationHistory.memo,
      images: userDestinationHistory.images,
      createdAt: userDestinationHistory.createdAt,
    })
    .from(userDestinationHistory)
    .leftJoin(userTable, eq(userDestinationHistory.userId, userTable.id))
    .leftJoin(
      destinationProfiles,
      eq(userDestinationHistory.destinationId, destinationProfiles.id),
    )
    .where(
      and(
        eq(userDestinationHistory.id, historyId),
        eq(userDestinationHistory.visibility, "public"),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [commentResult] = await db
    .select({ cnt: count() })
    .from(communityComments)
    .where(eq(communityComments.historyId, historyId));

  const images = row.images as
    | Array<{ name: string; contentType: string; dataUrl: string }>
    | null;

  return {
    historyId: row.historyId,
    authorName: row.authorName ?? "여행자",
    authorImage: row.authorImage ?? null,
    destinationName: row.destinationNameKo ?? row.destinationId,
    rating: row.rating,
    tags: (row.customTags as string[] | null) ?? [],
    memo: row.memo ?? null,
    imageUrl: images?.[0]?.dataUrl ?? null,
    commentCount: commentResult?.cnt ?? 0,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Comments                                                           */
/* ------------------------------------------------------------------ */

export async function listComments(historyId: string): Promise<CommentRow[]> {
  if (!usePersistentDatabase) {
    return listCommentsInMemory(historyId);
  }

  return listCommentsFromDb(historyId);
}

async function listCommentsInMemory(historyId: string): Promise<CommentRow[]> {
  const comments = useLocalFileStore
    ? Object.values((await readLocalStore()).communityComments)
    : [...memoryStore.communityComments.values()];

  const users = useLocalFileStore
    ? (await readLocalStore()).users
    : Object.fromEntries(memoryStore.users.entries());

  return comments
    .filter((c) => c.historyId === historyId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => {
      const author = users[c.userId];
      return {
        id: c.id,
        authorName: author?.name ?? "여행자",
        authorImage: author?.image ?? null,
        content: c.content,
        createdAt: c.createdAt,
      };
    });
}

async function listCommentsFromDb(historyId: string): Promise<CommentRow[]> {
  const { db } = await getRuntimeDatabase();

  const rows = await db
    .select({
      id: communityComments.id,
      authorName: userTable.name,
      authorImage: userTable.image,
      content: communityComments.content,
      createdAt: communityComments.createdAt,
    })
    .from(communityComments)
    .leftJoin(userTable, eq(communityComments.userId, userTable.id))
    .where(eq(communityComments.historyId, historyId))
    .orderBy(communityComments.createdAt);

  return rows.map((row) => ({
    id: row.id,
    authorName: row.authorName ?? "여행자",
    authorImage: row.authorImage ?? null,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createComment(
  historyId: string,
  userId: string,
  content: string,
): Promise<CommentRow | null> {
  if (!usePersistentDatabase) {
    return createCommentInMemory(historyId, userId, content);
  }

  return createCommentInDb(historyId, userId, content);
}

async function createCommentInMemory(
  historyId: string,
  userId: string,
  content: string,
): Promise<CommentRow | null> {
  const historyEntries = useLocalFileStore
    ? Object.values((await readLocalStore()).history)
    : [...memoryStore.history.values()];

  const entry = historyEntries.find(
    (e) => e.id === historyId && e.visibility === "public",
  );
  if (!entry) return null;

  const users = useLocalFileStore
    ? (await readLocalStore()).users
    : Object.fromEntries(memoryStore.users.entries());

  const author = users[userId];
  const nowIso = new Date().toISOString();

  const comment: CommunityComment = {
    id: randomUUID(),
    historyId,
    userId,
    content,
    createdAt: nowIso,
  };

  if (useLocalFileStore) {
    const store = await readLocalStore();
    store.communityComments[comment.id] = comment;
    await writeLocalStore(store);
  } else {
    memoryStore.communityComments.set(comment.id, comment);
  }

  return {
    id: comment.id,
    authorName: author?.name ?? "여행자",
    authorImage: author?.image ?? null,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

async function createCommentInDb(
  historyId: string,
  userId: string,
  content: string,
): Promise<CommentRow | null> {
  const { db } = await getRuntimeDatabase();

  const [entry] = await db
    .select({ id: userDestinationHistory.id })
    .from(userDestinationHistory)
    .where(
      and(
        eq(userDestinationHistory.id, historyId),
        eq(userDestinationHistory.visibility, "public"),
      ),
    )
    .limit(1);

  if (!entry) return null;

  const [created] = await db
    .insert(communityComments)
    .values({ historyId, userId, content })
    .returning();

  const [author] = await db
    .select({ name: userTable.name, image: userTable.image })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return {
    id: created.id,
    authorName: author?.name ?? "여행자",
    authorImage: author?.image ?? null,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const existing = store.communityComments[commentId];
      if (!existing || existing.userId !== userId) return false;
      delete store.communityComments[commentId];
      await writeLocalStore(store);
      return true;
    }

    const existing = memoryStore.communityComments.get(commentId);
    if (!existing || existing.userId !== userId) return false;
    memoryStore.communityComments.delete(commentId);
    return true;
  }

  const { db } = await getRuntimeDatabase();
  const deleted = await db
    .delete(communityComments)
    .where(
      and(
        eq(communityComments.id, commentId),
        eq(communityComments.userId, userId),
      ),
    )
    .returning();

  return deleted.length > 0;
}
