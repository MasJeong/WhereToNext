# 여행 데이터 보강 기능 상태

## 한눈에 보기
- 상태: 부분 완료
- 범위: 대표 추천 1곳에만 이미지, 날씨, 작은 지도, 주변 장소, 환율 참고 정보 추가
- 포함: 이미지 / 날씨 / 지도 / 주변 장소 / 환율
- 제외: 숙소 가격
- 완료:
  - 추천 API에 `leadSupplement` 추가
  - 홈 결과 / 목적지 상세 / 저장 링크 복원 화면에 공용 보조 정보 패널 연결
  - 타입, lint, unit test, build 검증 완료
- 미완료:
  - 실제 운영 키 기준 화면 점검 미완료
  - e2e 검증 미실행
- 범위 제외:
  - 숙소 가격 범위

## 핵심 결과
- 대표 추천 1곳에만 외부 여행 데이터를 붙였습니다.
- 보조 추천 리스트에는 외부 데이터를 붙이지 않았습니다.
- 저장 링크를 열면 저장된 추천 결과는 유지하고, 외부 데이터만 다시 조회합니다.
- 일부 공급자 호출이 실패해도 추천 결과는 유지되고 해당 블록만 숨깁니다.

## 완료된 사항

### 서버
- 외부 데이터 스키마와 타입 추가
- Open-Meteo, Unsplash, Google Maps Platform, exchangerate.host 집계 레이어 추가
- 추천 API에 대표 추천용 supplement 응답 추가
- 목적지 상세 / 저장 링크 복원 경로에 같은 supplement 연결

### UI
- 홈 결과 화면에 대표 이미지와 보조 정보 패널 추가
- 목적지 상세 화면에 같은 보조 정보 패널 추가
- 저장 링크 복원 화면도 같은 상세 뷰를 통해 보조 정보 표시
- 지도는 작은 임베드만 사용

### 설정 / 문서
- `next.config.ts`에 Unsplash 원격 이미지 설정 추가
- `.env.example`에 외부 공급자 키 항목 추가
- `README.md`, `docs/issue-resolution-log.md` 갱신

## 범위 제외
- 숙소 가격 범위
  - 현재 프로젝트 범위에서 제외
  - 이후 작업 항목으로 잡지 않음

## 미완료 / 보류 사항
- 실제 운영 키 기준 점검
  - 이미지, 지도, 장소 목록 품질 확인 필요
- e2e 검증
  - 저장/복원 흐름에서 보조 정보 노출 확인 필요
- UI 미세조정
  - 이미지 높이
  - 지도 높이
  - 주변 장소 row 밀도
  - 날씨/환율 문구 길이

## 다음 작업
1. 실제 `.env.local`에 공급자 키를 넣고 홈/상세/복원 화면 확인
2. 모바일 화면에서 support 패널 높이와 밀도 조정
3. 필요하면 e2e 추가

## 검증 결과
- `npx tsc --noEmit` 통과
- `npm run lint` 통과
- `npm run test:unit` 통과
- `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/travel-support/service.spec.ts` 통과
- `npm run build` 통과

## 관련 문서
- [`memory/2026-03-27-travel-data-enrichment/status.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/status.md)
- [`memory/2026-03-27-travel-data-enrichment/plan.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/plan.md)
- [`memory/2026-03-27-travel-data-enrichment/changes.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/changes.md)
- [`memory/2026-03-27-travel-data-enrichment/verification.md`](/Users/jihun/Desktop/study/project/SooGo/memory/2026-03-27-travel-data-enrichment/verification.md)
