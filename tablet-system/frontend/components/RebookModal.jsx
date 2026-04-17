import { useState } from 'react';
import { api } from '../lib/api';

const ROUTES = {
  airport:  { pickup: 'DFW International Airport', dropoff: '', price: 16500 },
  same:     null,  // filled dynamically from last ride
  custom:   { pickup: '', dropoff: '', price: 16500 },
};

const PRICE_LABELS = {
  airport: '$165',
  same:    '$165',
  custom:  'Quote',
};

export default function RebookModal({ customerId, lastRide, onClose }) {
  const [step, setStep]       = useState('choose');   // choose | schedule | processing | done
  const [routeType, setRoute] = useState(null);
  const [date, setDate]       = useState('');
  const [time, setTime]       = useState('');
  const [error, setError]     = useState(null);

  async function handleBook() {
    if (!date || !time) { setError('Please select a date and time.'); return; }

    setStep('processing');
    setError(null);

    const route = routeType === 'same' && lastRide
      ? { pickup: lastRide.pickup, dropoff: lastRide.dropoff, price: 16500 }
      : ROUTES[routeType];

    try {
      const { checkoutUrl } = await api.createBooking({
        customerId,
        pickup:      route.pickup,
        dropoff:     route.dropoff,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        price:       route.price,
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message);
      setStep('schedule');
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>

        {/* Close */}
        <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>

        {/* Eyebrow */}
        <p style={eyebrow}>Reserve Your Return</p>

        {/* STEP: Choose route */}
        {step === 'choose' && (
          <>
            <h2 style={heading}>Heading back later?</h2>
            <p style={sub}>Book in 15 seconds.</p>

            <div style={routeGrid}>
              <RouteCard
                icon="✈︎"
                label="Airport Return"
                detail="DFW · Flat rate"
                price={PRICE_LABELS.airport}
                onClick={() => { setRoute('airport'); setStep('schedule'); }}
              />
              <RouteCard
                icon="↩"
                label="Same Route"
                detail={lastRide ? `${lastRide.pickup} → ${lastRide.dropoff}` : 'Last route'}
                price={PRICE_LABELS.same}
                onClick={() => { setRoute('same'); setStep('schedule'); }}
              />
              <RouteCard
                icon="✦"
                label="Custom Ride"
                detail="Any pickup & drop-off"
                price={PRICE_LABELS.custom}
                onClick={() => { setRoute('custom'); setStep('schedule'); }}
              />
            </div>
          </>
        )}

        {/* STEP: Schedule */}
        {step === 'schedule' && (
          <>
            <h2 style={heading}>When do you need the car?</h2>
            <p style={sub}>Confirmation sent instantly.</p>

            <div style={fieldGroup}>
              <label style={label}>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={input}
              />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={input}
              />
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('choose')} style={btnOutline}>← Back</button>
              <button onClick={handleBook} style={btnGold}>Confirm &amp; Pay →</button>
            </div>
          </>
        )}

        {/* STEP: Processing */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: 'var(--gold)', fontSize: 14, letterSpacing: 2 }}>
              REDIRECTING TO CHECKOUT…
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────

function RouteCard({ icon, label, detail, price, onClick }) {
  return (
    <button onClick={onClick} style={routeCard}>
      <span style={routeIcon}>{icon}</span>
      <span style={routeLabel}>{label}</span>
      <span style={routeDetail}>{detail}</span>
      <span style={routePrice}>{price}</span>
    </button>
  );
}

// ── Styles ───────────────────────────────────────────

const overlay = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(6,6,10,0.85)',
  backdropFilter: 'blur(12px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};
const modal = {
  background: '#0F0F14',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '36px 32px',
  width: '100%', maxWidth: 460,
  position: 'relative',
};
const closeBtn = {
  position: 'absolute', top: 16, right: 16,
  background: 'none', border: 'none',
  color: 'var(--muted)', fontSize: 16, cursor: 'pointer',
};
const eyebrow = {
  fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.55)', marginBottom: 10,
};
const heading = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: 32, fontWeight: 400, color: 'var(--white)',
  marginBottom: 6, lineHeight: 1.1,
};
const sub = {
  fontSize: 13, color: 'var(--muted)', marginBottom: 28,
};
const routeGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
  marginBottom: 8,
};
const routeCard = {
  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
  gap: 4, padding: '16px 14px',
  background: '#141419',
  border: '1px solid var(--border)',
  borderRadius: 14,
  cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
  textAlign: 'left',
};
const routeIcon  = { fontSize: 18, color: 'var(--gold)',  marginBottom: 4 };
const routeLabel = { fontSize: 13, fontWeight: 500, color: 'var(--white)' };
const routeDetail= { fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 };
const routePrice = { fontSize: 13, color: 'var(--gold)',  fontWeight: 600, marginTop: 4 };

const fieldGroup = { marginBottom: 16 };
const label = {
  display: 'block', fontSize: 11, letterSpacing: '2.5px',
  textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
};
const input = {
  width: '100%', background: '#141419',
  border: '1px solid var(--border)',
  borderRadius: 10, padding: '12px 14px',
  color: 'var(--white)', fontSize: 14,
  outline: 'none', fontFamily: 'inherit',
};
const btnGold = {
  flex: 1, background: 'var(--gold)', color: '#06060A',
  border: 'none', borderRadius: 10,
  padding: '14px 20px',
  fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase',
};
const btnOutline = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 10, padding: '14px 18px',
  color: 'var(--muted)',
  fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
};
const errorStyle = {
  fontSize: 12, color: '#f87171', marginBottom: 14,
};
