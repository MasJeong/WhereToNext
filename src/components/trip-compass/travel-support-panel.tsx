"use client";

import Image from "next/image";

import type { DestinationTravelSupplement } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

type TravelSupportPanelProps = {
  supplement: DestinationTravelSupplement | null | undefined;
  destinationName: string;
  travelMonth?: number;
  heroMode?: "hero" | "compact";
  layout?: "full" | "summary";
  rootClassName?: string;
};

function formatObservedTime(isoString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(isoString));
}

function formatTravelMonth(month: number) {
  return `${month}월`;
}

/**
 * 대표 목적지의 외부 보조 정보를 짧게 묶어 보여준다.
 * @param supplement 외부 데이터 집계 결과
 * @param destinationName 목적지 이름
 * @param heroMode 이미지 표시 모드
 * @param rootClassName 선택적 래퍼 클래스
 * @returns 외부 보조 정보 패널
 */
export function TravelSupportPanel({
  supplement,
  destinationName,
  travelMonth,
  heroMode = "compact",
  layout = "full",
  rootClassName = "",
}: TravelSupportPanelProps) {
  if (!supplement) {
    if (layout !== "summary" || typeof travelMonth !== "number") {
      return null;
    }

    return (
      <section
        data-testid={testIds.detail.travelSupport}
        className={`rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3.5 ${rootClassName}`.trim()}
      >
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
          {formatTravelMonth(travelMonth)} 날씨
        </p>
        <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
          {formatTravelMonth(travelMonth)} 기준 날씨를 확인하고 있어요.
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
          외부 날씨 데이터를 불러오면 이 자리에서 평균 기온과 비 오는 날 비중까지 바로 보여드릴게요.
        </p>
      </section>
    );
  }

  const leadTravelMonth = supplement.travelMonthWeather?.travelMonth;
  const leadTravelWeatherSummary = supplement.travelMonthWeather?.summary;

  if (layout === "summary") {
    return (
      <section
        data-testid={testIds.detail.travelSupport}
        className={`rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3.5 ${rootClassName}`.trim()}
      >
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              {leadTravelMonth ? `${formatTravelMonth(leadTravelMonth)} 날씨` : "날씨"}
            </p>
            <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
              {leadTravelWeatherSummary ?? `${destinationName}의 시기별 날씨를 함께 보고 결정해 보세요.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {supplement.travelMonthWeather ? (
              <>
                <article className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1.5">
                  <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                    평균 최고 {supplement.travelMonthWeather.averageMaxTemperatureC}° / 최저 {supplement.travelMonthWeather.averageMinTemperatureC}°
                  </p>
                </article>
                <article className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1.5">
                  <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                    비 오는 날 비중 약 {supplement.travelMonthWeather.rainyDayRatio}%
                  </p>
                </article>
              </>
            ) : null}

            {supplement.weather ? (
              <article className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1.5">
                <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                  지금 {supplement.weather.temperatureC}° · 체감 {supplement.weather.apparentTemperatureC}° · {supplement.weather.summary}
                </p>
              </article>
            ) : null}
          </div>

          {supplement.mapEmbed ? (
            <article className="overflow-hidden rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-white">
              <div className="border-b border-[color:var(--color-funnel-border)] px-3.5 py-3">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                  위치
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-funnel-text)]">
                  {destinationName}가 어느 쪽에 있는지 먼저 감 잡아보세요.
                </p>
              </div>
              <iframe
                src={supplement.mapEmbed.src}
                title={supplement.mapEmbed.title}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-40 w-full border-0"
              />
            </article>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid={testIds.detail.travelSupport}
      className={`space-y-3 rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-white p-4 ${rootClassName}`.trim()}
    >
      <div className="space-y-1.5 border-b border-[color:var(--color-funnel-border)] pb-3">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
          {leadTravelMonth ? `${formatTravelMonth(leadTravelMonth)} 여행 판단` : "여행 판단 메모"}
        </p>
        <p className="text-[1rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
          {leadTravelWeatherSummary ?? `${destinationName}에 가기 전에 날씨와 현지 감을 먼저 확인해 보세요.`}
        </p>
        <p className="text-sm leading-6 text-[var(--color-funnel-text-soft)]">
          {leadTravelMonth
            ? `${destinationName}에서 ${formatTravelMonth(leadTravelMonth)}에 체감할 가능성이 큰 흐름을 먼저 보여드리고, 지금 날씨는 참고용으로 덧붙였어요.`
            : `${destinationName}에 가기 전 필요한 보조 정보만 짧게 정리했어요.`}
        </p>
      </div>

      {supplement.heroImage ? (
        <div
          className={`relative overflow-hidden rounded-[1.1rem] border border-[color:var(--color-funnel-border)] ${heroMode === "hero" ? "aspect-[16/10]" : "aspect-[16/9]"}`}
        >
          <Image
            src={supplement.heroImage.url}
            alt={supplement.heroImage.alt}
            fill
            sizes={heroMode === "hero" ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 1024px) 100vw, 40vw"}
            className="object-cover"
          />
        </div>
      ) : null}

      {supplement.heroImage ? (
        <p className="text-[11px] leading-5 text-[var(--color-funnel-text-soft)]">
          이미지 · {supplement.heroImage.sourceLabel} /{" "}
          <a
            href={supplement.heroImage.photographerUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline decoration-[color:var(--color-funnel-border)] underline-offset-4"
          >
            {supplement.heroImage.photographerName}
          </a>
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(15rem,0.9fr)]">
        {supplement.travelMonthWeather ? (
          <article className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              선택한 시기 평균
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
              {formatTravelMonth(supplement.travelMonthWeather.travelMonth)} 평균 최고{" "}
              {supplement.travelMonthWeather.averageMaxTemperatureC}° / 최저{" "}
              {supplement.travelMonthWeather.averageMinTemperatureC}°
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
              비 오는 날 비중 약 {supplement.travelMonthWeather.rainyDayRatio}%로, 여행 중 우산을 챙길지 판단하는 기준으로 보면 돼요.
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--color-funnel-text-soft)]">
              최근 {supplement.travelMonthWeather.basedOnYears}년 흐름 기준
            </p>
          </article>
        ) : null}

        {supplement.weather ? (
          <article className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              현재 참고
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
              지금 {destinationName}은 {supplement.weather.summary}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
              지금 {supplement.weather.temperatureC}° · 체감 {supplement.weather.apparentTemperatureC}° · 최고{" "}
              {supplement.weather.maxTemperatureC}° / 최저 {supplement.weather.minTemperatureC}°
            </p>
          </article>
        ) : null}

        {supplement.exchangeRate ? (
          <article className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              환율 참고
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
              {supplement.exchangeRate.summary}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
              {supplement.exchangeRate.baseCurrency} 기준 · {formatObservedTime(supplement.exchangeRate.observedAt)}
            </p>
          </article>
        ) : null}

        {supplement.mapEmbed ? (
          <article className="overflow-hidden rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)]">
            <div className="border-b border-[color:var(--color-funnel-border)] px-3.5 py-3">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                지도
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                {destinationName} 위치 감만 짧게 확인해 보세요.
              </p>
            </div>
            <iframe
              src={supplement.mapEmbed.src}
              title={supplement.mapEmbed.title}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-40 w-full border-0"
            />
          </article>
        ) : null}
      </div>

      {supplement.nearbyPlaces && supplement.nearbyPlaces.length > 0 ? (
        <div className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                주변 장소
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                도착 후 바로 감 잡기 좋은 곳만 추렸어요.
              </p>
            </div>
            <p className="text-[11px] leading-5 text-[var(--color-funnel-text-soft)]">
              {formatObservedTime(supplement.fetchedAt)} 기준
            </p>
          </div>

          <div className="mt-3 grid gap-2">
            {supplement.nearbyPlaces.slice(0, 5).map((place) => (
              <a
                key={place.id}
                href={place.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-3 rounded-[0.9rem] border border-[color:var(--color-funnel-border)] bg-white px-3 py-2.5 transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-funnel-text)]">{place.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-[var(--color-funnel-text-soft)]">
                    {place.shortAddress}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-[var(--color-action-primary)]">
                  지도
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
