import { randomUUID } from "node:crypto";

import { and, count, desc, eq, lt } from "drizzle-orm";

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

/* ------------------------------------------------------------------ */
/*  Community feed                                                     */
/* ------------------------------------------------------------------ */

export async function listPublicPosts(cursor?: string): Promise<{
  items: CommunityPostRow[];
  nextCursor: string | null;
}> {
  if (!usePersistentDatabase) {
    return listPublicPostsInMemory(cursor);
  }

  return listPublicPostsFromDb(cursor);
}

async function listPublicPostsInMemory(cursor?: string): Promise<{
  items: CommunityPostRow[];
  nextCursor: string | null;
}> {
  const historyEntries = useLocalFileStore
    ? Object.values((await readLocalStore()).history)
    : [...memoryStore.history.values()];

  const users = useLocalFileStore
    ? (await readLocalStore()).users
    : Object.fromEntries(memoryStore.users.entries());

  const comments = useLocalFileStore
    ? Object.values((await readLocalStore()).communityComments)
    : [...memoryStore.communityComments.values()];

  const publicEntries = historyEntries
    .filter((entry) => entry.visibility === "public")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let filtered = publicEntries;
  if (cursor) {
    const cursorIndex = filtered.findIndex((entry) => entry.createdAt < cursor);
    filtered = cursorIndex >= 0 ? filtered.slice(cursorIndex) : [];
  }

  const page = filtered.slice(0, PAGE_SIZE);

  const items: CommunityPostRow[] = page.map((entry) => {
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
  });

  const lastItem = items[items.length - 1];
  const nextCursor =
    items.length === PAGE_SIZE && lastItem ? lastItem.createdAt : null;

  return { items, nextCursor };
}

async function listPublicPostsFromDb(cursor?: string): Promise<{
  items: CommunityPostRow[];
  nextCursor: string | null;
}> {
  const { db } = await getRuntimeDatabase();

  const whereConditions = [eq(userDestinationHistory.visibility, "public")];

  if (cursor) {
    whereConditions.push(lt(userDestinationHistory.createdAt, new Date(cursor)));
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
    .orderBy(desc(userDestinationHistory.createdAt))
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

  const items: CommunityPostRow[] = rows.map((row) => {
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

  const lastItem = items[items.length - 1];
  const nextCursor =
    items.length === PAGE_SIZE && lastItem ? lastItem.createdAt : null;

  return { items, nextCursor };
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
