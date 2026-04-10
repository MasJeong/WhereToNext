# 한눈에 보기

- 현재 iOS 배포는 shell 생성 단계가 아니라 `shell build -> cap sync -> Xcode signing -> archive/upload -> App Store Connect 입력` 단계다.
- 코드 기준 내부 차단은 `shell:build` 자동화 안정성, `DEVELOPMENT_TEAM` 미설정, 실제 archive/upload 미검증이다.
- 외부 차단은 `Privacy Policy URL`, `Support URL`, `App Privacy`, `Age Rating`, `Export Compliance`, `App Review Information`, `screenshots`, `TestFlight` 처리다.

# 현재 상태

## 저장소에서 확인된 것

- `capacitor.config.ts` 존재
- `ios/App/**` native scaffold 존재
- `PRODUCT_BUNDLE_IDENTIFIER = kr.soogo.tteonabolkka`
- `MARKETING_VERSION = 1.0`
- `CURRENT_PROJECT_VERSION = 1`
- shell mode 가드와 shell-safe CORS 구현 존재
- 앱 내부 개인정보처리방침 페이지와 계정 삭제 경로 존재

## 아직 확인되지 않은 것

- Xcode `DEVELOPMENT_TEAM`
- 실제 `Product > Archive`
- TestFlight 업로드 성공
- App Store Connect 메타데이터 입력 완료

# 실행 순서

1. `npm run shell:build`
2. `npx cap sync ios`
3. Xcode에서 `Team`, bundle id, version, signing 확인
4. 시뮬레이터 또는 실기기 smoke 확인
5. `Product > Archive`
6. `Distribute App > App Store Connect > Upload`
7. App Store Connect에서 필수 메타데이터 입력

# 외부 기준 메모

- Privacy Policy URL은 iOS 앱에 필수다.
- Support URL은 platform version 정보에서 required로 표시된다.
- App previews는 선택 사항이지만 screenshots는 제출에 필요하다.
- App Review Information에는 연락처와 Notes, 로그인 필요 시 demo account가 필요하다.
- 암호화를 사용하거나 접근하는 앱은 export compliance 질문에 답해야 한다.

# 이번 세션 메모

- `apps/ios-shell`은 직접 `node node_modules/next/dist/bin/next build`로는 빌드가 됐다.
- 기존 `npm run build` 경로는 `.next/lock` 충돌로 불안정해 스크립트를 직접 node 실행 방식으로 우회한다.
