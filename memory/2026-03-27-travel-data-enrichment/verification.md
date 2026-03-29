# 검증

## 명령
- `npx tsc --noEmit`
- `npm run lint`
- `npm run test:unit`
- `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/travel-support/service.spec.ts`
- `npm run build`

## 결과
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run test:unit`: pass
- `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/travel-support/service.spec.ts`: pass
- `npm run build`: pass, 네트워크 허용 후 production build 완료

## 후속 확인
- 실제 공급자 키가 설정된 환경에서 대표 추천 이미지, 날씨, 지도, 환율 표시를 한 번 더 확인한다.
