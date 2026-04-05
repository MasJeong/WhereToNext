# 한눈에 보기

- 이번 작업은 문서 작성 작업이라 코드 실행 검증보다 문서 정합성 확인이 중심이다.
- 기존 문서 존재 여부와 관련 계획 문서 연결을 확인했다.

# 검증

## 명령
- `rg -n "ios|app store|apple|deployment|배포|심사|privacy|account deletion|sign in with apple" docs memory .sisyphus -g '*.md'`
- `sed -n '1,220p' docs/ios-release-preflight.md`
- `sed -n '1,220p' .sisyphus/plans/ios-launch-path.md`
- `npx vitest run tests/unit/account/delete-account.spec.ts tests/unit/api/me-account-route.spec.ts tests/unit/ui/account-future-trips.spec.tsx`
- `npm run lint`
- `npm run build`
- `npm run shell:build`

## 결과
- 기존 체크리스트 문서 `docs/ios-release-preflight.md` 존재를 확인했다.
- 기존 내부 계획 문서 `.sisyphus/plans/ios-launch-path.md` 존재를 확인했다.
- 새 공개 계획 문서가 기존 내부 계획을 중복 대체하지 않고 연결하도록 정리했다.
- 계정 삭제 service/API/UI 관련 단위 테스트 3개 묶음이 통과했다.
- `lint`, `build`, `shell:build`가 통과했다.
- `apps/ios-shell/out/index.html` 생성으로 static export 산출물 존재를 확인했다.

## 남은 리스크
- `App Privacy`, `App Review metadata`, `Capacitor shell 연결`, `Xcode/TestFlight`는 아직 구현/실행되지 않았다.
- App Store Connect 입력과 심사 결과는 실제 빌드/메타데이터 제출 단계에서 다시 검증해야 한다.
