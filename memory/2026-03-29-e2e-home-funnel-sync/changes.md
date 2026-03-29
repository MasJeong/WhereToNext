# 한눈에 보기

- 홈 5단 질문 퍼널에 맞춰 세 e2e 파일의 클릭 순서를 다시 맞췄다.
- 핵심 수정은 `여행 스타일 선택 후 home-step-next`를 거치게 만든 것이다.

## 변경 내용

### 1. 인증 저장 재개 e2e 정렬
- `tests/e2e/auth/social-login.spec.ts`
- `submitQuickRecommendation`에서 여행 스타일 선택 뒤 `home-step-next`를 추가했다.

### 2. iOS 획득 플로우 e2e 정렬
- `tests/e2e/ios-acquisition-flow.spec.ts`
- 저장/복원과 비교 보드 테스트가 현재 퍼널과 같은 순서로 결과 화면에 도달하도록 수정했다.

### 3. 추천 플로우 예외 케이스 정렬
- `tests/e2e/recommendation-flow.spec.ts`
- 빈 상태 복구, 재시도 테스트에 같은 `home-step-next` 단계를 반영해 실제 추천 요청이 마지막 단계 뒤에 나가도록 맞췄다.
