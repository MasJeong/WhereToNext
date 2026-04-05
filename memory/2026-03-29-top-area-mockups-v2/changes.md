# 상단 영역 목업 2차 시안 변경 사항

## 한눈에 보기
- 이전 안의 흰 박스, 라운드 패널, 떠 있는 라벨을 모두 제거했다.
- 상단 전체를 하나의 여행 장면처럼 보이게 다시 구성했다.
- 헤더는 텍스트 네비게이션, 히어로는 제목·설명·CTA 1개만 남겼다.

## 파일
- `memory/2026-03-29-top-area-mockups-v2/mockup-top-area-scene-a.svg`: 해안 산책 장면 기반 editorial hero.
- `memory/2026-03-29-top-area-mockups-v2/mockup-top-area-scene-b.svg`: 야간 도시+비행 궤적 기반 immersive hero.
- `memory/2026-03-29-top-area-mockups-v2/plan.md`: 작업 목표와 범위 정리.
- `memory/2026-03-29-top-area-mockups-v2/verification.md`: 검토 결과 기록.

## Before / After 구조 비교

### Before
- 큰 흰 바탕 프레임 안에 다시 헤더 박스가 들어감
- 히어로 안에 설명용 pill/label이 떠 있음
- 장면보다 박스 구조가 먼저 읽힘
- CTA 외에도 작은 보조 컴포넌트들이 시선을 나눔

### After
- 상단 전체가 하나의 연속된 장면으로 시작함
- 헤더는 텍스트 링크만 남겨 즉시 이해 가능하게 단순화함
- 히어로는 큰 제목, 짧은 설명, CTA 1개만 유지함
- 정보 전달은 카드가 아니라 배경 장면과 텍스트 위계로 해결함

## 사용자 흐름
1. 첫 시선은 배경 장면과 큰 제목에서 서비스 목적을 바로 이해한다.
2. 바로 아래 짧은 설명으로 "로그인 없이 빠르게 추천받는 서비스"라는 행동 이유를 확인한다.
3. 시선이 자연스럽게 CTA 하나로 내려오고, 다음 행동은 `추천 받기`로 수렴한다.
4. 추가 탐색이 필요하면 헤더 텍스트 네비게이션으로 이동한다.

## 화면별 UX 설계 이유

### Direction A · 해안 장면형
- 더 밝고 개방적인 첫인상에 맞춘 안이다.
- 수평선·산 능선·해변 곡선으로 한 화면이 한 호흡으로 이어진다.
- 여행을 시작하기 전의 맑은 기대감을 주되, CTA만 가장 선명하게 남긴다.

### Direction B · 도시 야경형
- 더 몰입감 있고 목적지 선택의 설렘을 크게 주는 안이다.
- 도시 불빛과 비행 궤적으로 "어디로 떠날까"라는 감정을 먼저 만든다.
- 정보는 줄이고 결정 행동만 남겨 landing hero의 집중도를 높였다.

## React 구조 참고 코드

> 참고용 스케치이며 production 코드에 적용하지 않았다.

```tsx
export function LandingTopAreaMock() {
  return (
    <section className="relative min-h-[920px] overflow-hidden bg-[var(--color-paper-soft)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.34),transparent_18%),linear-gradient(180deg,#edf7ff_0%,#6cbcff_42%,#0b63ce_100%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-8 py-7 text-[15px] font-semibold">
        <a href="/" className="tracking-[-0.04em] text-[22px]">떠나볼래</a>
        <nav className="flex items-center gap-8 text-white/88">
          <a href="/">추천 받기</a>
          <a href="/account">여행 기록</a>
          <a href="/auth">로그인</a>
        </nav>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-6xl items-center px-8 pb-20 pt-12">
        <div className="max-w-[620px]">
          <p className="text-[16px] font-semibold text-white/78">해외 여행지 추천</p>
          <h1 className="mt-5 text-[84px] font-semibold leading-[0.94] tracking-[-0.07em]">
            이번 여행,
            <br />
            어디로 갈지
            <br />
            바로 정해볼까요
          </h1>
          <p className="mt-6 max-w-[28rem] text-[22px] leading-8 text-white/82">
            일정과 분위기만 고르면 지금의 취향에 맞는 해외 목적지를 빠르게 추천해 드려요.
          </p>
          <button className="mt-10 rounded-full bg-white px-8 py-4 text-[18px] font-semibold text-[var(--color-sand-deep)]">
            추천 받기
          </button>
        </div>
      </div>
    </section>
  );
}
```
