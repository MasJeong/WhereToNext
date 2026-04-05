import {
  activeFlightAffiliatePartner,
  departureAirportAffiliateTargets,
  destinationFlightAffiliateCatalog,
  type FlightAffiliateRouteTarget,
} from "@/lib/affiliate/catalog";
import type {
  AffiliatePartner,
  DestinationProfile,
  RecommendationQuery,
} from "@/lib/domain/contracts";
import { formatDepartureAirport, formatTravelMonth, formatTripLengthBand } from "@/lib/trip-compass/presentation";

const destinationFlightAffiliateIndex = new Map(
  destinationFlightAffiliateCatalog.map((entry) => [entry.destinationId, entry]),
);

export type DestinationFlightAffiliateLink = {
  destinationId: string;
  partner: AffiliatePartner;
  partnerLabel: string;
  category: "flight";
  url: string;
  eyebrow: string;
  title: string;
  ctaLabel: string;
  disclosureLabel: string;
  disclosureDetail: string;
  summary: string;
};

function buildSkyscannerRouteUrl(origin: FlightAffiliateRouteTarget, destination: FlightAffiliateRouteTarget): string {
  return `https://www.skyscanner.co.kr/routes/${origin.entityId.toLowerCase()}/${destination.entityId.toLowerCase()}/${origin.slug}-to-${destination.slug}.html`;
}

function buildTripComRouteUrl(origin: FlightAffiliateRouteTarget, destination: FlightAffiliateRouteTarget): string {
  return `https://kr.trip.com/flights/${origin.slug}-to-${destination.slug}/airfares-${origin.entityId.toLowerCase()}-${destination.entityId.toLowerCase()}/?locale=ko-KR&curr=KRW`;
}

function buildFlightAffiliateSummary(query: RecommendationQuery): string {
  return `${formatTravelMonth(query.travelMonth)} ${formatTripLengthBand(query.tripLengthDays)} 일정에 맞춰 바로 비교할 수 있어요.`;
}

function buildLinkForPartner(
  partner: AffiliatePartner,
  destinationId: string,
  query: RecommendationQuery,
): string | null {
  const departure = departureAirportAffiliateTargets[query.departureAirport];
  const destination = destinationFlightAffiliateIndex.get(destinationId);

  if (!departure || !destination) {
    return null;
  }

  if (partner === "skyscanner") {
    return buildSkyscannerRouteUrl(departure.skyscanner, destination.skyscanner);
  }

  return buildTripComRouteUrl(departure.tripCom, destination.tripCom);
}

/**
 * 목적지 상세에서 사용할 항공권 제휴 링크를 계산한다.
 * @param destination 목적지 프로필
 * @param query 현재 추천 질의
 * @returns 렌더 가능한 항공권 제휴 링크 또는 null
 */
export function resolveDestinationFlightAffiliateLink(
  destination: Pick<DestinationProfile, "id" | "nameKo">,
  query: RecommendationQuery | null | undefined,
): DestinationFlightAffiliateLink | null {
  if (!query) {
    return null;
  }

  const primaryUrl = buildLinkForPartner(activeFlightAffiliatePartner, destination.id, query);
  const fallbackPartner: AffiliatePartner =
    activeFlightAffiliatePartner === "skyscanner" ? "trip-com" : "skyscanner";
  const resolvedPartner = primaryUrl ? activeFlightAffiliatePartner : fallbackPartner;
  const resolvedUrl = primaryUrl ?? buildLinkForPartner(fallbackPartner, destination.id, query);

  if (!resolvedUrl) {
    return null;
  }

  return {
    destinationId: destination.id,
    partner: resolvedPartner,
    partnerLabel: resolvedPartner === "skyscanner" ? "Skyscanner" : "Trip.com",
    category: "flight",
    url: resolvedUrl,
    eyebrow: "다음 단계",
    title: `${formatDepartureAirport(query.departureAirport)} 출발 항공권을 확인해 보세요.`,
    ctaLabel: `${formatDepartureAirport(query.departureAirport)} 출발 ${formatTravelMonth(query.travelMonth)} 항공권 보기`,
    disclosureLabel: "제휴 링크 포함",
    disclosureDetail: "외부 예약 페이지로 이동하며, 예약이나 구매가 발생하면 수수료를 받을 수 있어요.",
    summary: buildFlightAffiliateSummary(query),
  };
}
