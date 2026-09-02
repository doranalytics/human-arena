import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Human Arena. Learn AI by doing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: the wordmark, the one-line pitch, and the five tier rosettes as a quiet ladder. */
export default function OG() {
  const tiers = [
    { name: "Tourist", fill: "#FFA26B" },
    { name: "Newcomer", fill: "#F0570F" },
    { name: "Resident", fill: "#B8410B" },
    { name: "Citizen", fill: "#1C1917" },
    { name: "AI-Native", fill: "#D4A13C" },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#faf9f5", padding: 72, fontFamily: "Georgia, 'Times New Roman', serif", color: "#141413" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="44" height="44" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#d97757" />
            <path d="M32 12v40M12 32h40M17.9 17.9l28.2 28.2M46.1 17.9 17.9 46.1M22.5 13.5l19 37M41.5 13.5l-19 37M13.5 22.5l37 19M13.5 41.5l37-19" stroke="#faf9f5" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>Human Arena</div>
          <div style={{ marginLeft: 14, fontSize: 22, color: "#8f8e88", fontFamily: "Helvetica, Arial, sans-serif" }}>Safe training environment</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 88, lineHeight: 1.02, letterSpacing: -2, fontWeight: 600, maxWidth: 1000 }}>Learn AI by doing.</div>
          <div style={{ fontSize: 32, lineHeight: 1.3, color: "#5e5d59", fontFamily: "Helvetica, Arial, sans-serif", maxWidth: 940 }}>32 timed challenges inside a chat that watches what you click. A safe training environment.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {tiers.map((t) => (
            <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Helvetica, Arial, sans-serif", fontSize: 22, color: "#5e5d59" }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: t.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 14, height: 14, borderRadius: 999, background: "#faf9f5" }} />
              </div>
              {t.name}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
