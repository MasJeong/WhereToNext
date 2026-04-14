"use client";

import Image from "next/image";

import type { DestinationTravelSupplement } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

import { InteractiveDestinationMapCard } from "./interactive-destination-map-card";

type TravelSupportPanelProps = {
  supplement: DestinationTravelSupplement | null | undefined;
  destinationName: string;
  travelMonth?: number;
  heroMode?: "hero" | "compact";
  layout?: "full" | "summary";
  rootClassName?: string;
  showWeatherSummary?: boolean;
  summaryFacts?: Array<{
    label: string;
    value: string;
  }>;
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

function describeAverageTemperature(averageMinTemperatureC: number, averageMaxTemperatureC: number) {
  const averageTemperature = (averageMinTemperatureC + averageMaxTemperatureC) / 2;

  if (averageTemperature < 5) {
    return "추운 편";
  }

  if (averageTemperature < 12) {
    return "쌀쌀한 편";
  }

  if (averageTemperature < 20) {
    return "돌아다니기 좋음";
  }

  if (averageTemperature < 27) {
    return "살짝 더운 편";
  }

  return "더운 편";
}

function describeRainyDayRatio(rainyDayRatio: number) {
  if (rainyDayRatio >= 50) {
    return "비 잦음";
  }

  if (rainyDayRatio >= 30) {
    return "비 가끔";
  }

  if (rainyDayRatio >= 15) {
    return "비 변수 약간";
  }

  return "비 걱정 적음";
}

function describeSeasonCondition(
  averageMinTemperatureC: number,
  averageMaxTemperatureC: number,
  rainyDayRatio: number,
) {
  const averageTemperature = (averageMinTemperatureC + averageMaxTemperatureC) / 2;

  if (averageTemperature <= 0) {
    return "눈 가능성";
  }

  if (rainyDayRatio >= 50) {
    return "비 잦음";
  }

  if (rainyDayRatio >= 30) {
    return "비 가끔";
  }

  if (rainyDayRatio >= 15) {
    return "구름·비 변수";
  }

  return "맑은 편";
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
  showWeatherSummary = true,
  summaryFacts = [],
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
        <p className="text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
          {formatTravelMonth(travelMonth)} · 날씨를 확인하고 있어요.
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
          외부 날씨 데이터를 불러오면 이 자리에서 평균 기온과 비 오는 날 비중까지 바로 보여드릴게요.
        </p>
      </section>
    );
  }

  const leadTravelMonth = supplement.travelMonthWeather?.travelMonth;
  const leadTravelWeatherSummary = supplement.travelMonthWeather?.summary;
  const compactTravelWeatherSummary = supplement.travelMonthWeather
    ? `${describeAverageTemperature(
        supplement.travelMonthWeather.averageMinTemperatureC,
        supplement.travelMonthWeather.averageMaxTemperatureC,
      )}, ${describeRainyDayRatio(supplement.travelMonthWeather.rainyDayRatio)}`
    : undefined;

  if (layout === "summary") {
    return (
      <section
        data-testid={testIds.detail.travelSupport}
        className={`space-y-3 ${rootClassName}`.trim()}
      >
        {supplement.map ? (
          <InteractiveDestinationMapCard
            map={supplement.map}
            destinationName={destinationName}
            size="summary"
          />
        ) : null}

        {showWeatherSummary || summaryFacts.length > 0 ? (
          <article className="rounded-[0.95rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 py-2.5">
            <div className="space-y-1.5">
              {showWeatherSummary ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[0.82rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
                    {leadTravelMonth
                      ? `${formatTravelMonth(leadTravelMonth)} · ${compactTravelWeatherSummary ?? leadTravelWeatherSummary ?? `${destinationName}의 시기별 날씨를 함께 보고 결정해 보세요.`}`
                      : compactTravelWeatherSummary ?? leadTravelWeatherSummary ?? `${destinationName}의 시기별 날씨를 함께 보고 결정해 보세요.`}
                  </p>
                  {supplement.travelMonthWeather ? (
                    <>
                      <article className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2 py-[0.22rem]">
                        <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                          평균 {supplement.travelMonthWeather.averageMinTemperatureC}°~{supplement.travelMonthWeather.averageMaxTemperatureC}°
                        </p>
                      </article>
                      <article className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2 py-[0.22rem]">
                        <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                          {describeSeasonCondition(
                            supplement.travelMonthWeather.averageMinTemperatureC,
                            supplement.travelMonthWeather.averageMaxTemperatureC,
                            supplement.travelMonthWeather.rainyDayRatio,
                          )}
                        </p>
                      </article>
                    </>
                  ) : null}

                  {supplement.weather ? (
                    <article className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2 py-[0.22rem]">
                      <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                        지금 {supplement.weather.summary}
                      </p>
                    </article>
                  ) : null}
                </div>
              ) : null}

              {summaryFacts.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {summaryFacts.map((fact) => (
                    <article
                      key={fact.label}
                      className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2 py-[0.22rem]"
                    >
                      <p className="text-[0.68rem] font-semibold text-[var(--color-funnel-text)]">
                        {fact.label} {fact.value}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ) : null}

        {supplement.nearbyPlaces && supplement.nearbyPlaces.length > 0 ? (
          <article className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                  먼저 볼 만한 곳
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-funnel-text)]">
                  {destinationName}에서 바로 동선에 넣기 좋은 장소예요.
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]">
                {supplement.nearbyPlaces.slice(0, 3).length}곳
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {supplement.nearbyPlaces.slice(0, 3).map((place, index) => (
                <a
                  key={place.id}
                  data-testid={index === 0 ? testIds.detail.nearbyPlace0 : undefined}
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[0.9rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-3 transition-colors duration-200 hover:border-[var(--color-action-primary)] hover:bg-white"
                >
                  <p className="text-sm font-semibold text-[var(--color-funnel-text)]">{place.name}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-funnel-text-soft)]">
                    {place.shortAddress}
                  </p>
                </a>
              ))}
            </div>
          </article>
        ) : null}
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
          {leadTravelMonth ? `${formatTravelMonth(leadTravelMonth)} 여행 날씨` : "여행 날씨"}
        </p>
        <p className="text-[1rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
          {leadTravelWeatherSummary ?? `${destinationName}의 날씨를 미리 알아보세요.`}
        </p>
        <p className="text-sm leading-6 text-[var(--color-funnel-text-soft)]">
          {leadTravelMonth
            ? `${formatTravelMonth(leadTravelMonth)} ${destinationName}의 평균 날씨예요.`
            : `${destinationName}의 날씨 정보예요.`}
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

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {supplement.map ? (
          <InteractiveDestinationMapCard
            map={supplement.map}
            destinationName={destinationName}
            className="bg-[var(--color-funnel-muted)] sm:col-span-2 xl:col-span-2"
          />
        ) : null}

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
              비 오는 날이 약 {supplement.travelMonthWeather.rainyDayRatio}% 정도예요.
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
