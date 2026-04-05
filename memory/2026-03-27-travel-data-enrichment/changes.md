# Changes

## Added
- `src/lib/travel-support/country-metadata.ts`
- `src/lib/travel-support/service.ts`
- `src/components/trip-compass/travel-support-panel.tsx`
- `tests/unit/travel-support/service.spec.ts`

## Updated
- `src/lib/domain/contracts.ts`
- `src/lib/trip-compass/presentation.ts`
- `src/app/api/recommendations/route.ts`
- `src/lib/trip-compass/route-data.ts`
- `src/components/trip-compass/home/result-page.tsx`
- `src/components/trip-compass/home-experience.tsx`
- `src/components/trip-compass/destination-detail-experience.tsx`
- `src/components/trip-compass/snapshot-restore-view.tsx`
- `src/app/destinations/[slug]/page.tsx`
- `tests/unit/api/recommendations-route.spec.ts`
- `.env.example`
- `README.md`
- `docs/issue-resolution-log.md`
- `src/lib/test-ids.ts`

## Notes
- 공급자 키가 없으면 해당 보조 블록만 비활성화된다.
- 지도는 작은 임베드만 사용한다.
- 공유 링크는 저장된 추천 결과를 유지하고, 외부 데이터만 현재 시점으로 다시 조회한다.
