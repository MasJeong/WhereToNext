# 한눈에 보기

- 이 문서는 `떠나볼까?` iOS 앱을 App Store Connect에 올릴 때 바로 입력할 값과 아직 비어 있는 값을 한 번에 정리한 제출 패키지다.
- 2026-04-10 기준 내부적으로 준비된 URL은 `/privacy`, `/support`이고, 실제 App Store Connect에는 운영 도메인 기준 절대 URL로 넣어야 한다.
- 지금 남은 외부 작업은 `Team 지정`, `Archive/Upload`, `App Privacy`, `Age Rating`, `Export Compliance`, `App Review Information`, `screenshots`다.
- 최신 기준으로는 여기에 `DSA trader status`와 `Xcode 26 / iOS 26 SDK` 확인도 같이 들어간다.

# 제출용 값

## URL

- Privacy Policy URL: `https://<운영도메인>/privacy`
- Support URL: `https://<운영도메인>/support`
- Marketing URL: 선택

## 현재 남은 실물 보강 항목

- 현재 기준 배포 대상이 `대한민국`만이라면 `/support` 페이지에는 실제 심사/문의 대응이 가능한 `이름, 이메일, 전화번호`가 우선 필요하다.
- 나중에 EU storefront를 열 계획이 생기면 그때 DSA trader 공개 연락처 기준에 맞춰 `주소 또는 P.O. Box`까지 다시 검토해야 한다.

## App Store Connect 사전 확인

- 배포 국가가 `대한민국`만 선택돼 있는지
- App Store Connect에 `DSA trader status` 관련 화면이 보이면 한국 한정 배포 기준으로 처리했는지
- `Xcode 26` 이상으로 archive 했는지
- archive 전 Xcode `Privacy Report`에서 Capacitor manifest가 반영됐는지

## 앱 기본 정보

- App Name: `떠나볼까?`
- Bundle ID: `kr.soogo.tteonabolkka`
- Version: `1.0`
- Build: `1`
- Primary language: `Korean`

## App Review Information 초안

- 연락처 이름: `정지훈`
- 연락처 이메일: `jihun365430@gmail.com`
- 연락처 전화번호: `010-4010-2987`
- Review notes:

```text
떠나볼까?는 여행지 추천과 결과 탐색을 빠르게 제공하는 앱입니다.
핵심 추천 플로우는 로그인 없이 사용할 수 있습니다.
로그인은 저장과 여행 기록 같은 보조 기능에서만 사용됩니다.
주요 경로는 홈 > 추천 조건 선택 > 추천 결과 > 목적지 상세 보기입니다.
개인정보처리방침과 지원 안내는 앱 footer와 제출 메타데이터 URL에서 모두 확인할 수 있습니다.
```

## 로그인 심사 메모

- 핵심 플로우는 비로그인 접근 가능
- 로그인 기능 검토가 필요하면 demo account 준비
- 소셜 로그인 유지 시 Sign in with Apple 옵션 제공 여부 확인

## 스크린샷 캡처 권장 순서

1. 홈 첫 화면
2. 추천 질문 진행 화면
3. 추천 결과 첫 화면
4. 목적지 상세
5. 저장/기록 보조 기능 화면 또는 정책/지원 화면

## 아직 직접 입력해야 하는 항목

- 배포 국가
- DSA trader status 관련 질문지
- App Privacy
- Age Rating
- Export Compliance
- Content Rights
- 가격/배포 국가
- TestFlight 내부 테스터 설정

# 코드 기준 근거

- 개인정보처리방침 페이지: `src/app/privacy/page.tsx`
- 지원 페이지: `src/app/support/page.tsx`
- shell build / sync 경로: `apps/ios-shell/package.json`, `capacitor.config.ts`
- iOS 프로젝트 버전/번들 ID: `ios/App/App.xcodeproj/project.pbxproj`

# 같이 볼 문서

- `docs/ios-release-preflight.md`
- `docs/ios-app-privacy-matrix.md`
- `docs/ios-at-home-release-checklist.md`
