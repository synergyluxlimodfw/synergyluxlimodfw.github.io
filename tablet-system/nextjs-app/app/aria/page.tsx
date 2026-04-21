import type { Metadata } from 'next';
import AriaChat from '@/components/AriaChat';

export const metadata: Metadata = {
  title:       'Book Your Ride — Prestige by Synergy Lux',
  description: 'Tell Amirah your occasion and we handle everything. Private chauffeur service in Dallas–Fort Worth.',
};

// ─────────────────────────────────────────────────────────
// /aria — Aria AI Concierge Landing Page
// ─────────────────────────────────────────────────────────

export default function AriaPage() {
  return (
    <div style={{ background: '#06060A', minHeight: '100vh', color: '#EFEFEF' }}>

      {/* ── Ambient top glow ───────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:   'fixed',
          inset:      0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)',
          zIndex:     0,
        }}
      />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{
        position:       'relative',
        zIndex:         1,
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        padding:        'clamp(60px, 8vw, 100px) clamp(24px, 6vw, 80px)',
        gap:            'clamp(40px, 6vw, 80px)',
        flexWrap:       'wrap' as const,
      }}>

        {/* Left — copy */}
        <div style={{
          flex:    '1 1 340px',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          gap:     '32px',
        }}>

          {/* Brand label */}
          <p style={{
            fontSize:      '10px',
            letterSpacing: '5px',
            textTransform: 'uppercase' as const,
            color:         '#C9A84C',
            opacity:       0.75,
            margin:        0,
          }}>
            Prestige by Synergy Lux
          </p>

          {/* Headline */}
          <h1
            className="font-[family-name:var(--font-cormorant)]"
            style={{
            fontSize:    'clamp(42px, 5.5vw, 64px)',
            fontWeight:  300,
            lineHeight:  1.1,
            color:       '#EFEFEF',
            margin:      0,
          }}>
            Private Chauffeur
            <br />
            <em style={{ color: '#C9A84C', fontStyle: 'italic' }}>
              Experience, Elevated
            </em>
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize:   '16px',
            lineHeight: 1.65,
            color:      '#666672',
            margin:     0,
            maxWidth:   '420px',
          }}>
            Personalized journeys designed around you. Tell Amirah your occasion
            and we handle everything.
          </p>

          {/* Trust pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px' }}>
            {['Discreet', 'On Time', 'Super Cruise Equipped'].map(label => (
              <span
                key={label}
                style={{
                  padding:       '7px 16px',
                  borderRadius:  '100px',
                  border:        '1px solid rgba(201,168,76,0.25)',
                  fontSize:      '11px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase' as const,
                  color:         'rgba(201,168,76,0.70)',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Phone */}
          <a
            href="tel:6468791391"
            className="font-[family-name:var(--font-cormorant)]"
            style={{
              display:     'inline-flex',
              alignItems:  'center',
              gap:         '8px',
              color:       '#C9A84C',
              textDecoration: 'none',
              fontSize:    '18px',
              fontWeight:  500,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ fontSize: '13px', opacity: 0.7 }}>✆</span>
            (646) 879-1391
          </a>
        </div>

        {/* Right — Aria chat */}
        <div style={{
          flex:    '1 1 380px',
          maxWidth: '480px',
          width:   '100%',
        }}>
          <AriaChat />
        </div>

      </section>

      {/* ── Divider ────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex:   1,
        height:   '1px',
        background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.18), transparent)',
        margin:   '0 clamp(24px, 6vw, 80px)',
      }} />

      {/* ── Trust section ──────────────────────────────────── */}
      <section style={{
        position:  'relative',
        zIndex:    1,
        padding:   'clamp(60px, 8vw, 100px) clamp(24px, 6vw, 80px)',
        display:   'flex',
        gap:       '24px',
        flexWrap:  'wrap' as const,
      }}>
        {[
          {
            title:  'Discreet',
            body:   'Your privacy is non-negotiable. Our chauffeurs are trained to the highest standards of discretion.',
          },
          {
            title:  'On Time',
            body:   'We monitor every flight and traffic condition so you never wait — and you never rush.',
          },
          {
            title:  'Tailored Experience',
            body:   'From cabin temperature to music preference, every detail is prepared before you arrive.',
          },
        ].map(({ title, body }) => (
          <div
            key={title}
            style={{
              flex:         '1 1 240px',
              padding:      '32px 28px',
              background:   '#0F0F14',
              border:       '1px solid rgba(201,168,76,0.14)',
              borderTop:    '2px solid rgba(201,168,76,0.30)',
              borderRadius: '20px',
              display:      'flex',
              flexDirection: 'column',
              gap:          '14px',
            }}
          >
            <span style={{ color: '#C9A84C', fontSize: '18px' }}>✦</span>
            <h3
              className="font-[family-name:var(--font-cormorant)]"
              style={{
              fontSize:    '24px',
              fontWeight:  400,
              color:       '#EFEFEF',
              margin:      0,
              lineHeight:  1.2,
            }}>
              {title}
            </h3>
            <p style={{
              fontSize:   '14px',
              lineHeight: 1.65,
              color:      '#666672',
              margin:     0,
            }}>
              {body}
            </p>
          </div>
        ))}
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section style={{
        position: 'relative',
        zIndex:   1,
        padding:  'clamp(40px, 6vw, 80px) clamp(24px, 6vw, 80px)',
      }}>
        {/* Section label */}
        <p style={{
          fontSize:      '10px',
          letterSpacing: '5px',
          textTransform: 'uppercase' as const,
          color:         'rgba(201,168,76,0.50)',
          marginBottom:  '48px',
        }}>
          How It Works
        </p>

        <div style={{
          display:  'flex',
          gap:      '40px',
          flexWrap: 'wrap' as const,
        }}>
          {[
            { n: '01', step: 'Tell Amirah your occasion',  detail: 'Share where you\'re going, when, and what the moment calls for. Amirah handles the rest.' },
            { n: '02', step: 'We prepare your ride',      detail: 'Your chauffeur, cabin preferences, and route are confirmed before you\'re even ready.' },
            { n: '03', step: 'Experience Prestige',       detail: 'Step in. Everything is exactly as you requested. That\'s the Prestige standard.' },
          ].map(({ n, step, detail }) => (
            <div
              key={n}
              style={{
                flex:          '1 1 220px',
                display:       'flex',
                flexDirection: 'column',
                gap:           '14px',
              }}
            >
              <span
                className="font-[family-name:var(--font-cormorant)]"
                style={{
                fontSize:    '40px',
                fontWeight:  300,
                color:       'rgba(201,168,76,0.35)',
                lineHeight:  1,
              }}>
                {n}
              </span>
              <h4
                className="font-[family-name:var(--font-cormorant)]"
                style={{
                fontSize:    '22px',
                fontWeight:  400,
                color:       '#EFEFEF',
                margin:      0,
                lineHeight:  1.3,
              }}>
                {step}
              </h4>
              <p style={{
                fontSize:   '14px',
                lineHeight: 1.65,
                color:      '#666672',
                margin:     0,
              }}>
                {detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bio divider ────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex:   1,
        height:   '1px',
        background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.18), transparent)',
        margin:   '0 clamp(24px, 6vw, 80px)',
      }} />

      {/* ── About Mr. Rodriguez ────────────────────────────── */}
      <section style={{
        position:       'relative',
        zIndex:         1,
        padding:        'clamp(60px, 8vw, 100px) clamp(24px, 6vw, 80px)',
        display:        'flex',
        alignItems:     'center',
        gap:            'clamp(40px, 6vw, 80px)',
        flexWrap:       'wrap' as const,
      }}>
        {/* Gold accent line */}
        <div style={{
          width:      '2px',
          alignSelf:  'stretch',
          minHeight:  '80px',
          background: 'linear-gradient(to bottom, rgba(201,168,76,0.60), rgba(201,168,76,0.08))',
          flexShrink: 0,
        }} />

        <div style={{ flex: '1 1 280px' }}>
          <p style={{
            fontSize:      '10px',
            letterSpacing: '5px',
            textTransform: 'uppercase' as const,
            color:         'rgba(201,168,76,0.50)',
            margin:        '0 0 20px',
          }}>
            Your Chauffeur
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)]"
            style={{
            fontSize:    'clamp(32px, 4vw, 48px)',
            fontWeight:  300,
            color:       '#EFEFEF',
            margin:      '0 0 20px',
            lineHeight:  1.15,
          }}>
            Mr. Rodriguez
          </h2>
          <p style={{
            fontSize:   '16px',
            lineHeight: 1.75,
            color:      '#888892',
            margin:     0,
            maxWidth:   '560px',
          }}>
            Mr. Rodriguez brings 14 years of experience as an educator to every
            ride — where precision, punctuality, and earning trust were never
            optional. That same dedication now drives every Synergy Lux experience.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{
        position:     'relative',
        zIndex:       1,
        borderTop:    '1px solid rgba(201,168,76,0.10)',
        padding:      '40px clamp(24px, 6vw, 80px)',
        display:      'flex',
        flexWrap:     'wrap' as const,
        alignItems:   'center',
        justifyContent: 'space-between',
        gap:          '20px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p
            className="font-[family-name:var(--font-cormorant)]"
            style={{
            fontSize:    '18px',
            fontWeight:  500,
            color:       '#EFEFEF',
            margin:      0,
            letterSpacing: '0.02em',
          }}>
            Prestige by Synergy Lux
          </p>
          <p style={{ fontSize: '12px', color: '#666672', margin: 0 }}>
            Dallas–Fort Worth
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <a
            href="tel:6468791391"
            className="font-[family-name:var(--font-cormorant)]"
            style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '15px' }}
          >
            (646) 879-1391
          </a>
          <a
            href="https://synergyluxlimodfw.com"
            style={{ color: '#666672', textDecoration: 'none', fontSize: '12px' }}
          >
            synergyluxlimodfw.com →
          </a>
        </div>
      </footer>

      <p className="text-xs text-gray-400 text-center py-2">
        © 2026 Synergy Lux Limo DFW LLC · Powered by Amirah AI
      </p>

    </div>
  );
}
