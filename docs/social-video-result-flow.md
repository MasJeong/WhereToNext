# 추천 결과 화면 YouTube 처리 흐름

## 한눈에 보기

- 추천 결과 1위 카드에는 YouTube 영상을 최대 3개까지 붙입니다.
- `메인 1개 + 서브 2개` 구조이며, 메인은 설명력과 관련성을 가장 우선합니다.
- 백엔드는 YouTube `search.list`로 후보를 모으고, `videos.list`로 상세 메타데이터를 붙인 뒤 점수화합니다.
- 프런트는 `/api/social-video` 응답에서 `items`를 받아 큰 카드 1개와 작은 카드 2개로 렌더합니다.
- 확신 높은 영상이 없으면 `fallback` 또는 `empty`로 내려가고, 화면은 빈 슬롯 또는 대체 안내를 유지합니다.

## 1. 어디서 시작되는가

추천 결과 화면의 1위 카드에서 [social-video-panel.tsx](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/social-video-panel.tsx)가 `/api/social-video`를 호출합니다.

호출에 포함되는 값은 아래와 같습니다.

- `destinationId`
- 추천 쿼리 전체
  - 동행 유형
  - 예산
  - 여행일 수
  - 출발 공항
  - 여행 월
  - pace
  - 비행 허용치
  - vibes
- 리드 추천 이유를 기반으로 만든 `leadEvidence`

이 값은 프런트에서 `buildSocialVideoSearchParams()`로 조합합니다.

## 2. API에서 무엇을 하는가

API 진입점은 [route.ts](/Users/jihun/Desktop/study/project/SooGo/src/app/api/social-video/route.ts)입니다.

처리 순서는 아래와 같습니다.

1. 쿼리 문자열을 `parseSocialVideoQuery()`로 검증합니다.
2. `destinationId`가 실제 카탈로그에 있는지 확인합니다.
3. 요청 키를 만들어 메모리 캐시를 먼저 조회합니다.
4. 캐시가 없으면 `getLeadSocialVideoResult()`를 호출합니다.
5. 결과를 `socialVideoResponseSchema`로 검증한 뒤 JSON으로 반환합니다.

캐시 정책은 아래와 같습니다.

- 서버 메모리 캐시 TTL: `10,800초` = 3시간
- 응답 헤더도 `s-maxage=10800`, `stale-while-revalidate=86400`를 사용합니다.

## 3. YouTube 후보를 어떻게 찾는가

핵심 로직은 [service.ts](/Users/jihun/Desktop/study/project/SooGo/src/lib/social-video/service.ts)에 있습니다.

### 3-1. 검색어 생성

`buildSocialVideoSearchQueries()`가 목적지 이름, 국가명, 분위기, 리드 근거 키워드를 이용해 검색어를 만듭니다.

예시 성격은 아래와 같습니다.

- `도쿄 여행 브이로그`
- `도쿄 여행 쇼츠`
- `도쿄 한국인 여행`
- `도쿄 로맨틱 여행`
- `Tokyo travel vlog`
- `Japan travel guide`

특징은 아래와 같습니다.

- 한국어 쿼리를 먼저 둡니다.
- 영어 쿼리도 일부 섞습니다.
- 추천 이유에서 뽑은 키워드 최대 2개를 추가합니다.
- 중복 검색어는 제거합니다.
- 최종 검색어 수는 최대 8개입니다.

### 3-2. YouTube API 호출

현재 쓰는 YouTube Data API v3 메서드는 2개입니다.

- `search.list`
  - 후보 영상을 찾는 1차 검색
- `videos.list`
  - 찾은 영상의 길이, 통계, 공개 상태 같은 상세 메타데이터 조회

검색은 두 번 나뉩니다.

- `relevance` 검색
  - 목적지와 추천 맥락에 가장 잘 맞는 영상을 먼저 모읍니다.
- `date` 검색
  - 최근 30일 이내 업로드 영상을 별도로 보강합니다.

현재 구현 기준으로는 아래처럼 동작합니다.

- 모든 검색어에 대해 `order=relevance`
- 앞쪽 일부 검색어에 대해 `order=date + publishedAfter=최근 30일`

## 4. 검색 결과를 어떻게 후보로 바꾸는가

`hydrateCandidatesFromYouTube()`가 `search.list`와 `videos.list` 결과를 합쳐 내부 후보 형식으로 정리합니다.

후보에 담기는 주요 값은 아래와 같습니다.

- `videoId`
- `title`
- `channelTitle`
- `channelId`
- `videoUrl`
- `thumbnailUrl`
- `durationSeconds`
- `description`
- `publishedAt`
- `viewCount`
- `likeCount`
- `commentCount`
- `languageHint`

제외 조건도 있습니다.

- `videoId`가 없으면 제외
- 제목/채널명이 없으면 제외
- 썸네일이 없으면 제외
- `privacyStatus === "private"`면 제외

## 5. 메인 영상을 어떻게 고르는가

메인 선정의 기본 원칙은 아래입니다.

- 가장 먼저 보여줄 가치가 있는가
- 추천 결과를 가장 잘 설명하는가
- 한국 사용자에게 맥락이 맞는가
- 너무 짧거나 너무 산만하지 않은가

점수는 `scoreSocialVideoCandidate()`에서 계산합니다.

### 5-1. 점수 구성

점수 축은 아래 5개입니다.

- `destinationRelevance`
  - 목적지명, 국가명, 분위기, 리드 근거 키워드가 제목/설명/채널명과 얼마나 맞는지
- `koreanSignals`
  - 한글 제목/설명/채널명, `ko` 언어 힌트, 한국 제작 신호
- `freshness`
  - 업로드 시점이 얼마나 최근인지
- `engagementQuality`
  - 조회수 원값이 아니라 게시 후 반응 밀도 기준으로 계산
- `durationPreference`
  - 추천 결과 상단에서 보기 좋은 영상 길이인지

### 5-2. 메인 선정 철학

메인은 단순히 `조회수 최대`로 고르지 않습니다.

이유는 아래와 같습니다.

- Shorts/짧은 영상은 조회수만 높고 설명력은 낮을 수 있음
- 오래된 대형 영상은 반응이 많아도 지금 추천 맥락과 안 맞을 수 있음
- 목적지 관련성이 약한 일반 여행 채널 영상이 섞일 수 있음

그래서 현재 로직은 사실상 아래 우선순위에 가깝습니다.

1. 목적지 관련성
2. 한국 사용자 적합성
3. 반응 품질
4. 최근성
5. 길이 적합성

최종 정렬도 이 순서를 반영합니다.

## 6. 서브 2개는 어떻게 고르는가

서브 영상은 `selectSocialVideoCandidates()`에서 고릅니다.

구조는 아래와 같습니다.

1. 메인 1개를 먼저 고릅니다.
2. 최근 30일 내 영상 중에서 메인과 겹치지 않는 후보를 1개 찾습니다.
3. 90초 이하의 짧게 훑기 좋은 영상 중에서 또 1개 찾습니다.
4. 그래도 비면 남은 점수순 후보로 채웁니다.

중복 방지 규칙도 있습니다.

- 이미 뽑힌 `videoId`는 제외
- 가능하면 같은 `channelId`도 피함

즉 현재 슬롯 의미는 아래처럼 보는 게 맞습니다.

- 메인: 가장 먼저 볼 영상
- 서브 1: 최근성 보완
- 서브 2: 짧게 훑는 보완

## 7. 확신이 낮을 때는 어떻게 하는가

`getLeadSocialVideoResult()`는 결과를 3단계로 나눕니다.

### `status: "ok"`

- 점수 기준을 충분히 넘는 영상이 있음
- `items`에 최대 3개 영상이 들어감
- `item`은 첫 번째 메인 영상

### `status: "fallback"`

- 엄격한 기준으로는 부족하지만, 완전히 버리기엔 쓸 만한 후보가 있음
- 더 낮은 최소 점수(`SOCIAL_VIDEO_FALLBACK_MIN_SCORE`)로 다시 골라서 보여줌
- 왜 fallback인지 설명하는 `fallback` 메타를 함께 내려줌

### `status: "empty"`

- API 키가 꺼져 있거나
- 요청이 실패했거나
- 쓸 만한 후보를 못 찾은 경우

이때도 `fallback.searches`를 함께 내려서 사용자가 바로 YouTube 검색 결과로 갈 수 있게 합니다.

## 8. 프런트에서는 어떻게 보여주는가

프런트는 [social-video-panel.tsx](/Users/jihun/Desktop/study/project/SooGo/src/components/trip-compass/social-video-panel.tsx)에서 응답을 소비합니다.

처리 방식은 아래와 같습니다.

1. `/api/social-video` 응답을 받습니다.
2. `extractSocialVideoItems()`로 `items`를 우선 읽습니다.
3. 최대 3개까지 잘라 씁니다.
4. 첫 번째는 큰 메인 카드로 렌더합니다.
5. 두 번째와 세 번째는 작은 서브 카드로 렌더합니다.

UI 의미는 아래와 같습니다.

- 메인 카드 라벨: `가장 먼저 볼 영상`
- 서브 카드: 보조 참고 영상
- 메인 카드에는 조회수 라벨도 추가로 노출할 수 있음

## 9. 실패해도 화면은 어떻게 유지되는가

프런트는 영상이 없다고 해서 추천 결과 레이아웃을 없애지 않습니다.

현재 정책은 아래와 같습니다.

- 응답 실패나 빈 결과여도 `social-video-block` 영역은 유지
- 슬롯에 영상이 없으면 플레이스홀더 카드 표시
- 메인 슬롯에는 “지금은 메인으로 보여줄 영상이 아직 없어요” 같은 안내를 노출

즉 추천 결과 화면은 `영상이 없어도 무너지지 않는 구조`를 유지합니다.

## 10. 현재 응답 계약

계약은 [contracts.ts](/Users/jihun/Desktop/study/project/SooGo/src/lib/domain/contracts.ts)에 있습니다.

핵심 필드는 아래와 같습니다.

- `status`
  - `ok`
  - `fallback`
  - `empty`
- `item`
  - 첫 번째 메인 영상
- `items`
  - 최대 3개 영상
- `fallback`
  - fallback 또는 empty일 때의 설명과 검색 링크

`SocialVideoItem`에는 아래 정보가 포함됩니다.

- `provider`
- `videoId`
- `title`
- `channelTitle`
- `channelUrl`
- `videoUrl`
- `thumbnailUrl`
- `publishedAt`
- `durationSeconds`
- `viewCount` optional

## 11. 운영 관점에서 볼 포인트

현재 성능과 비용을 볼 때 중요한 포인트는 아래입니다.

- `search.list` 호출량이 `videos.list`보다 많습니다.
- 이유는 검색어를 여러 개 시도하고, 그중 일부에 대해 최근 검색도 한 번 더 하기 때문입니다.
- `videos.list`는 검색에서 건진 videoId들에 대해서만 호출합니다.

운영 관점 체크 포인트는 아래입니다.

- `search.list` 오류율이 급증하는지
- `videos.list` 오류율이 급증하는지
- `status: fallback` 비율이 늘어나는지
- `status: empty` 비율이 늘어나는지
- 특정 목적지에서 메인/서브가 과도하게 같은 채널로 쏠리는지

## 12. 지금 구조의 의도

현재 구조의 의도는 단순합니다.

- 추천 엔진 본체는 목적지를 고른다.
- YouTube 레이어는 그 목적지를 더 빠르게 감으로 이해하게 돕는다.
- 메인은 설명력 중심
- 서브는 최근성/짧은 소비성 중심
- 실패해도 추천 화면은 안정적으로 유지한다.

즉 YouTube는 `랭킹 엔진`이 아니라 `추천 결과를 빠르게 이해시키는 보조 레이어`로 설계되어 있습니다.
