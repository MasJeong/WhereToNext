# 한눈에 보기

- 세션 응답에서 `user.email`을 `?? ""`로 바꾸던 코드를 제거했다.
- memory와 DB 세션 읽기 경로에 대해 `null` email 회귀 테스트를 추가했다.

## 변경 사항

1. `src/lib/auth.ts`
2. `tests/unit/auth/session-storage-model.spec.ts`
3. `tests/unit/auth/session-db-mode.spec.ts`
