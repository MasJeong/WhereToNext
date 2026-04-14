import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { getDestinationTravelSupplement } from "@/lib/travel-support/service";

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

  afterEach(() => {
    process.env.UNSPLASH_ACCESS_KEY = originalEnv.UNSPLASH_ACCESS_KEY;
    process.env.GOOGLE_MAPS_API_KEY = originalEnv.GOOGLE_MAPS_API_KEY;
    process.env.EXCHANGERATE_HOST_ACCESS_KEY = originalEnv.EXCHANGERATE_HOST_ACCESS_KEY;
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

      if (requestUrl.includes("places.googleapis.com")) {
        return createJsonResponse({
          places: [
            {
              id: "place-1",
              displayName: { text: "센소지" },
              formattedAddress: "Taito City, Tokyo",
              googleMapsUri: "https://maps.google.com/?cid=1",
            },
            {
              id: "place-2",
              displayName: { text: "시부야 스카이" },
              formattedAddress: "Shibuya City, Tokyo",
              googleMapsUri: "https://maps.google.com/?cid=2",
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

    const supplement = await getDestinationTravelSupplement(destination!);

    expect(fetchMock).toHaveBeenCalled();
    expect(supplement?.location.countryCode).toBe("JP");
    expect(supplement?.heroImage?.sourceLabel).toBe("Unsplash");
    expect(supplement?.weather?.summary).toBe("맑아요");
    expect(supplement?.nearbyPlaces).toHaveLength(2);
    expect(supplement?.exchangeRate?.quoteCurrency).toBe("JPY");
    expect(supplement?.mapEmbed?.src).toContain("google.com/maps/embed/v1/place");
  });

  it("keeps partial data when optional providers fail", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("geocoding-api.open-meteo.com")) {
        return createJsonResponse({
          results: [{ latitude: 48.8566, longitude: 2.3522 }],
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

    const supplement = await getDestinationTravelSupplement(destination!);

    expect(supplement?.location.countryCode).toBe("FR");
    expect(supplement?.weather?.summary).toBe("흐린 편이에요");
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
});
