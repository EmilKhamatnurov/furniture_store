import { ImageResponse } from "next/og";

// Default social-share card for pages that don't set their own OG image.
// (Blog posts and products with a cover image override this.)
export const alt = "KHAMATNUROV MEBEL — handcrafted furniture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBFAF6",
          color: "#161613",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", width: 120, height: 4, background: "#161613", marginBottom: 40 }} />
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: 6 }}>
          KHAMATNUROV MEBEL
        </div>
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            marginTop: 28,
            color: "#8a857a",
            textTransform: "uppercase",
          }}
        >
          Handcrafted furniture · Est. 2018
        </div>
      </div>
    ),
    size
  );
}
