import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  budgetBandValues,
  destinationKindValues,
  evidenceSourceTypeValues,
  evidenceTierValues,
  flightBandValues,
  freshnessStateValues,
  paceValues,
  snapshotKindValues,
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
  snapshotVersion: integer("snapshot_version").notNull().default(1),
  query: jsonb("query").$type<RecommendationQuery | null>(),
  payload: jsonb("payload").$type<RecommendationSnapshot | ComparisonSnapshot>().notNull(),
  scoringVersionId: text("scoring_version_id").references(() => scoringVersions.id),
  trendSnapshotIds: jsonb("trend_snapshot_ids").$type<string[]>().notNull().default([]),
  destinationIds: jsonb("destination_ids").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
