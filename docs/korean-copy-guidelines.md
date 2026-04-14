# 떠나볼래 Korean Copy Guidelines

## 목적

떠나볼래 is a Korean-first outbound travel recommendation product. Write every user-facing string for Korean travelers departing from Korea, not for a global English audience.

## 제품 보이스

- 명확하고 단단하게, 한 번 읽으면 무엇을 도와주는지 바로 이해되게 쓴다.
- 따뜻하되 과하게 귀엽지 않게, 친근한 서비스 톤을 쓰되 억지스럽게 장난스럽지는 않게 간다.
- 자신감 있고 실용적으로, 왜 이 목적지가 맞는지, 무엇을 확인해야 하는지, 다음 행동이 무엇인지 알려 준다.
- Recommendation-first 원칙을 지킨다. Instagram 스타일 근거는 보조 mood layer이지 ranking authority가 아니다.
- Anonymous-first 문맥을 지킨다. 맥락상 필요할 때는 로그인 없이도 use, save, compare가 가능하다는 점을 알려 준다.

## 핵심 톤 규칙

- 문장은 한국어를 먼저 둔다. 영어는 brand name, airport code, 공식 source name, 또는 명확성을 높이는 destination name에만 남긴다.
- 직역보다 자연스러운 한국어 제품 문장을 우선한다.
- 문장은 짧게 쓴다. 한 문장에 한 가지 생각을 담는 것을 기본으로 한다.
- `-해요`, `-해 보세요`, `-할 수 있어요` 같은 일상적인 서비스 문체로 여행자에게 직접 말한다.
- 법률이나 기술 문맥이 아니라면 `조회되었습니다`, `처리 중입니다`, `불가능합니다` 같은 딱딱한 관리자 톤은 피한다.

## UI 문구 규칙

- 버튼은 짧고 행동이 먼저 보이게 쓴다. 예: `추천 받기`, `공유 페이지 보기`, `링크 복사`.
- 섹션 제목은 명사형으로 두고, 빨리 훑어볼 수 있게 만든다. 예: `추천 이유`, `체크할 점`, `여행 정보`.
- helper text는 이 선택이 왜 중요한지 설명해야지, 컨트롤 이름만 반복하면 안 된다.
- empty state는 이유를 설명하고, 다음 완화 단계를 제안해야 한다.
- error state는 무엇이 실패했는지 차분하게 말하고, 복구 행동은 하나만 분명하게 준다.
- comparison page와 restore page는 저장된 결과가 immutable하고 anonymous하다는 점을 강조한다.

## 여행 맥락 규칙

- 여행자는 한국에서 출발한다고 가정한다.
- 짧은 연차, 계절 수요, 공항 선택, 비행 피로, 가성비 같은 한국 여행자의 습관을 자연스럽게 반영한다.
- 목적지는 한국 여행자가 실제로 궁금해하는 기준으로 설명한다. 예를 들면 여행 시기, 예산 체감, pace, 비행 거리, 음식, 쇼핑, 풍경, 분위기다.
- Instagram은 mood proof로만 다룬다. social buzz가 ranking을 결정하는 것처럼 쓰면 안 된다.

## 용어 규칙

- `데스티네이션` 같은 어색한 직역보다 `목적지`를 쓴다.
- `분위기`와 `무드` 중에서는 기본값으로 `분위기`를 쓴다. `무드`는 꼭 필요할 때만 쓴다.
- `추천 결과`, `비교 보드`, `저장한 카드`를 일관되게 쓴다.
- 반복 라벨은 `예산 감각`, `비행 거리`, `추천 시기`, `일정 밀도`로 맞춘다.

## 하지 말 것

- 영어를 먼저 쓰고 한국어를 부제처럼 붙이지 않는다.
- 이전 영어 카피를 기계적으로 직역하지 않는다.
- 느낌표, 유행어, 인플루언서식 과장 톤을 남발하지 않는다.
- 제품이 제공하지 않는 예약 보장, 가격 확정, 실시간 availability를 약속하지 않는다.
- Instagram 근거를 메인 scoring engine처럼 표현하지 않는다.

## 예시 패턴

- 나쁨: `Run recommendation`
- 좋음: `추천 받기`

- 나쁨: `The recommendation engine could not load a route right now.`
- 좋음: `지금은 추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.`

- 나쁨: `Instagram vibe summary`
- 좋음: `인스타그램 분위기 요약`
