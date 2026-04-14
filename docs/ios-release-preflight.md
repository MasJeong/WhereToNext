# 한눈에 보기

- 2026-04-05 현재 `떠나볼까?`는 iOS shell 생성 단계가 아니라 `Xcode 업로드 + App Store Connect 입력` 단계다.
- 저장소 안 기준으로는 `capacitor.config.ts`, `apps/ios-shell/out`, `ios/App/**`가 이미 존재한다.
- 오늘 2시간 안에 현실적으로 노릴 수 있는 목표는 `TestFlight 내부 배포 업로드 완료`다.
- App Store 심사 제출까지도 같은 흐름으로 이어갈 수 있지만, `메타데이터`, `스크린샷`, `App Privacy`, `리뷰 정보` 입력 속도에 따라 2시간을 넘길 수 있다.
- 2026-04-28 이후 App Store Connect 업로드는 `iOS 26 SDK` 이상으로 빌드해야 하므로, 집에서 배포할 때는 `Xcode 26` 이상 사용 여부를 먼저 확인해야 한다.

# iOS 출시 전 점검

## 1. 현재 저장소 기준 상태

### 이미 준비된 것
- [x] `capacitor.config.ts` 존재
- [x] `webDir`가 `apps/ios-shell/out`을 가리킴
- [x] `apps/ios-shell/out` 정적 산출물 존재
- [x] `ios/App/**` iOS native scaffold 존재
- [x] `CFBundleDisplayName = 떠나볼까?`
- [x] `PRODUCT_BUNDLE_IDENTIFIER = kr.soogo.tteonabolkka`
- [x] `MARKETING_VERSION = 1.0`
- [x] `CURRENT_PROJECT_VERSION = 1`
- [x] shell-safe 웹 흐름, restore/share 계약, shell mode 가드 구현

### 아직 코드/프로젝트에서 직접 확인되지 않은 것
- [ ] Xcode signing에 필요한 `DEVELOPMENT_TEAM`
- [ ] App Store Connect 앱 레코드 생성 여부
- [ ] App Privacy 입력 완료 여부
- [ ] `Support URL`, `Privacy Policy URL`, 리뷰 연락처, `review notes`
- [ ] iPhone용 제출 스크린샷 업로드
- [ ] Xcode Organizer archive / upload 성공 여부

## 2. 오늘 목표를 이렇게 잡아야 함

### 2시간 안 목표
- 1순위: `TestFlight 내부 배포 업로드 완료`
- 2순위: App Store Connect 메타데이터 초안 완료
- 3순위: 가능하면 외부 테스터 또는 심사 제출까지 진행

### 과하게 잡으면 안 되는 목표
- 오늘 안에 `심사 승인`까지 받는 것
- 네이티브 기능 확장이나 Universal Links까지 새로 붙이는 것
- shell 범위를 늘려 auth/account/history를 앱 안에 다시 넣는 것

## 3. 지금 남은 진짜 차단 항목

### 로컬/Xcode
- [ ] `Xcode 26` 이상 설치 여부 확인
- [ ] Mac에 로그인된 Apple Developer 계정
- [ ] Xcode에서 `Signing & Capabilities` 설정
- [ ] `Team` 선택으로 `DEVELOPMENT_TEAM` 반영
- [ ] 실제 기기 또는 시뮬레이터에서 최소 1회 smoke 확인
- [ ] `Product > Archive` 성공
- [ ] archive 전에 `Privacy Report`에서 Capacitor privacy manifest 포함 여부 확인

### App Store Connect
- [ ] 앱 생성 또는 기존 앱 레코드 확인
- [ ] 배포 국가가 `대한민국`만 선택돼 있는지 확인하고, EU storefront가 빠져 있는지 점검
- [ ] App Store Connect에 `DSA trader status` 관련 화면이 보이면 `EU 미배포` 기준으로 처리할지 확인
- [ ] `Privacy Policy URL`
- [ ] `Support URL`
- [ ] `App Privacy`
- [ ] `Age Rating`
- [ ] `Export Compliance`
- [ ] `App Review Information`
- [ ] iPhone screenshots

## 4. 2026-04-05 기준 2시간 실행 순서

### 0~20분
1. `npm run shell:ios:sync`로 최신 웹 산출물을 iOS 프로젝트에 동기화한다.
2. `open ios/App/App.xcodeproj`로 Xcode를 연다.
3. Xcode에서 `Signing & Capabilities`로 들어가 `Team`을 지정한다.
4. Bundle ID가 App Store Connect의 앱 레코드와 일치하는지 확인한다.
5. `Xcode 26` 이상인지 확인하고, archive 전에 `Privacy Report`를 열어 Capacitor manifest가 합쳐지는지 확인한다.

### 20~45분
1. 시뮬레이터 또는 연결된 iPhone에서 1회 실행한다.
2. 아래 핵심 화면만 빠르게 확인한다.
   - 홈 진입
   - 추천 생성
   - 결과 화면
   - 저장된 snapshot 링크 열기
   - destination detail
3. 웹뷰처럼 깨지거나 blank screen이 없는지만 본다.

### 45~75분
1. Xcode에서 `Product > Archive`
2. Organizer에서 `Distribute App > App Store Connect > Upload`
3. 업로드가 끝나면 App Store Connect의 TestFlight 빌드 처리 대기

### 75~120분
1. App Store Connect에서 아래 메타데이터를 채운다.
   - `DSA trader status`
   - `Privacy Policy URL`
   - `Support URL`
   - `App Privacy`
   - `Age Rating`
   - `Export Compliance`
   - `App Review Information`
2. iPhone screenshots를 올린다.
3. 내부 테스터용 TestFlight 배포를 켠다.
4. 시간이 남으면 리뷰 제출까지 이어간다.

## 5. Xcode에서 바로 확인할 것

### Signing
- `Team`이 비어 있으면 업로드가 막힌다.
- `Bundle Identifier`는 `kr.soogo.tteonabolkka`를 그대로 쓸지, 실제 배포용 식별자로 바꿀지 먼저 결정해야 한다.
- 2026-04-28 이후에는 `Xcode 26`과 `iOS 26 SDK`로 archive 해야 업로드 자체가 된다.

### Versioning
- 현재 프로젝트 값은 `1.0 (1)`이다.
- 오늘 첫 업로드면 그대로 가능하다.
- 기존에 같은 bundle id로 업로드한 적이 있으면 build number 충돌 여부를 확인해야 한다.

### Build target
- `ios/App/App.xcodeproj`를 열고 `App` scheme으로 archive 한다.

## 6. App Store Connect에 넣을 정보

### 필수
- `DSA trader status` 선언
- `Privacy Policy URL`
- `Support URL`
- `App Privacy`
- `Age Rating`
- `Export Compliance`
- `App Review Information`
- iPhone screenshots

### App Review Information에 바로 넣을 내용
- 앱 핵심 기능은 로그인 없이 여행지 추천과 결과 탐색이 가능하다는 점
- 로그인은 저장/기록 같은 보조 기능용이라는 점
- 외부 링크가 있다면 어디로 이동하는지
- 심사 중 테스트해야 할 핵심 경로

### demo account
- 계정 기능 검토가 필요한 경우 제공한다.
- 단, 현재 v1 핵심 플로우가 비로그인 추천 중심이면 심사 메모에서 그 점을 분명히 적는 것이 우선이다.

## 7. Export Compliance 판단 메모

- Apple 공식 문서상 앱이 암호화를 사용하거나 접근하면 export compliance 판단이 필요하다.
- 일반적인 HTTPS/TLS 사용 앱도 App Store Connect에서 질문에 답해야 한다.
- 이 항목은 `Info.plist`보다 App Store Connect 입력이 먼저다.
- 비표준 암호화를 직접 구현하지 않았다면 대개 표준 암호화 사용 여부와 면제 범위를 기준으로 답하게 된다.

## 7-1. 최신 추가 체크

- `Support URL`은 실제 연락 가능한 안내 페이지여야 하고, 한국 한정 배포라면 심사 연락용 `이름, 이메일, 전화번호`가 우선이다.
- `Capacitor`는 Apple의 privacy manifest/signature 요구 SDK 목록에 포함돼 있으므로, archive 전에 Xcode `Privacy Report`에서 manifest 결합 결과를 확인하는 편이 안전하다.
- EU 배포를 하지 않는다면 DSA trader 공개 연락처 요건은 직접 적용되지 않지만, 배포 국가 설정과 App Store Connect의 관련 질문지는 한 번 확인하는 편이 안전하다.
- Age rating 시스템이 더 세분화됐으므로 기존 기본값을 그대로 두지 말고 현재 질문지를 한 번 다시 확인하는 편이 안전하다.

## 8. 오늘 바로 쓸 리뷰 메모 초안

```text
떠나볼까?는 여행지 추천과 결과 탐색을 빠르게 제공하는 앱입니다.
핵심 추천 플로우는 로그인 없이 사용할 수 있습니다.
로그인은 저장과 기록 같은 보조 기능에서만 사용됩니다.
앱의 주요 경로는 홈 > 추천 조건 선택 > 추천 결과 > 목적지 상세 보기입니다.
개인정보처리방침은 앱 내부와 제출 메타데이터의 URL에서 모두 확인할 수 있습니다.
```

## 9. 로컬에서 확인한 사실

- `capacitor.config.ts`의 `webDir`는 `apps/ios-shell/out`이다.
- `apps/ios-shell/out/index.html`이 존재한다.
- `ios/App/App.xcodeproj/project.pbxproj`에는 `MARKETING_VERSION = 1.0`, `CURRENT_PROJECT_VERSION = 1`, `PRODUCT_BUNDLE_IDENTIFIER = kr.soogo.tteonabolkka`가 있다.
- 같은 파일에서 `DEVELOPMENT_TEAM`은 아직 확인되지 않았다.

## 10. 현재 결론

지금은 `iOS native shell 생성 전` 단계가 아니다.
지금은 `Xcode signing + archive/upload + App Store Connect 메타데이터 입력` 단계다.

오늘 2026-04-05 안에 가장 현실적인 목표는:

> Xcode archive와 TestFlight 내부 배포 업로드를 끝내고, App Store Connect 필수 입력을 같은 세션에서 정리하는 것.

## 11. 공식 참고 링크

- App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Upload builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds
- App Review Information: https://developer.apple.com/help/app-store-connect/reference/app-review-information
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- Overview of export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance
