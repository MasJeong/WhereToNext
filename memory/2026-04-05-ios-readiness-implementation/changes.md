# 한눈에 보기

- 앱 내부 개인정보처리방침과 계정 삭제를 구현했다.
- iOS shell export가 실제로 되는지 검증하고 문서를 현재 상태로 맞췄다.

# 변경 사항

## 파일
- `src/app/privacy/page.tsx`: 개인정보처리방침 페이지를 추가했다.
- `src/components/trip-compass/experience-shell.tsx`: 모든 주요 화면에서 접근 가능한 footer privacy 링크를 추가했다.
- `src/components/trip-compass/account-experience.tsx`: 추천 설정 탭에 개인정보처리방침 링크와 계정 삭제 UI를 추가했다.
- `src/app/api/me/account/route.ts`: 현재 로그인 사용자의 계정 삭제 API를 추가했다.
- `src/lib/account/service.ts`: 계정, 세션, 선호, 기록, 예정 여행, 소유 스냅샷, 사용자 연계 제휴 클릭 삭제 로직을 추가했다.
- `src/lib/test-ids.ts`: privacy / account deletion selector를 추가했다.
- `tests/unit/api/me-account-route.spec.ts`: 계정 삭제 API 테스트를 추가했다.
- `tests/unit/ui/account-future-trips.spec.tsx`: 계정 설정 탭의 privacy / account deletion 동작 테스트를 추가했다.
- `docs/ios-release-preflight.md`: privacy/account deletion 완료 상태와 shell export 확인 상태를 반영했다.
- `docs/ios-app-store-readiness-plan.md`: 이번 턴에서 끝낸 구현 항목을 반영했다.
- `docs/issue-resolution-log.md`: 구현 배경과 검증 결과를 기록했다.

## 메모
- App Store 정책상 중요한 항목 중 현재 코드로 바로 구현 가능한 범위를 먼저 끝냈다.
- `apps/ios-shell/out` export는 이미 가능해서, 이번 턴에서는 shell 연결 대신 검증과 문서 갱신에 집중했다.
