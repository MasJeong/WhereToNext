# 한눈에 보기

- 홈 퍼널은 `stage`, `step`, 질문 응답 query를 주소와 동기화하도록 바꿨다.
- 인증 우회와 계정 탭도 URL 기반 복귀 흐름으로 정리했다.

## 변경 내용

### 1. 인증 우회 복귀 수정
- `src/components/trip-compass/auth-experience.tsx`
- `로그인 없이 계속 보기`가 무조건 `/`로 가지 않고, 안전한 상대 경로 `next`가 있으면 그 위치로 복귀하도록 바꿨다.

### 2. 헤더 중복 정리
- `src/components/trip-compass/experience-shell.tsx`
- `src/components/trip-compass/shell-auth-nav.tsx`
- `src/components/trip-compass/shell-primary-nav.tsx`
- 비로그인 상태에서 인증 영역의 중복 `내 여행` 링크를 제거하고, 주요 메뉴의 `추천 받기`는 질문 시작 URL로 직접 연결되게 맞췄다.

### 3. 홈 퍼널 URL 동기화
- `src/components/trip-compass/home-experience.tsx`
- 홈 질문 퍼널에 `stage`, `step`, `whoWith`, `travelWindow`, `tripLength`, `travelStyle`, `flightPreference`를 반영했다.
- 질문 진행, 뒤로 가기, 다시 시작, 결과 도착, 저장 후 복귀 시 URL과 내부 상태가 어긋나지 않도록 보정 로직을 추가했다.

### 4. 질문 기본값 제거
- `src/components/trip-compass/home-experience.tsx`
- 초기 응답을 빈 상태로 두고, URL 복원 시에도 실제로 선택된 값만 반영되게 수정했다.

### 5. 계정 탭 URL 동기화
- `src/components/trip-compass/account-experience.tsx`
- 탭 클릭 시 `?tab=`를 갱신하고, 초기 탭 prop이 바뀌면 클라이언트 state도 다시 맞추도록 정리했다.

### 6. 회귀 테스트 보강
- `tests/e2e/smoke.spec.ts`
- `tests/e2e/recommendation-flow.spec.ts`
- `tests/e2e/account-future-trips.spec.ts`
- `tests/unit/ui/account-future-trips.spec.tsx`
- `tests/unit/ui/account-history-gallery.spec.tsx`
- `tests/unit/ui/future-trip-result-cta.spec.tsx`
- `tests/unit/auth/oauth-callback-shell.spec.ts`
- URL 동기화, 인증 우회 복귀, 저장 후 결과 유지, 계정 탭 복귀를 검증하도록 테스트를 맞췄다.
