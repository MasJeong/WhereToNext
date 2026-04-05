# 한눈에 보기

- 상태: 완료
- 목적: `social-login-auth-architecture` 계획의 핵심 구현을 실제 코드에 반영
- 범위: 소셜 로그인 공급자/인증 라우트, 스냅샷 권한 모델, 로그인 후 이어서 수행, 계정 저장 추천 목록, 인증 UI, mock OAuth E2E

## 작업 계획

1. 소셜 로그인 전제를 반영하도록 user/account/snapshot 스키마와 저장소 구조를 확장한다.
2. OAuth transaction(state/PKCE/nonce/next/intent)과 session 회전 로직을 추가한다.
3. 공급자 식별 정보 정규화와 `/api/auth/oauth/[provider]/*` 라우트를 구현한다.
4. Google/Kakao/Apple 공급자 흐름과 mock OAuth 테스트 장치를 추가한다.
5. 인증 UI를 소셜 로그인 전용으로 전환하고, 로그인 후 이어서 수행하는 저장 게이트를 연결한다.
6. private/public 스냅샷 의미 규칙, owner-only 저장 스냅샷 API, `/account` 저장 추천 목록을 반영한다.
7. unit/e2e/build 검증과 문서 업데이트를 수행한다.
