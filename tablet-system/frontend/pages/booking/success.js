import Head from 'next/head';
import { useRouter } from 'next/router';

export default function BookingSuccess() {
  const router = useRouter();

  return (
    <>
      <Head><title>Booking Confirmed — Synergy Lux</title></Head>
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.icon}>✦</div>
          <p style={s.eyebrow}>Booking Confirmed</p>
          <h1 style={s.h1}>You're all set.</h1>
          <p style={s.sub}>
            A confirmation will be sent to you shortly.<br />
            Your chauffeur will be ready and waiting.
          </p>
          <a href="/" style={s.btn}>Return to Site</a>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center' },
  icon: { fontSize: 28, color: 'var(--gold)', marginBottom: 20 },
  eyebrow: { fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 12 },
  h1:  { fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 400, marginBottom: 16 },
  sub: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32 },
  btn: { display: 'inline-block', background: 'var(--gold)', color: '#06060A', borderRadius: 10, padding: '13px 28px', fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase' },
};
