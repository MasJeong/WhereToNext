import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

/**
 * Generates the Apple touch icon used for iOS home screen shortcuts.
 * @returns PNG icon response
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "42px",
          background: "linear-gradient(135deg, #56bbff 0%, #0b63ce 100%)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            height: 88,
            width: 88,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
            boxShadow: "0 0 0 8px rgba(255,255,255,0.14)",
          }}
        >
          <div
            style={{
              height: 42,
              width: 42,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              height: 62,
              width: 6,
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
