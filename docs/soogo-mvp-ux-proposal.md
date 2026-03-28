# 떠나볼래 MVP UX Proposal

Reference notes:
- `docs/uiux-style-guide.md`
- `docs/designus-reference-notes.md`

## 1. 서비스 한 줄 정의

떠나볼래는 아직 목적지를 정하지 못한 사용자가 몇 가지 여행 조건만 선택하면, 자신에게 맞는 해외 여행지를 빠르게 발견하고 추천 이유를 납득한 뒤 저장·비교까지 이어갈 수 있게 돕는 발견형 추천 서비스다.

## 2. 핵심 사용자와 JTBD

### 핵심 사용자
- 20대 후반~30대 초반 직장인
- 3박 4일 또는 4박 5일 해외여행을 계획 중
- 혼행, 커플, 친구/가족 동행 모두 가능하지만 목적지는 미정
- SNS에서 본 여행지는 많지만 “이번에 어디 갈지”를 결정하지 못한 상태

### 사용자의 목표
- 짧은 시간 안에 `후보 2~3개`로 압축하고 싶다.
- 왜 이 여행지가 맞는지 빠르게 이해하고 싶다.
- 여러 탭을 열지 않고 비교 후 결정하고 싶다.

### 사용자의 불안
- 예뻐 보여도 내 일정/예산에는 안 맞을 수 있다.
- 비행시간, 날씨, 치안, 이동 편의성 같은 현실 요소를 놓칠 수 있다.
- 비교를 하다 보면 후보만 늘어나고 결정은 못 할 수 있다.

### JTBD
- 내 일정과 예산, 동행 조건에 맞는 여행지를 빨리 발견하고,
- 왜 맞는지 납득한 뒤,
- 몇 개 후보만 비교해서 결정하고 싶다.

## 3. 전체 사용자 플로우

`홈(조건 시작) -> 추천 결과 -> 저장/비교 -> 상세 심화 검토(선택) -> 공유/재방문`

### 단계별 의사결정과 UX 역할

| 단계 | 사용자가 결정하는 것 | 마찰 | UX가 줄여야 하는 것 |
|---|---|---|---|
| 홈 | 이 서비스가 무엇을 해주는지 / 지금 시작할지 | 목적 이해 부족 | 5초 안에 추천형 서비스임을 이해시키기 |
| 홈 내 조건 선택 | 어떤 여행을 원하는지 | 입력 피로, 선택 과부하 | 3~5개의 고신호 질문으로 의도만 잡기 |
| 추천 결과 | 어떤 후보를 남길지 | 추천에 대한 불신 | 추천 이유 + 신뢰 신호를 먼저 보여주기 |
| 저장/비교 | 어떤 후보를 shortlist로 둘지 | 앱 밖에서 따로 비교해야 함 | 카드 저장 즉시 compare tray로 연결 |
| 상세 심화 검토 | 정말 이 후보가 맞는지 | 감성은 보이지만 판단 정보 부족 | 예산/비행/시즌/치안/대안 비교를 우선 제공 |
| 공유/재방문 | 나중에 다시 볼지, 함께 볼지 | 링크/상태 재현 불편 | 저장 링크, 비교 링크, immutable restore 제공 |

## 4. MVP 화면 목록

MVP는 5~6개 이내가 적절하다.

| 화면 | 존재 이유 |
|---|---|
| 홈 / 추천 시작 화면 | 서비스 목적 이해 + 조건 입력 시작 |
| 추천 결과 화면 | 상위 후보 발견 + 저장/비교 |
| 비교 보드 화면 | 후보 2~3개를 같은 기준으로 비교 |
| 여행지 상세 화면 | 선택형 심화 판단 |
| 저장/공유 복원 화면 | 저장한 카드/비교 보드 재확인 |
| 로그인/내 여행 기록 화면 | 여행 기억과 선호를 추천에 연결 |

### 중요한 구조 조정
- `홈`과 `조건 입력`은 분리된 2개 페이지가 아니라 `하나의 추천 시작 흐름`으로 설계한다.
- `상세`는 필수 단계가 아니라, 필요할 때만 들어가는 심화 검토 단계다.
- `저장/비교`는 결과 화면에서 바로 이어져야 하며, compare는 saved card에서 시작한다.

## 5. 화면별 상세 설계

### 5-1. 홈 / 추천 시작 화면

| 항목 | 내용 |
|---|---|
| 목적 | 서비스 목적을 즉시 이해시키고 추천 흐름을 시작시키기 |
| 사용자 핵심 질문 | 여기서 뭘 할 수 있지? |
| 주요 CTA | `내 여행 조건으로 추천 받기` |
| 핵심 컴포넌트 | 서비스 한 줄 정의, 빠른 intent chips, 단계형 조건 카드, 추천 방식 설명, 선택형 로그인 카드 |
| 배치 순서 | 서비스 정의 -> 대표 CTA -> 빠른 조건 chips -> 단계형 조건 입력 -> 추천 방식 설명 -> 선택형 로그인 |
| 제거 요소 | 대형 검색창, 여행지 카드 나열, 지도, 예약 배너 |

#### 왜 이 순서가 직관적인가
- 홈의 목표는 `탐색 시작`이다.
- 사용자는 목적지보다 먼저 `어떤 여행인지`를 정의한다.
- 추천 시작 전부터 여행지 카드가 나열되면 검색/피드 서비스처럼 보이게 된다.

#### Remove / Compress / Keep

| Remove | Compress | Keep |
|---|---|---|
| 대형 검색창, 여행지 카드 피드, 예약 배너 | 추천 방식 설명, 로그인 유도, 고급 조건 | 한 줄 정의, 대표 CTA, 빠른 intent chips, 핵심 질문 |

### 5-2. 추천 결과 화면

| 항목 | 내용 |
|---|---|
| 목적 | 후보를 빠르게 발견하고 저장/비교하게 만들기 |
| 사용자 핵심 질문 | 왜 이걸 추천했지? / 무엇을 남겨야 하지? |
| 주요 CTA | 카드별 `저장`, 하단 sticky tray의 `비교하기` |
| 핵심 컴포넌트 | 조건 요약, 상위 3개 추천 카드, 추천 이유, 신뢰 신호, 여행 정보, 분위기 참고, compare tray, 완화 액션 |
| 배치 순서 | 조건 요약 -> 상위 3개 카드 -> 추천 이유 -> 신뢰 신호 -> 여행 정보 -> 분위기 참고 -> 저장 -> sticky compare tray |
| 제거 요소 | 감성 피드형 카드 나열, 별점 위주 정보, 상단 광고 삽입 |

#### 왜 이 순서가 직관적인가
- 추천 결과 화면의 핵심 목표는 `후보를 남기는 것`이다.
- 감성은 사용자를 끌어오지만, 저장은 신뢰와 납득이 있어야 일어난다.
- 따라서 `why + trust + action` 순서가 중요하다.

#### Remove / Compress / Keep

| Remove | Compress | Keep |
|---|---|---|
| 카드형 피드식 장식, 상단 광고, 중복 공유 액션 | 분위기 참고, 체크할 점, 장문 추천 설명 | 한 줄 판정, 추천 이유, 신뢰 신호, 저장/비교 트레이 |

### 5-3. 비교 보드 화면

| 항목 | 내용 |
|---|---|
| 목적 | 후보 2~3개를 같은 기준으로 비교해 결정하게 만들기 |
| 사용자 핵심 질문 | 결국 어디가 제일 나와 맞지? |
| 주요 CTA | `이 후보 저장`, `공유하기` |
| 핵심 컴포넌트 | 목적지별 컬럼, 비교 기준 행, 차이 요약, 공유 CTA |
| 배치 순서 | 비교 제목 -> 비교 기준 행 -> 후보별 차이 -> 해석 요약 -> CTA |
| 제거 요소 | 이미지 중심 카드 나열형 비교, 예약 CTA, 광고 개입 |

#### 비교는 왜 `행 기준`이어야 하는가
- 카드형 비교는 보기엔 예쁘지만 실제 판단 속도가 느리다.
- 모바일에서는 특히 `예산 / 비행 / 시즌 / 분위기 / 체크할 점` 같은 행 기준 비교가 더 빠르다.

#### Remove / Compress / Keep

| Remove | Compress | Keep |
|---|---|---|
| 카드형 비교 감성 레이아웃, 광고, 예약 CTA | 상단 요약 카드, 분위기 설명 장문 | 행 기준 비교, 차이만 보기, verdict row, 공유 CTA |

### 5-4. 여행지 상세 화면

| 항목 | 내용 |
|---|---|
| 목적 | 최종 결정 전 판단 근거를 더 깊게 보여주기 |
| 사용자 핵심 질문 | 이 여행지가 진짜 내 일정과 예산에 맞나? |
| 주요 CTA | `저장하기`, `비교 보드에 담기` |
| 핵심 컴포넌트 | 한 줄 추천 정의, 추천 이유 3개, 예산/비행/시즌/치안/이동, 비슷한 대안 2~3개, 분위기 참고 |
| 배치 순서 | 한 줄 정의 -> 추천 이유 -> 판단 정보 -> 비슷한 대안 -> 분위기 참고 -> CTA |
| 제거 요소 | 장문 후기, 커뮤니티, 숙소/항공/투어 리스트 |

#### 상세는 왜 선택형이어야 하는가
- 추천형 서비스에서 모든 사용자가 상세를 거칠 필요는 없다.
- 상위 후보가 명확하면 결과 화면에서 바로 저장/비교하는 것이 더 빠르다.
- 상세는 `깊이 있게 확인하고 싶은 사용자`를 위한 선택형 단계다.

#### Remove / Compress / Keep

| Remove | Compress | Keep |
|---|---|---|
| 장문 후기, 커뮤니티, 예약 리스트 | 분위기 참고, 대안 설명 문단 | 예산, 비행, 시즌, 치안, 이동, 추천 이유, 저장/비교 |

### 5-5. 저장/공유 복원 화면

| 항목 | 내용 |
|---|---|
| 목적 | 저장한 카드나 비교 보드를 다시 보고 공유 가능하게 만들기 |
| 사용자 핵심 질문 | 내가 저장한 후보를 다시 볼 수 있나? |
| 주요 CTA | `다시 비교하기`, `새 조건으로 추천 받기` |
| 핵심 컴포넌트 | 복원된 카드/비교 보드, 추천 이유, 체크 포인트, 공유 링크 |
| 제거 요소 | 댓글, 좋아요, 피드 재노출 |

### 5-6. 로그인 / 내 여행 기록 화면

| 항목 | 내용 |
|---|---|
| 목적 | 여행 이력과 선호를 추천 엔진과 연결하기 |
| 사용자 핵심 질문 | 내 여행 기억을 남기면 뭐가 좋아지지? |
| 주요 CTA | `여행 기록 저장` |
| 핵심 컴포넌트 | repeat/balanced/discover, 방문한 목적지, 평점, 태그, 다시 가고 싶은지 여부 |
| 제거 요소 | 설정 중심 대시보드, 소셜/커뮤니티성 UI |

#### Remove / Compress / Keep

| Remove | Compress | Keep |
|---|---|---|
| 계정 설정 메뉴 트리, 프로필 꾸미기 요소 | 로그인 이유 설명, 과한 프로필 메타 | 여행 기억 입력, 선호 모드, 저장 피드백 |

## 6. 텍스트 기반 저충실도 와이어프레임

### 홈 / 추천 시작
```text
[상단]
- 떠나볼래 로고
- 한 줄 정의: 조건만 고르면, 아직 모르는 여행지를 추천해드려요

[본문]
- 대표 CTA: 내 여행 조건으로 추천 받기
- 빠른 intent chips
- 단계형 조건 선택 카드

[보조 정보]
- 추천은 이렇게 이뤄져요
- 로그인 없이 바로 사용 가능

[하단 CTA]
- 예시 조건으로 둘러보기
```

### 추천 결과
```text
[상단]
- 현재 조건 요약
- 조건 수정

[본문]
- 추천 카드 1
- 추천 카드 2
- 추천 카드 3

[보조 정보]
- 더 보기
- 조건 완화 액션

[하단 CTA]
- sticky compare tray
- 2개 저장하면 비교할 수 있어요
```

### 비교 보드
```text
[상단]
- 비교 중인 후보 수
- 비교 제목

[본문]
- 비교 기준 행
  - 추천 이유
  - 예산
  - 비행 부담
  - 추천 시기
  - 분위기
  - 체크할 점

[보조 정보]
- 어떤 후보가 누구에게 더 맞는지 요약

[하단 CTA]
- 공유하기
- 다른 후보 더 보기
```

### 여행지 상세
```text
[상단]
- 여행지명
- 한 줄 정의

[본문]
- 추천 이유
- 판단 정보(예산/비행/시즌/치안/이동)
- 비슷한 대안

[보조 정보]
- 분위기 참고

[하단 CTA]
- 저장하기
- 비교 보드에 담기
```

### 내 여행 기록
```text
[상단]
- 내 여행 기억
- 선호 모드

[본문]
- 새 여행 기록 추가
- 기존 여행 기록 목록

[보조 정보]
- 다음 추천에 반영돼요

[하단 CTA]
- 여행 기록 저장
```

## 7. AI 추천 UX 설계

### 추천 질문 단계
MVP는 `3~5개 핵심 질문 + 결과 후 미세 조정`이 적절하다.

추천 질문:
1. 여행 기간
2. 동행인
3. 예산 감각
4. 휴양/도시/자연/미식 등 핵심 성향
5. 비행 부담

선택형 추가:
- 출발 공항
- repeat / balanced / discover 선호

### 질문 수를 최소화하면서 품질을 확보하는 방법
- 처음부터 모든 조건을 다 물으면 검색형 폼이 된다.
- 따라서 `고신호 변수만 먼저` 받고,
- 결과 이후 `더 따뜻하게`, `더 저렴하게`, `더 짧게`, `더 한적하게` 같은 후속 refinement를 제공한다.

### 추천 결과 카드에 꼭 들어갈 정보
- 목적지 이름
- 한 줄 추천 정의
- 왜 추천했는지 1~2문장
- 신뢰 신호 3~4개
- 예산 감각
- 비행 거리/시간 감각
- 추천 시기
- 체크할 점
- 분위기 참고
- 저장 CTA

### 추천 결과 카드에 기본으로 보여주지 말아야 할 정보
- 장문 소개 문단
- 3개 이상 watch-out 카드
- 분위기 참고의 긴 설명
- 공유/복사 같은 2차 액션
- 점수 해석 없이 수치만 강조한 시각 요소

### 추천 근거를 신뢰감 있게 보여주는 방법
- 문장형 이유를 먼저 노출
- 그 다음 정량 신호를 붙인다
  - 점수
  - 시즌 적합도
  - 비행 적합도
  - 근거 출처
  - 근거 수

예시 문장:
- `4박 5일 일정에 비행 부담이 적어요.`
- `10월 여행 기준으로 날씨와 이동감이 안정적이에요.`
- `커플 여행에서 야경과 식사 만족도가 높은 편이에요.`

### 대안 여행지 비교 UX
- 저장 즉시 compare tray에 축적
- 2개 저장되면 `지금 비교하기` 강조
- 비교 화면에서는 숫자 나열보다 차이 설명을 함께 제공

예시:
- `도쿄는 일정 밀도가 높고, 후쿠오카는 피로가 적어요.`
- `발리는 분위기가 강하고, 다낭은 예산 효율이 좋아요.`

## 8. 정보 구조(IA)

### 홈 우선순위
1. 서비스 목적
2. 추천 시작 CTA
3. 빠른 intent chips
4. 추천 방식 설명
5. 선택형 로그인 안내

### 추천 결과 우선순위
1. 조건 요약
2. 상위 3개 추천
3. 추천 이유
4. 신뢰 신호
5. 저장/비교
6. 분위기 참고
7. 더 보기 / 완화

### 상세 우선순위
1. 한 줄 정의
2. 추천 이유
3. 판단 정보
4. 대안 비교
5. 분위기 참고
6. 저장/비교

## 9. 상태 설계

### 로딩 상태
- skeleton 카드 3개
- `조건에 맞는 목적지를 고르고 있어요`

### 추천 결과 없음
- dead-end 문구 금지
- 즉시 실행 가능한 완화 액션 제공
  - 일정 늘리기
  - 비행 범위 넓히기
  - 출발 월 바꾸기
  - 보조 분위기 제거

### 조건이 너무 넓은 경우
- 결과를 많이 던지지 않고
- 상위 3개 + `더 선명하게 좁히기` 액션 제공

### 저장 전/후 상태
- 저장 전: `저장하기`
- 저장 후: `저장됨`
- 2개 이상 저장 시 compare tray 활성화

### 오류 상태
- 사용자 탓 금지
- 구조: `무슨 일이 있었는지 + 다음 액션 1개`

## 10. MVP / 추후 확장 구분

### MVP에 반드시 필요한 것
- 익명 추천
- intent 기반 조건 입력
- 상위 3개 추천
- 추천 이유
- 신뢰 신호
- 저장/비교
- 여행지 상세 판단 정보
- 선택형 로그인 + 여행 기록 반영

### 나중에 넣어도 되는 것
- 지도
- 일정 planner
- 예약 연결
- 친구 초대
- 후기/리뷰 피드
- 실시간 가격 추적
- AI 챗 대화형 상담

### 지금 넣으면 오히려 해로운 것
- 검색창 중심 홈
- 첫 화면 목적지 카드 나열
- 예약 CTA 전면 노출
- 광고 삽입
- 과한 감성 캐러셀

## 11. 왜 이 구조가 적절한가

### 왜 직관적인가
- 사용자의 실제 결정 순서와 화면 순서가 같다.
- `조건 정의 -> 후보 발견 -> 이유 납득 -> 비교 -> 저장`으로 흐름이 끊기지 않는다.

### 왜 추천형 서비스에 맞는가
- 검색형 UX는 사용자가 무엇을 찾는지 이미 아는 상황에 강하다.
- 떠나볼래 사용자는 `어디 갈지 모르는 상태`에서 들어온다.
- 따라서 검색/예약형 구조를 가져오면 본질적으로 맞지 않는다.

### 사용자의 의사결정을 어떻게 줄여주는가
- 후보 수를 먼저 압축한다.
- 추천 이유를 짧게 제공한다.
- 비교 기준을 구조화한다.
- 저장/비교를 같은 흐름 안에서 해결한다.

## 12. 개발 handoff

### 프론트엔드 주요 컴포넌트
- `HeroIntro`
- `IntentChipGroup`
- `GuidedConditionSteps`
- `RecommendationCard`
- `TrustSignalGrid`
- `MoodEvidenceBlock`
- `SavedCompareTray`
- `CompareBoard`
- `DetailDecisionPanel`
- `EmptyStateRelaxActions`
- `AuthPromptCard`
- `TravelMemoryForm`
- `TravelMemoryEntryCard`

### 백엔드/API에서 필요한 필드 예시

#### recommendation query
- `partyType`
- `partySize`
- `budgetBand`
- `tripLengthDays`
- `departureAirport`
- `travelMonth`
- `pace`
- `flightTolerance`
- `vibes`
- `explorationPreference` (optional)

#### recommendation result
- `destinationId`
- `nameKo`
- `nameEn`
- `summary`
- `whyThisFits`
- `reasons[]`
- `scoreBreakdown`
- `confidence`
- `bestMonths`
- `budgetBand`
- `flightBand`
- `watchOuts[]`
- `trendEvidence[]`

#### compare
- `snapshotIds[]`
- `destinationIds[]`
- `budget`
- `flight`
- `bestMonths`
- `vibes`
- `whyThisFits`
- `watchOuts`
- `moodSummary`

#### user memory
- `destinationId`
- `rating`
- `tags[]`
- `wouldRevisit`
- `visitedAt`

### 재사용 구조로 만들면 좋은 부분
- 카드 공통 블록
  - 신뢰 신호
  - 여행 정보
  - 체크할 점
  - 분위기 참고
- 상태 컴포넌트
  - loading
  - empty
  - error
- CTA variants
  - primary
  - secondary
  - compare
- 저장/비교 state management
- 레이블/문구 포맷터

## 13. 화면별 제거/압축 실행 규칙

### Home
- first viewport group count: `3` main groups max
- optional sections: collapsed or below the fold
- login prompt: informational, not competitive with the main CTA

### Recommendation Result
- top 3 cards only by default
- each card: `verdict + reasons + trust + action` first
- mood evidence and deep caution: progressive disclosure

### Compare
- mobile default: 2 columns at a time
- differences-only: on by default
- verdict row: always visible even when other rows are hidden

### Detail
- only opened when the user needs confirmation
- should not become a content rabbit hole

## 14. Color application examples

| UI element | Recommended role | Why |
|---|---|---|
| 홈 대표 CTA | `action-primary` | user should know what to do first instantly |
| 선택된 intent chip | `selected-state` | current choice, not global action |
| 추천 카드 verdict box | `decision-highlight` | priority interpretation, not a button |
| trust signal card | `trust-info` | informational, calm, readable |
| 분위기 참고 카드 | muted `surface-elevated` + restrained accent | supporting inspiration only |
| 체크할 점 | `warning` | caution without looking destructive |
| 오류 메시지 | `error` | only for failed or blocked states |

## 13. 화면-컴포넌트-상태 매핑

### 13-1. 화면별 low-fi wireframe 요약

| 화면 | 핵심 목표 | 주 CTA | 꼭 보여야 하는 것 | 절대 앞에 두지 말아야 할 것 |
|---|---|---|---|---|
| 홈 / 추천 시작 | 서비스를 이해시키고 추천 흐름 시작 | `내 여행 조건으로 추천 받기` | 한 줄 정의, intent chips, 단계형 조건 시작 | 검색창, 목적지 카드 나열 |
| 추천 결과 | 후보 2~3개를 남기게 만들기 | `저장`, `비교하기` | 추천 이유, 신뢰 신호, 저장/비교 트레이 | 감성 이미지 중심 피드 |
| 비교 보드 | 최종 의사결정 | `공유하기`, `다른 후보 더 보기` | 기준 행 비교, 차이 요약 | 광고, 예약 CTA |
| 여행지 상세 | 선택형 심화 판단 | `저장하기`, `비교 보드에 담기` | 예산/비행/시즌/대안 비교 | 장문 후기/커뮤니티 |
| 저장/복원 | 저장한 후보 다시 보기 | `다시 비교하기` | 복원된 카드/보드, 추천 이유, 링크 | 추천 피드 재노출 |
| 내 여행 기록 | 취향 데이터를 추천에 연결 | `여행 기록 저장` | 선호 모드, 평점, 태그, 재방문 의사 | 설정 메뉴형 UI |

### 13-2. 화면별 프론트엔드 컴포넌트 매핑

| 화면 | 핵심 컴포넌트 | 재사용 가능 컴포넌트 | 비고 |
|---|---|---|---|
| 홈 / 추천 시작 | `HeroIntro`, `IntentChipGroup`, `GuidedConditionSteps`, `AuthPromptCard` | `SectionLabel`, `PrimaryCTA`, `SecondaryCTA`, `ChoiceChip` | 홈과 조건 입력은 같은 흐름으로 유지 |
| 추천 결과 | `RecommendationCard`, `TrustSignalGrid`, `MoodEvidenceBlock`, `SavedCompareTray`, `EmptyStateRelaxActions` | `MetaPill`, `SaveButton`, `CompareAction`, `StatusBadge` | 결과 화면이 저장/비교의 출발점 |
| 비교 보드 | `CompareBoard`, `CompareRow`, `DifferenceSummary` | `CompareValueCell`, `CompareHeaderCell`, `ShareAction` | 모바일은 2-up 비교 기준 |
| 여행지 상세 | `DetailDecisionPanel`, `AlternativeDestinationList`, `MoodEvidenceBlock` | `TrustSignalGrid`, `InfoFactGrid`, `DecisionCTAGroup` | 필수 단계 아님 |
| 저장/복원 | `SavedCardRestore`, `SavedCompareRestore` | `RecommendationCard`, `CompareBoard`, `ImmutableStateBanner` | 추천/비교 화면을 재사용 |
| 내 여행 기록 | `TravelMemoryForm`, `TravelMemoryEntryCard`, `PreferenceModeSelector` | `ChoiceChip`, `FieldHint`, `InlineError`, `FormCTA` | 계정보다 기억 중심 구조 |

### 13-3. 화면별 상태 매핑

| 화면 | 클라이언트 상태 | 서버 데이터 | 꼭 필요한 상태 처리 |
|---|---|---|---|
| 홈 | 선택된 조건, 단계 진행, submit 가능 여부 | 없음 또는 사용자 세션 요약 | 초기 상태, 진행 중, submit disabled |
| 추천 결과 | 저장 상태, compare selection, refinement actions | 추천 결과, source summary | loading, empty, save success, compare enabled |
| 비교 보드 | differences only, 공유 상태 | compare snapshot payload | loading, invalid compare, restore failure |
| 상세 | 저장 여부, 비교 담기 상태 | recommendation snapshot or destination detail payload | loading, fallback detail, restore-safe failure |
| 저장/복원 | 없음 또는 최소 UI state | recommendation/comparison snapshot | not found, immutable restore failure |
| 내 여행 기록 | 입력 draft, preference selection, history CRUD 상태 | profile, history entries | unauthorized, save success, validation error |

### 13-4. 화면별 이벤트와 전이

| 시작 상태 | 사용자 액션 | 다음 상태 | UX 메모 |
|---|---|---|---|
| 홈 idle | CTA 클릭 | 조건 선택 진행 | 시작점은 항상 하나여야 함 |
| 조건 입력 중 | 조건 선택 완료 | 추천 로딩 | 중간 저장보다 즉시 추천이 우선 |
| 추천 결과 | 저장 클릭 | saved state + compare tray 갱신 | 저장은 결과 화면 내에서 끝나야 함 |
| 추천 결과 | 비교하기 | 비교 보드 이동 | 2개 이상일 때만 활성 |
| 추천 결과 empty | 완화 액션 클릭 | 재추천 로딩 | dead-end 금지 |
| 상세 | 저장/비교 클릭 | saved or compare | 상세는 결정 보조 단계 |
| 내 여행 기록 | 기록 저장 | history list 갱신 | 추천 개인화와 연결되는 피드백 필요 |

## 14. 구현 우선순위

### Phase 1. 추천 시작 흐름 정리
- 홈과 조건 입력을 한 흐름으로 정리
- 첫 화면의 목적 이해와 첫 CTA를 가장 먼저 개선
- 검색형 인상을 주는 요소 제거

### Phase 2. 추천 결과 강화
- 카드 내 `추천 이유 -> 신뢰 신호 -> 여행 정보 -> 저장` 구조 고정
- 상위 3개 + 더 보기 + 완화 액션 정교화
- compare tray를 결과 화면의 핵심 요소로 승격

### Phase 3. 비교 보드 재설계
- 카드형 비교가 아니라 행 기준 decision board로 재구성
- 모바일 2-up 비교와 differences-only 토글 설계

### Phase 4. 상세와 저장/복원 정리
- 상세를 선택형 심화 단계로 정리
- 저장/공유 복원 화면은 판단 정보 재확인용으로 간소화

### Phase 5. 로그인 / 여행 기억 화면 정리
- 로그인은 보조 흐름으로 유지
- 여행 기억 입력/수정/삭제의 피드백과 개인화 연결 가시화

## 15. 구현 handoff 체크리스트

### 프론트엔드 체크리스트
- 홈은 `단일 핵심 CTA`만 유지되는가?
- 추천 결과는 카드당 `추천 이유`가 최상단에 가까운가?
- compare tray가 모바일 엄지 영역에 자연스럽게 닿는가?
- empty state가 dead-end가 아니라 재시도 흐름인가?
- 상세가 필수 이동 단계처럼 작동하지 않는가?

### 백엔드/API 체크리스트
- recommendation payload에 `왜 추천했는지`와 `신뢰 근거`가 충분한가?
- compare payload가 행 기준 비교에 필요한 값을 다 주는가?
- snapshot restore가 immutable 원칙을 지키는가?
- history/profile 데이터가 추천 개인화와 일관되게 연결되는가?

### 디자인/카피 체크리스트
- 한국어 우선 카피인가?
- “예쁘다”보다 “결정에 도움 된다”가 먼저 보이는가?
- 감성 레이어가 신뢰 레이어를 덮지 않는가?
- 광고/파트너 배치가 핵심 추천 흐름을 방해하지 않는가?

## Final judgment

떠나볼래는 `트리플/트립닷컴/토스처럼 직관적`이어야 하지만,
그 서비스들처럼 검색이나 예약을 첫 화면 주인공으로 두면 안 된다.

떠나볼래의 정답은:
- 강한 검색창이 아니라 `빠른 의도 입력`
- 많은 카드 나열이 아니라 `상위 3개 추천`
- 감성 소개가 아니라 `추천 이유 + 신뢰 신호`
- 긴 탐색이 아니라 `저장 -> 비교 -> 결정`

즉, 떠나볼래는 `예쁜 피드`가 아니라 `설명 가능한 발견 + 비교` 서비스로 설계돼야 한다.
