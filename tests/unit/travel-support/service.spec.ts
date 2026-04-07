import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import {
  clearDestinationTravelSupplementCacheForTests,
  getDestinationTravelSupplement,
} from "@/lib/travel-support/service";

const originalEnv = {
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  EXCHANGERATE_HOST_ACCESS_KEY: process.env.EXCHANGERATE_HOST_ACCESS_KEY,
};

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
    ...init,
  });
}

describe("getDestinationTravelSupplement", () => {
  beforeEach(() => {
    process.env.UNSPLASH_ACCESS_KEY = "test-unsplash";
    process.env.GOOGLE_MAPS_API_KEY = "test-google";
    process.env.EXCHANGERATE_HOST_ACCESS_KEY = "test-exchange";
  });

  afterEach(async () => {
    process.env.UNSPLASH_ACCESS_KEY = originalEnv.UNSPLASH_ACCESS_KEY;
    process.env.GOOGLE_MAPS_API_KEY = originalEnv.GOOGLE_MAPS_API_KEY;
    process.env.EXCHANGERATE_HOST_ACCESS_KEY = originalEnv.EXCHANGERATE_HOST_ACCESS_KEY;
    await clearDestinationTravelSupplementCacheForTests();
    vi.restoreAllMocks();
  });

  it("returns a parsed supplement when providers respond", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("geocoding-api.open-meteo.com")) {
        return createJsonResponse({
          results: [{ latitude: 35.6764, longitude: 139.6500 }],
        });
      }

      if (requestUrl.includes("archive-api.open-meteo.com")) {
        return createJsonResponse({
          daily: {
            time: [
              "2021-10-05",
              "2022-10-12",
              "2023-10-18",
              "2024-10-09",
              "2025-10-21",
            ],
            temperature_2m_max: [22, 21, 20, 23, 19],
            temperature_2m_min: [14, 13, 12, 15, 11],
            precipitation_sum: [0, 0.2, 1.6, 0, 2.1],
          },
        });
      }

      if (requestUrl.includes("api.open-meteo.com")) {
        return createJsonResponse({
          current: {
            temperature_2m: 17.8,
            apparent_temperature: 16.9,
            weather_code: 0,
            time: "2026-03-27T09:00",
          },
          daily: {
            temperature_2m_max: [20.1],
            temperature_2m_min: [11.6],
            precipitation_probability_max: [8],
          },
        });
      }

      if (requestUrl.includes("api.unsplash.com")) {
        return createJsonResponse({
          results: [
            {
              alt_description: "Tokyo skyline",
              urls: { regular: "https://images.example.com/tokyo.jpg" },
              user: {
                name: "Photo Author",
                links: { html: "https://unsplash.com/@author" },
              },
            },
          ],
        });
      }

      if (requestUrl.includes("api.exchangerate.host")) {
        return createJsonResponse({
          success: true,
          timestamp: 1774573200,
          quotes: {
            KRWJPY: 0.11,
          },
        });
      }

      throw new Error(`unexpected fetch: ${requestUrl}`);
    });

    const destination = launchCatalog.find((item) => item.id === "tokyo");
    expect(destination).toBeTruthy();

    const supplement = await getDestinationTravelSupplement(destination!, 10);

    expect(fetchMock).toHaveBeenCalled();
    expect(supplement?.location.countryCode).toBe("JP");
    expect(supplement?.heroImage?.sourceLabel).toBe("Unsplash");
    expect(supplement?.weather?.summary).toBe("맑아요");
    expect(supplement?.travelMonthWeather?.travelMonth).toBe(10);
    expect(supplement?.travelMonthWeather?.averageMaxTemperatureC).toBe(21);
    expect(supplement?.travelMonthWeather?.rainyDayRatio).toBe(40);
    expect(supplement?.nearbyPlaces).toBeUndefined();
    expect(supplement?.exchangeRate?.quoteCurrency).toBe("JPY");
    expect(supplement?.map?.title).toBe("도쿄 지도");
    expect(supplement?.map?.googleMapsUrl).toContain("google.com/maps/search");
  });

  it("keeps partial data when optional providers fail", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("geocoding-api.open-meteo.com")) {
        return createJsonResponse({
          results: [{ latitude: 48.8566, longitude: 2.3522 }],
        });
      }

      if (requestUrl.includes("archive-api.open-meteo.com")) {
        return createJsonResponse({
          daily: {
            time: ["2021-10-04", "2022-10-18"],
            temperature_2m_max: [18, 17],
            temperature_2m_min: [10, 9],
            precipitation_sum: [0, 3],
          },
        });
      }

      if (requestUrl.includes("api.open-meteo.com")) {
        return createJsonResponse({
          current: {
            temperature_2m: 14,
            apparent_temperature: 13,
            weather_code: 3,
            time: "2026-03-27T09:00",
          },
          daily: {
            temperature_2m_max: [17],
            temperature_2m_min: [9],
            precipitation_probability_max: [30],
          },
        });
      }

      return new Response("provider-failed", { status: 500 });
    });

    const destination = launchCatalog.find((item) => item.id === "paris");
    expect(destination).toBeTruthy();

    const supplement = await getDestinationTravelSupplement(destination!, 10);

    expect(supplement?.location.countryCode).toBe("FR");
    expect(supplement?.weather?.summary).toBe("흐린 편이에요");
    expect(supplement?.travelMonthWeather?.travelMonth).toBe(10);
    expect(supplement?.heroImage).toBeUndefined();
    expect(supplement?.nearbyPlaces).toBeUndefined();
    expect(supplement?.exchangeRate).toBeUndefined();
  });

  it("returns null when geocoding fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not-found", { status: 500 }));

    const destination = launchCatalog.find((item) => item.id === "tokyo");
    expect(destination).toBeTruthy();

    const supplement = await getDestinationTravelSupplement(destination!);

    expect(supplement).toBeNull();
  });

  it("reuses the cached supplement for the same destination and travel month", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("geocoding-api.open-meteo.com")) {
        return createJsonResponse({
          results: [{ latitude: 35.6764, longitude: 139.6500 }],
        });
      }

      if (requestUrl.includes("archive-api.open-meteo.com")) {
        return createJsonResponse({
          daily: {
            time: ["2021-07-05", "2022-07-12", "2023-07-18", "2024-07-09", "2025-07-21"],
            temperature_2m_max: [31, 30, 29, 32, 30],
            temperature_2m_min: [23, 22, 24, 23, 22],
            precipitation_sum: [3, 0.2, 1.6, 0, 2.1],
          },
        });
      }

      if (requestUrl.includes("api.open-meteo.com")) {
        return createJsonResponse({
          current: {
            temperature_2m: 28.1,
            apparent_temperature: 29.4,
            weather_code: 2,
            time: "2026-04-06T09:00",
          },
          daily: {
            temperature_2m_max: [31.2],
            temperature_2m_min: [24.1],
            precipitation_probability_max: [25],
          },
        });
      }

      if (requestUrl.includes("api.unsplash.com")) {
        return createJsonResponse({
          results: [
            {
              alt_description: "Tokyo skyline",
              urls: { regular: "https://images.example.com/tokyo.jpg" },
              user: {
                name: "Photo Author",
                links: { html: "https://unsplash.com/@author" },
              },
            },
          ],
        });
      }

      if (requestUrl.includes("places.googleapis.com")) {
        return createJsonResponse({
          places: [
            {
              id: "place-1",
              displayName: { text: "센소지" },
              formattedAddress: "Taito City, Tokyo",
              googleMapsUri: "https://maps.google.com/?cid=1",
            },
          ],
        });
      }

      if (requestUrl.includes("api.exchangerate.host")) {
        return createJsonResponse({
          success: true,
          timestamp: 1774573200,
          quotes: {
            KRWJPY: 0.11,
          },
        });
      }

      throw new Error(`unexpected fetch: ${requestUrl}`);
    });

    const destination = launchCatalog.find((item) => item.id === "tokyo");
    expect(destination).toBeTruthy();

    const first = await getDestinationTravelSupplement(destination!, 7);
    const firstCallCount = fetchMock.mock.calls.length;
    const second = await getDestinationTravelSupplement(destination!, 7);

    expect(second).toEqual(first);
    expect(fetchMock.mock.calls.length).toBe(firstCallCount);
  });
});
