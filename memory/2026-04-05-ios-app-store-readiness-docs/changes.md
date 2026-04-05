# 한눈에 보기

- 기존 iOS preflight 문서에 App Store 정책 체크를 추가했다.
- 공개용 iOS App Store 준비 계획 문서를 새로 만들었다.

# 변경 사항

## 파일
- `docs/ios-release-preflight.md`: 기존 웹/PWA/shell 체크리스트에 App Store 제출 필수 정책, 현재 코드 기준 판단, 공식 출처를 추가했다.
- `docs/ios-app-store-readiness-plan.md`: 정책 보완, shell 준비, TestFlight 증빙, App Store Connect 메타데이터 준비까지 이어지는 공개용 실행 계획 문서를 추가했다.
- `src/app/privacy/page.tsx`: 앱 내부 개인정보처리방침 페이지를 추가했다.
- `src/components/trip-compass/experience-shell.tsx`: 모든 주요 화면에서 개인정보처리방침으로 이동할 수 있는 footer 링크를 추가했다.
- `src/lib/account/service.ts`, `src/app/api/me/account/route.ts`: 계정과 개인 데이터를 삭제하는 서비스와 API를 추가했다.
- `src/components/trip-compass/account-experience.tsx`: 추천 설정 탭에 개인정보처리방침 링크와 계정 삭제 2단계 UI를 추가했다.
- `src/lib/test-ids.ts`, `tests/unit/account/delete-account.spec.ts`, `tests/unit/api/me-account-route.spec.ts`, `tests/unit/ui/account-future-trips.spec.tsx`: 계정 삭제와 privacy 진입 테스트/selector를 추가했다.
- `apps/ios-shell/next.config.ts`: shell build warning을 줄이기 위해 `turbopack.root`를 지정했다.
- `memory/2026-04-05-ios-app-store-readiness-docs/plan.md`: 이번 문서 작업의 목표와 범위를 기록했다.
- `memory/2026-04-05-ios-app-store-readiness-docs/changes.md`: 변경 파일과 요지를 기록했다.
- `memory/2026-04-05-ios-app-store-readiness-docs/verification.md`: 검증과 남은 리스크를 기록할 파일을 추가했다.

## 메모
- 기존 `.sisyphus/plans/ios-launch-path.md`와 `docs/ios-release-preflight.md`가 이미 있어, 이를 대체하지 않고 공개 문서 계층만 보강하는 방향을 택했다.
- 현재 저장소에서 정책 리스크가 큰 항목 중 `계정 삭제`와 `개인정보처리방침 노출`은 이번 턴에 구현했다.
