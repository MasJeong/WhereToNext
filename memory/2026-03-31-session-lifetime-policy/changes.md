# 한눈에 보기

- auth core, auth routes, shell trust helper, session policy 테스트를 함께 갱신했다.

# 변경 사항

- `src/lib/auth.ts`
  - session issuance stamp helper 유지
  - idle/absolute read enforcement 추가
  - throttled sliding refresh helper 추가
  - `/api/auth/session` 응답 경로에서 사용할 refresh-aware reader 추가
- `src/app/api/auth/sign-in/route.ts`
- `src/app/api/auth/sign-up/route.ts`
- `src/app/api/auth/oauth/[provider]/callback/route.ts`
  - trusted shell request일 때만 shell issuance 허용
  - cookie maxAge를 policy/session expiry와 맞춤
- `src/app/api/auth/session/route.ts`
  - refresh-aware lookup + invalid cookie clear 연결
- `src/lib/provider-auth.ts`
  - OAuth rotation 경로에 shell issuance 옵션 전달
- `src/lib/runtime/shell.ts`
  - trusted shell origin helper 추가
- 테스트
  - `tests/unit/auth/session-read-refresh-routes.spec.ts`
  - `tests/unit/auth/session-local-fallback.spec.ts`

# 비고

- cookie attribute(`SameSite=lax`)는 기존 계약을 유지했다.
- 실제 Capacitor/WebView에서의 cookie 전송 동작은 device QA로 계속 확인해야 한다.
