import type { EvidenceSourceType, EvidenceTier } from "@/lib/domain/contracts";

export type EvidenceCatalogItem = {
  tier: EvidenceTier;
  sourceType: EvidenceSourceType;
  sourceLabel: string;
  sourceUrl: string;
  summary: string;
  confidence: number;
  observedAt: string;
};

export const destinationEvidenceCatalog: Record<string, EvidenceCatalogItem[]> = {
  tokyo: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Go Tokyo",
      sourceUrl: "https://www.instagram.com/gotokyoofficial/",
      summary: "도심 야경과 카페, 편집숍 중심의 도시 감성이 강합니다.",
      confidence: 91,
      observedAt: "2026-03-15T09:00:00.000Z",
    },
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#tokyotrip",
      sourceUrl: "https://www.instagram.com/explore/tags/tokyotrip/",
      summary: "봄철 도쿄 감성 여행 컷과 미식/쇼핑 포스트가 꾸준히 보입니다.",
      confidence: 78,
      observedAt: "2026-03-16T08:00:00.000Z",
    },
  ],
  kyoto: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Kyoto Travel",
      sourceUrl: "https://www.instagram.com/visit_kyoto/",
      summary: "사찰, 골목, 전통 거리 풍경 중심으로 차분한 커플 여행 무드가 강합니다.",
      confidence: 88,
      observedAt: "2026-03-14T10:00:00.000Z",
    },
  ],
  lisbon: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Visit Lisboa",
      sourceUrl: "https://www.instagram.com/visitlisboa/",
      summary: "노을과 트램, 전망대 중심의 로맨틱한 장면이 꾸준히 소비됩니다.",
      confidence: 89,
      observedAt: "2026-03-13T12:00:00.000Z",
    },
  ],
  paris: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Paris je t'aime",
      sourceUrl: "https://www.instagram.com/parisjetaime/",
      summary: "전시와 카페, 거리 풍경 중심의 하이엔드 무드가 강합니다.",
      confidence: 92,
      observedAt: "2026-03-15T06:00:00.000Z",
    },
  ],
  bali: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Wonderful Indonesia",
      sourceUrl: "https://www.instagram.com/wonderfulindonesia/",
      summary: "풀빌라, 스파, 자연 속 휴식 컷이 많아 느린 커플 여행 무드에 잘 맞습니다.",
      confidence: 90,
      observedAt: "2026-03-16T05:00:00.000Z",
    },
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#balilife",
      sourceUrl: "https://www.instagram.com/explore/tags/balilife/",
      summary: "리조트와 해변 중심의 비주얼 증거가 풍부합니다.",
      confidence: 76,
      observedAt: "2026-03-16T11:00:00.000Z",
    },
  ],
  bangkok: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Amazing Thailand",
      sourceUrl: "https://www.instagram.com/amazingthailand/",
      summary: "야시장과 루프톱, 미식 중심의 생동감 있는 도시 밤 무드가 강합니다.",
      confidence: 86,
      observedAt: "2026-03-14T09:30:00.000Z",
    },
  ],
  "da-nang": [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Vietnam Tourism",
      sourceUrl: "https://www.instagram.com/vietnamtourismboard/",
      summary: "해변과 리조트, 가벼운 시내 감성이 함께 노출됩니다.",
      confidence: 82,
      observedAt: "2026-03-12T07:00:00.000Z",
    },
  ],
  singapore: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Visit Singapore",
      sourceUrl: "https://www.instagram.com/visit_singapore/",
      summary: "도시 스카이라인과 실내 명소, 푸드홀 중심의 세련된 비주얼이 강합니다.",
      confidence: 87,
      observedAt: "2026-03-15T08:30:00.000Z",
    },
  ],
  "hong-kong": [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Discover Hong Kong",
      sourceUrl: "https://www.instagram.com/discoverhongkong/",
      summary: "야경과 쇼핑, 딤섬/카페 중심의 촘촘한 도심형 피드가 잘 맞습니다.",
      confidence: 88,
      observedAt: "2026-03-16T04:00:00.000Z",
    },
  ],
  dubai: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Visit Dubai",
      sourceUrl: "https://www.instagram.com/visit.dubai/",
      summary: "럭셔리 호텔과 사막, 고층 전망 위주의 선명한 비주얼이 강합니다.",
      confidence: 93,
      observedAt: "2026-03-16T03:00:00.000Z",
    },
  ],
};
