import { z } from "zod";

export const destinationKindValues = ["country", "region", "city"] as const;
export const budgetBandValues = ["budget", "mid", "premium"] as const;
export const flightBandValues = ["short", "medium", "long"] as const;
export const partyTypeValues = ["solo", "couple", "friends", "family"] as const;
export const departureAirportValues = ["ICN", "GMP", "PUS", "CJU"] as const;
export const paceValues = ["slow", "balanced", "packed"] as const;
export const flightToleranceValues = ["short", "medium", "long"] as const;
export const vibeValues = [
  "romance",
  "food",
  "nature",
  "city",
  "shopping",
  "beach",
  "nightlife",
  "culture",
  "family",
  "luxury",
  "desert",
] as const;
export const evidenceTierValues = ["green", "yellow", "fallback"] as const;
export const evidenceSourceTypeValues = [
  "embed",
  "partner_account",
  "hashtag_capsule",
  "editorial",
] as const;
export const freshnessStateValues = ["fresh", "aging", "stale"] as const;
export const snapshotKindValues = ["recommendation", "comparison"] as const;

export const destinationKindSchema = z.enum(destinationKindValues);
export const budgetBandSchema = z.enum(budgetBandValues);
export const flightBandSchema = z.enum(flightBandValues);
export const partyTypeSchema = z.enum(partyTypeValues);
export const departureAirportSchema = z.enum(departureAirportValues);
export const paceSchema = z.enum(paceValues);
export const flightToleranceSchema = z.enum(flightToleranceValues);
export const vibeSchema = z.enum(vibeValues);
export const evidenceTierSchema = z.enum(evidenceTierValues);
export const evidenceSourceTypeSchema = z.enum(evidenceSourceTypeValues);
export const freshnessStateSchema = z.enum(freshnessStateValues);
export const snapshotKindSchema = z.enum(snapshotKindValues);

export const scoringWeightsSchema = z.object({
  vibeMatch: z.literal(25),
  budgetFit: z.literal(18),
  tripLengthFit: z.literal(15),
  seasonFit: z.literal(14),
  flightToleranceFit: z.literal(12),
  partyFit: z.literal(8),
  paceFit: z.literal(5),
  sourceConfidence: z.literal(3),
});

export const scoringVersionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  active: z.boolean(),
  weights: scoringWeightsSchema,
  tieBreakerCap: z.literal(3),
  shoulderWindowMonths: z.literal(1),
});

export const destinationProfileSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: destinationKindSchema,
  countryCode: z.string().length(2),
  nameKo: z.string().min(1),
  nameEn: z.string().min(1),
  budgetBand: budgetBandSchema,
  flightBand: flightBandSchema,
  bestMonths: z.array(z.number().int().min(1).max(12)).min(1),
  paceTags: z.array(paceSchema).min(1),
  vibeTags: z.array(vibeSchema).min(1),
  summary: z.string().min(1),
  watchOuts: z.array(z.string().min(1)).min(1),
  active: z.boolean(),
});

export const recommendationQuerySchema = z.object({
  partyType: partyTypeSchema,
  partySize: z.number().int().min(1).max(8),
  budgetBand: budgetBandSchema,
  tripLengthDays: z.number().int().min(2).max(21),
  departureAirport: departureAirportSchema,
  travelMonth: z.number().int().min(1).max(12),
  pace: paceSchema,
  flightTolerance: flightToleranceSchema,
  vibes: z.array(vibeSchema).min(1).max(2),
});

export const trendEvidenceSnapshotSchema = z.object({
  id: z.string().min(1),
  destinationId: z.string().min(1),
  tier: evidenceTierSchema,
  sourceType: evidenceSourceTypeSchema,
  sourceLabel: z.string().min(1),
  sourceUrl: z.url(),
  observedAt: z.string().datetime(),
  freshnessState: freshnessStateSchema,
  confidence: z.number().int().min(0).max(100),
  summary: z.string().min(1),
});

export const recommendationScoreBreakdownSchema = z.object({
  vibeMatch: z.number().min(0).max(25),
  budgetFit: z.number().min(0).max(18),
  tripLengthFit: z.number().min(0).max(15),
  seasonFit: z.number().min(0).max(14),
  flightToleranceFit: z.number().min(0).max(12),
  partyFit: z.number().min(0).max(8),
  paceFit: z.number().min(0).max(5),
  sourceConfidence: z.number().min(0).max(3),
  total: z.number().min(0).max(100),
});

export const recommendationResultSchema = z.object({
  destinationId: z.string().min(1),
  destinationKind: destinationKindSchema,
  reasons: z.array(z.string().min(1)).min(1),
  whyThisFits: z.string().min(1),
  watchOuts: z.array(z.string().min(1)).min(1),
  confidence: z.number().int().min(0).max(100),
  scoreBreakdown: recommendationScoreBreakdownSchema,
  trendEvidence: z.array(trendEvidenceSnapshotSchema),
});

export const recommendationSnapshotSchema = z.object({
  v: z.literal(1),
  kind: z.literal("recommendation"),
  query: recommendationQuerySchema,
  destinationIds: z.array(z.string().min(1)).min(1),
  results: z.array(recommendationResultSchema).min(1),
  scoringVersionId: z.string().min(1),
  trendSnapshotIds: z.array(z.string().min(1)),
});

export const comparisonSnapshotSchema = z.object({
  v: z.literal(1),
  kind: z.literal("comparison"),
  snapshotIds: z.array(z.string().min(1)).min(2).max(4),
  destinationIds: z.array(z.string().min(1)).min(2).max(4),
});

export type DestinationProfile = z.infer<typeof destinationProfileSchema>;
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type RecommendationResult = z.infer<typeof recommendationResultSchema>;
export type TrendEvidenceSnapshot = z.infer<typeof trendEvidenceSnapshotSchema>;
export type RecommendationSnapshot = z.infer<typeof recommendationSnapshotSchema>;
export type ComparisonSnapshot = z.infer<typeof comparisonSnapshotSchema>;
export type ScoringVersion = z.infer<typeof scoringVersionSchema>;
export type EvidenceTier = z.infer<typeof evidenceTierSchema>;
export type EvidenceSourceType = z.infer<typeof evidenceSourceTypeSchema>;
