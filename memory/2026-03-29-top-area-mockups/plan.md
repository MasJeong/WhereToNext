## 한눈에 보기

- 메인 랜딩 상단을 `헤더 + 에디토리얼 히어로`로 다시 보는 SVG 목업 2종을 만들었습니다.
- 핵심 목표는 `바로 이해 → 바로 시작`입니다. 카드형 설명 대신 큰 제목, 짧은 설명, CTA 1개, 여행 장면형 배경으로 정리했습니다.
- 결과물은 `mockup-top-area-a.svg`, `mockup-top-area-b.svg`입니다.

## 사용자 목표

- 첫 화면에서 서비스가 무엇을 하는지 바로 이해한다.
- 로그인 여부와 관계없이 어디서 시작하면 되는지 헷갈리지 않는다.
- 복잡한 카드 읽기 전에 `추천 받기` 행동으로 바로 이동한다.

## 사용자 행동 흐름

1. 헤더에서 브랜드와 주요 이동 경로를 읽는다.
2. `추천 받기 / 여행 기록 / 저장한 결과`처럼 익숙한 라벨로 구조를 이해한다.
3. 히어로에서 큰 제목과 한 줄 설명으로 서비스 목적을 확인한다.
4. 장면형 여행 배경으로 감정적 기대를 만든다.
5. 단일 CTA `추천 받기`를 누른다.

## 화면의 단일 목적

- 메인 랜딩 상단의 목적은 `설명`이 아니라 `추천 시작 유도`입니다.

## Before / After 구조 비교

### Before

- 헤더 액션 의미가 상대적으로 약함
- 로그인/계정 affordance가 빠르게 안 읽힘
- 히어로 설명이 중앙 집중형이라 장면보다 UI 요소로 느껴짐
- 서비스 이해와 시작 행동 사이 연결이 약함

### After

- 헤더에 명확한 텍스트 기반 이동: `추천 받기`, `여행 기록`, `저장한 결과`
- 우측에 `로그인` 또는 `내 계정` 영역을 분명히 분리
- 히어로는 카드 대신 큰 제목 + 짧은 설명 + CTA 1개
- 배경은 여행 장면형 비주얼로 감정 흐름을 담당
- 상단 한 화면 안에서 `무엇을 하는 서비스인지`와 `어디를 눌러야 하는지`가 동시에 보임

## 방향 A: 안내가 빠른 에디토리얼 스플릿

- 좌측 정보, 우측 여행 장면으로 나눈 가장 직관적인 구조입니다.
- 헤더는 서비스 진입 라우트를 선명하게 보여 줍니다.
- 히어로는 `지금 떠나고 싶은 여행, 바로 추천해 드릴게요`라는 약속을 중심에 둡니다.
- CTA 아래 보조 문구로 `로그인 없이도 바로 시작`을 알려 anonymous-first 원칙을 살렸습니다.

## 방향 B: 장면 몰입형 파노라마

- 히어로 전체를 넓은 여행 장면으로 쓰고, 텍스트를 전면에 겹쳐 배치했습니다.
- 더 감정적인 첫인상이 필요할 때 적합합니다.
- 헤더 라벨은 더 제품 중심적으로 `추천 받기`, `추천 방식`, `여행 기록`으로 정리했습니다.
- 장면형 배경 위에서도 CTA는 하나만 강조해 선택 피로를 줄였습니다.

## 화면별 UX 설계 이유

### 헤더

- 아이콘보다 텍스트 라벨을 우선해 인지 속도를 올립니다.
- 계정 영역은 우상단에 고정된 문맥으로 두어 로그인 행동을 쉽게 찾게 합니다.
- 강조는 최소화하고 정보 역할을 분리해 히어로 CTA와 경쟁하지 않게 합니다.

### 히어로

- 큰 제목은 서비스 결과를 먼저 약속합니다.
- 짧은 설명은 입력 부담이 낮다는 점만 전달합니다.
- 카드 설명 블록을 제거해 읽기보다 행동 흐름으로 전환합니다.
- 배경 장면은 여행 기대감을 만들되 기능 설명을 대신하지 않습니다.

## 목업 제작 기준으로 정리한 React 구조 예시

```tsx
export function LandingTopAreaMock() {
  return (
    <section className="bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="font-display text-xl">떠나볼래</a>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <a href="#start">추천 받기</a>
          <a href="/account">여행 기록</a>
          <a href="/saved">저장한 결과</a>
        </nav>
        <a href="/auth" className="rounded-full border px-4 py-2 text-sm">로그인</a>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-[var(--color-sand-deep)]">해외 여행지 추천</p>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-[-0.05em]">
            지금 떠나고 싶은 여행,
            <br />바로 추천해 드릴게요
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-ink-soft)]">
            일정, 예산, 분위기만 고르면 지금의 취향에 맞는 목적지를 바로 볼 수 있어요.
          </p>
          <a
            id="start"
            href="/start"
            className="mt-8 inline-flex min-h-14 items-center rounded-full bg-[var(--color-action-primary)] px-7 text-sm font-semibold text-white"
          >
            추천 받기
          </a>
        </div>

        <div aria-hidden="true" className="min-h-[28rem] rounded-[2rem] bg-[var(--color-paper-soft)]" />
      </div>
    </section>
  );
}
```
