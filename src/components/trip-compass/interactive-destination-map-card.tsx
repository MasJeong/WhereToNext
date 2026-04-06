"use client";

import { useEffect, useRef, useState } from "react";

import type { DestinationTravelSupplement } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

type DestinationMap = NonNullable<DestinationTravelSupplement["map"]>;

type InteractiveDestinationMapCardProps = {
  map: DestinationMap;
  destinationName: string;
  className?: string;
};

type GoogleMapOptions = {
  center: { lat: number; lng: number };
  zoom: number;
  fullscreenControl: boolean;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  zoomControl: boolean;
  gestureHandling: "greedy";
};

type GoogleMapsNamespace = {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => unknown;
    Marker: new (options: {
      map: unknown;
      position: { lat: number; lng: number };
      title: string;
    }) => unknown;
  };
};

declare global {
  interface Window {
    __tripCompassInitGoogleMaps?: () => void;
    __tripCompassGoogleMapsPromise?: Promise<GoogleMapsNamespace>;
    google?: GoogleMapsNamespace;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "trip-compass-google-maps-script";

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsNamespace> {
  if (window.google) {
    return Promise.resolve(window.google);
  }

  if (window.__tripCompassGoogleMapsPromise) {
    return window.__tripCompassGoogleMapsPromise;
  }

  window.__tripCompassGoogleMapsPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    window.__tripCompassInitGoogleMaps = () => {
      if (window.google) {
        resolve(window.google);
        return;
      }

      reject(new Error("GOOGLE_MAPS_UNAVAILABLE"));
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=__tripCompassInitGoogleMaps&v=quarterly`;
    script.onerror = () => reject(new Error("GOOGLE_MAPS_LOAD_FAILED"));
    document.head.appendChild(script);
  });

  return window.__tripCompassGoogleMapsPromise;
}

export function InteractiveDestinationMapCard({
  map,
  destinationName,
  className = "",
}: InteractiveDestinationMapCardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const canOpenInteractiveMap = apiKey.length > 0;
  const [isInteractiveOpen, setIsInteractiveOpen] = useState(false);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!isInteractiveOpen || !apiKey || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    let isCancelled = false;

    void loadGoogleMaps(apiKey)
      .then((googleMaps) => {
        if (isCancelled || !mapContainerRef.current) {
          return;
        }

        const mapInstance = new googleMaps.maps.Map(mapContainerRef.current, {
          center: {
            lat: map.latitude,
            lng: map.longitude,
          },
          zoom: map.zoom,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: "greedy",
        });

        mapInstanceRef.current = mapInstance;
        new googleMaps.maps.Marker({
          map: mapInstance,
          position: {
            lat: map.latitude,
            lng: map.longitude,
          },
          title: map.title,
        });
        setLoadState("ready");
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setLoadState("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [apiKey, isInteractiveOpen, map.latitude, map.longitude, map.title, map.zoom]);

  const shellClassName = `overflow-hidden rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-white ${className}`.trim();

  return (
    <article className={shellClassName}>
      <div className="border-b border-[color:var(--color-funnel-border)] px-3.5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              지도
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-funnel-text)]">
              {destinationName}가 어디에 붙어 있는지 먼저 감 잡아보세요.
            </p>
          </div>
          <a
            href={map.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[0.72rem] font-semibold text-[var(--color-action-primary)] transition-colors duration-200 hover:text-[var(--color-action-primary-strong)]"
          >
            지도 새 탭에서 열기
          </a>
        </div>
      </div>

      {!isInteractiveOpen ? (
        <div
          data-testid={testIds.detail.travelMapPreview}
          className="relative flex h-44 flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#eef6ff_0%,#fff6ea_100%)] p-4"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-action-primary)] shadow-[0_0_0_8px_rgba(20,184,166,0.12)]" />
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text)] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              {canOpenInteractiveMap ? "드래그 · 확대 가능" : "위치 감 먼저 보기"}
            </span>
            <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]">
              중심 좌표 {map.latitude.toFixed(2)}, {map.longitude.toFixed(2)}
            </span>
          </div>

          <div className="relative z-10 space-y-2">
            <p className="max-w-sm text-sm font-semibold leading-6 text-[var(--color-funnel-text)]">
              위치 감만 보는 작은 썸네일이 아니라, 눌러서 바로 움직여 볼 수 있는 지도로 열어둘게요.
            </p>
            {canOpenInteractiveMap ? (
              <button
                type="button"
                data-testid={testIds.detail.travelMapActivate}
                onClick={() => {
                  setLoadState("loading");
                  setIsInteractiveOpen(true);
                }}
                className="inline-flex min-h-[2.5rem] items-center rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[0.72rem] font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
              >
                지도 직접 보기
              </button>
            ) : (
              <a
                data-testid={testIds.detail.travelMapActivate}
                href={map.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[2.5rem] items-center rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[0.72rem] font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
              >
                Google 지도에서 보기
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="relative h-52 bg-[var(--color-funnel-muted)]">
          <div
            ref={mapContainerRef}
            data-testid={testIds.detail.travelMapCanvas}
            className="h-full w-full"
          />
          {loadState !== "ready" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/72 backdrop-blur-sm">
              <div className="space-y-2 text-center">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                  Interactive Map
                </p>
                <p className="text-sm font-semibold text-[var(--color-funnel-text)]">
                  {loadState === "error" ? "지도를 바로 열지 못했어요." : "지도를 준비하고 있어요."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
