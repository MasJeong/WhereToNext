import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

/**
 * Generates the primary application icon.
 * @returns PNG icon response
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "120px",
          background: "linear-gradient(135deg, #56bbff 0%, #0b63ce 100%)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            height: 252,
            width: 252,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
            boxShadow: "0 0 0 18px rgba(255,255,255,0.14)",
          }}
        >
          <div
            style={{
              height: 124,
              width: 124,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              height: 172,
              width: 14,
              borderRadius: 999,
              background: "#ffffff",
              transform: "rotate(38deg)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
