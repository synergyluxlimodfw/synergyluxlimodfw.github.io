import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { connectToRide } from '../../lib/socket';
import ETAChip from '../../components/ETAChip';
import RebookModal from '../../components/RebookModal';

export default function TabletPage() {
  const router = useRouter();
  const { rideId } = router.query;

  const [ride, setRide]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [promptType, setPrompt]   = useState(null);
  const [activeBtn, setActiveBtn] = useState({});
  const [time, setTime]           = useState('');

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      let h = now.getHours(), m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setTime(`${h}:${String(m).padStart(2, '0')} ${ampm}`);
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  // Fetch ride on load
  useEffect(() => {
    if (!rideId) return;
    api.getRide(rideId)
      .then(setRide)
      .catch(() => setError('Ride session not found.'))
      .finally(() => setLoading(false));
  }, [rideId]);

  // Socket connection
  useEffect(() => {
    if (!rideId) return;

    const socket = connectToRide(rideId);

    socket.on('ride:update', ({ etaMinutes }) => {
      setRide(prev => prev ? { ...prev, etaMinutes } : prev);
    });

    socket.on('show:rebook', ({ type }) => {
      setPrompt(type);
      setShowModal(true);
    });

    socket.on('ride:complete', ({ customerId }) => {
      router.push(`/rebook/${customerId}`);
    });

    return () => {
      socket.off('ride:update');
      socket.off('show:rebook');
      socket.off('ride:complete');
    };
  }, [rideId, router]);

  const toggleBtn = useCallback((key) => {
    setActiveBtn(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  if (loading) return <FullscreenMessage>Loading your experience…</FullscreenMessage>;
  if (error)   return <FullscreenMessage>{error}</FullscreenMessage>;
  if (!ride)   return null;

  return (
    <>
      <Head>
        <title>Synergy Lux — In-Car Experience</title>
      </Head>

      <div style={s.page}>

        {/* ── HEADER ── */}
        <header style={s.header}>
          <div style={s.logo}>SYNERGY <span style={s.logoGold}>LUX</span></div>
          <div style={s.headerRight}>
            <span style={s.wifiDot} />
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>WiFi Connected</span>
            <span style={{ color: 'var(--white)', fontWeight: 500, fontSize: 12 }}>{time}</span>
          </div>
        </header>

        <main style={s.main}>

          {/* ── WELCOME ── */}
          <section style={s.welcome}>
            <p style={s.eyebrow}>In-Car Experience</p>
            <h1 style={s.welcomeH1}>
              Welcome, <em style={{ color: 'var(--gold2)', fontStyle: 'italic' }}>
                {ride.customer.name}
              </em>
            </h1>
            <div style={s.metaRow}>
              <Chip gold>Chauffeur: {ride.chauffeurName}</Chip>
              <ETAChip etaMinutes={ride.etaMinutes} />
            </div>
          </section>

          {/* ── BOOK NEXT RIDE ── */}
          <div style={s.cardBook}>
            <p style={s.bookEyebrow}>Your Next Ride</p>
            <h2 style={s.bookHeading}>Reserve Your Return</h2>
            <p style={s.bookSub}>Book before drop-off and lock in your rate.</p>
            <button style={s.btnBook} onClick={() => setShowModal(true)}>
              Book Now &nbsp;→
            </button>
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div>
            <p style={s.sectionLabel}>Preferences</p>
            <div style={s.quickGrid}>
              {[
                { key: 'wifi',    icon: '⌾', label: 'WiFi'    },
                { key: 'music',   icon: '♪', label: 'Music'   },
                { key: 'climate', icon: '❄', label: 'Climate' },
                { key: 'service', icon: '◈', label: 'Request' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  style={{ ...s.quickBtn, ...(activeBtn[key] ? s.quickBtnActive : {}) }}
                  onClick={() => toggleBtn(key)}
                >
                  <span style={s.quickIcon}>{icon}</span>
                  <span style={s.quickLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── VIP STATUS ── */}
          <div style={s.card}>
            <div style={s.vipHeader}>
              <h3 style={s.cardTitle}>VIP Status</h3>
              <span style={s.vipBadge}>Gold</span>
            </div>
            <p style={s.vipSub}>2 rides away from Platinum</p>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: '60%' }} />
            </div>
            <div style={s.progressLabels}>
              <span>Gold</span><span>Platinum</span>
            </div>
          </div>

          {/* ── SPECIAL OFFER ── */}
          <div style={s.cardOffer}>
            <div>
              <h3 style={s.offerTitle}>Book Before Drop-Off</h3>
              <p style={s.offerSub}>Reserve your next ride now and receive 10% off.</p>
            </div>
            <span style={s.offerBadge}>10% Off</span>
          </div>

          {/* ── CORPORATE ── */}
          <div style={s.card}>
            <div style={s.corpRow}>
              <div>
                <h3 style={{ ...s.cardTitle, fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400 }}>
                  Corporate Account
                </h3>
                <p style={s.corpSub}>4+ rides/month. 10–15% off all rides.<br />Monthly invoicing available.</p>
              </div>
              <a href="tel:6468791391" style={s.btnCorp}>Apply</a>
            </div>
          </div>

          {/* ── QR CODE ── */}
          <div style={s.card}>
            <div style={s.qrRow}>
              <div style={s.qrWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&margin=6&data=${
                    encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL?.replace(':4000',':3000') || ''}/rebook/${ride.customerId}`)
                  }`}
                  alt="QR rebook"
                  width={88} height={88}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <h3 style={s.cardTitle}>Scan to Rebook</h3>
                <p style={s.corpSub}>Takes you directly to your booking page.<br />Works from any device.</p>
                <span style={{ fontSize: 11, color: 'var(--gold)' }}>synergyluxlimodfw.com</span>
              </div>
            </div>
          </div>

        </main>

        <footer style={s.footer}>
          <span style={{ color: 'var(--gold)' }}>SYNERGY LUX</span> · Dallas–Fort Worth · (646) 879-1391
        </footer>

      </div>

      {showModal && (
        <RebookModal
          customerId={ride.customerId}
          lastRide={ride}
          onClose={() => { setShowModal(false); setPrompt(null); }}
        />
      )}
    </>
  );
}

// ── Small helpers ──────────────────────────────────────────

function Chip({ children, gold }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'var(--gold-dim)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '5px 13px',
      fontSize: 12, color: 'var(--white)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: gold ? 'var(--gold)' : 'var(--green-accent)',
      }} />
      {children}
    </span>
  );
}

function FullscreenMessage({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100vh', background: 'var(--black)', color: 'var(--muted)',
                  fontSize: 14, letterSpacing: 1 }}>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────

const s = {
  page: { minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' },

  header: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: 60,
    background: 'rgba(6,6,10,0.92)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
  },
  logo:      { fontSize: 12, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' },
  logoGold:  { color: 'var(--gold)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  wifiDot:   { width: 7, height: 7, borderRadius: '50%', background: '#4ADE80',
                boxShadow: '0 0 6px #4ADE80', display: 'inline-block' },

  main: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 12,
    padding: '20px 20px 40px', maxWidth: 700, margin: '0 auto', width: '100%',
  },

  welcome:   { padding: '28px 0 8px' },
  eyebrow:   { fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 10 },
  welcomeH1: { fontFamily: "'Cormorant Garamond', serif", fontSize: 46, fontWeight: 400, lineHeight: 1.05, marginBottom: 14 },
  metaRow:   { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },

  cardBook: {
    background: 'linear-gradient(135deg, #8B6914 0%, #C9A84C 50%, #DEB96A 100%)',
    borderRadius: 18, padding: '26px 24px',
  },
  bookEyebrow: { fontSize: 10, letterSpacing: '3.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: 6 },
  bookHeading: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, color: '#0A0600', marginBottom: 6, lineHeight: 1.1 },
  bookSub:     { fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 20 },
  btnBook: {
    display: 'block', width: '100%', background: '#06060A', color: 'var(--gold)',
    border: 'none', borderRadius: 10, padding: 15,
    fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase',
  },

  sectionLabel: { fontSize: 10, letterSpacing: '3.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 },
  quickGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 },
  quickBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    background: '#141419', border: '1px solid var(--border)', borderRadius: 14,
    padding: '18px 8px 14px',
    fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase',
    transition: 'background 0.2s, border-color 0.2s',
  },
  quickBtnActive: { background: 'var(--gold-dim)', borderColor: 'rgba(201,168,76,0.35)', color: 'var(--white)' },
  quickIcon:  { fontSize: 20, color: 'var(--gold)' },
  quickLabel: { fontSize: 10 },

  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px 22px' },
  cardTitle: { fontSize: 15, fontWeight: 500, color: 'var(--white)', marginBottom: 4 },

  vipHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  vipBadge:  { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', background: 'var(--gold-dim)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px' },
  vipSub:    { fontSize: 12, color: 'var(--muted)', marginBottom: 14 },
  progressTrack: { width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--gold2))', borderRadius: 2, transition: 'width 1s ease' },
  progressLabels:{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--muted)' },

  cardOffer:  { background: '#1A3A2A', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  offerTitle: { fontSize: 14, fontWeight: 600, color: '#4ADE80', marginBottom: 3 },
  offerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  offerBadge: { flexShrink: 0, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#4ADE80', whiteSpace: 'nowrap' },

  corpRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  corpSub:  { fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, marginTop: 4 },
  btnCorp:  { flexShrink: 0, background: 'var(--gold)', color: '#06060A', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },

  qrRow:  { display: 'flex', alignItems: 'center', gap: 20 },
  qrWrap: { width: 88, height: 88, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'white' },

  footer: { textAlign: 'center', padding: '0 20px 24px', fontSize: 11, color: 'var(--muted)', letterSpacing: 1, maxWidth: 700, margin: '0 auto', width: '100%' },
};
