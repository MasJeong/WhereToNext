import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  budgetBandValues,
  destinationKindValues,
  evidenceSourceTypeValues,
  evidenceTierValues,
  explorationPreferenceValues,
  flightBandValues,
  freshnessStateValues,
  paceValues,
  snapshotKindValues,
  snapshotVisibilityValues,
  vibeValues,
  type ComparisonSnapshot,
  type DestinationProfile,
  type RecommendationQuery,
  type RecommendationSnapshot,
  type ScoringVersion,
  type TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";

export const destinationKindEnum = pgEnum("destination_kind", destinationKindValues);
export const budgetBandEnum = pgEnum("budget_band", budgetBandValues);
export const flightBandEnum = pgEnum("flight_band", flightBandValues);
export const paceEnum = pgEnum("pace", paceValues);
export const vibeEnum = pgEnum("vibe", vibeValues);
export const evidenceTierEnum = pgEnum("evidence_tier", evidenceTierValues);
export const evidenceSourceTypeEnum = pgEnum("evidence_source_type", evidenceSourceTypeValues);
export const freshnessStateEnum = pgEnum("freshness_state", freshnessStateValues);
export const snapshotKindEnum = pgEnum("snapshot_kind", snapshotKindValues);
export const snapshotVisibilityEnum = pgEnum("snapshot_visibility", snapshotVisibilityValues);
export const explorationPreferenceEnum = pgEnum(
  "exploration_preference",
  explorationPreferenceValues,
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    providerEmail: text("provider_email"),
    providerEmailVerified: boolean("provider_email_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    userProviderUnique: uniqueIndex("account_user_provider_unique").on(table.userId, table.providerId),
  }),
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const destinationProfiles = pgTable("destination_profiles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  kind: destinationKindEnum("kind").notNull(),
  countryCode: text("country_code").notNull(),
  nameKo: text("name_ko").notNull(),
  nameEn: text("name_en").notNull(),
  budgetBand: budgetBandEnum("budget_band").notNull(),
  flightBand: flightBandEnum("flight_band").notNull(),
  bestMonths: jsonb("best_months").$type<DestinationProfile["bestMonths"]>().notNull(),
  paceTags: jsonb("pace_tags").$type<DestinationProfile["paceTags"]>().notNull(),
  vibeTags: jsonb("vibe_tags").$type<DestinationProfile["vibeTags"]>().notNull(),
  summary: text("summary").notNull(),
  watchOuts: jsonb("watch_outs").$type<DestinationProfile["watchOuts"]>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trendSnapshots = pgTable("trend_snapshots", {
  id: text("id").primaryKey(),
  destinationId: text("destination_id").notNull().references(() => destinationProfiles.id),
  tier: evidenceTierEnum("tier").notNull(),
  sourceType: evidenceSourceTypeEnum("source_type").notNull(),
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url").notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  freshnessState: freshnessStateEnum("freshness_state").notNull(),
  confidence: integer("confidence").notNull(),
  summary: text("summary").notNull(),
  payload: jsonb("payload").$type<TrendEvidenceSnapshot>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoringVersions = pgTable("scoring_versions", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  active: boolean("active").notNull().default(false),
  weights: jsonb("weights").$type<ScoringVersion["weights"]>().notNull(),
  tieBreakerCap: integer("tie_breaker_cap").notNull(),
  shoulderWindowMonths: integer("shoulder_window_months").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const recommendationSnapshots = pgTable("recommendation_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: snapshotKindEnum("kind").notNull(),
  visibility: snapshotVisibilityEnum("visibility").notNull().default("public"),
  ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
  snapshotVersion: integer("snapshot_version").notNull().default(1),
  query: jsonb("query").$type<RecommendationQuery | null>(),
  payload: jsonb("payload").$type<RecommendationSnapshot | ComparisonSnapshot>().notNull(),
  scoringVersionId: text("scoring_version_id").references(() => scoringVersions.id),
  trendSnapshotIds: jsonb("trend_snapshot_ids").$type<string[]>().notNull().default([]),
  destinationIds: jsonb("destination_ids").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userPreferenceProfiles = pgTable("user_preference_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  explorationPreference: explorationPreferenceEnum("exploration_preference")
    .notNull()
    .default("balanced"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userDestinationHistory = pgTable("user_destination_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  destinationId: text("destination_id")
    .notNull()
    .references(() => destinationProfiles.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  tags: jsonb("tags").$type<typeof vibeValues[number][]>().notNull(),
  wouldRevisit: boolean("would_revisit").notNull().default(false),
  visitedAt: timestamp("visited_at", { withTimezone: true }).notNull(),
  memo: text("memo"),
  image: jsonb("image").$type<{
    name: string;
    contentType: string;
    dataUrl: string;
  } | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
