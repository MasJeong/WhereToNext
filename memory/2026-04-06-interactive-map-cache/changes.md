# 한눈에 보기

- 지도 계약을 `mapEmbed` 문자열에서 좌표 기반 `map` 객체로 바꿨다.
- 여행 보조 정보 캐시 테이블과 클릭 후 로드되는 지도 카드 컴포넌트를 추가했다.
- 남은 항목은 e2e 회귀 정리이며, 실패한 파일과 재진입 포인트를 아래에 남긴다.

# 변경 사항

## 데이터/서비스
- `src/lib/domain/contracts.ts`
  - `DestinationTravelSupplement`가 `mapEmbed` 대신 `map` 객체를 사용하도록 변경했다.
- `src/lib/db/schema.ts`
  - `destination_travel_supplement_cache` 테이블을 추가했다.
- `drizzle/0010_orange_synch.sql`
  - 캐시 테이블 생성 마이그레이션을 추가했다.
- `src/lib/travel-support/service.ts`
  - 목적지/여행 월 기준 캐시 read/write 로직을 추가했다.
  - stale 캐시 fallback과 외부 API 실패 시 부분 재사용 경로를 넣었다.

## UI
- `src/components/trip-compass/interactive-destination-map-card.tsx`
  - 클릭 전 정적 프리뷰, 클릭 후 `Maps JavaScript API` 로드 구조를 구현했다.
- `src/components/trip-compass/travel-support-panel.tsx`
  - 임베드 지도를 지도 카드와 주변 장소 카드로 교체했다.
- `src/lib/trip-compass/route-data.ts`
  - 결과/상세/복원 화면이 같은 supplement를 재사용하도록 travel month 전달을 정리했다.

## 문서/설정
- `.env.example`, `README.md`, `docs/deployment.md`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 추가하고 공개 키/서버 키 역할을 분리해 설명했다.
- `docs/issue-resolution-log.md`
  - 이번 변경의 원인, 해결, 검증을 기록했다.

## 미완료 항목
- 전체 `npm run test:e2e`는 아직 녹색이 아니다.
- 이번 실행에서 확인한 실패:
  - `tests/e2e/account-future-trips.spec.ts`
  - `tests/e2e/auth/social-login.spec.ts`
  - `tests/e2e/ios-acquisition-flow.spec.ts`
  - `tests/e2e/recommendation-flow.spec.ts`
- 공통 성격:
  - 저장/인증/복원 흐름에서 timeout이 먼저 발생했고, 지도 카드 렌더링 자체를 가리키는 실패는 보지 못했다.
