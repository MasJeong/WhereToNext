# 한눈에 보기

- 목표는 `떠나볼까?`를 가장 빠른 경로로 TestFlight/App Store 제출 가능한 상태까지 끌어올리는 것이다.
- 2026-04-05 현재 우선순위는 `Xcode signing -> archive/upload -> App Store Connect 메타데이터 입력` 순서다.
- `static shell/webDir`와 `ios/App/**`는 이미 준비돼 있으므로, 더 이상 “native shell 시작 전” 문서가 아니다.
- 내부 기준 계획은 `.sisyphus/plans/ios-launch-path.md`, `.sisyphus/plans/static-webdir-strategy.md`를 함께 본다.

# iOS App Store 준비 계획

## 목표

- App Store 심사에서 즉시 걸릴 확률이 높은 정책 누락을 먼저 제거한다.
- web-first 코드베이스를 유지하면서 TestFlight 제출 가능한 iOS shell 경로를 확정한다.
- 출시 전 필요한 문서, 메타데이터, 검증 항목을 한 문서에서 추적 가능하게 만든다.

## 현재 상태 요약

- 완료:
  - mobile web / PWA / shell-safe URL, CORS, share/restore 계약 일부 정리
  - WebKit / Mobile Safari 흐름 검증 일부 확보
  - `Apple` 로그인 옵션 포함
  - 앱 내부 개인정보처리방침 노출
  - 앱 내 계정 삭제 경로 구현
  - `capacitor.config.ts` 추가와 `apps/ios-shell/out` `webDir` 연결
  - `ios/App/**` 생성과 `npx cap sync ios` 검증
  - shell mode에서 `auth/account/account settings/history` 경로 차단과 저장 CTA 숨김
- 미완료:
  - Xcode signing / archive / TestFlight 업로드
  - App Store Connect 메타데이터 입력

## 오늘 2시간 목표

### 목표선
1. TestFlight 내부 배포 업로드 완료
2. App Store Connect 필수 입력 초안 완료
3. 시간이 남으면 심사 제출까지 진행

### 오늘 안에 새로 만들지 않을 것
1. Universal Links
2. shell 범위 확장
3. 네이티브 기능 추가
4. Android 대응

## 지금 당장 남은 항목

### 제품 안에서 추가 구현해야 하는 것
1. iOS shell에서 필요한 review/demo 진입 흐름 확인

### 운영/심사 준비로 정리해야 하는 것
1. `App Privacy` 작성표
2. 로그인 심사용 `demo account` 준비
3. `review notes`와 App Review 연락처 정보 정리
4. `Privacy Policy URL`, `Support URL` 점검
5. `Age Rating`, `export compliance`, `screenshots` 입력안
6. 심사 중 백엔드와 기능 URL이 실제로 동작하도록 점검
7. 외부 콘텐츠 권리/약관 준수 정리
8. 서드파티 로그인 유지 시 `Sign in with Apple` 동등 옵션 검증
9. 핵심 기능이 계정 기반이 아니면 비로그인 접근 가능 상태 유지

### 2026-04-10 Apple 공식 문서 재확인 메모
1. `Privacy Policy URL`은 iOS 앱에 필수다.
2. `Support URL`은 platform version metadata에서 required로 표시된다.
3. `App Review Information`에는 연락처, notes, 로그인 필요 시 만료되지 않는 demo account가 필요하다.
4. `screenshots`는 제출용 필수 자산이고, `app previews`는 선택 항목이다.
5. 일반적인 HTTPS/TLS 접근만 있어도 export compliance 질문을 거쳐야 할 수 있다.

### 현재는 구현 완료된 것
1. 앱 내부 개인정보처리방침
2. 앱 내 계정 삭제 경로와 삭제 API
3. shell-safe URL / CORS / restore/share 계약
4. 핵심 추천 흐름의 비로그인 접근 가능 상태
5. Apple 로그인 옵션 포함

## 범위

- 포함:
  - App Store 정책 충족에 직접 연결되는 문서/기능/검증
  - iOS shell 제출 가능성을 높이는 최소 구현 계획
  - App Store Connect 메타데이터 준비 항목
- 제외:
  - Android
  - 푸시, 결제, 구독, 오프라인 엔진, 네이티브 UI 전면 재작성
  - v1 shell 범위를 넘는 account/history/auth 확장

## 실행 계획

### 1단계. 제출 차단 가능성이 큰 정책 누락 제거
1. 개인정보처리방침 URL과 앱 내부 진입점 추가
2. 계정 삭제 UX, API, 저장소 삭제 정책 정의 및 구현
3. App Privacy 데이터 수집표 작성
4. App Review용 demo account, 연락처, review notes 문서화

### 2단계. Xcode 업로드 경로 확정
1. `npm run shell:ios:sync`로 최신 웹 산출물을 iOS 프로젝트에 동기화
2. Xcode에서 `Signing & Capabilities`의 `Team`과 bundle id를 확정
3. 시뮬레이터 또는 실제 iPhone에서 핵심 흐름 smoke 확인
4. `Product > Archive` 후 Organizer 업로드

### 3단계. iOS 배포 기술 증빙 확보
1. shell mode 핵심 흐름 QA
2. Xcode simulator build와 핵심 흐름 QA
3. TestFlight 내부 배포 확인
4. 업로드 전 체크리스트 완결

### 4단계. App Store Connect 제출 패키지 준비
1. Age Rating, privacy, export compliance, screenshots 입력
2. `Privacy Policy URL`, `Support URL`, 연락처 정보 점검
3. review notes에 로그인/데모/제휴 링크 동작 설명
4. 제출 메타데이터와 기능 URL이 실제 동작과 일치하는지 점검
5. 외부 콘텐츠 권리 및 약관 준수 정리
6. 제출 전 최종 회귀 검증 수행

## 작업 단위별 산출물

### 정책
- `privacy policy` 페이지 또는 외부 canonical URL
- 계정 삭제 기능 명세와 구현
- App Privacy 작성표
- App Review 연락처 / `Support URL`

### 기술
- `capacitor.config.ts`
- `ios/App/**`
- shell build / sync / simulator 검증 기록

### 운영
- App Review notes 초안
- metadata checklist
- release owner / verification owner 지정 문서
- 심사 중 백엔드/외부 링크 가용성 확인 메모

## 우선순위

### P0
- Xcode signing과 archive/upload
- App Privacy, screenshots, review information 입력

### P1
- simulator smoke 확인
- review notes / demo account / App Review 연락처
- 심사 중 백엔드 / URL 가용성 점검
- external content rights 정리

### P2
- universal links
- shell 범위 이후 확장 검토

## 남은 작업 계획

### 1. 앱 구현
1. `npm run shell:ios:sync`를 돌려 최신 shell 산출물을 iOS 프로젝트에 반영한다.
2. Xcode에서 `Team`, bundle id, 버전값을 확인한다.
3. shell mode에서 노출 가능한 화면을 `home -> acquisition -> results -> detail/restore/compare` 범위로 유지한다.

### 2. 심사 준비물
1. `App Privacy` 입력표를 별도 문서로 만든다.
2. 계정 기반 기능 검토를 위해 만료되지 않는 `demo account`를 준비한다.
3. `review notes`에 로그인 방식, demo 접근, 외부 제휴 링크 동작을 정리한다.
4. App Review 연락처 이름, 이메일, 전화번호를 정리한다.
5. App Store Connect 입력용 `Privacy Policy URL`, `Support URL`, `Age Rating`, `export compliance`, `screenshots` 체크리스트를 만든다.
6. 심사 기간 동안 백엔드와 제출 메타데이터의 URL이 살아 있는지 확인한다.
7. `app previews`는 선택 항목으로 관리한다.

### 3. 최종 검증
1. full Xcode 환경에서 simulator build를 확인한다.
2. TestFlight 업로드 전 실제 iPhone 흐름을 재검증한다.
3. 제출 직전 `build`, 관련 unit/e2e, shell build 결과를 다시 묶어 확인한다.

## 완료 기준

- 앱 내 계정 삭제 가능
- 개인정보처리방침 접근 가능
- App Store Connect 필수 메타데이터 초안 완료
- static shell 산출물과 `ios/App` 생성 가능
- Xcode archive 업로드 가능
- 최소 `lint`, `build`, 관련 unit/e2e, simulator build 결과 확보

## 이번 턴에서 끝낸 항목

- `/privacy` 페이지 추가
- 공용 shell footer와 계정 설정 탭에서 개인정보처리방침 진입점 추가
- `DELETE /api/me/account` 추가
- 계정 삭제 시 계정, 세션, 선호, 여행 기록, 예정 여행, 소유 스냅샷, 사용자 연계 제휴 클릭 정리
- `npm run shell:build`로 `apps/ios-shell/out` 생성 확인
- `capacitor.config.ts` 추가 및 `apps/ios-shell/out` 연결
- `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli` 설치
- `ios/App/**` scaffold 생성
- `npm run shell:ios:sync`로 `cap sync ios` 검증
- shell mode에서 `auth/account/account settings/history`를 홈으로 redirect
- shell 결과 화면에서 `내 여행에 담기`, `계정에서 보기` CTA 숨김

## 리스크

- 현재 iOS shell이 여전히 단순 웹뷰처럼 보이면 `4.2 Minimum Functionality` 리스크가 남는다.
- 제휴/외부 콘텐츠 사용 방식이 권리 또는 disclosure 측면에서 추가 설명을 요구할 수 있다.
- Xcode/simulator 환경이 없는 상태에서는 최종 go/no-go 판단을 로컬에서 끝낼 수 없다.

## 공식 기준 검증 메모

- `Privacy Policy URL`은 모든 앱에 필요하고, 앱 내부에서도 쉽게 접근 가능해야 한다.
- `App Privacy` 응답은 앱과 서드파티 파트너의 데이터 수집까지 포함해 작성해야 한다.
- 앱에 계정 기반 기능이 있으면 App Review용 `demo account` 또는 fully-featured `demo mode`가 필요하고, `demo mode`는 `demo account`를 제공할 수 없는 경우 Apple 사전 승인 전제의 예외다.
- 서드파티 로그인으로 기본 계정을 인증하면 `Sign in with Apple` 동등 옵션이 필요하다.
- 계정 기반 기능이 핵심이 아니면 로그인 없이 핵심 기능을 제공해야 한다.
- `Support URL`과 App Review 연락처 정보는 제출 메타데이터에 포함해야 한다.
- 스크린샷은 필수이고, `app previews`는 선택 사항이다.
- 제출 전에 메타데이터가 완전해야 하고, 기능 URL과 백엔드는 심사 중 실제로 동작해야 한다.
- `Age Rating`, `export compliance`, 외부 콘텐츠 권리 확인은 여전히 필수 체크 대상이다.
- 공개 UGC가 생기면 신고, 차단, 필터링, 연락처 공개 요건을 추가로 만족해야 한다. 현재 제품 범위에서는 조건부 항목이다.

## 공식 참고 링크

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines
- Sign in with Apple for user account sign-in: https://developer.apple.com/sign-in-with-apple/get-started/
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- App privacy reference: https://developer.apple.com/help/app-store-connect/reference/app-privacy
- App information reference: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- App review information reference: https://developer.apple.com/help/app-store-connect/reference/app-review-information
- Upload app previews and screenshots: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- Overview of export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance
- Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/

## 관련 문서

- [docs/ios-release-preflight.md](C:/jihun_roject/trip-compass/docs/ios-release-preflight.md)
- [.sisyphus/plans/ios-launch-path.md](C:/jihun_roject/trip-compass/.sisyphus/plans/ios-launch-path.md)
- [.sisyphus/plans/static-webdir-strategy.md](C:/jihun_roject/trip-compass/.sisyphus/plans/static-webdir-strategy.md)
- [docs/social-login-setup.md](C:/jihun_roject/trip-compass/docs/social-login-setup.md)
- [docs/deployment.md](C:/jihun_roject/trip-compass/docs/deployment.md)
