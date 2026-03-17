import { scoringVersionSchema } from "@/lib/domain/contracts";

export const activeScoringVersion = scoringVersionSchema.parse({
  id: "mvp-v1",
  label: "MVP v1 deterministic ranking",
  active: true,
  weights: {
    vibeMatch: 25,
    budgetFit: 18,
    tripLengthFit: 15,
    seasonFit: 14,
    flightToleranceFit: 12,
    partyFit: 8,
    paceFit: 5,
    sourceConfidence: 3,
  },
  tieBreakerCap: 3,
  shoulderWindowMonths: 1,
});
