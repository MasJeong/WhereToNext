# 한눈에 보기

- 이 문서는 `떠나볼까?` iOS 앱을 App Store Connect에 올릴 때 바로 입력할 값과 아직 비어 있는 값을 한 번에 정리한 제출 패키지다.
- 2026-04-10 기준 내부적으로 준비된 URL은 `/privacy`, `/support`이고, 실제 App Store Connect에는 운영 도메인 기준 절대 URL로 넣어야 한다.
- 지금 남은 외부 작업은 `Team 지정`, `Archive/Upload`, `App Privacy`, `Age Rating`, `Export Compliance`, `App Review Information`, `screenshots`다.

# 제출용 값

## URL

- Privacy Policy URL: `https://<운영도메인>/privacy`
- Support URL: `https://<운영도메인>/support`
- Marketing URL: 선택

## 앱 기본 정보

- App Name: `떠나볼까?`
- Bundle ID: `kr.soogo.tteonabolkka`
- Version: `1.0`
- Build: `1`
- Primary language: `Korean`

## App Review Information 초안

- 연락처 이름: 배포 담당자 실명
- 연락처 이메일: 심사 응답 가능한 메일
- 연락처 전화번호: 심사 연락 가능한 번호
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
