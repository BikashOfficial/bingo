import { useState } from "react";

export default function SoonCard({ game, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        background: hovered ? "rgba(255,255,255,.055)" : "rgba(255,255,255,.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.06)"}`,
        padding: "16px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "all .25s",
        animation: `tiltIn 0.5s cubic-bezier(.23,1,.32,1) ${0.38 + index * 0.06}s both`,
      }}
    >
      <span style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 100,
        padding: "2px 6px",
        fontSize: 9,
        fontWeight: 700,
        color: "rgba(255,255,255,.3)",
        letterSpacing: ".08em",
        textTransform: "uppercase",
      }}>
        Soon
      </span>
      <span style={{
        fontSize: 22,
        flexShrink: 0,
        filter: hovered ? "grayscale(.2) opacity(.9)" : "grayscale(.4) opacity(.7)",
        transform: hovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0)",
        transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s",
      }}>
        {game.emoji}
      </span>
      <div>
        <div style={{
          fontWeight: 700,
          fontSize: 13,
          color: hovered ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.5)",
          transition: "color 0.3s",
        }}>
          {game.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 2 }}>{game.sub}</div>
      </div>
    </div>
  );
}
