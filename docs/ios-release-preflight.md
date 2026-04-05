# iOS Release Preflight

이 문서는 SooGo의 iOS 출시 준비 상태를 점검하는 체크리스트다.
현재 기준으로는 **모바일 웹/PWA + shell-safe 웹 계약 정리**까지 완료했고, **실제 Capacitor native shell 생성과 Universal Links 구성은 아직 차단 상태**다.

## 1. 현재 완료된 기반

- [x] WebKit / Mobile Safari acquisition 흐름 검증
- [x] 공유 링크 canonical public origin 정리 (`NEXT_PUBLIC_APP_ORIGIN`)
- [x] API base 분리 (`NEXT_PUBLIC_API_BASE_URL`)
- [x] PWA manifest / install icons / apple touch icon / viewport theme color 반영
- [x] 추천 실패 시 retry UI 추가
- [x] snapshot/detail 링크 복사 실패 시 manual-copy fallback 추가
- [x] acquisition API에 shell-origin CORS 허용 추가 (`capacitor://localhost` 기본)
- [x] restore / compare / destination detail route data를 재사용 가능한 serializable contract로 분리
- [x] `NEXT_PUBLIC_IOS_SHELL=true`일 때 auth/account CTA 숨김 검증

## 2. 현재 차단 상태

### Architecture Blocked
- [ ] Capacitor가 소비할 실제 static `webDir` 산출물이 아직 없다.
- [ ] 현재 Next 16 App Router 앱은 일반 `next build`만으로는 Capacitor production bundle용 정적 HTML 번들을 만들지 않는다.
- [ ] dynamic routes, API handlers, middleware를 유지한 채 어떤 export target을 native shell에 넣을지 별도 아키텍처 결정이 필요하다.

### Environment Blocked
- [ ] 이 작업 환경에는 full Xcode / iOS simulator tooling이 없어 `xcodebuild` / `simctl` 기반 검증을 수행할 수 없다.

## 3. TestFlight 이전 필수 조건

### Web / PWA 계약
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npx vitest run tests/unit/runtime/url.spec.ts`
- [x] `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows a retry path when recommendation loading fails|shows a manual-copy fallback when snapshot clipboard copy fails|shows a manual-copy fallback when detail clipboard copy fails"`
- [x] `npx playwright test tests/e2e/smoke.spec.ts -g "keeps auth and account navigation in standard web mode"`
- [x] `NEXT_PUBLIC_IOS_SHELL=true npx playwright test tests/e2e/smoke.spec.ts -g "hides auth and account navigation in ios shell mode"`
- [x] `npx playwright test tests/e2e/ios-acquisition-flow.spec.ts --project=webkit`
- [x] `npx playwright test tests/e2e/ios-acquisition-flow.spec.ts --project="Mobile Safari"`

### Shell transport 계약
- [x] shell-origin preflight returns `204`
- [x] `Origin: capacitor://localhost` acquisition API responses include:
  - `Access-Control-Allow-Origin: capacitor://localhost`
  - `Access-Control-Allow-Credentials: true`

## 4. Native shell 전환 전에 해야 할 일

- [ ] Capacitor용 실제 static shell/web bundle 전략 결정
- [ ] `capacitor.config.ts`의 `webDir`가 실제 static output을 가리키도록 구성
- [ ] production에서 `server.url`을 사용하지 않도록 유지
- [ ] `ios/App/**` 생성 후 `npx cap sync ios`
- [ ] full Xcode 환경에서 simulator build 검증
- [ ] shell deep link / universal link app identifier 확정
- [ ] AASA 파일과 iOS associated domains 구성

## 5. App Review 메모

- 단순 웹뷰 래핑처럼 보이지 않도록 acquisition flow의 앱다운 가치가 설명 가능해야 한다.
- v1 shell 범위는 anonymous acquisition flow로 제한한다.
- broken auth/account/history 진입점은 shell mode에서 숨긴다.
- 공유 링크, restore flow, compare flow, detail flow가 fail-closed로 동작해야 한다.
- clipboard failure / recommendation failure 상황에서도 blank state 없이 recovery path가 있어야 한다.

## 6. 관련 파일

- Runtime URL contract: `src/lib/runtime/url.ts`
- Shell flag: `src/lib/runtime/shell.ts`
- Shell nav guard: `src/components/trip-compass/experience-shell.tsx`
- Route data split: `src/lib/trip-compass/route-data.ts`
- Restore views: `src/components/trip-compass/snapshot-restore-view.tsx`, `src/components/trip-compass/compare-restore-view.tsx`
- Acquisition CORS: `src/lib/security/cors.ts`, `src/app/api/recommendations/route.ts`, `src/app/api/snapshots/route.ts`, `src/app/api/snapshots/[snapshotId]/route.ts`, `src/app/api/auth/session/route.ts`
- PWA metadata: `src/app/layout.tsx`, `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`

## 7. 현재 결론

지금 저장소는 **iOS 출시 준비를 위한 웹 계약 정리 단계는 완료**했지만,
**실제 App Store/TestFlight용 native shell 생성은 아직 시작하면 안 되는 상태**다.

다음 진짜 게이트는 하나다:

> Capacitor가 사용할 수 있는 진짜 static `webDir`를 먼저 정의하고 검증할 것.
