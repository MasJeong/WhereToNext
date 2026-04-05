# 한눈에 보기

- 세션 응답에서 `null` 이메일을 빈 문자열로 바꾸지 않도록 정리한다.
- memory / database 경로 모두에서 nullable user email 계약을 유지한다.

## 계획

1. `src/lib/auth.ts`의 세션 조회/발급 응답을 점검한다.
2. memory와 DB 경로에서 `user.email`이 `null`일 때 그대로 유지되도록 고친다.
3. 회귀 테스트로 nullable email 세션 응답을 고정한다.
