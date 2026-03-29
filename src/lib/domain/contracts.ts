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
export const snapshotVisibilityValues = ["public", "private"] as const;
export const snapshotStatusValues = ["saved", "planned"] as const;
export const explorationPreferenceValues = ["repeat", "balanced", "discover"] as const;

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
export const snapshotVisibilitySchema = z.enum(snapshotVisibilityValues);
export const snapshotStatusSchema = z.enum(snapshotStatusValues);
export const explorationPreferenceSchema = z.enum(explorationPreferenceValues);

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
  vibes: z.array(vibeSchema).min(1).max(3),
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

export const destinationTravelLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  countryCode: z.string().length(2),
  countryName: z.string().min(1),
  currencyCode: z.string().length(3),
});

export const destinationHeroImageSchema = z.object({
  url: z.url(),
  alt: z.string().min(1),
  photographerName: z.string().min(1),
  photographerUrl: z.url(),
  sourceLabel: z.literal("Unsplash"),
});

export const destinationWeatherSnapshotSchema = z.object({
  summary: z.string().min(1),
  temperatureC: z.number(),
  apparentTemperatureC: z.number(),
  minTemperatureC: z.number(),
  maxTemperatureC: z.number(),
  precipitationProbability: z.number().min(0).max(100),
  observedAt: z.string().datetime(),
});

export const destinationTravelMonthWeatherSchema = z.object({
  travelMonth: z.number().int().min(1).max(12),
  summary: z.string().min(1),
  averageMinTemperatureC: z.number(),
  averageMaxTemperatureC: z.number(),
  rainyDayRatio: z.number().min(0).max(100),
  basedOnYears: z.number().int().min(1),
});

export const destinationNearbyPlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortAddress: z.string().min(1),
  googleMapsUrl: z.url(),
});

export const destinationMapEmbedSchema = z.object({
  src: z.url(),
  title: z.string().min(1),
});

export const destinationExchangeRateSchema = z.object({
  baseCurrency: z.string().length(3),
  quoteCurrency: z.string().length(3),
  quote: z.number().positive(),
  summary: z.string().min(1),
  observedAt: z.string().datetime(),
});

export const destinationTravelSupplementSchema = z.object({
  location: destinationTravelLocationSchema,
  heroImage: destinationHeroImageSchema.optional(),
  weather: destinationWeatherSnapshotSchema.optional(),
  travelMonthWeather: destinationTravelMonthWeatherSchema.optional(),
  nearbyPlaces: z.array(destinationNearbyPlaceSchema).max(5).optional(),
  mapEmbed: destinationMapEmbedSchema.optional(),
  exchangeRate: destinationExchangeRateSchema.optional(),
  fetchedAt: z.string().datetime(),
});

export const socialVideoLeadEvidenceSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
  sourceLabel: z.string().min(1),
  sourceUrl: z.url().nullable().optional(),
});

export const socialVideoRequestSchema = z.object({
  destinationId: z.string().min(1),
  query: recommendationQuerySchema,
  leadEvidence: socialVideoLeadEvidenceSchema.optional(),
});

export const socialVideoItemSchema = z.object({
  provider: z.literal("youtube"),
  videoId: z.string().min(1),
  title: z.string().min(1),
  channelTitle: z.string().min(1),
  channelUrl: z.url(),
  videoUrl: z.url(),
  thumbnailUrl: z.url(),
  publishedAt: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  viewCount: z.number().int().nonnegative().optional(),
});

export const socialVideoFallbackSearchSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

export const socialVideoFallbackMetaSchema = z.object({
  reason: z.enum(["api-disabled", "request-failed", "low-confidence", "no-candidates"]),
  headline: z.string().min(1),
  description: z.string().min(1),
  searches: z.array(socialVideoFallbackSearchSchema).min(1).max(4),
});

export const socialVideoResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    item: socialVideoItemSchema,
    items: z.array(socialVideoItemSchema).min(1).max(3),
  }),
  z.object({
    status: z.literal("fallback"),
    item: socialVideoItemSchema.nullable(),
    items: z.array(socialVideoItemSchema).max(3),
    fallback: socialVideoFallbackMetaSchema,
  }),
  z.object({
    status: z.literal("empty"),
    item: z.null(),
    items: z.array(socialVideoItemSchema).max(0).optional(),
    fallback: socialVideoFallbackMetaSchema,
  }),
]);

export const recommendationSnapshotMetaSchema = z.object({
  status: snapshotStatusSchema.default("saved"),
});

export const recommendationSnapshotSchema = z.object({
  v: z.literal(1),
  kind: z.literal("recommendation"),
  query: recommendationQuerySchema,
  destinationIds: z.array(z.string().min(1)).min(1),
  results: z.array(recommendationResultSchema).min(1),
  scoringVersionId: z.string().min(1),
  trendSnapshotIds: z.array(z.string().min(1)),
  meta: recommendationSnapshotMetaSchema.optional(),
});

export const comparisonSnapshotSchema = z.object({
  v: z.literal(1),
  kind: z.literal("comparison"),
  snapshotIds: z.array(z.string().min(1)).min(2).max(4),
  destinationIds: z.array(z.string().min(1)).min(2).max(4),
});

export const userPreferenceProfileSchema = z.object({
  userId: z.string().min(1),
  explorationPreference: explorationPreferenceSchema,
});

export const userPreferenceProfileUpdateSchema = z.object({
  explorationPreference: explorationPreferenceSchema,
});

export const userDestinationHistoryImageSchema = z.object({
  name: z.string().min(1).max(120),
  contentType: z.string().min(1).max(120),
  dataUrl: z.string().startsWith("data:image/").max(3_000_000),
});

export const userDestinationHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  destinationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z.array(vibeSchema).min(1).max(4),
  wouldRevisit: z.boolean(),
  visitedAt: z.string().datetime(),
  memo: z.string().trim().max(500).nullable().optional(),
  image: userDestinationHistoryImageSchema.nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const userDestinationHistoryInputSchema = z.object({
  destinationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z.array(vibeSchema).min(1).max(4),
  wouldRevisit: z.boolean(),
  visitedAt: z.string().datetime(),
  memo: z.string().trim().max(500).nullish().transform((value) => value ?? null),
  image: userDestinationHistoryImageSchema.nullish().transform((value) => value ?? null),
});

export const userFutureTripSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  destinationId: z.string().min(1),
  sourceSnapshotId: z.string().uuid(),
  destinationNameKo: z.string().min(1),
  countryCode: z.string().length(2),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const userFutureTripInputSchema = z.object({
  destinationId: z.string().min(1),
  sourceSnapshotId: z.string().uuid(),
});

export const recommendationPersonalizationContextSchema = z.object({
  explorationPreference: explorationPreferenceSchema,
  history: z.array(userDestinationHistorySchema),
});

export type DestinationProfile = z.infer<typeof destinationProfileSchema>;
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type RecommendationResult = z.infer<typeof recommendationResultSchema>;
export type TrendEvidenceSnapshot = z.infer<typeof trendEvidenceSnapshotSchema>;
export type DestinationTravelSupplement = z.infer<typeof destinationTravelSupplementSchema>;
export type SocialVideoLeadEvidence = z.infer<typeof socialVideoLeadEvidenceSchema>;
export type SocialVideoRequest = z.infer<typeof socialVideoRequestSchema>;
export type SocialVideoItem = z.infer<typeof socialVideoItemSchema>;
export type SocialVideoResponse = z.infer<typeof socialVideoResponseSchema>;
export type RecommendationSnapshot = z.infer<typeof recommendationSnapshotSchema>;
export type ComparisonSnapshot = z.infer<typeof comparisonSnapshotSchema>;
export type ScoringVersion = z.infer<typeof scoringVersionSchema>;
export type EvidenceTier = z.infer<typeof evidenceTierSchema>;
export type EvidenceSourceType = z.infer<typeof evidenceSourceTypeSchema>;
export type SnapshotVisibility = z.infer<typeof snapshotVisibilitySchema>;
export type SnapshotStatus = z.infer<typeof snapshotStatusSchema>;
export type ExplorationPreference = z.infer<typeof explorationPreferenceSchema>;
export type UserPreferenceProfile = z.infer<typeof userPreferenceProfileSchema>;
export type UserPreferenceProfileUpdate = z.infer<typeof userPreferenceProfileUpdateSchema>;
export type UserDestinationHistoryImage = z.infer<typeof userDestinationHistoryImageSchema>;
export type UserDestinationHistory = z.infer<typeof userDestinationHistorySchema>;
export type UserDestinationHistoryInput = z.infer<typeof userDestinationHistoryInputSchema>;
export type UserFutureTrip = z.infer<typeof userFutureTripSchema>;
export type UserFutureTripInput = z.infer<typeof userFutureTripInputSchema>;
export type RecommendationPersonalizationContext = z.infer<
  typeof recommendationPersonalizationContextSchema
>;
