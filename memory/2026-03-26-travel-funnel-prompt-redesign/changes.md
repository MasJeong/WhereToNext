# 여행 퍼널 프롬프트 리디자인 변경 사항

## 변경한 파일
- `package.json`
- `package-lock.json`
- `src/app/globals.css`
- `src/components/trip-compass/home-experience.tsx`
- `src/components/trip-compass/home/landing-page.tsx`
- `src/components/trip-compass/home/hero-animation.tsx`
- `src/components/trip-compass/home/step-question.tsx`
- `src/components/trip-compass/home/progress-bar.tsx`
- `src/components/trip-compass/home/result-page.tsx`
- `src/components/trip-compass/experience-shell.tsx`

## 변경 내용
- 홈 퍼널을 더 엄격한 흰색 중심 레이아웃으로 재작업했고, 홈페이지 퍼널에서는 app shell 상단 header/topbar를 숨겼다.
- 랜딩을 중앙 정렬 headline, 짧은 보조 문장, 대표 비주얼, 단일 주요 CTA로 단순화했다.
- 질문 화면을 여유 있는 화면당 질문 1개 흐름으로 단순화했고, 간결한 progress bar와 선택 즉시 다음 단계로 넘어가는 동작을 적용했다.
- 결과 표현을 재구성해 대표 목적지가 페이지를 이끌고, 보조 추천은 더 단순한 목록 형태로 아래에 배치되게 했다.
- 대표 결과 영역의 과한 설명 밀도를 줄이기 위해 무거운 reason/evidence/day-flow 묶음을 더 짧은 메모+액션 블록으로 교체했다.
- 플랫폼 typography 가이드를 검토한 뒤 랜딩, 질문, 결과 단계 전반의 mobile-first 글자 크기 체계를 다듬었고, 퍼널 시작 화면에서 과도하게 큰 heading을 쓰지 않게 했다.
- recommendation fetching, snapshot 저장/공유, compare 생성, fallback 카피 흐름, test-id 연결은 유지했다.
- 회귀 검증에서 계약 불일치가 드러난 뒤 e2e에 보이는 라벨(`공유 페이지 보기`, `Day-flow`)을 정확히 복원했다.
- `framer-motion`을 추가하고 랜딩, 질문, 결과, 대표 비주얼, progress bar에 최소한의 reduced-motion-aware transition을 연결했다.
- `home-experience.tsx`에 request invalidation guard를 추가해 restart/reopen 액션 후 오래된 recommendation 응답이 더 새로운 상태를 덮어쓰지 못하게 했다.
- `globals.css`에서 퍼널 색상 토큰을 더 엄격한 흰색 중심 표현으로 조정했다.

## 리뷰 메모
- Oracle review는 이번 리디자인의 구조가 타당하다고 봤고, 모션, 흰색 중심 스타일링, 오래된 async 응답 처리에서 프롬프트 정합성 차이를 지적했다.
- 그 차이는 최종 검증 전에 모두 보완했다.
