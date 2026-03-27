# 여행 데이터 보강 작업 상세 상태

## 개요
- 작업명: 대표 추천 외부 여행 데이터 보강
- 상태: 부분 완료
- 목표: 대표 추천 1곳에만 이미지, 날씨, 작은 지도, 주변 장소, 환율 참고 정보를 붙이는 것
- 포함: 이미지 / 날씨 / 지도 / 주변 장소 / 환율
- 범위 제외: 숙소 가격 범위

## 최종 결과
- 대표 추천 1곳에만 supplement를 붙였습니다.
- 홈 결과, 목적지 상세, 저장 링크 복원 화면이 같은 supplement 구조를 사용합니다.
- 저장 링크는 추천 결과를 저장 당시 기준으로 유지하고, 외부 데이터만 다시 조회합니다.
- 보조 추천 리스트에는 외부 데이터를 붙이지 않았습니다.

## 이번에 구현한 것

### 계약 / 데이터
- 외부 여행 데이터용 스키마 추가
- 위치, 이미지, 날씨, 주변 장소, 지도, 환율, 조회 시각 구조 정의

관련 파일:
- [`src/lib/domain/contracts.ts`](/Users/jihun/Desktop/study/project/SooGo/src/lib/domain/contracts.ts)

### 서버 집계
- 국가 코드별 국가명/통화 코드 매핑 추가
- Open-Meteo 지오코딩/날씨 조회 연결
- Unsplash 이미지 조회 연결
- Google Places/Maps 조회 연결
- exchangerate.host 환율 조회 연결
- 공급자 실패 시 해당 블록만 빠지도록 처리

관련 파일:
- [`src/lib/travel-support/country-metadata.ts`](/Users/jihun/Desktop/study/project/SooGo/src/lib/travel-support/country-metadata.ts)
- [`src/lib/travel-support/service.ts`](/Users/jihun/Desktop/study/project/SooGo/src/lib/travel-support/service.ts)

### API / 라우트
- 추천 API 응답에 `leadSupplement` 추가
- 목적지 상세 페이지에 supplement 연결
- 저장 링크 복원 페이지에 supplement 연결

관련 파일:
- [`src/app/api/recommendations/route.ts`](/Users/jihun/Desktop/study/project/SooGo/src/app/api/recommendations/route.ts)
- [`src/lib/trip-compass/presentation.ts`](/Users/jihun/Desktop/study/project/SooGo/src/lib/trip-compass/presentation.ts)
- [`src/lib/trip-compass/route-data.ts`](/Users/jihun/Desktop/study/project/SooGo/src/lib/trip-compass/route-data.ts)

### UI
- 공용 보조 정보 패널 추가
- 홈 결과 화면에 대표 이미지 + 보조 정보 패널 연결
- 목적지 상세 화면에 보조 정보 패널 연결
- 저장 링크 복원 화면도 같은 상세 뷰를 통해 반영

관련 파일:
- [`src/components/trip-compass/travel-support-panel.tsx`](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/travel-support-panel.tsx)
- [`src/components/trip-compass/home-experience.tsx`](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/home-experience.tsx)
- [`src/components/trip-compass/home/result-page.tsx`](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/home/result-page.tsx)
- [`src/components/trip-compass/destination-detail-experience.tsx`](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/destination-detail-experience.tsx)
- [`src/components/trip-compass/snapshot-restore-view.tsx`](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/snapshot-restore-view.tsx)

### 설정 / 문서
- Unsplash 원격 이미지 설정 추가
- 외부 공급자 키 항목 추가
- README, issue log 갱신

관련 파일:
- [`next.config.ts`](/Users/jihun/Desktop/study/project/SooGo/next.config.ts)
- [`.env.example`](/Users/jihun/Desktop/study/project/SooGo/.env.example)
- [`README.md`](/Users/jihun/Desktop/study/project/SooGo/README.md)
- [`docs/issue-resolution-log.md`](/Users/jihun/Desktop/study/project/SooGo/docs/issue-resolution-log.md)

## 아직 안 한 것
- 실제 운영 키 기준 화면 품질 점검
- e2e 검증
- support 패널 시각 미세조정

## 범위 제외
- 숙소 가격 범위:
  - 현재 프로젝트 범위에서 제외
  - 이후 구현 항목으로 다루지 않음

## 보류 이유
- 보조 추천 리스트 외부 데이터 미적용:
  - 정보 과다 방지
  - 대표 추천 중심 구조 유지

## 검증 상태
- `npx tsc --noEmit` 통과
- `npm run lint` 통과
- `npm run test:unit` 통과
- `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/travel-support/service.spec.ts` 통과
- `npm run build` 통과

## 다음 작업 순서
1. 실제 공급자 키를 넣고 화면 확인
2. 모바일 기준 support 패널 높이 조정
3. 필요하면 e2e 추가

## 관련 문서
- [`docs/travel-data-enrichment-status.md`](/Users/jihun/Desktop/study/project/SooGo/docs/travel-data-enrichment-status.md)
- [`plan.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/plan.md)
- [`changes.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/changes.md)
- [`verification.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/verification.md)
