import type { MetadataRoute } from "next";
import { brandDisplayName, brandName } from "@/lib/brand";

/**
 * Returns the web app manifest used by the browser install prompt and icon lookup.
 * @returns Manifest metadata for the current visible brand
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brandDisplayName,
    short_name: brandName,
    description: `한국 출발 여행자를 위한 목적지 추천 플랫폼 ${brandDisplayName}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ko",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
