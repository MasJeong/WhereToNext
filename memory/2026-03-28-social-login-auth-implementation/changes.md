# 한눈에 보기

- 소셜 로그인 핵심 흐름과 snapshot 권한 모델을 구현했다.
- Google/Kakao/Apple 공급자 기준 구현과 mock OAuth E2E 테스트 장치까지 추가했다.

## 주요 변경

- `src/lib/db/schema.ts`, `drizzle/0004_brave_donald_blake.sql`
  - user email nullable, account 공급자 메타데이터/고유 제약, snapshot visibility/ownerUserId 추가
- `src/lib/oauth-transaction.ts`, `src/lib/auth.ts`
  - OAuth transaction 저장/소비, PKCE challenge, relative next 검증, session fixation 회전 추가
- `src/lib/provider-identity.ts`, `src/lib/provider-auth.ts`, `src/lib/oauth-provider-service.ts`
  - 공급자 identity 정규화, 공급자 로그인 오케스트레이션, Google/Kakao/Apple exchange/authorization 구현
- `src/app/api/auth/oauth/**`, `src/app/api/auth/mock/**`
  - OAuth start/callback route와 테스트용 mock authorize route 추가
- `src/components/trip-compass/auth-experience.tsx`, `src/lib/test-ids.ts`
  - auth UI를 소셜 로그인 전용으로 전환하고 소셜 공급자/test selector 추가
- `src/lib/post-auth-intent.ts`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`
  - 저장/비교 로그인 게이트와 로그인 후 1회 이어서 수행 흐름 연결
- `src/app/api/snapshots/route.ts`, `src/lib/snapshots/service.ts`
  - private/public snapshot authz 반영
- `src/app/api/me/snapshots/**`, `src/app/account/page.tsx`, `src/components/trip-compass/account-experience.tsx`
  - owner-only saved snapshot API와 `/account` saved recommendation library 추가
- `.env.example`, `README.md`
  - 공급자 환경 변수와 mock OAuth E2E 설명 추가

## 메모

- Playwright auth E2E는 오래된 production build 대신 dev server + mock OAuth 공급자 경로에서 검증했다.
- 기존 auth email/password API는 내부적으로 남아 있지만 UI 화면에서는 제거되어 기본 경로가 아니다.
