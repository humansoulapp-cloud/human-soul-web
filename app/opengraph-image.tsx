import { ImageResponse } from "next/og";

/* The picture shown when humansoul.co is shared in messages and on social media. */
export const alt = "HumanSoul · Write a little. Notice a lot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(150deg, #26302A 0%, #1E1C1A 55%, #141312 100%)",
          color: "#F3EFE8",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 40, letterSpacing: "-0.01em" }}>
          <span style={{ fontWeight: 600 }}>Human</span>
          <span style={{ color: "#8BA58F", fontWeight: 600 }}>Soul</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: 900 }}>Write a little. Notice a lot.</div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: "#ABA59C", maxWidth: 860 }}>
            Guided reflective journeys and a private journal. Join the free 90-day beta.
          </div>
        </div>
      </div>
    ),
    size
  );
}
