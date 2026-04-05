# 한눈에 보기

- 소셜 로그인 계획 문서를 2개에서 1개로 정리했다.
- 기존 `login-social-auth-architecture.md`를 정본 내용으로 유지하되, 최종 파일명은 `social-login-auth-architecture.md`로 통일했다.

## 변경 파일

- `.sisyphus/plans/social-login-auth-architecture.md`: 통합 정본 문서로 갱신했다.
- `memory/2026-03-28-social-login-plan-consolidation/plan.md`: 이번 통합 작업 계획을 기록했다.
- `memory/2026-03-28-social-login-plan-consolidation/changes.md`: 변경 내역을 기록했다.

## 메모

- 정본 방향은 **기존 앱 세션 유지 + 공급자 식별 정보 확장**으로 고정했다.
- Auth.js 중심 대안은 별도 migration plan이 필요한 더 큰 범위로 판단해 이번 정본 범위에서 제외했다.
- 삭제 대상이던 중복 계획 파일은 제거해 혼란을 줄였다.
- Oracle 리뷰를 반영해 verification wording, wave sizing, v1 linking 범위를 문서 안에서 일관되게 정리했다.
