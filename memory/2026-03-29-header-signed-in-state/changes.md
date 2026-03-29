# 한눈에 보기

- 로그인 후 헤더에 `이름 + 이니셜 + 로그인됨` profile chip을 추가했다.
- `로그아웃`은 주 행동이 아니라 보조 액션으로 정리했다.

## 변경 내용

### 1. 로그인 상태 시각화

- `src/components/trip-compass/shell-auth-nav.tsx`에서 로그인 사용자를 위한 profile chip을 추가했다.
- chip 안에는 사용자 이니셜, 사용자 이름, `로그인됨` 라벨을 넣었다.
- 계정 진입은 profile chip과 `내 여행 기록` 링크로 명확하게 분리했다.

### 2. 액션 위계 정리

- 로그인 전에는 `로그인` primary CTA를 유지한다.
- 로그인 후에는 `로그아웃`을 secondary 버튼으로 내려 현재 상태 확인이 먼저 읽히도록 조정했다.

### 3. 테스트 보강

- `tests/e2e/auth/social-login.spec.ts`에 로그인 후 `identity-card`가 보이고 `로그인됨` 텍스트가 표시되는지 검증을 추가했다.
