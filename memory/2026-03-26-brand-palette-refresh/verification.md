## 검증

- 통과:
  - `npm run lint`

- 실패:
  - `npx vitest run tests/unit/smoke.spec.tsx`
    - 기존 실패 상태다. 테스트는 아직 예전 랜딩 제목 문구인 `여행지, 감으로 시작해도 결과는 또렷하게.`를 기대하지만, 현재 UI는 `지금 맞는 여행지, 바로 좁혀 드려요.`를 렌더링한다.

## 메모

- 이 팔레트 리프레시 전부터 저장소에는 홈 랜딩 heading 카피와 관련한 smoke test 불일치가 이미 있었다.
- 전체 build 검증은 sandboxed/offline 환경에서 Google Fonts fetch가 막히면 로컬에서 영향받을 수 있다.
