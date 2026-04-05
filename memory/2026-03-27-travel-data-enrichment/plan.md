# 2026-03-27 여행 데이터 보강

## 목표
- 대표 추천 1곳에만 이미지, 날씨, 작은 지도, 주변 장소, 환율 참고 정보를 붙인다.
- 홈 결과, 목적지 상세, 저장 링크 복원이 같은 서버 집계 레이어를 재사용하게 만든다.
- 공급자 실패 시 추천 결과는 유지하고 해당 블록만 숨긴다.

## 범위
- Unsplash 대표 이미지(`hero image`)
- Open-Meteo 날씨 요약
- Google Maps 소형 임베드 + 주변 장소
- exchangerate.host 환율 참고 정보
- 공유 링크를 열 때 외부 데이터 재조회
- 숙소 가격 범위는 v1 제외

## 구현 계획
1. `contracts`와 presentation response에 lead supplement 타입을 추가한다.
2. `src/lib/travel-support/`에 공급자 집계 레이어를 만든다.
3. `/api/recommendations`와 route restore/detail 경로에 supplement를 연결한다.
4. 공용 support panel을 만들어 홈 결과와 상세/복원 화면에 재사용한다.
5. env/docs/tests/issue log를 갱신한다.
