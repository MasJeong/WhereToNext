"use client";

import { useEffect, useRef, useState } from "react";

import type { DestinationTravelSupplement } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

type DestinationMap = NonNullable<DestinationTravelSupplement["map"]>;

type InteractiveDestinationMapCardProps = {
  map: DestinationMap;
  destinationName: string;
  className?: string;
  size?: "default" | "summary";
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
  size = "default",
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
  const previewHeightClassName = size === "summary" ? "h-48 sm:h-52" : "h-44";
  const interactiveHeightClassName = size === "summary" ? "h-60 sm:h-68" : "h-52";
  const title = "위치 먼저 보기";
  const externalLinkText = "Google 지도 열기";
  const primaryActionText = "지도 열기";

  return (
    <article className={shellClassName}>
      <div className="border-b border-[color:var(--color-funnel-border)] px-3.5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
            {title}
          </p>
          <a
            href={map.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[0.72rem] font-semibold text-[var(--color-action-primary)] transition-colors duration-200 hover:text-[var(--color-action-primary-strong)]"
          >
            {externalLinkText}
          </a>
        </div>
      </div>

      {!isInteractiveOpen ? (
        <div
          data-testid={testIds.detail.travelMapPreview}
          className={`relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#eef6ff_0%,#fff6ea_100%)] p-4 ${previewHeightClassName}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative z-10" />

          <div className="relative z-10 max-w-sm space-y-2.5">
            <div className="inline-flex items-center rounded-full border border-white/60 bg-white/72 px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)] backdrop-blur-sm">
              {destinationName}
            </div>
            <p className="text-sm leading-6 text-[var(--color-funnel-text)]">
              중심 위치를 먼저 보고, 이동 동선이 맞으면 바로 Google 지도로 이어서 확인해 보세요.
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
                {primaryActionText}
              </button>
            ) : (
              <p className="text-[0.72rem] font-medium text-[var(--color-funnel-text-soft)]">
                지금은 미리보기 지도는 열 수 없어서 Google 지도로 바로 연결해 드려요.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={`relative bg-[var(--color-funnel-muted)] ${interactiveHeightClassName}`}>
          <div
            ref={mapContainerRef}
            data-testid={testIds.detail.travelMapCanvas}
            className="h-full w-full"
          />
          {loadState !== "ready" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/72 backdrop-blur-sm">
              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold text-[var(--color-funnel-text)]">
                  {loadState === "error" ? "지도를 바로 열지 못했어요." : "지도를 준비하고 있어요."}
                </p>
              </div>
            </div>
          ) : null}
          {loadState === "ready" ? (
            <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/92 px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text)] shadow-[0_8px_18px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                {destinationName}
              </div>
              <a
                href={map.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto rounded-full bg-white/92 px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-action-primary)] shadow-[0_8px_18px_rgba(15,23,42,0.12)] backdrop-blur-sm"
              >
                {externalLinkText}
              </a>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
