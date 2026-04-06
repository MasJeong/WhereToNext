# 한눈에 보기

- 단위 검증, lint, build, 분할 unit CI는 통과했다.
- `npm run test:unit`은 기존 hang 이슈 때문에 `npm run test:unit:ci`로 대체했다.
- 전체 e2e는 기존 저장/인증/복원 흐름 실패가 남아 있어 후속 작업이 필요하다.

# 검증

## 실행한 명령
- `npx vitest run tests/unit/travel-support/service.spec.ts tests/unit/ui/travel-support-panel.spec.tsx`
- `npm run lint`
- `npm run build`
- `npm run test:unit:ci`
- `npm run test:e2e`

## 결과
- `tests/unit/travel-support/service.spec.ts`: 통과
- `tests/unit/ui/travel-support-panel.spec.tsx`: 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- `npm run test:unit:ci`: 통과
- `npm run test:e2e`: 실패

## e2e 실패 메모
- 첫 실행 실패 원인:
  - `http://localhost:4010` 포트 점유
  - 로컬 `next dev` 프로세스 정리 후 재실행
- 재실행에서 확인한 실패 케이스:
  - `tests/e2e/account-future-trips.spec.ts:44`
    - `promotes a saved recommendation into 앞으로 갈 곳 and can move it back`
  - `tests/e2e/auth/social-login.spec.ts:51`
    - `mock social login resumes saving after auth`
  - `tests/e2e/ios-acquisition-flow.spec.ts:64`
    - `restores a saved recommendation snapshot after social login on acquisition flow`
  - `tests/e2e/ios-acquisition-flow.spec.ts:76`
    - `builds a compare board from saved snapshots after social login on acquisition flow`
  - `tests/e2e/recommendation-flow.spec.ts:192`
    - `redirects signed-out save actions to the social auth gate`

## 다음 재진입 절차
1. `npm run build`
2. 실패 파일만 chromium 기준으로 개별 재현
3. 저장/인증/복원 흐름의 selector와 현재 카피를 대조
4. 수정 후 `npm run test:e2e` 전체 재확인
