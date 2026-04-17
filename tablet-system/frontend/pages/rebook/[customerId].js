import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import RebookModal from '../../components/RebookModal';

/**
 * QR landing page — /rebook/:customerId
 * Auto-fetches last ride data and pre-fills the rebook flow.
 */
export default function RebookPage() {
  const router = useRouter();
  const { customerId } = router.query;

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    api.getCustomerData(customerId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div style={s.page}>
        <p style={s.loading}>Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={s.page}>
        <p style={s.loading}>Customer not found.</p>
      </div>
    );
  }

  const { customer, lastRide } = data;

  return (
    <>
      <Head>
        <title>Rebook — Synergy Lux</title>
      </Head>

      <div style={s.page}>
        <header style={s.header}>
          <div style={s.logo}>SYNERGY <span style={{ color: 'var(--gold)' }}>LUX</span></div>
        </header>

        <main style={s.main}>

          <p style={s.eyebrow}>Welcome Back</p>
          <h1 style={s.h1}>
            Good to see you,<br />
            <em style={{ color: 'var(--gold2)', fontStyle: 'italic' }}>{customer.name}</em>
          </h1>

          {lastRide && (
            <div style={s.lastRide}>
              <p style={s.lastLabel}>Last Ride</p>
              <p style={s.lastRoute}>{lastRide.pickup} → {lastRide.dropoff}</p>
            </div>
          )}

          <button style={s.btnGold} onClick={() => setShowModal(true)}>
            Book a Ride &nbsp;→
          </button>

          <p style={s.phone}>
            Or call us: <a href="tel:6468791391" style={{ color: 'var(--gold)' }}>(646) 879-1391</a>
          </p>

        </main>
      </div>

      {showModal && (
        <RebookModal
          customerId={customerId}
          lastRide={lastRide}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

const s = {
  page:    { minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' },
  header:  { padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' },
  logo:    { fontSize: 12, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' },
  main:    { flex: 1, padding: '52px 28px', maxWidth: 480, margin: '0 auto', width: '100%' },
  eyebrow: { fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 12 },
  h1:      { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 400, lineHeight: 1.1, marginBottom: 36 },
  lastRide:{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', marginBottom: 28 },
  lastLabel: { fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 },
  lastRoute: { fontSize: 14, color: 'var(--white)' },
  btnGold: { width: '100%', background: 'var(--gold)', color: '#06060A', border: 'none', borderRadius: 12, padding: '16px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 },
  phone:   { fontSize: 13, color: 'var(--muted)', textAlign: 'center' },
  loading: { color: 'var(--muted)', margin: 'auto', fontSize: 13, letterSpacing: 1 },
};
