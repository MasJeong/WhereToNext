# 변경 내용

## 한눈에 보기
- social-video 문서 기준을 README와 환경 예시에 반영했다.
- 선택 정책을 issue log에 기록했다.
- visible audit trail 폴더를 새로 만들었다.

## 실제 변경 사항
- `README.md`
  - 대표 추천 카드에 YouTube 기반 소셜 비디오 블록이 붙을 수 있음을 추가했다.
  - 소셜 비디오의 선택 기준을 한국어/한국인 업로드 우선, short-form 선호, 일반 영상 fallback 허용으로 적었다.
  - `YOUTUBE_API_KEY` 기반 서버 조회와 fail-soft 동작을 문서화했다.
- `.env.example`
  - `YOUTUBE_API_KEY=` 예시를 추가했다.
- `docs/issue-resolution-log.md`
  - social-video 선택 기준이 분산되어 있던 점을 정리한 새 entry를 추가했다.

## 참고
- 이번 작업은 문서와 audit trail 갱신만 포함한다.
- 코드와 테스트 파일은 수정하지 않았다.
