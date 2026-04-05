# 한눈에 보기

- 목표는 `SooGo`를 가장 빠른 경로로 TestFlight/App Store 제출 가능한 상태까지 끌어올리는 것이다.
- 현재 기준 우선순위는 `정책 누락 보완 -> static shell/webDir 확정 -> iOS shell build -> TestFlight 증빙` 순서다.
- 이미 있는 내부 계획 `.sisyphus/plans/ios-launch-path.md`를 대체하지 않고, 공개용 실행 계획으로 압축했다.

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
- 미완료:
  - App Privacy 입력 기준
  - static `webDir` 기반 Capacitor shell 연결
  - Xcode/simulator/TestFlight 검증

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
4. App Review용 demo account 또는 demo mode 운영안 문서화

### 2단계. iOS shell 빌드 경로 확정
1. `apps/ios-shell/out` 산출물을 기준 `webDir` 후보로 고정
2. Capacitor `webDir`가 이 산출물을 가리키도록 연결
3. production `server.url` 없이 로컬 번들만 쓰는 shell 구성
4. placeholder shell을 anonymous acquisition flow 기준으로 확장

### 3단계. iOS 배포 기술 증빙 확보
1. `npx cap sync ios` 가능한 상태 정리
2. Xcode simulator build와 핵심 흐름 QA
3. Universal Links / AASA 필요 여부와 범위 확정
4. TestFlight 업로드 전 체크리스트 완결

### 4단계. App Store Connect 제출 패키지 준비
1. Age Rating, privacy, export compliance, screenshots 입력
2. review notes에 로그인/데모/제휴 링크 동작 설명
3. 외부 콘텐츠 권리 및 약관 준수 정리
4. 제출 전 최종 회귀 검증 수행

## 작업 단위별 산출물

### 정책
- `privacy policy` 페이지 또는 외부 canonical URL
- 계정 삭제 기능 명세와 구현
- App Privacy 작성표

### 기술
- `capacitor.config.ts`
- `ios/App/**`
- shell build / sync / simulator 검증 기록

### 운영
- App Review notes 초안
- metadata checklist
- release owner / verification owner 지정 문서

## 우선순위

### P0
- App Privacy 입력 기준
- Capacitor `webDir` 연결

### P1
- Capacitor shell build / sync / simulator build
- review notes / demo account
- external content rights 정리

### P2
- universal links
- shell 범위 이후 확장 검토

## 완료 기준

- 앱 내 계정 삭제 가능
- 개인정보처리방침 접근 가능
- App Store Connect 필수 메타데이터 초안 완료
- static shell 산출물과 `ios/App` 생성 가능
- 최소 `lint`, `build`, 관련 unit/e2e, simulator build 결과 확보

## 이번 턴에서 끝낸 항목

- `/privacy` 페이지 추가
- 공용 shell footer와 계정 설정 탭에서 개인정보처리방침 진입점 추가
- `DELETE /api/me/account` 추가
- 계정 삭제 시 계정, 세션, 선호, 여행 기록, 예정 여행, 소유 스냅샷, 사용자 연계 제휴 클릭 정리
- `npm run shell:build`로 `apps/ios-shell/out` 생성 확인

## 리스크

- 현재 iOS shell이 여전히 단순 웹뷰처럼 보이면 `4.2 Minimum Functionality` 리스크가 남는다.
- 제휴/외부 콘텐츠 사용 방식이 권리 또는 disclosure 측면에서 추가 설명을 요구할 수 있다.
- Xcode/simulator 환경이 없는 상태에서는 최종 go/no-go 판단을 로컬에서 끝낼 수 없다.

## 관련 문서

- [docs/ios-release-preflight.md](/Users/jihun/Desktop/study/project/SooGo/docs/ios-release-preflight.md)
- [.sisyphus/plans/ios-launch-path.md](/Users/jihun/Desktop/study/project/SooGo/.sisyphus/plans/ios-launch-path.md)
- [docs/social-login-setup.md](/Users/jihun/Desktop/study/project/SooGo/docs/social-login-setup.md)
- [docs/deployment.md](/Users/jihun/Desktop/study/project/SooGo/docs/deployment.md)
