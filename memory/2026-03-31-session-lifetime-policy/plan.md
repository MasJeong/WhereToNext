# 한눈에 보기

- web / ios-shell 세션 수명을 분리하고, legacy 세션은 기존 `expiresAt`까지만 유지하도록 롤아웃 정책을 구현했다.
- 발급, 읽기, refresh, auth route, fallback store 검증 범위를 한 묶음으로 정리했다.

# session-lifetime-policy 구현 계획 결과

- 완료 범위
  - 발급 시점 policy stamp 통합
  - DB/local/memory session lifetime metadata 확장
  - idle + absolute expiry read enforcement
  - throttled sliding refresh + `/api/auth/session` cookie sync
  - trusted shell origin 기반 shell issuance
  - legacy grandfathering / fallback store 회귀 테스트

- 롤아웃 원칙
  - legacy session: 기존 `expiresAt`까지만 유효, sliding 없음
  - new web session: idle 14d / absolute 90d
  - new ios-shell session: idle 30d / absolute 180d
