"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type RideState = "arrival" | "cruise" | "mid-ride" | "pre-dropoff";
type DataStatus = "live" | "stale" | "error";
type ConfirmationStage = "confirming" | "confirmed" | "done";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const GOLD = "rgba(180,155,110,";
const CREAM = "rgba(240,236,228,";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";

function StatusBanner({ status }: { status: DataStatus }) {
  if (status === "live") return null;
  const isError = status === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.5, ease: EASE } }}
      style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "rgba(15,13,11,0.85)", border: `0.5px solid ${isError ? "rgba(200,80,80,0.2)" : `${GOLD}0.2)`}`, borderRadius: 20, backdropFilter: "blur(12px)", zIndex: 30 }}
    >
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: isError ? "rgba(200,80,80,0.7)" : `${GOLD}0.6)` }} />
      <span style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: `${CREAM}0.4)`, fontWeight: 300, fontFamily: SANS }}>
        {isError ? "Route data unavailable" : "Updating route..."}
      </span>
    </motion.div>
  );
}

function FallbackView() {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "44px 48px 40px", minHeight: 560, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } }}>
        <p style={{ fontSize: 11, letterSpacing: "1.8px", textTransform: "uppercase", color: `${CREAM}0.3)`, fontWeight: 300, marginBottom: 6, fontFamily: SANS }}>Please stand by</p>
        <h1 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 300, color: "#f0ece4", lineHeight: 1.2, whiteSpace: "pre-line" }}>{"Reconnecting\nyour journey."}</h1>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.15 } }}>
        <p style={{ fontSize: 13, fontWeight: 300, color: `${CREAM}0.35)`, fontFamily: SANS }}>Your chauffeur continues on route.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4, duration: 1.0 } }} style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }} style={{ width: 4, height: 4, borderRadius: "50%", background: `${GOLD}0.5)` }} />
        ))}
      </motion.div>
    </div>
  );
}

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
        <motion.div key={`greeting-${rideState}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } }}>
          <p style={{ fontSize: 11, letterSpacing: "1.8px", textTransform: "uppercase", color: `${CREAM}0.4)`, fontWeight: 300, marginBottom: 6, fontFamily: SANS }}>Welcome aboard</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 300, color: "#f0ece4", lineHeight: 1.15, letterSpacing: -0.5, whiteSpace: "pre-line" }}>{greetingText}</h1>
        </motion.div>
      </div>
      <div>
        <motion.div key={`eta-${eta}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.12 } }}>
          <p style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: `${CREAM}0.35)`, fontWeight: 300, fontFamily: SANS }}>Arriving in</p>
          <p style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: dataStatus !== "live" ? `${CREAM}0.25)` : "#f0ece4", lineHeight: 1, letterSpacing: -1, transition: "color 0.8s ease" }}>{etaDisplay}</p>
          <div style={{ width: 32, height: 0.5, background: `${GOLD}0.4)`, margin: "20px 0" }} />
          <p style={{ fontSize: 16, fontWeight: 400, color: `${CREAM}0.8)` }}>DFW International Airport</p>
          <p style={{ fontSize: 13, fontWeight: 300, color: `${CREAM}0.4)`, marginTop: 4 }}>Marcus — 2024 Cadillac Escalade</p>
        </motion.div>
        {rideState !== "arrival" && (
          <motion.div key="cabin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.24 } }} style={{ display: "flex", gap: 20, alignItems: "center", opacity: 0.55, marginTop: 28 }}>
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
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 1.0, ease: EASE } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.6, ease: EASE } }}
      style={{ position: "absolute", bottom: 40, left: 48, right: 48, background: "rgba(22,20,18,0.95)", border: `0.5px solid ${GOLD}0.25)`, borderRadius: 14, padding: "24px 28px", backdropFilter: "blur(20px)", zIndex: 10 }}
    >
      <p style={{ fontSize: 17, fontWeight: 400, color: "#f0ece4", marginBottom: 18, fontFamily: SERIF }}>Need a ride later today?</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onBook} style={{ flex: 1, padding: "13px 20px", background: `${GOLD}0.12)`, border: `0.5px solid ${GOLD}0.4)`, borderRadius: 8, color: "#d4b896", fontSize: 13, fontFamily: SANS, fontWeight: 400, letterSpacing: "0.8px", cursor: "pointer", textTransform: "uppercase" }}>Book return</button>
        <button onClick={onDismiss} style={{ padding: "13px 20px", background: "transparent", border: `0.5px solid ${CREAM}0.1)`, borderRadius: 8, color: `${CREAM}0.35)`, fontSize: 13, fontFamily: SANS, fontWeight: 300, cursor: "pointer" }}>Not now</button>
      </div>
      <div style={{ marginTop: 16, height: 1.5, background: `${GOLD}0.1)`, borderRadius: 2, overflow: "hidden" }}>
        <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.1, ease: "linear" }} style={{ height: "100%", background: `${GOLD}0.35)`, borderRadius: 2 }} />
      </div>
    </motion.div>
  );
}

function ConfirmationView({ clientName, destination, onComplete, returnState }: { clientName?: string; destination?: string; onComplete: (returnTo: RideState) => void; returnState: RideState; }) {
  const [stage, setStage] = useState<ConfirmationStage>("confirming");
  useEffect(() => {
    const t1 = setTimeout(() => setStage("confirmed"), 300);
    const t2 = setTimeout(() => setStage("done"), 4500);
    const t3 = setTimeout(() => onComplete(returnState), 8500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete, returnState]);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "44px 48px", minHeight: 560, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <AnimatePresence mode="wait">
        {stage === "confirming" && (
          <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.5, ease: EASE } }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <motion.div key={i} animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }} style={{ width: 5, height: 5, borderRadius: "50%", background: `${GOLD}0.7)` }} />
              ))}
            </div>
            <p style={{ fontSize: 13, letterSpacing: "2px", textTransform: "uppercase", color: `${CREAM}0.3)`, fontFamily: SANS, fontWeight: 300 }}>Securing your reservation</p>
          </motion.div>
        )}
        {stage === "confirmed" && (
          <motion.div key="confirmed" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1, transition: { duration: 0.8, ease: EASE } }}>
                <motion.div animate={{ boxShadow: ["0 0 0 0px rgba(180,155,110,0)", "0 0 0 12px rgba(180,155,110,0.08)", "0 0 0 0px rgba(180,155,110,0)"] }} transition={{ duration: 1.8, times: [0, 0.5, 1], ease: "easeOut" }} style={{ width: 64, height: 64, borderRadius: "50%", border: `0.5px solid ${GOLD}0.4)`, display: "flex", alignItems: "center", justifyContent: "center", background: `${GOLD}0.08)` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <motion.path d="M5 12.5L9.5 17L19 8" stroke="rgba(180,155,110,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }} />
                  </svg>
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4, ease: EASE } }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 300, color: "#f0ece4", lineHeight: 1.1, letterSpacing: -0.5 }}>Ride Reserved</h2>
                <p style={{ fontSize: 14, fontWeight: 300, color: `${CREAM}0.6)`, fontFamily: SANS }}>Mr. Rodriguez is confirmed{clientName ? ` for ${clientName}` : ""}.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.7, ease: EASE } }} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: `${CREAM}0.35)`, fontFamily: SANS, fontWeight: 300 }}>{today}</span>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", background: `${GOLD}0.4)` }} />
                  <span style={{ fontSize: 12, color: `${CREAM}0.35)`, fontFamily: SANS, fontWeight: 300 }}>{destination || "Same route"}</span>
                </div>
                <p style={{ fontSize: 11, color: `${CREAM}0.2)`, fontFamily: SANS, fontWeight: 300, marginTop: 4 }}>Your preferences and route are saved.</p>
              </motion.div>
            </div>
            <div />
          </motion.div>
        )}
        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } }} style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300, color: `${CREAM}0.7)`, lineHeight: 1.3 }}>We have your request.</motion.p>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.15 } }} style={{ fontSize: 13, fontWeight: 300, color: `${CREAM}0.3)`, fontFamily: SANS, lineHeight: 1.7 }}>Expect a confirmation text{"\n"}within minutes.</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.9, ease: EASE, delay: 0.5 } }} style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: `${CREAM}0.15)`, fontWeight: 300, fontFamily: SANS, marginTop: 24 }}>Synergy Lux Limo · DFW</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingView({ onConfirmed }: { onConfirmed: () => void }) {
  const [glowing, setGlowing] = useState(false);
  function handleBook() {
    setGlowing(true);
    setTimeout(() => { setGlowing(false); onConfirmed(); }, 600);
  }
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "44px 48px 44px", minHeight: 560, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } }}>
          <p style={{ fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: `${GOLD}0.7)`, fontWeight: 300, marginBottom: 12, fontFamily: SANS }}>Your journey continues</p>
          <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 300, color: "#f0ece4", lineHeight: 1.2, whiteSpace: "pre-line" }}>{"Where to\nnext?"}</h2>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { duration: 1.0, ease: EASE } }}>
        <button onClick={handleBook} style={{ width: "100%", padding: 18, background: `${GOLD}0.15)`, border: `0.5px solid ${GOLD}0.5)`, borderRadius: 10, color: "#d4b896", fontSize: 15, fontFamily: SANS, fontWeight: 400, letterSpacing: "1px", cursor: "pointer", textTransform: "uppercase", marginBottom: 12, boxShadow: glowing ? `0 0 0 1px ${GOLD}0.3)` : "none", transition: "box-shadow 0.3s ease" }}>Book this ride again</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {["Schedule return", "Plan a new trip"].map((label) => (
            <button key={label} style={{ padding: 15, background: "transparent", border: `0.5px solid ${CREAM}0.1)`, borderRadius: 10, color: `${CREAM}0.55)`, fontSize: 13, fontFamily: SANS, fontWeight: 300, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.5 } }} style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 12, color: `${GOLD}0.75)`, fontFamily: SANS, fontWeight: 300, letterSpacing: "0.4px" }}>10% preferred rate when reserved before arrival</p>
        <p style={{ fontSize: 11, color: `${CREAM}0.22)`, fontFamily: SANS, fontWeight: 300, letterSpacing: "0.3px" }}>Your chauffeur and preferences are already saved</p>
      </motion.div>
    </div>
  );
}

export default function PrestigeTablet() {
  const [rideState, setRideState] = useState<RideState>("arrival");
  const [dataStatus, setDataStatus] = useState<DataStatus>("live");
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [bookedFromPrompt, setBookedFromPrompt] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const liveRideState = useRef<RideState>(rideState);

  useEffect(() => { liveRideState.current = rideState; }, [rideState]);

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
  const isBookingView = rideState === "pre-dropoff" && !showFallback && !confirming;
  const isConfirming = rideState === "pre-dropoff" && confirming && !showFallback;

  return (
    <div style={{ fontFamily: SANS, background: "#0a0a0a", color: "#f0ece4", minHeight: 560, width: "100%", position: "relative", overflow: "hidden", borderRadius: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${GOLD}0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, ${GOLD}0.04) 0%, transparent 50%)`, pointerEvents: "none" }} />
      <AnimatePresence>
        {dataStatus !== "live" && <StatusBanner key="banner" status={dataStatus} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {showFallback ? (
          <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 1.0, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}>
            <FallbackView />
          </motion.div>
        ) : isConfirming ? (
          <motion.div key="confirmation" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 1.0, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}>
            <ConfirmationView returnState={liveRideState.current} onComplete={(returnTo) => { setConfirming(false); setRideState(returnTo); }} />
          </motion.div>
        ) : isBookingView ? (
          <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 1.0, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}>
            <BookingView onConfirmed={() => setConfirming(true)} />
          </motion.div>
        ) : (
          <motion.div key={`passive-${rideState}`} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.9, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}>
            <PassiveView rideState={rideState} dataStatus={dataStatus} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPrompt && <MidRidePrompt key="prompt" onDismiss={handleDismiss} onBook={handleBookFromPrompt} />}
      </AnimatePresence>
      {process.env.NODE_ENV === "development" && (
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 6, zIndex: 20 }}>
          {(["arrival", "cruise", "mid-ride", "pre-dropoff"] as RideState[]).map((s) => (
            <button key={s} onClick={() => { setRideState(s); if (s !== "mid-ride") { setShowPrompt(false); setPromptDismissed(false); } }} style={{ padding: "4px 10px", background: rideState === s ? `${GOLD}0.15)` : "rgba(255,255,255,0.05)", border: `0.5px solid ${rideState === s ? `${GOLD}0.4)` : "rgba(255,255,255,0.1)"}`, borderRadius: 20, color: rideState === s ? `${GOLD}0.8)` : "rgba(255,255,255,0.3)", fontSize: 10, cursor: "pointer", fontFamily: SANS }}>{s}</button>
          ))}
          {(["live", "stale", "error"] as DataStatus[]).map((s) => (
            <button key={s} onClick={() => setDataStatus(s)} style={{ padding: "4px 10px", background: dataStatus === s ? "rgba(200,80,80,0.15)" : "rgba(255,255,255,0.05)", border: `0.5px solid ${dataStatus === s ? "rgba(200,80,80,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, color: dataStatus === s ? "rgba(200,80,80,0.8)" : "rgba(255,255,255,0.3)", fontSize: 10, cursor: "pointer", fontFamily: SANS }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
