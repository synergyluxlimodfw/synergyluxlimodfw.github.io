'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function ConfirmInner() {
  const params = useSearchParams();
  const token = params.get('token');

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [ride, setRide] = useState<any>(null);

  useEffect(() => {
    async function loadRide() {
      if (!token) return;
      try {
        const res = await fetch(`/api/confirm?token=${token}`);
        const json = await res.json();
        if (json.data) setRide(json.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadRide();
  }, [token]);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) setConfirmed(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  if (confirmed) {
    return (
      <div style={styles.container}>
        <div style={styles.checkCircle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5L9.5 17L19 8" stroke="rgba(180,155,110,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.title}>Ride Confirmed</h1>
        <p style={styles.subtitle}>
          {ride?.passenger_name ? `${ride.passenger_name} has been notified.` : 'Passenger has been notified.'}
        </p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div style={styles.container}>
        <p style={styles.subtitle}>Loading request...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Synergy Lux · Confirm</p>

        <p style={styles.label}>Passenger</p>
        <h2 style={styles.value}>{ride.passenger_name}</h2>

        <p style={styles.label}>Route</p>
        <h3 style={styles.route}>{ride.pickup} → {ride.destination}</h3>

        {ride.occasion && (
          <>
            <p style={styles.label}>Occasion</p>
            <p style={styles.value}>{ride.occasion}</p>
          </>
        )}

        <p style={styles.label}>Phone</p>
        <p style={{ ...styles.value, fontSize: 14, color: 'rgba(180,155,110,0.7)' }}>{ride.phone}</p>

        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Confirming...' : 'Confirm Ride'}
        </button>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0A0A0A',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif',
          fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Loading...
        </p>
      </div>
    }>
      <ConfirmInner />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: '0.5px solid rgba(180,155,110,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(180,155,110,0.08)',
    marginBottom: 24,
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36,
    fontWeight: 300,
    color: '#f0ece4',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(240,236,228,0.4)',
    fontWeight: 300,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(22,20,18,0.98)',
    border: '0.5px solid rgba(180,155,110,0.2)',
    borderRadius: 16,
    padding: '32px 28px',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(180,155,110,0.5)',
    fontWeight: 300,
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'rgba(240,236,228,0.3)',
    fontWeight: 300,
    marginTop: 20,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    color: '#f0ece4',
    fontWeight: 300,
  },
  route: {
    fontSize: 16,
    color: 'rgba(180,155,110,0.85)',
    fontWeight: 300,
  },
  button: {
    marginTop: 28,
    width: '100%',
    padding: '16px',
    background: 'rgba(180,155,110,0.15)',
    border: '0.5px solid rgba(180,155,110,0.5)',
    borderRadius: 10,
    color: '#d4b896',
    fontSize: 13,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 400,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
};
