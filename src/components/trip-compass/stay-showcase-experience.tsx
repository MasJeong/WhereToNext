import { testIds } from "@/lib/test-ids";

const AIRBNB_CARD_SHADOW = "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px";

const stayFilters = ["한옥", "오션뷰", "풀빌라", "복층", "장기 숙박", "반려동물"];

const stayCards = [
  {
    id: "stay-gangneung",
    location: "강릉 · 사천해변",
    title: "파도 소리로 하루가 정리되는 오션 스테이",
    description: "큰 창과 낮은 조명만으로 공간 분위기를 잡은 숙소예요.",
    price: "₩290,000 /박",
    rating: "4.98",
    badge: "게스트 선호",
    background:
      "linear-gradient(180deg, rgba(10,43,67,0.08), rgba(10,43,67,0.3)), linear-gradient(135deg, #98d5f5 0%, #6bb3db 32%, #f0c18c 68%, #c98458 100%)",
  },
  {
    id: "stay-jeonju",
    location: "전주 · 한옥마을",
    title: "마당과 다실이 함께 있는 조용한 한옥",
    description: "아침 빛이 예쁘게 드는 마루와 작은 차 공간이 있어요.",
    price: "₩214,000 /박",
    rating: "4.95",
    badge: "슈퍼호스트",
    background:
      "linear-gradient(180deg, rgba(47,28,18,0.12), rgba(47,28,18,0.34)), linear-gradient(135deg, #c59a6f 0%, #9b6f4a 34%, #ede2d3 100%)",
  },
  {
    id: "stay-jeju",
    location: "제주 · 애월",
    title: "노을 시간까지 잡아두고 싶은 돌담 스테이",
    description: "돌담 마당과 낮은 욕조가 있는 커플 중심 숙소예요.",
    price: "₩338,000 /박",
    rating: "5.0",
    badge: "신규",
    background:
      "linear-gradient(180deg, rgba(16,44,35,0.08), rgba(16,44,35,0.32)), linear-gradient(135deg, #8ed0b2 0%, #5ea485 30%, #f5c79b 100%)",
  },
  {
    id: "stay-seochon",
    location: "서울 · 서촌",
    title: "도심 한가운데서 쉬어 가는 복층 스테이",
    description: "식당과 전시를 천천히 걷기 좋은 위치에 있어요.",
    price: "₩248,000 /박",
    rating: "4.93",
    badge: "도심 추천",
    background:
      "linear-gradient(180deg, rgba(28,34,44,0.08), rgba(28,34,44,0.34)), linear-gradient(135deg, #c9d2df 0%, #929faf 40%, #f0c4a3 100%)",
  },
] as const;

const stayReasons = [
  {
    title: "사진이 먼저 보이게",
    description: "카드 상단을 크게 열어 두고, 텍스트는 필요한 만큼만 두었습니다.",
  },
  {
    title: "포인트 컬러는 한 번만",
    description: "코랄 CTA만 강조하고 나머지는 흰 배경과 따뜻한 검정으로 눌렀습니다.",
  },
  {
    title: "둥글고 조용하게",
    description: "20px 전후 라운드와 얕은 3중 그림자로 부드럽게 띄웠습니다.",
  },
] as const;

/** Renders an Airbnb-inspired stay browsing showcase using the local design reference. */
export function StayShowcaseExperience() {
  const featuredStay = stayCards[0];
  const compactStayCards = stayCards.slice(1);

  return (
    <div
      data-testid={testIds.stays.root}
      className="space-y-6 pb-4"
      style={{
        color: "#222222",
        fontFamily: "\"Airbnb Cereal VF\", \"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
      }}
    >
      <section
        className="rounded-[2rem] bg-white px-4 py-5 sm:px-6 sm:py-6"
        style={{ boxShadow: AIRBNB_CARD_SHADOW }}
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[#fff1f4] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-[#ff385c]">
              DESIGN SAMPLE
            </span>
            <div className="max-w-2xl space-y-2">
              <h1 className="text-[1.55rem] font-bold leading-[1.12] tracking-[-0.035em] sm:text-[2.05rem]">
                이번 주말, 오래 머물고 싶은 스테이
              </h1>
              <p className="text-[0.95rem] leading-7 text-[#6a6a6a]">
                `design-systems/airbnb.md`를 기준으로 만든 숙소 탐색 샘플 화면입니다.
              </p>
            </div>
          </div>

          <div
            className="rounded-[2rem] border border-black/5 bg-white p-2"
            style={{ boxShadow: AIRBNB_CARD_SHADOW }}
          >
            <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.7fr)_auto]">
              <div className="rounded-[1.4rem] px-4 py-3">
                <p className="text-[11px] font-semibold text-[#6a6a6a]">여행지</p>
                <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">도심에서 2시간 안</p>
              </div>
              <div className="rounded-[1.4rem] px-4 py-3">
                <p className="text-[11px] font-semibold text-[#6a6a6a]">체크인</p>
                <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">4월 셋째 주</p>
              </div>
              <div className="rounded-[1.4rem] px-4 py-3">
                <p className="text-[11px] font-semibold text-[#6a6a6a]">체크아웃</p>
                <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">2박 3일</p>
              </div>
              <div className="rounded-[1.4rem] px-4 py-3">
                <p className="text-[11px] font-semibold text-[#6a6a6a]">인원</p>
                <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">2명</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-[3.5rem] items-center justify-center rounded-full bg-[#ff385c] px-5 text-[15px] font-semibold text-white transition-transform duration-200 hover:scale-[0.98]"
              >
                찾기
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {stayFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="shrink-0 rounded-full border border-black/8 bg-[#f7f7f7] px-4 py-2 text-[13px] font-semibold text-[#222222] transition-colors duration-200 hover:bg-white"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.95fr)]">
        <article
          data-testid={testIds.stays.card0}
          className="overflow-hidden rounded-[2rem] bg-white"
          style={{ boxShadow: AIRBNB_CARD_SHADOW }}
        >
          <div
            className="relative aspect-[16/10] overflow-hidden"
            style={{ background: featuredStay.background }}
          >
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#222222]">
                {featuredStay.badge}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#222222]">
                ★ {featuredStay.rating}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(34,34,34,0.72)_100%)] p-5 text-white">
              <p className="text-[13px] font-semibold text-white/82">{featuredStay.location}</p>
              <h2 className="mt-2 text-[1.8rem] font-semibold leading-[1.05] tracking-[-0.045em]">
                {featuredStay.title}
              </h2>
            </div>
          </div>

          <div className="space-y-3 px-5 py-5">
            <p className="text-[0.95rem] leading-7 text-[#6a6a6a]">{featuredStay.description}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-[#222222]">{featuredStay.price}</p>
              <button
                type="button"
                className="inline-flex min-h-[2.8rem] items-center rounded-[0.9rem] bg-[#222222] px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#ff385c]"
              >
                둘러보기
              </button>
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          {compactStayCards.map((stay) => (
            <article
              key={stay.id}
              className="overflow-hidden rounded-[1.6rem] bg-white"
              style={{ boxShadow: AIRBNB_CARD_SHADOW }}
            >
              <div className="grid gap-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <div className="aspect-[4/3] sm:aspect-auto" style={{ background: stay.background }} />
                <div className="space-y-2 px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#6a6a6a]">{stay.location}</p>
                    <span className="text-[12px] font-semibold text-[#222222]">★ {stay.rating}</span>
                  </div>
                  <h3 className="text-[1.12rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#222222]">
                    {stay.title}
                  </h3>
                  <p className="text-[13px] leading-6 text-[#6a6a6a]">{stay.description}</p>
                  <p className="text-[14px] font-semibold text-[#222222]">{stay.price}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {stayReasons.map((reason) => (
          <article
            key={reason.title}
            className="rounded-[1.5rem] border border-black/5 bg-white px-4 py-4"
            style={{ boxShadow: AIRBNB_CARD_SHADOW }}
          >
            <p className="text-[1rem] font-semibold tracking-[-0.02em] text-[#222222]">{reason.title}</p>
            <p className="mt-2 text-[13px] leading-6 text-[#6a6a6a]">{reason.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
