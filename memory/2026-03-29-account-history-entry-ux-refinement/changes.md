# 한눈에 보기

- 여행 기록 카드에서 바로 `수정`으로 들어갈 수 있게 했다.
- 기록 추가/수정 step에 빠른 선택과 자동 진행을 넣어 입력 부담을 줄였다.

## 변경 내용

### 1. 수정 진입 추가

- `src/components/trip-compass/account-experience.tsx`의 여행 기록 카드에 `수정` 버튼을 추가했다.
- `src/app/account/history/[historyId]/edit/page.tsx`를 만들어 기존 기록을 같은 step UI로 수정할 수 있게 했다.
- `src/lib/profile/service.ts`에 단건 조회용 `readUserDestinationHistory`를 추가했다.

### 2. step 등록 UX 가속화

- `src/components/trip-compass/account-history-create-experience.tsx`를 생성/수정 겸용으로 바꿨다.
- 목적지는 빠른 추천 chips를 눌러 바로 고를 수 있게 했다.
- 날짜는 `오늘`, `1주 전`, `1달 전` 빠른 제안을 넣었다.
- 평점은 고르는 즉시 다음 단계로 넘어가게 해 클릭 수를 줄였다.
- 단계 상단에 요약 chip을 두어 필요한 단계로 바로 점프할 수 있게 했다.
- 메모는 바로 쓸 수 있는 제안 문구를 추가했다.

### 3. 테스트 보강

- 여행 기록 생성 후 리스트에서 수정 진입, 메모 수정, 저장 후 반영까지 e2e를 추가했다.
