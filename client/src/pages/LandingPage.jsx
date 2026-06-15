
import { useNavigate } from "react-router-dom";
import LiveCard from "../components/LiveCard";
import SoonCard from "../components/SoonCard";
import { LIVE_GAMES, SOON_GAMES } from "../utils/gameData";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      background: "#07071a",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#fff",
      minHeight: "100vh",
      overflowX: "hidden",
      position: "relative",
      paddingBottom: 60,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes driftA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes driftB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
        @keyframes driftC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,50px)} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes tiltIn  { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseDot{ 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 70%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
        .shimmer-txt {
          background: linear-gradient(90deg,#fff 25%,#c084fc 45%,#22d3ee 60%,#fff 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3.5s linear infinite;
        }
        .nav-btn:hover { color:#fff !important; background:rgba(255,255,255,.07) !important; }
        .btn-primary:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 8px 36px rgba(168,85,247,.55) !important; }
        .btn-ghost:hover { background:rgba(255,255,255,.09) !important; color:#fff !important; }
        .footer-link:hover { color:rgba(255,255,255,.6) !important; }
        .suggest-btn:hover { background:rgba(168,85,247,.18) !important; }
      `}</style>

      {/* Background orbs */}
      {[
        { w: 480, h: 480, top: -140, left: -60, bg: "#7c3aed", anim: "driftA 18s ease-in-out infinite" },
        { w: 380, h: 380, top: 160, right: -80, bg: "#0891b2", anim: "driftB 22s ease-in-out infinite" },
        { w: 320, h: 320, bottom: 80, left: "20%", bg: "#d97706", anim: "driftC 16s ease-in-out infinite" },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none",
          filter: "blur(90px)", opacity: .55,
          width: o.w, height: o.h,
          top: o.top, left: o.left, right: o.right, bottom: o.bottom,
          background: o.bg, animation: o.anim,
        }} />
      ))}

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px 0", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 17, letterSpacing: "-.02em" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#a855f7,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>✦</div>
          PlaySpace
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["Games", "About"].map(l => (
            <button key={l} className="nav-btn" style={{
              background: "none", border: "none", color: "rgba(255,255,255,.4)",
              fontSize: 13, fontFamily: "inherit", fontWeight: 500,
              padding: "7px 13px", borderRadius: 8, cursor: "pointer", transition: "all .2s",
            }}>{l}</button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "64px 28px 52px", position: "relative", zIndex: 2, animation: "fadeUp .7s ease both" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "rgba(168,85,247,.1)", border: "1px solid rgba(168,85,247,.22)",
          borderRadius: 100, padding: "5px 14px", marginBottom: 26,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: "pulseDot 2s infinite", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".07em", textTransform: "uppercase" }}>
            3 live · 4 coming soon
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(42px,8vw,76px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.0, margin: "0 0 14px" }}>
          <span className="shimmer-txt">Play anything.</span><br />
          <span style={{ color: "rgba(255,255,255,.18)" }}>Share one code.</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,.4)", fontSize: "clamp(13px,2vw,16px)", maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Private rooms. Real-time multiplayer. Zero accounts, zero tracking, zero friction.
        </p>

      </div>

      {/* Live games */}
      <div style={{ padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {LIVE_GAMES.map((g, i) => <LiveCard key={g.id} game={g} index={i} />)}
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "44px 24px 32px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Coming soon
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
      </div>

      {/* Soon games */}
      <div style={{ padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" }}>Up Next</span>
          <span style={{
            background: "rgba(168,85,247,.1)", border: "1px solid rgba(168,85,247,.2)",
            borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 700,
            color: "#c084fc", letterSpacing: ".07em", textTransform: "uppercase",
          }}>In development</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {SOON_GAMES.map((g, i) => <SoonCard key={g.name} game={g} index={i} />)}
        </div>
      </div>

      {/* Suggest CTA */}
      <div style={{
        margin: "16px 24px 0",
        background: "rgba(255,255,255,.02)", border: "1px dashed rgba(255,255,255,.09)",
        borderRadius: 14, padding: "18px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>Got a game idea?</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.28)", marginTop: 2 }}>Drop a suggestion — best ones get built next.</div>
        </div>
        <button className="suggest-btn" style={{
          background: "rgba(168,85,247,.1)", border: "1px solid rgba(168,85,247,.22)",
          borderRadius: 9, padding: "8px 16px", color: "#c084fc",
          fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", transition: "all .2s",
        }}>
          Suggest a game ✦
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "44px 24px 0", fontSize: 11, color: "rgba(255,255,255,.18)", lineHeight: 2 }}>
        All sessions ephemeral · No accounts · No tracking · Open source
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6 }}>
          {["Privacy", "GitHub", "Feedback"].map(l => (
            <a key={l} href="#" className="footer-link" style={{ color: "rgba(255,255,255,.25)", textDecoration: "none", transition: "color .2s" }}>{l}</a>
          ))}
        </div>
      </div>
    </div>
  );
}