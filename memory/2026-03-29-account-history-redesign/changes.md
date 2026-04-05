# 한눈에 보기

- 계정 메인을 `여행 기록 / 저장한 추천 / 추천 모드` 탭 구조로 다시 만들었다.
- `기록 추가`는 `/account/history/new` 별도 화면으로 분리했고, step 방식과 이미지 업로드를 붙였다.
- 여행 기록 데이터에 `memo`, `image`를 추가했다.

## 변경 내용

### 1. 계정 메인 구조 재설계

- `src/components/trip-compass/account-experience.tsx`를 리스트 중심 레이아웃으로 다시 작성했다.
- 첫 화면은 여행 기록 리스트가 기본이고, `기록 추가` CTA를 상단에 배치했다.
- 저장한 추천은 별도 탭으로, 추천 모드는 또 다른 탭으로 분리했다.

### 2. 기록 추가 화면 분리

- `src/app/account/history/new/page.tsx`를 추가했다.
- `src/components/trip-compass/account-history-create-experience.tsx`에서 6단계 step 입력을 구현했다.
- 순서는 `여행지 -> 날짜 -> 평점 -> 해시태그 -> 이미지 -> 메모`다.
- 이미지 업로드는 단일 대표 사진 1장 기준으로 처리하고, 2MB 제한과 미리보기를 넣었다.

### 3. 데이터 계약과 저장 구조 확장

- `src/lib/domain/contracts.ts`에 여행 기록용 `image`, `memo`를 추가했다.
- `src/lib/db/schema.ts`에 `user_destination_history.memo`, `user_destination_history.image` 컬럼을 추가했다.
- `src/lib/profile/service.ts`가 새 필드를 로컬 스토어, 메모리 스토어, DB 모두에서 읽고 쓰도록 맞췄다.
- Drizzle migration `drizzle/0005_sweet_spacker_dave.sql`을 생성했다.

### 4. 테스트 조정

- `tests/e2e/recommendation-flow.spec.ts`에서 로그인 후 기록 추가 step과 저장한 추천 탭 흐름을 새 구조에 맞게 업데이트했다.
- `src/lib/test-ids.ts`에 계정 탭/step/이미지/메모 관련 selector를 추가했다.
