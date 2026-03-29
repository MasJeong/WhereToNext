import type { DestinationProfile, DestinationTravelSupplement } from "@/lib/domain/contracts";
import { destinationTravelSupplementSchema } from "@/lib/domain/contracts";

import { getCountryMetadata } from "./country-metadata";

type OpenMeteoGeocodingResponse = {
  results?: Array<{
    latitude: number;
    longitude: number;
  }>;
};

type OpenMeteoForecastResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    time?: string;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

type OpenMeteoArchiveResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
};

type UnsplashSearchResponse = {
  results?: Array<{
    alt_description?: string | null;
    urls?: {
      regular?: string;
    };
    user?: {
      name?: string;
      links?: {
        html?: string;
      };
    };
  }>;
};

type GooglePlacesTextSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: {
      text?: string;
    };
    formattedAddress?: string;
    googleMapsUri?: string;
  }>;
};

type ExchangeRateLiveResponse = {
  success?: boolean;
  timestamp?: number;
  quotes?: Record<string, number>;
};

type LocationMeta = {
  latitude: number;
  longitude: number;
  countryCode: string;
  countryName: string;
  currencyCode: string;
};

const DEFAULT_REQUEST_OPTIONS = {
  headers: {
    accept: "application/json",
  },
  next: {
    revalidate: 3600,
  },
} satisfies RequestInit;

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "맑아요",
  1: "대체로 맑아요",
  2: "가끔 흐려져요",
  3: "흐린 편이에요",
  45: "안개가 낄 수 있어요",
  48: "안개가 짙을 수 있어요",
  51: "가벼운 이슬비가 있어요",
  53: "이슬비가 이어져요",
  55: "이슬비가 강한 편이에요",
  61: "비가 조금 와요",
  63: "비가 이어져요",
  65: "비가 강한 편이에요",
  71: "눈이 조금 와요",
  73: "눈이 이어져요",
  75: "눈이 많이 와요",
  80: "소나기가 있어요",
  81: "소나기가 이어져요",
  82: "소나기가 강한 편이에요",
  95: "뇌우 가능성이 있어요",
  96: "우박을 동반한 뇌우 가능성이 있어요",
  99: "강한 뇌우 가능성이 있어요",
};

function buildDestinationSearchLabel(destination: DestinationProfile, countryName: string) {
  return `${destination.nameEn}, ${countryName}`;
}

function roundTemperature(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value);
}

function roundAverage(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildTravelMonthWeatherSummary(
  travelMonth: number,
  averageMinTemperatureC: number,
  averageMaxTemperatureC: number,
  rainyDayRatio: number,
) {
  const averageTemperature = (averageMinTemperatureC + averageMaxTemperatureC) / 2;

  let temperatureTone = "가볍게 덥고";

  if (averageTemperature < 5) {
    temperatureTone = "제법 춥고";
  } else if (averageTemperature < 12) {
    temperatureTone = "서늘한 편이고";
  } else if (averageTemperature < 20) {
    temperatureTone = "걷기 무난한 편이고";
  } else if (averageTemperature < 27) {
    temperatureTone = "조금 덥지만 움직이기 괜찮고";
  }

  let rainTone = "비 변수는 낮은 편이에요.";

  if (rainyDayRatio >= 50) {
    rainTone = "비를 염두에 두고 동선을 짜는 편이 좋아요.";
  } else if (rainyDayRatio >= 30) {
    rainTone = "비 올 가능성을 조금 보고 움직이면 좋아요.";
  }

  return `${travelMonth}월엔 ${temperatureTone} ${rainTone}`;
}

/**
 * 외부 데이터 집계가 가능한 최소 환경 변수 집합을 읽는다.
 * @returns 공급자 키 구성
 */
function getProviderConfig() {
  return {
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY?.trim() ?? "",
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY?.trim() ?? "",
    exchangeRateHostAccessKey: process.env.EXCHANGERATE_HOST_ACCESS_KEY?.trim() ?? "",
  };
}

/**
 * Open-Meteo 지오코딩으로 목적지 좌표를 찾는다.
 * @param destination 목적지
 * @param countryName 영문 국가명
 * @returns 좌표 또는 null
 */
async function getDestinationLocation(
  destination: DestinationProfile,
  countryName: string,
  currencyCode: string,
): Promise<LocationMeta | null> {
  const searchLabel = buildDestinationSearchLabel(destination, countryName);
  const searchParams = new URLSearchParams({
    name: searchLabel,
    count: "1",
    language: "en",
    format: "json",
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${searchParams.toString()}`,
    DEFAULT_REQUEST_OPTIONS,
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OpenMeteoGeocodingResponse;
  const result = payload.results?.[0];

  if (!result) {
    return null;
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    countryCode: destination.countryCode,
    countryName,
    currencyCode,
  };
}

/**
 * Unsplash에서 대표 이미지를 가져온다.
 * @param destination 목적지
 * @param countryName 국가명
 * @param accessKey Unsplash access key
 * @returns 대표 이미지 또는 undefined
 */
async function getHeroImage(
  destination: DestinationProfile,
  countryName: string,
  accessKey: string,
): Promise<DestinationTravelSupplement["heroImage"] | undefined> {
  if (!accessKey) {
    return undefined;
  }

  const searchParams = new URLSearchParams({
    query: `${destination.nameEn} ${countryName} travel`,
    orientation: "landscape",
    per_page: "1",
    content_filter: "high",
  });

  const response = await fetch(`https://api.unsplash.com/search/photos?${searchParams.toString()}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      accept: "application/json",
    },
    next: {
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as UnsplashSearchResponse;
  const first = payload.results?.[0];

  if (!first?.urls?.regular || !first.user?.name || !first.user.links?.html) {
    return undefined;
  }

  return {
    url: first.urls.regular,
    alt: first.alt_description ?? `${destination.nameKo} 대표 풍경`,
    photographerName: first.user.name,
    photographerUrl: first.user.links.html,
    sourceLabel: "Unsplash",
  };
}

/**
 * Open-Meteo 현재 날씨와 오늘 범위를 가져온다.
 * @param location 목적지 좌표
 * @returns 날씨 스냅샷 또는 undefined
 */
async function getWeatherSnapshot(
  location: LocationMeta,
): Promise<DestinationTravelSupplement["weather"] | undefined> {
  const searchParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "1",
    timezone: "auto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${searchParams.toString()}`, {
    ...DEFAULT_REQUEST_OPTIONS,
    next: {
      revalidate: 1800,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as OpenMeteoForecastResponse;
  const current = payload.current;
  const daily = payload.daily;
  const temperatureC = roundTemperature(current?.temperature_2m);
  const apparentTemperatureC = roundTemperature(current?.apparent_temperature);
  const maxTemperatureC = roundTemperature(daily?.temperature_2m_max?.[0]);
  const minTemperatureC = roundTemperature(daily?.temperature_2m_min?.[0]);

  if (
    !current?.time ||
    temperatureC === null ||
    apparentTemperatureC === null ||
    maxTemperatureC === null ||
    minTemperatureC === null
  ) {
    return undefined;
  }

  return {
    summary: WEATHER_CODE_LABELS[current.weather_code ?? -1] ?? "오늘 날씨를 참고해 보세요",
    temperatureC,
    apparentTemperatureC,
    minTemperatureC,
    maxTemperatureC,
    precipitationProbability: Math.max(
      0,
      Math.min(100, Math.round(daily?.precipitation_probability_max?.[0] ?? 0)),
    ),
    observedAt: new Date(current.time).toISOString(),
  };
}

async function getTravelMonthWeatherSnapshot(
  location: LocationMeta,
  travelMonth: number,
): Promise<DestinationTravelSupplement["travelMonthWeather"] | undefined> {
  const now = new Date();
  const startDate = `${String(now.getUTCFullYear() - 5)}-01-01`;
  const endDate = `${String(now.getUTCFullYear() - 1)}-12-31`;
  const searchParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
  });

  const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${searchParams.toString()}`, {
    ...DEFAULT_REQUEST_OPTIONS,
    next: {
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as OpenMeteoArchiveResponse;
  const dates = payload.daily?.time ?? [];
  const maxTemperatures = payload.daily?.temperature_2m_max ?? [];
  const minTemperatures = payload.daily?.temperature_2m_min ?? [];
  const precipitation = payload.daily?.precipitation_sum ?? [];

  const matchingIndexes = dates
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.getUTCMonth() + 1 === travelMonth;
    })
    .map(({ index }) => index);

  if (matchingIndexes.length === 0) {
    return undefined;
  }

  const monthMaxTemperatures = matchingIndexes
    .map((index) => maxTemperatures[index])
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  const monthMinTemperatures = matchingIndexes
    .map((index) => minTemperatures[index])
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  const rainyDays = matchingIndexes.filter((index) => (precipitation[index] ?? 0) >= 1);
  const averageMaxTemperatureC = average(monthMaxTemperatures);
  const averageMinTemperatureC = average(monthMinTemperatures);

  if (averageMaxTemperatureC === null || averageMinTemperatureC === null) {
    return undefined;
  }

  const basedOnYears = new Set(
    matchingIndexes.map((index) => dates[index]?.slice(0, 4)).filter((value): value is string => Boolean(value)),
  ).size;
  const rainyDayRatio = Math.round((rainyDays.length / matchingIndexes.length) * 100);

  return {
    travelMonth,
    summary: buildTravelMonthWeatherSummary(
      travelMonth,
      roundAverage(averageMinTemperatureC),
      roundAverage(averageMaxTemperatureC),
      rainyDayRatio,
    ),
    averageMinTemperatureC: roundAverage(averageMinTemperatureC),
    averageMaxTemperatureC: roundAverage(averageMaxTemperatureC),
    rainyDayRatio,
    basedOnYears,
  };
}

/**
 * Google Places에서 주변 장소를 짧게 찾는다.
 * @param destination 목적지
 * @param location 목적지 좌표
 * @param apiKey Google Maps API key
 * @returns 주변 장소 목록 또는 undefined
 */
async function getNearbyPlaces(
  destination: DestinationProfile,
  location: LocationMeta,
  apiKey: string,
): Promise<DestinationTravelSupplement["nearbyPlaces"] | undefined> {
  if (!apiKey) {
    return undefined;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery: `${destination.nameEn} attractions`,
      languageCode: "ko",
      regionCode: destination.countryCode,
      pageSize: 5,
      locationBias: {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: 12000,
        },
      },
    }),
    next: {
      revalidate: 21600,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as GooglePlacesTextSearchResponse;
  const items =
    payload.places
      ?.map((place) => {
        if (!place.id || !place.displayName?.text || !place.formattedAddress || !place.googleMapsUri) {
          return null;
        }

        return {
          id: place.id,
          name: place.displayName.text,
          shortAddress: place.formattedAddress,
          googleMapsUrl: place.googleMapsUri,
        };
      })
      .filter((place): place is NonNullable<typeof place> => place !== null)
      .slice(0, 5) ?? [];

  return items.length > 0 ? items : undefined;
}

/**
 * Google Maps 임베드용 작은 지도 URL을 만든다.
 * @param destination 목적지
 * @param location 목적지 좌표
 * @param apiKey Google Maps API key
 * @returns 지도 임베드 정보 또는 undefined
 */
function getMapEmbed(
  destination: DestinationProfile,
  location: LocationMeta,
  apiKey: string,
): DestinationTravelSupplement["mapEmbed"] | undefined {
  if (!apiKey) {
    return undefined;
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    q: buildDestinationSearchLabel(destination, location.countryName),
    center: `${location.latitude},${location.longitude}`,
    zoom: "11",
    language: "ko",
  });

  return {
    src: `https://www.google.com/maps/embed/v1/place?${searchParams.toString()}`,
    title: `${destination.nameKo} 지도`,
  };
}

/**
 * 환율을 원화 기준 참고값으로 가져온다.
 * @param currencyCode 목적지 통화 코드
 * @param accessKey exchangerate.host access key
 * @returns 환율 요약 또는 undefined
 */
async function getExchangeRate(
  currencyCode: string,
  accessKey: string,
): Promise<DestinationTravelSupplement["exchangeRate"] | undefined> {
  if (!accessKey || currencyCode === "KRW") {
    return undefined;
  }

  const searchParams = new URLSearchParams({
    access_key: accessKey,
    source: "KRW",
    currencies: currencyCode,
  });

  const response = await fetch(`https://api.exchangerate.host/live?${searchParams.toString()}`, {
    ...DEFAULT_REQUEST_OPTIONS,
    next: {
      revalidate: 1800,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as ExchangeRateLiveResponse;
  const quote = payload.quotes?.[`KRW${currencyCode}`];

  if (!payload.success || !quote || !payload.timestamp) {
    return undefined;
  }

  return {
    baseCurrency: "KRW",
    quoteCurrency: currencyCode,
    quote,
    summary: `1,000원당 약 ${(quote * 1000).toFixed(currencyCode === "JPY" ? 0 : 2)} ${currencyCode}`,
    observedAt: new Date(payload.timestamp * 1000).toISOString(),
  };
}

/**
 * 목적지에 맞는 외부 여행 보조 데이터를 조합한다.
 * @param destination 목적지 프로필
 * @returns 표시 가능한 보조 정보 또는 null
 */
export async function getDestinationTravelSupplement(
  destination: DestinationProfile,
  travelMonth?: number,
): Promise<DestinationTravelSupplement | null> {
  const metadata = getCountryMetadata(destination.countryCode);

  if (!metadata) {
    return null;
  }

  try {
    const providerConfig = getProviderConfig();
    const location = await getDestinationLocation(
      destination,
      metadata.countryName,
      metadata.currencyCode,
    );

    if (!location) {
      return null;
    }

    const [heroImage, weather, travelMonthWeather, nearbyPlaces, exchangeRate] = await Promise.all([
      getHeroImage(destination, metadata.countryName, providerConfig.unsplashAccessKey).catch(() => undefined),
      getWeatherSnapshot(location).catch(() => undefined),
      typeof travelMonth === "number"
        ? getTravelMonthWeatherSnapshot(location, travelMonth).catch(() => undefined)
        : Promise.resolve(undefined),
      getNearbyPlaces(destination, location, providerConfig.googleMapsApiKey).catch(() => undefined),
      getExchangeRate(location.currencyCode, providerConfig.exchangeRateHostAccessKey).catch(() => undefined),
    ]);

    return destinationTravelSupplementSchema.parse({
      location,
      heroImage,
      weather,
      travelMonthWeather,
      nearbyPlaces,
      mapEmbed: getMapEmbed(destination, location, providerConfig.googleMapsApiKey),
      exchangeRate,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}
