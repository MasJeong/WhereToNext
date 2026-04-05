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
      summary: "노을과 트램, 전망대 중심의 분위기 있는 장면이 꾸준히 소비됩니다.",
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
  brisbane: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#brisbane",
      sourceUrl: "https://www.instagram.com/explore/tags/brisbane/",
      summary: "강변 산책과 브리지, 사우스뱅크 중심의 도심 라이프스타일 컷이 꾸준히 보입니다.",
      confidence: 79,
      observedAt: "2026-04-01T08:00:00.000Z",
    },
  ],
  perth: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#perth",
      sourceUrl: "https://www.instagram.com/explore/tags/perth/",
      summary: "해변과 도심 바, 강변 산책 컷이 함께 보이는 서호주 도시 무드가 꾸준합니다.",
      confidence: 80,
      observedAt: "2026-04-01T09:00:00.000Z",
    },
  ],
  cairns: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#cairns",
      sourceUrl: "https://www.instagram.com/explore/tags/cairns/",
      summary: "리프 투어와 열대우림, 리조트 무드가 강하게 반복되는 자연형 피드입니다.",
      confidence: 82,
      observedAt: "2026-04-01T09:10:00.000Z",
    },
  ],
  adelaide: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#adelaide",
      sourceUrl: "https://www.instagram.com/explore/tags/adelaide/",
      summary: "와인 산지 근교와 여유로운 도심, 해변 라이프스타일 컷이 고르게 보입니다.",
      confidence: 77,
      observedAt: "2026-04-01T10:00:00.000Z",
    },
  ],
  miyakojima: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#miyakojima",
      sourceUrl: "https://www.instagram.com/explore/tags/miyakojima/",
      summary: "에메랄드빛 해변과 드라이브 컷이 많아 일본 휴양 감성 목적지로 잘 소비됩니다.",
      confidence: 82,
      observedAt: "2026-03-18T09:00:00.000Z",
    },
  ],
  "nha-trang": [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Vietnam Tourism",
      sourceUrl: "https://www.instagram.com/vietnamtourismboard/",
      summary: "리조트와 해변, 야시장 무드가 강해 한국어 베트남 휴양 콘텐츠와 잘 맞습니다.",
      confidence: 84,
      observedAt: "2026-03-18T08:30:00.000Z",
    },
  ],
  "phu-quoc": [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#phuquoc",
      sourceUrl: "https://www.instagram.com/explore/tags/phuquoc/",
      summary: "선셋과 리조트, 섬 휴양 비주얼이 반복적으로 노출됩니다.",
      confidence: 83,
      observedAt: "2026-03-18T08:00:00.000Z",
    },
  ],
  chongqing: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#chongqing",
      sourceUrl: "https://www.instagram.com/explore/tags/chongqing/",
      summary: "입체적인 야경과 훠궈, 도시 포토 스폿 중심의 강한 비주얼 신호가 있습니다.",
      confidence: 80,
      observedAt: "2026-03-18T07:30:00.000Z",
    },
  ],
  beijing: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#beijing",
      sourceUrl: "https://www.instagram.com/explore/tags/beijing/",
      summary: "자금성과 만리장성, 중심축 유적 동선이 도드라지는 문화 도시 비주얼이 강합니다.",
      confidence: 81,
      observedAt: "2026-04-01T09:20:00.000Z",
    },
  ],
  guangzhou: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#guangzhou",
      sourceUrl: "https://www.instagram.com/explore/tags/guangzhou/",
      summary: "캔톤타워 야경과 광둥 미식, 대형 쇼핑몰 동선이 반복적으로 보이는 도시 피드입니다.",
      confidence: 80,
      observedAt: "2026-04-01T10:10:00.000Z",
    },
  ],
  shanghai: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#shanghai",
      sourceUrl: "https://www.instagram.com/explore/tags/shanghai/",
      summary: "와이탄 야경과 난징동루, 스카이라인 중심의 도시 비주얼이 강하게 반복됩니다.",
      confidence: 83,
      observedAt: "2026-04-01T08:30:00.000Z",
    },
  ],
  shenzhen: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#shenzhen",
      sourceUrl: "https://www.instagram.com/explore/tags/shenzhen/",
      summary: "현대적인 스카이라인과 테마파크, 해안 도시 야경 컷이 함께 노출됩니다.",
      confidence: 79,
      observedAt: "2026-04-01T10:20:00.000Z",
    },
  ],
  vancouver: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#vancouver",
      sourceUrl: "https://www.instagram.com/explore/tags/vancouver/",
      summary: "도심과 바다, 산 풍경이 한 화면에 담기는 서부 캐나다 도시 무드가 강합니다.",
      confidence: 82,
      observedAt: "2026-04-01T10:30:00.000Z",
    },
  ],
  banff: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#banff",
      sourceUrl: "https://www.instagram.com/explore/tags/banff/",
      summary: "록키 산맥과 청록빛 호수, 겨울 설경이 강하게 반복되는 캐나다 대표 절경 피드입니다.",
      confidence: 89,
      observedAt: "2026-04-01T10:40:00.000Z",
    },
  ],
  toronto: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#toronto",
      sourceUrl: "https://www.instagram.com/explore/tags/toronto/",
      summary: "도심 스카이라인과 미식, 쇼핑, 공연 관람 무드가 고르게 보이는 대도시 피드입니다.",
      confidence: 78,
      observedAt: "2026-04-01T10:50:00.000Z",
    },
  ],
  montreal: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#montreal",
      sourceUrl: "https://www.instagram.com/explore/tags/montreal/",
      summary: "올드타운과 축제, 카페와 미식 중심의 감성 도시 컷이 꾸준히 보입니다.",
      confidence: 81,
      observedAt: "2026-04-01T11:00:00.000Z",
    },
  ],
  auckland: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#auckland",
      sourceUrl: "https://www.instagram.com/explore/tags/auckland/",
      summary: "항구와 스카이라인, 섬과 해안이 함께 노출되는 도시형 뉴질랜드 피드입니다.",
      confidence: 79,
      observedAt: "2026-04-01T09:30:00.000Z",
    },
  ],
  queenstown: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#queenstown",
      sourceUrl: "https://www.instagram.com/explore/tags/queenstown/",
      summary: "호수와 산악 풍경, 액티비티와 와이너리 컷이 강하게 반복되는 대표 절경 피드입니다.",
      confidence: 85,
      observedAt: "2026-04-01T09:40:00.000Z",
    },
  ],
  christchurch: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#christchurch",
      sourceUrl: "https://www.instagram.com/explore/tags/christchurch/",
      summary: "정원 도시와 스트리트 감성, 남섬 관문 동선이 함께 보이는 뉴질랜드 도시 피드입니다.",
      confidence: 76,
      observedAt: "2026-04-01T11:10:00.000Z",
    },
  ],
  london: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Visit London",
      sourceUrl: "https://www.instagram.com/visitlondon/",
      summary: "랜드마크와 박물관, 펍과 거리 풍경이 고르게 노출되는 대표 도시 피드입니다.",
      confidence: 90,
      observedAt: "2026-03-18T07:00:00.000Z",
    },
  ],
  amsterdam: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "I amsterdam",
      sourceUrl: "https://www.instagram.com/iamsterdam/",
      summary: "운하와 미술관, 자전거 감성이 강해 감각적인 유럽 도시 무드가 선명합니다.",
      confidence: 88,
      observedAt: "2026-03-18T06:30:00.000Z",
    },
  ],
  madrid: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#madrid",
      sourceUrl: "https://www.instagram.com/explore/tags/madrid/",
      summary: "광장과 미식, 야간 거리 분위기 중심의 도시 콘텐츠가 꾸준합니다.",
      confidence: 81,
      observedAt: "2026-03-18T06:00:00.000Z",
    },
  ],
  "san-francisco": [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Only in San Francisco",
      sourceUrl: "https://www.instagram.com/onlyinsf/",
      summary: "언덕과 해안, 브리지와 감각적인 거리 풍경이 함께 노출됩니다.",
      confidence: 87,
      observedAt: "2026-03-18T05:30:00.000Z",
    },
  ],
  "las-vegas": [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#lasvegas",
      sourceUrl: "https://www.instagram.com/explore/tags/lasvegas/",
      summary: "호텔과 쇼, 네온 야경 중심의 과감한 도시 비주얼이 강합니다.",
      confidence: 82,
      observedAt: "2026-03-18T05:00:00.000Z",
    },
  ],
  milan: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "YesMilano",
      sourceUrl: "https://www.instagram.com/yesmilano/",
      summary: "두오모와 패션, 카페 거리 무드가 강한 북이탈리아 도시 피드입니다.",
      confidence: 86,
      observedAt: "2026-03-18T04:30:00.000Z",
    },
  ],
  venice: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#venice",
      sourceUrl: "https://www.instagram.com/explore/tags/venice/",
      summary: "수로와 곤돌라, 골목 풍경 중심의 분위기 있는 비주얼이 매우 강합니다.",
      confidence: 88,
      observedAt: "2026-03-18T04:00:00.000Z",
    },
  ],
  nice: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#nicefrance",
      sourceUrl: "https://www.instagram.com/explore/tags/nicefrance/",
      summary: "남프랑스 해변과 산책로, 코트다쥐르 감성이 잘 드러나는 피드입니다.",
      confidence: 80,
      observedAt: "2026-03-18T03:30:00.000Z",
    },
  ],
  seville: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#seville",
      sourceUrl: "https://www.instagram.com/explore/tags/seville/",
      summary: "플라멩코와 스페인 남부 골목 풍경, 오렌지빛 건축 무드가 반복됩니다.",
      confidence: 79,
      observedAt: "2026-03-18T03:00:00.000Z",
    },
  ],
  cairo: [
    {
      tier: "green",
      sourceType: "partner_account",
      sourceLabel: "Experience Egypt",
      sourceUrl: "https://www.instagram.com/experienceegypt/",
      summary: "피라미드와 박물관, 사막 톤 비주얼이 강해 이집트 관문 도시 신호가 뚜렷합니다.",
      confidence: 89,
      observedAt: "2026-03-18T02:30:00.000Z",
    },
  ],
  marrakech: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#marrakech",
      sourceUrl: "https://www.instagram.com/explore/tags/marrakech/",
      summary: "시장과 리야드, 붉은 도시 색감이 강하게 소비되는 북아프리카 감성 피드입니다.",
      confidence: 86,
      observedAt: "2026-03-18T02:00:00.000Z",
    },
  ],
  casablanca: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#casablanca",
      sourceUrl: "https://www.instagram.com/explore/tags/casablanca/",
      summary: "모스크와 해안, 모로코 관문 도시 이미지가 고르게 보입니다.",
      confidence: 78,
      observedAt: "2026-03-18T01:30:00.000Z",
    },
  ],
  "cape-town": [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#capetown",
      sourceUrl: "https://www.instagram.com/explore/tags/capetown/",
      summary: "테이블마운틴과 해안 도로, 와이너리 주변 무드가 함께 보이는 도시 피드입니다.",
      confidence: 88,
      observedAt: "2026-03-18T01:00:00.000Z",
    },
  ],
  luxor: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#luxor",
      sourceUrl: "https://www.instagram.com/explore/tags/luxor/",
      summary: "신전과 유적, 열기구 풍경이 강해 고대 문명 체험 목적지가 잘 드러납니다.",
      confidence: 84,
      observedAt: "2026-03-18T00:30:00.000Z",
    },
  ],
  zanzibar: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#zanzibar",
      sourceUrl: "https://www.instagram.com/explore/tags/zanzibar/",
      summary: "화이트 샌드 비치와 허니문 무드가 강한 동아프리카 휴양 피드입니다.",
      confidence: 87,
      observedAt: "2026-03-18T00:00:00.000Z",
    },
  ],
  serengeti: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#serengeti",
      sourceUrl: "https://www.instagram.com/explore/tags/serengeti/",
      summary: "사파리 차량과 야생동물, 열기구 컷이 중심인 대표 사파리 권역 피드입니다.",
      confidence: 85,
      observedAt: "2026-03-17T23:30:00.000Z",
    },
  ],
  "maasai-mara": [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#maasaimara",
      sourceUrl: "https://www.instagram.com/explore/tags/maasaimara/",
      summary: "빅파이브와 사파리 롯지 중심 비주얼이 강한 케냐 대표 야생 권역입니다.",
      confidence: 84,
      observedAt: "2026-03-17T23:00:00.000Z",
    },
  ],
  rabat: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#rabat",
      sourceUrl: "https://www.instagram.com/explore/tags/rabat/",
      summary: "바닷가와 행정 수도 특유의 차분한 도시 컷이 꾸준히 보입니다.",
      confidence: 76,
      observedAt: "2026-03-17T22:30:00.000Z",
    },
  ],
  nairobi: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#nairobi",
      sourceUrl: "https://www.instagram.com/explore/tags/nairobi/",
      summary: "도시와 사파리 관문 이미지가 함께 보이는 동아프리카 허브 도시 피드입니다.",
      confidence: 78,
      observedAt: "2026-03-17T22:00:00.000Z",
    },
  ],
  johannesburg: [
    {
      tier: "yellow",
      sourceType: "hashtag_capsule",
      sourceLabel: "#johannesburg",
      sourceUrl: "https://www.instagram.com/explore/tags/johannesburg/",
      summary: "남아공 도심과 근교 이동 허브 성격이 드러나는 도시 피드입니다.",
      confidence: 74,
      observedAt: "2026-03-17T21:30:00.000Z",
    },
  ],
};
