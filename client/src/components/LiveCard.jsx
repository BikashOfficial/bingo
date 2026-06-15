import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   INJECT KEYFRAMES (once, in <head>)
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900;1000&family=Inter:wght@400;500;600&display=swap');

  @keyframes floatEmoji {
    0%, 100% { transform: translateY(0px) rotate(-3deg); }
    50%       { transform: translateY(-7px) rotate(3deg); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes cardEntrance {
    0%   { opacity: 0; transform: translateY(28px) scale(0.94); }
    100% { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes starPop {
    0%, 100% { transform: scale(1) rotate(0deg); }
    40%       { transform: scale(1.35) rotate(-8deg); }
    70%       { transform: scale(0.9) rotate(4deg); }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("live-card-styles")) {
  const tag = document.createElement("style");
  tag.id = "live-card-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function LivePip() {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
      <span style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        background: "#4ade80",
        animation: "pulseRing 1.4s ease-out infinite",
      }} />
      <span style={{
        position: "relative", width: 8, height: 8,
        borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 6px #22c55e",
      }} />
    </span>
  );
}

function StarBurst({ color }) {
  return (
    <span style={{
      fontSize: 11,
      color,
      animation: "starPop 2.4s ease-in-out infinite",
      display: "inline-block",
      lineHeight: 1,
    }}>★</span>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function LiveCard({ game, index }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mm = window.matchMedia("(max-width: 768px)");
    setIsMobile(mm.matches);
    const handler = (e) => setIsMobile(e.matches);
    mm.addEventListener("change", handler);
    return () => mm.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current || isMobile) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursor({ x, y });
    const cx = rect.width / 2, cy = rect.height / 2;
    setRotate({
      x: ((cy - y) / cy) * 9,
      y: ((x - cx) / cx) * 9,
    });
  };

  const cardTransform = hovered && !isMobile
    ? `perspective(900px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-10px) scale(1.03)`
    : hovered && isMobile
    ? `perspective(900px) rotateX(0deg) rotateY(0deg) translateY(-10px) scale(1.03)`
    : `perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`;

  const cardTransition = hovered
    ? "transform 0.08s ease-out, box-shadow 0.25s ease"
    : "transform 0.55s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.55s cubic-bezier(0.25,0.8,0.25,1)";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setRotate({ x: 0, y: 0 }); }}
      onClick={() => {
        if (isMobile) {
          setHovered(prev => !prev);
        } else {
          navigate(game.path);
        }
      }}
      style={{
        /* Layout */
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
        userSelect: "none",

        /* Shape */
        borderRadius: 28,
        overflow: "hidden",
        position: "relative",

        /* 3-D tilt */
        transform: cardTransform,
        transformStyle: "preserve-3d",
        transition: cardTransition,

        /* Depth shadow + glow */
        boxShadow: hovered
          ? `0 30px 64px rgba(0,0,0,0.55), 0 0 0 1.5px ${game.accent}, 0 0 48px ${game.glow}`
          : `0 10px 32px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.07)`,

        /* Entrance */
        animation: `cardEntrance 0.55s cubic-bezier(0.23,1,0.32,1) ${index * 0.1}s both`,

        /* Base bg — will be covered by inner layers */
        background: "#0d0d1f",

        fontFamily: "'Nunito', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Cursor-tracked radial light ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: hovered
          ? `radial-gradient(320px circle at ${cursor.x}px ${cursor.y}px, ${game.glowLight}, transparent 72%)`
          : "none",
        pointerEvents: "none",
        zIndex: 10,
        transition: "background 0.15s ease",
      }} />

      {/* ── HERO ZONE ── */}
      <div style={{
        background: game.bg,
        padding: "28px 22px 26px",
        position: "relative",
        overflow: "hidden",
        minHeight: 195,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}>

        {/* Dot-matrix texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          opacity: hovered ? 0.55 : 0.25,
          transition: "opacity 0.35s ease",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* Top-left diagonal highlight streak */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(125deg, rgba(255,255,255,0.18) 0%, transparent 45%)",
          zIndex: 1, pointerEvents: "none",
        }} />

        {/* Noise overlay for depth */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.6,
          zIndex: 1, pointerEvents: "none",
        }} />

        {/* ── Top badge row ── */}
        <div style={{
          position: "absolute", top: 14, left: 16, right: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          zIndex: 3,
        }}>
          {/* LIVE pill */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(0,0,0,0.42)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 999, padding: "5px 12px",
            fontSize: 10.5, fontWeight: 900,
            color: "#fff", letterSpacing: "0.09em",
            textTransform: "uppercase",
          }}>
            <LivePip />
            Live
          </span>

          {/* Players badge */}
          
        </div>

        {/* ── Big emoji ── */}
        <span style={{
          fontSize: 50, lineHeight: 1,
          display: "inline-block",
          marginBottom: 12,
          zIndex: 2,
          animation: "floatEmoji 3s ease-in-out infinite",
          animationDelay: `${index * 0.4}s`,
          filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.45))",
          width: "fit-content",
          transformOrigin: "center bottom",
        }}>
          {game.emoji}
        </span>

        {/* Name + tagline */}
        <div style={{ zIndex: 2, position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7, marginBottom: 3,
          }}>
            <StarBurst color={game.accent} />
            <span style={{
              fontSize: 21, fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.03em",
              textShadow: hovered ? `0 0 18px ${game.glow}` : "0 2px 6px rgba(0,0,0,0.3)",
              transition: "text-shadow 0.3s ease",
              lineHeight: 1.1,
            }}>
              {game.name}
            </span>
            <StarBurst color={game.accent} />
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: hovered ? "#fff" : "rgba(255,255,255,0.62)",
            fontStyle: "italic",
            letterSpacing: "0.02em",
            transition: "color 0.3s ease",
            fontFamily: "'Inter', sans-serif",
          }}>
            {game.tagline}
          </div>
        </div>
      </div>

      {/* ── BODY ZONE ── */}
      <div style={{
        padding: "18px 20px 20px",
        background: "rgba(10,10,26,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: `2px solid ${hovered ? game.accent + "55" : "rgba(255,255,255,0.07)"}`,
        transition: "border-color 0.3s ease",
        position: "relative",
        zIndex: 2,
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        {/* Description */}
        <p style={{
          fontSize: 12.5, fontWeight: 500,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.65,
          marginBottom: 16,
          fontFamily: "'Inter', sans-serif",
        }}>
          {game.desc}
        </p>

        {/* ── CTA Button ── */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(game.path); }}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14, fontWeight: 900,
            letterSpacing: "0.02em",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            transform: hovered ? "scale(1.02)" : "scale(1)",

            /* Shimmer gradient background */
            background: hovered
              ? `linear-gradient(270deg, ${game.accent}, ${game.accentLight ?? "#fff"}, ${game.accent})`
              : `linear-gradient(135deg, ${game.accent}bb 0%, ${game.accent}55 100%)`,
            backgroundSize: hovered ? "300% 100%" : "100% 100%",
            animation: hovered ? "shimmer 1.8s linear infinite" : "none",

            boxShadow: hovered
              ? `0 6px 28px -4px ${game.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
              : `0 2px 12px -4px ${game.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,

            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span>Play Now</span>
          <span style={{
            display: "inline-block",
            transform: hovered ? "translateX(5px) scale(1.15)" : "translateX(0) scale(1)",
            transition: "transform 0.2s cubic-bezier(0.25,0.8,0.25,1)",
          }}>
            →
          </span>
        </button>
      </div>

      {/* ── Bottom accent strip ── */}
      <div style={{
        height: 3,
        background: hovered
          ? `linear-gradient(90deg, transparent, ${game.accent}, transparent)`
          : "transparent",
        transition: "background 0.4s ease",
        position: "relative",
        zIndex: 2,
      }} />
    </div>
  );
}