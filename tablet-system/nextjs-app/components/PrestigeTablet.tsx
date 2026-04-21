"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type RideState = "arrival" | "cruise" | "mid-ride" | "pre-dropoff";
type DataStatus = "live" | "stale" | "error";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay } }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.6, ease: EASE } },
};

const softScale = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.0, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.5, ease: EASE } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.0, ease: EASE } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.6, ease: EASE } },
};

const screenFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.0, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.7, ease: EASE } },
};

const GOLD = "rgba(180,155,110,";
const CREAM = "rgba(240,236,228,";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";

// ── Data status banner — shown when GPS/API feed drops ───────────────────────
function StatusBanner({ status }: { status: DataStatus }) {
  if (status === "live") return null;

  const isError = status === "error";
  const message = isError ? "Route data unavailable" : "Updating route...";
  const dotColor = isError ? "rgba(200,80,80,0.7)" : `${GOLD}0.6)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.5, ease: EASE } }}
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 16px",
        background: "rgba(15,13,11,0.85)",
        border: `0.5px solid ${isError ? "rgba(200,80,80,0.2)" : `${GOLD}0.2)`}`,
        borderRadius: 20,
        backdropFilter: "blur(12px)",
        zIndex: 30,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor }} />
      <span style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: `${CREAM}0.4)`, fontWeight: 300, fontFamily: SANS }}>
        {message}
      </span>
    </motion.div>
  );
}

// ── Fallback screen — shown on full data error ───────────────────────────────
function FallbackView() {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "44px 48px 40px", minHeight: 560, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 16 }}>
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" custom={0}>
        <p style={{ fontSize: 11, letterSpacing: "1.8px", textTransform: "uppercase", color: `${CREAM}0.3)`, fontWeight: 300, marginBottom: 6, fontFamily: SANS }}>Please stand by</p>
        <h1 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 300, color: "#f0ece4", lineHeight: 1.2, letterSpacing: -0.5 }}>{"Reconnecting\nyour journey."}</h1>
      </motion.div>
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" custom={0.15}>
        <p style={{ fontSize: 13, fontWeight: 300, color: `${CREAM}0.35)`, fontFamily: SANS, letterSpacing: 0.2 }}>
          Your chauffeur continues on route.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.4, duration: 1.0 } }}
        style={{ display: "flex", gap: 6, marginTop: 8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 4, height: 4, borderRadius: "50%", background: `${GOLD}0.5)` }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ── Passive view ─────────────────────────────────────────────────────────────
function PassiveView({ rideState, dataStatus }: { rideState: RideState; dataStatus: DataStatus }) {
  const etaMap: Record<RideState, number> = { arrival: 2, cruise: 8, "mid-ride": 12, "pre-dropoff": 4 };
  const progressMap: Record<RideState, number> = { arrival: 5, cruise: 35, "mid-ride": 62, "pre-dropoff": 88 };
  const eta = etaMap[rideState];
  const progress = progressMap[rideState];
  const greetingText = rideState === "arrival" ? "Good evening,\nMr. Rodriguez." : rideState === "pre-dropoff" ? "Almost there." : "Enjoy the\nride.";
  const etaDisplay = dataStatus !== "live" ? "—" : `${eta} min`;

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "44px 48px 40px", minHeight: 560, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <motion.div key={`greeting-${rideState}`} variants={fadeSlideUp} initial="hidden" animate="visible" custom={0}>
          <p style={{ fontSize: 11, letterSpacing: "1.8px", textTransform: "uppercase", color: `${CREAM}0.4)`, fontWeight: 300, marginBottom: 6, fontFamily: SANS }}>Welcome aboard</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 300, color: "#f0ece4", lineHeight: 1.15, letterSpacing: -0.5, whiteSpace: "pre-line" }}>{greetingText}</h1>
        </motion.div>
      </div>
      <div>
        <motion.div key={`eta-${eta}`} variants={fadeSlideUp} initial="hidden" animate="visible" custom={0.12}>
          <p style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: `${CREAM}0.35)`, fontWeight: 300, fontFamily: SANS }}>Arriving in</p>
          <p style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: dataStatus !== "live" ? `${CREAM}0.25)` : "#f0ece4", lineHeight: 1, letterSpacing: -1, transition: "color 0.8s ease" }}>{etaDisplay}</p>
          <div style={{ width: 32, height: 0.5, background: `${GOLD}0.4)`, margin: "20px 0" }} />
          <p style={{ fontSize: 16, fontWeight: 400, color: `${CREAM}0.8)` }}>DFW International Airport</p>
          <p style={{ fontSize: 13, fontWeight: 300, color: `${CREAM}0.4)`, marginTop: 4 }}>Marcus — 2024 Cadillac Escalade</p>
        </motion.div>
        {rideState !== "arrival" && (
          <motion.div key="cabin" variants={fadeSlideUp} initial="hidden" animate="visible" custom={0.24} style={{ display: "flex", gap: 20, alignItems: "center", opacity: 0.55, marginTop: 28 }}>
            {["68°F", "Quiet mode", "WiFi active"].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 300, color: `${CREAM}0.6)` }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: `${GOLD}0.6)` }} />
                {label}
              </div>
            ))}
          </motion.div>
        )}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: dataStatus !== "live" ? 0.25 : 0.65, transition: { duration: 1.2, delay: 0.3 } }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}0.15) 0%, ${GOLD}0.5) 60%, ${GOLD}0.15) 100%)`, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: `${GOLD}0.8)`, borderRadius: 2, transition: "width 1s ease", width: `${progress}%` }} />
        </div>
      </motion.div>
    </div>
  );
}

// ── Mid-ride prompt — auto-dismisses after 9 seconds ─────────────────────────
function MidRidePrompt({ onBook, onDismiss }: { onBook: () => void; onDismiss: () => void }) {
  const DISMISS_DELAY = 9000;
  const [timeLeft, setTimeLeft] = useState(DISMISS_DELAY);

  useEffect(() => {
    const dismiss = setTimeout(onDismiss, DISMISS_DELAY);
    const tick = setInterval(() => setTimeLeft((t) => Math.max(0, t - 100)), 100);
    return () => { clearTimeout(dismiss); clearInterval(tick); };
  }, [onDismiss]);

  const progress = timeLeft / DISMISS_DELAY;

  return (
    <motion.div variants={cardReveal} initial="hidden" animate="visible" exit="exit"
      style={{ position: "absolute", bottom: 40, left: 48, right: 48, background: "rgba(22,20,18,0.95)", border: `0.5px solid ${GOLD}0.25)`, borderRadius: 14, padding: "24px 28px", backdropFilter: "blur(20px)", zIndex: 10 }}>
      <p style={{ fontSize: 17, fontWeight: 400, color: "#f0ece4", marginBottom: 18, fontFamily: SERIF, letterSpacing: 0.2 }}>Need a ride later today?</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onBook} style={{ flex: 1, padding: "13px 20px", background: `${GOLD}0.12)`, border: `0.5px solid ${GOLD}0.4)`, borderRadius: 8, color: "#d4b896", fontSize: 13, fontFamily: SANS, fontWeight: 400, letterSpacing: "0.8px", cursor: "pointer", textTransform: "uppercase" }}>Book return</button>
        <button onClick={onDismiss} style={{ padding: "13px 20px", background: "transparent", border: `0.5px solid ${CREAM}0.1)`, borderRadius: 8, color: `${CREAM}0.35)`, fontSize: 13, fontFamily: SANS, fontWeight: 300, cursor: "pointer" }}>Not now</button>
      </div>
      <div style={{ marginTop: 16, height: 1.5, background: `${GOLD}0.1)`, borderRadius: 2, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
          style={{ height: "100%", background: `${GOLD}0.35)`, borderRadius: 2 }}
        />
      </div>
    </motion.div>
  );
}

// ── Booking view ─────────────────────────────────────────────────────────────
function BookingView() {
  const [glowing, setGlowing] = useState(false);
  function handleBook() { setGlowing(true); setTimeout(() => setGlowing(false), 800); }

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "44px 48px 44px", minHeight: 560, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" custom={0}>
          <p style={{ fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: `${GOLD}0.7)`, fontWeight: 300, marginBottom: 12, fontFamily: SANS }}>Your journey continues</p>
          <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 300, color: "#f0ece4", lineHeight: 1.2, whiteSpace: "pre-line" }}>{"Where to\nnext?"}</h2>
        </motion.div>
      </div>
      <motion.div variants={softScale} initial="hidden" animate="visible">
        <button onClick={handleBook} style={{ width: "100%", padding: 18, background: `${GOLD}0.15)`, border: `0.5px solid ${GOLD}0.5)`, borderRadius: 10, color: "#d4b896", fontSize: 15, fontFamily: SANS, fontWeight: 400, letterSpacing: "1px", cursor: "pointer", textTransform: "uppercase", marginBottom: 12, boxShadow: glowing ? `0 0 0 1px ${GOLD}0.3)` : "none", transition: "box-shadow 0.3s ease" }}>Book this ride again</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {["Schedule return", "Plan a new trip"].map((label) => (
            <button key={label} style={{ padding: 15, background: "transparent", border: `0.5px solid ${CREAM}0.1)`, borderRadius: 10, color: `${CREAM}0.55)`, fontSize: 13, fontFamily: SANS, fontWeight: 300, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.8 } }} style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: `${CREAM}0.2)`, fontWeight: 300, fontFamily: SANS }}>Synergy Lux Limo · DFW</p>
      </motion.div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function PrestigeTablet() {
  const [rideState, setRideState] = useState<RideState>("arrival");
  const [dataStatus, setDataStatus] = useState<DataStatus>("live");
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [bookedFromPrompt, setBookedFromPrompt] = useState(false);

  useEffect(() => {
    if (rideState === "mid-ride" && !promptDismissed && !bookedFromPrompt) {
      const t = setTimeout(() => setShowPrompt(true), 600);
      return () => clearTimeout(t);
    }
    if (rideState !== "mid-ride") setShowPrompt(false);
  }, [rideState, promptDismissed, bookedFromPrompt]);

  function handleDismiss() { setShowPrompt(false); setPromptDismissed(true); }
  function handleBookFromPrompt() { setShowPrompt(false); setBookedFromPrompt(true); setRideState("pre-dropoff"); }

  const showFallback = dataStatus === "error";
  const isBookingView = rideState === "pre-dropoff" && !showFallback;

  return (
    <div style={{ fontFamily: SANS, background: "#0a0a0a", color: "#f0ece4", minHeight: 560, width: "100%", position: "relative", overflow: "hidden", borderRadius: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${GOLD}0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, ${GOLD}0.04) 0%, transparent 50%)`, pointerEvents: "none" }} />

      <AnimatePresence>
        <StatusBanner key="banner" status={dataStatus} />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showFallback
          ? <motion.div key="fallback" {...screenFade}><FallbackView /></motion.div>
          : isBookingView
          ? <motion.div key="booking" {...screenFade}><BookingView /></motion.div>
          : <motion.div key={`passive-${rideState}`} {...screenFade}><PassiveView rideState={rideState} dataStatus={dataStatus} /></motion.div>
        }
      </AnimatePresence>

      <AnimatePresence>
        {showPrompt && <MidRidePrompt key="prompt" onDismiss={handleDismiss} onBook={handleBookFromPrompt} />}
      </AnimatePresence>

      {process.env.NODE_ENV === "development" && (
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 6, zIndex: 20 }}>
          {(["arrival", "cruise", "mid-ride", "pre-dropoff"] as RideState[]).map((s) => (
            <button key={s} onClick={() => { setRideState(s); if (s !== "mid-ride") { setShowPrompt(false); setPromptDismissed(false); } }}
              style={{ padding: "4px 10px", background: rideState === s ? `${GOLD}0.15)` : "rgba(255,255,255,0.05)", border: `0.5px solid ${rideState === s ? `${GOLD}0.4)` : "rgba(255,255,255,0.1)"}`, borderRadius: 20, color: rideState === s ? `${GOLD}0.8)` : "rgba(255,255,255,0.3)", fontSize: 10, cursor: "pointer", fontFamily: SANS }}>{s}</button>
          ))}
          {(["live", "stale", "error"] as DataStatus[]).map((s) => (
            <button key={s} onClick={() => setDataStatus(s)}
              style={{ padding: "4px 10px", background: dataStatus === s ? "rgba(200,80,80,0.15)" : "rgba(255,255,255,0.05)", border: `0.5px solid ${dataStatus === s ? "rgba(200,80,80,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, color: dataStatus === s ? "rgba(200,80,80,0.8)" : "rgba(255,255,255,0.3)", fontSize: 10, cursor: "pointer", fontFamily: SANS }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
