"use client";

import Image from "next/image";

import type { DestinationTravelSupplement } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

type TravelSupportPanelProps = {
  supplement: DestinationTravelSupplement | null | undefined;
  destinationName: string;
  heroMode?: "hero" | "compact";
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
  heroMode = "compact",
  rootClassName = "",
}: TravelSupportPanelProps) {
  if (!supplement) {
    return null;
  }

  return (
    <section
      data-testid={testIds.detail.travelSupport}
      className={`space-y-3 rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-white p-4 ${rootClassName}`.trim()}
    >
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
        {supplement.weather ? (
          <article className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              날씨
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
              {supplement.weather.summary}
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
