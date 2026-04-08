import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TravelSupportPanel } from "@/components/trip-compass/travel-support-panel";

describe("TravelSupportPanel", () => {
  it("prioritizes selected travel-month weather above current weather", () => {
    render(
      <TravelSupportPanel
        destinationName="발리"
        supplement={{
          location: {
            latitude: -8.34,
            longitude: 115.09,
            countryCode: "ID",
            countryName: "Indonesia",
            currencyCode: "IDR",
          },
          weather: {
            summary: "맑아요",
            temperatureC: 29,
            apparentTemperatureC: 31,
            minTemperatureC: 25,
            maxTemperatureC: 31,
            precipitationProbability: 18,
            observedAt: "2026-03-29T00:00:00.000Z",
          },
          travelMonthWeather: {
            travelMonth: 10,
            summary: "10월엔 조금 덥지만 움직이기 괜찮고 비 변수는 낮은 편이에요.",
            averageMinTemperatureC: 24.1,
            averageMaxTemperatureC: 30.2,
            rainyDayRatio: 12,
            basedOnYears: 5,
          },
          map: {
            latitude: -8.34,
            longitude: 115.09,
            zoom: 11,
            title: "발리 지도",
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=-8.34%2C115.09",
          },
          nearbyPlaces: [
            {
              id: "place-1",
              name: "우붓 왕궁",
              shortAddress: "Ubud, Gianyar Regency",
              googleMapsUrl: "https://maps.google.com/?cid=1",
            },
          ],
          fetchedAt: "2026-03-29T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("10월 여행 날씨")).toBeInTheDocument();
    expect(screen.getByText("10월엔 조금 덥지만 움직이기 괜찮고 비 변수는 낮은 편이에요.")).toBeInTheDocument();
    expect(screen.getByText("선택한 시기 평균")).toBeInTheDocument();
    expect(screen.getByText("현재 참고")).toBeInTheDocument();
    expect(screen.getByText(/10월 평균 최고 30.2° \/ 최저 24.1°/)).toBeInTheDocument();
  });

  it("renders a slimmer summary layout for the result page", () => {
    render(
      <TravelSupportPanel
        destinationName="발리"
        layout="summary"
        supplement={{
          location: {
            latitude: -8.34,
            longitude: 115.09,
            countryCode: "ID",
            countryName: "Indonesia",
            currencyCode: "IDR",
          },
          weather: {
            summary: "맑아요",
            temperatureC: 29,
            apparentTemperatureC: 31,
            minTemperatureC: 25,
            maxTemperatureC: 31,
            precipitationProbability: 18,
            observedAt: "2026-03-29T00:00:00.000Z",
          },
          travelMonthWeather: {
            travelMonth: 10,
            summary: "10월엔 조금 덥지만 움직이기 괜찮고 비 변수는 낮은 편이에요.",
            averageMinTemperatureC: 24.1,
            averageMaxTemperatureC: 30.2,
            rainyDayRatio: 12,
            basedOnYears: 5,
          },
          map: {
            latitude: -8.34,
            longitude: 115.09,
            zoom: 11,
            title: "발리 지도",
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=-8.34%2C115.09",
          },
          nearbyPlaces: [
            {
              id: "place-1",
              name: "우붓 왕궁",
              shortAddress: "Ubud, Gianyar Regency",
              googleMapsUrl: "https://maps.google.com/?cid=1",
            },
            {
              id: "place-2",
              name: "뜨갈랄랑 라이스 테라스",
              shortAddress: "Tegallalang, Gianyar Regency",
              googleMapsUrl: "https://maps.google.com/?cid=2",
            },
          ],
          fetchedAt: "2026-03-29T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("10월 · 더운 편, 비 걱정 적음")).toBeInTheDocument();
    expect(screen.queryByText("환율 참고")).not.toBeInTheDocument();
    expect(screen.getByText("평균 24.1°~30.2°")).toBeInTheDocument();
    expect(screen.getByText("맑은 편")).toBeInTheDocument();
    expect(screen.getByText("지금 맑아요")).toBeInTheDocument();
    expect(screen.getByText("구글맵으로 발리 위치를 바로 확인해 보세요.")).toBeInTheDocument();
    expect(screen.getByText("구글맵 보기")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "지도 새 탭에서 열기" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=-8.34%2C115.09",
    );
  });

  it("shows a fallback summary block when external weather data is unavailable", () => {
    render(
      <TravelSupportPanel
        destinationName="발리"
        travelMonth={10}
        layout="summary"
        supplement={null}
      />,
    );

    expect(screen.getByText("10월 · 날씨를 확인하고 있어요.")).toBeInTheDocument();
  });
});
