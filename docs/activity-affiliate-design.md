# 한눈에 보기

- 이 문서는 `떠나볼래`에 첫 제휴 수익화 기능으로 `액티비티 제휴 링크`를 붙이기 위한 구현 설계안입니다.
- 1차 목표는 `목적지 상세 페이지`에만 제휴 CTA를 넣고, 추천 순위와 분리된 후속 행동 영역으로 운영하는 것입니다.
- 초기 파트너는 `Klook` 또는 `KKday` 같은 액티비티 계열을 우선 검토합니다.
- 기본 원칙은 `추천을 해치지 않기`, `광고임을 숨기지 않기`, `클릭 데이터를 반드시 남기기`입니다.

# 목적과 범위

## 목표

- 추천된 목적지를 본 사용자가 자연스럽게 다음 행동으로 넘어가게 합니다.
- 무작위 배너가 아니라 `목적지와 직접 연결되는 액티비티 제휴 링크`로 수익화를 시작합니다.
- 추천 결과와 제휴 노출을 명확히 분리해 신뢰를 유지합니다.

## 1차 범위

- `목적지 상세 페이지`에만 제휴 CTA를 추가합니다.
- 제휴 카테고리는 `액티비티` 1종만 지원합니다.
- CTA는 `1개 슬롯`만 둡니다.
- 클릭 이벤트를 서버에 저장합니다.

## 1차 범위 제외

- 추천 결과 리스트 중간 광고 카드
- 숙소, 항공권, eSIM, 보험 등 다중 제휴 카테고리
- 사용자별 개인화 제휴 노출
- A/B 테스트
- 제휴 링크 자동 생성기

# 왜 액티비티부터 시작하는가

- 이 서비스의 강점은 `어디로 갈지 정하는 것`이지 `숙소 검색`이 아닙니다.
- 액티비티는 목적지 의사결정 직후의 후속 행동으로 자연스럽습니다.
- 숙소는 체크인 날짜, 인원, 가격대 입력 부담이 커서 이탈이 더 큽니다.
- 액티비티 CTA는 추천 결과의 신뢰를 덜 해치고, 목적지 상세와 결이 잘 맞습니다.

# 사용자 흐름

## 핵심 흐름

1. 사용자가 추천 결과에서 목적지 상세로 이동합니다.
2. 상세 상단에서 목적지 판단 정보를 확인합니다.
3. 상세 중하단에서 `현지 액티비티 보기` CTA를 만납니다.
4. 클릭 시 새 탭으로 파트너 링크로 이동합니다.
5. 내부에서는 클릭 로그를 저장합니다.

## 의도된 UX 위치

- CTA는 `핵심 판단 정보`를 본 뒤에 노출합니다.
- 추천 이유 바로 아래가 아니라, 사용자가 목적지를 어느 정도 받아들인 다음 단계에 둡니다.
- 사용자가 "이제 예약/탐색을 더 해볼까"라고 느끼는 순간에 붙입니다.

# 삽입 위치

## 1차 권장 위치

- 파일: `src/components/trip-compass/destination-detail-experience.tsx`

## 위치 기준

- `추천 이유`, `핵심 팩트`, `여행 지원 정보` 다음
- `여행 기록 저장`과 충돌하지 않는 별도 블록
- 하단 CTA 영역 중 하나로 분리

## 비권장 위치

- 질문 퍼널 내부
- 추천 결과 1위 카드 바로 아래
- 여행 기록 작성/수정 화면 내부
- 저장/공유 CTA와 같은 시각 계층

# UI 설계

## 블록 이름

- `ActivityAffiliatePanel`

## 표시 요소

- eyebrow: `현지에서 바로 이어보기`
- 제목: `현지 액티비티 보기`
- 설명: `이 목적지에서 많이 찾는 투어·입장권·체험 링크로 이동합니다.`
- 보조 라벨: `제휴 링크 포함`
- CTA 버튼: `현지 액티비티 보기`

## 보조 문구

- `예약이나 구매가 발생하면 수수료를 받을 수 있어요.`

## 버튼 동작

- 새 탭 열기
- `rel="sponsored noopener noreferrer"` 사용
- 클릭 직전 로깅 또는 클릭 직후 비동기 로깅

## 시각 원칙

- 추천 카드와 동일한 강조 톤을 쓰지 않습니다.
- `광고`처럼 번쩍이는 박스가 아니라 `후속 액션` 성격의 보조 패널이어야 합니다.
- 핵심 CTA는 1개만 둡니다.
- `제휴 링크 포함` 고지는 항상 보이게 둡니다.

# 정책 검증

## 결론

- `액티비티 제휴 링크` 자체는 운영 가능합니다.
- 다만 `경제적 이해관계 표시`, `추천과 광고의 분리`, `검색엔진용 저품질 제휴 페이지 금지`를 지키지 않으면 정책 리스크가 있습니다.
- 1차 설계인 `목적지 상세의 별도 패널 + 링크 근처 고지 + rel="sponsored"` 구조는 비교적 안전한 방향입니다.

## 공식 기준

### FTC

- 구매나 예약이 발생할 때 수수료를 받는 링크는 `material connection` 공개 대상입니다.
- 공개는 `clear and conspicuous`해야 하며, 링크나 추천 문구 가까이에 있어야 합니다.
- `affiliate link` 같은 모호한 영어 표기만으로는 부족할 수 있습니다.

공식 문서:

- https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides
- https://www.ftc.gov/documents/bus41-dot-com-disclosures-information-about-online-advertising

### Google Search

- 보상성 외부 링크는 `rel="sponsored"` 사용이 권장됩니다.
- 유저 생성 콘텐츠 안의 보상성 링크는 `ugc sponsored` 조합까지 고려할 수 있습니다.
- sponsored link 자체가 금지되는 것은 아니지만, 검색용 저가치 상업 페이지를 대량 생성하는 방식은 피해야 합니다.
- 마지막 항목은 rel 가이드와 검색 스팸 집행 흐름을 바탕으로 한 운영상 판단입니다.

공식 문서:

- https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify

### 한국 공정거래위원회

- 경제적 이해관계가 있으면 표시 대상입니다.
- 표시는 추천·보증 내용과 가까운 위치에, 소비자가 쉽게 인식 가능한 방식으로, 명확한 한국어 문구로 제공해야 합니다.
- 2024년 12월 1일부터 시행된 개정 지침도 이 방향을 강화했습니다.

공식 문서:

- https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=3&key=12&nttSn=43669&pageIndex=2&pageUnit=10&rltnNttSn=40672&searchCnd=all&searchViolt=0609
- https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=6&key=20&nttSn=9048&pageIndex=3&pageUnit=10&searchCnd=all
- https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=3&key=12&nttSn=41608&pageIndex=27&pageUnit=10&rltnNttSn=45865&searchCnd=all&searchCtgry=01%2C02&searchViolt=000002

## 반드시 지킬 운영 원칙

- 제휴 링크는 추천 근거와 분리된 별도 패널에서만 노출합니다.
- CTA 가까이에 `제휴 링크 포함`과 `예약이나 구매가 발생하면 수수료를 받을 수 있어요.` 같은 문구를 항상 함께 둡니다.
- 제휴 링크는 추천 이유, 사용자 후기, 편집 코멘트처럼 보이게 배치하거나 표현하지 않습니다.
- 광고 고지는 본문 끝, 푸터, 별도 약관 페이지에만 숨기지 않습니다.
- 한국 사용자 대상 UI에서는 한국어 고지를 기본값으로 사용합니다.

## 권장 고지 문구

- `제휴 링크 포함`
- `외부 예약 페이지로 이동하며, 예약이나 구매가 발생하면 수수료를 받을 수 있어요.`
- `추천 결과와 별개로 제공되는 제휴 링크입니다.`

## 금지 또는 위험 패턴

- 링크만 넣고 제휴 관계를 표시하지 않는 것
- 고지를 페이지 하단이나 푸터에만 두는 것
- `affiliate`, `partner`, `ad?` 같은 짧고 모호한 영어 표현만 쓰는 것
- 추천 결과 1위 이유와 제휴 CTA를 같은 카드 안에서 섞는 것
- 사용자 생성 후기나 공개 여행 기록 본문에 제휴 링크를 자연 후기처럼 숨겨 넣는 것
- 제휴 트래픽만 노린 SEO용 별도 랜딩 페이지를 양산하는 것

## 출시 전 체크리스트

- 제휴 CTA 근처에 한국어 고지가 실제로 보이는가
- 외부 링크에 `rel="sponsored noopener noreferrer"`가 적용됐는가
- 추천 이유와 제휴 패널이 시각적으로 분리돼 있는가
- 공개 여행 기록 본문에는 광고성 링크가 섞이지 않는가
- 어떤 목적지, 어떤 파트너, 어떤 페이지에서 클릭이 났는지 로그가 남는가
- 고지 문구와 위치 변경 이력을 운영 문서에 남길 수 있는가
- 분기 1회 또는 파트너 추가 시 정책을 다시 검토하는가

# 데이터 모델

## 1차 저장 방식

목적지 카탈로그와 분리된 별도 제휴 카탈로그 파일을 둡니다.

권장 파일:

- `src/lib/affiliate/catalog.ts`

## 타입 초안

```ts
export type DestinationAffiliateLink = {
  destinationId: string;
  category: "activity";
  partner: "klook" | "kkday";
  url: string;
  ctaLabel: string;
  disclosureLabel: string;
  active: boolean;
};
```

## 분리하는 이유

- 제휴 링크는 운영 중 자주 바뀔 수 있습니다.
- 목적지 핵심 프로필과 관심사가 다릅니다.
- 제휴 운영자가 나중에 링크만 갱신하기 쉬워집니다.

# 클릭 로그 설계

## 목적

- 어떤 목적지에서 실제 클릭이 나는지 확인합니다.
- 파트너별 클릭률을 비교합니다.
- 상세 페이지 전환력을 판단합니다.

## 저장 위치

- 1차는 DB 테이블 저장 권장

권장 테이블:

- `destination_affiliate_clicks`

## 필드 초안

```ts
id
destinationId
partner
category
pageType
userId nullable
sessionId nullable
clickedAt
```

## pageType 후보

- `destination-detail`
- 추후 확장:
  - `result-page`
  - `public-history`

# API 설계

## 1차 방식

- 링크는 서버 렌더 시 함께 주입
- 클릭 로그는 별도 POST API로 저장

권장 엔드포인트:

- `POST /api/affiliate/clicks`

## 요청 payload 초안

```json
{
  "destinationId": "tokyo",
  "partner": "klook",
  "category": "activity",
  "pageType": "destination-detail"
}
```

## 응답

- `204 No Content` 또는 `200 { ok: true }`

## 실패 처리

- 로깅 실패가 있어도 사용자 이동은 막지 않습니다.
- 클릭 로깅은 절대 CTA 이동보다 우선하지 않습니다.

# 구현 구조

## 새 파일 권장

- `src/lib/affiliate/catalog.ts`
- `src/lib/affiliate/service.ts`
- `src/app/api/affiliate/clicks/route.ts`
- `src/components/trip-compass/activity-affiliate-panel.tsx`

## 기존 파일 수정

- `src/components/trip-compass/destination-detail-experience.tsx`
- 필요 시 `src/lib/domain/contracts.ts`
- 필요 시 `src/lib/db/schema.ts`

## 역할 분리

- 카탈로그: 목적지별 제휴 링크 정의
- 서비스: 목적지 기준 링크 조회
- API: 클릭 로그 저장
- 컴포넌트: CTA UI 표시

# 공개 고지 원칙

- `제휴 링크 포함` 문구는 숨기지 않습니다.
- 추천 순위나 적합도와 제휴 여부는 연결되지 않음을 유지합니다.
- 제휴 블록은 추천 이유 텍스트와 시각적으로 분리합니다.

# 측정 지표

## 1차 필수 지표

- 목적지 상세 조회 수
- 제휴 CTA 클릭 수
- 목적지별 CTR
- 파트너별 CTR
- 로그인 여부별 CTR

## 판단 기준 예시

- CTR 1% 미만: 위치/문구 재검토
- CTR 3% 이상: 결과 페이지 확장 검토
- 특정 목적지 편중 심함: 목적지별 CTA 카피 차등화 검토

# 단계별 구현 순서

## 1단계

- 제휴 카탈로그 파일 추가
- 목적지 상세 UI 블록 추가
- 외부 링크 연결

## 2단계

- 클릭 로그 API 추가
- DB 테이블 추가
- 관리자용 조회는 아직 생략

## 3단계

- 목적지별 문구 보정
- 파트너 A/B 비교
- 공개 여행 기록 상세까지 확장 검토

# 테스트 계획

## 단위 테스트

- 목적지별 제휴 링크 조회
- inactive 링크 미노출
- CTA 라벨/고지 문구 렌더

## UI 테스트

- 상세 페이지에서 제휴 패널 노출
- 링크 href 검증
- 고지 문구 노출 검증

## API 테스트

- 클릭 로그 POST 성공
- 필수 필드 누락 시 검증 실패

# 결정 사항

- 첫 제휴 카테고리는 `액티비티`
- 첫 노출 위치는 `목적지 상세 페이지`
- 첫 파트너 후보는 `Klook`, 대안은 `KKday`
- 링크 데이터는 목적지 카탈로그와 분리
- 클릭 로그는 별도 API/DB 테이블로 저장

# 보류 사항

- 실제 파트너 확정
- 파트너별 링크 규격
- 관리자 화면 필요 여부
- 공개 여행 기록 화면까지 확장할지 여부
