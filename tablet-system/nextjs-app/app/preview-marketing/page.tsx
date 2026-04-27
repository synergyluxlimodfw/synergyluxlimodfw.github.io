'use client';

/**
 * /preview-marketing — design review page only.
 *
 * Simulates how the marketing site (synergyluxlimodfw.com) homepage hero
 * would look with the Escalade video background. No existing pages or
 * components are modified.
 *
 * To discard: delete this file. Everything else is untouched.
 */

export default function PreviewMarketingPage() {
  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>

      {/* ── Video background: z-index 0 ───────────────────────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position:      'fixed',
          top:            0,
          left:           0,
          width:         '100vw',
          height:        '100vh',
          objectFit:     'cover',
          zIndex:         0,
          pointerEvents: 'none',
        }}
      >
        <source src="/escalade-hero.mp4" type="video/mp4" />
      </video>

      {/* ── Dark gradient overlay: z-index 1 ─────────────────────────── */}
      <div
        style={{
          position:      'fixed',
          top:            0,
          left:           0,
          width:         '100vw',
          height:        '100vh',
          background:    'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%)',
          zIndex:         1,
          pointerEvents: 'none',
        }}
      />

      {/* ── All page content: z-index 10 ─────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav style={{
          position:     'fixed',
          top:           0,
          left:          0,
          right:         0,
          zIndex:        20,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      '0 40px',
          height:       '68px',
          background:   'rgba(0,0,0,0.15)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid rgba(212,175,55,0.25)',
        }}>
          {/* Logo */}
          <a href="#" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontFamily:    'Georgia, serif',
              fontSize:      '20px',
              fontWeight:    700,
              letterSpacing: '4px',
              color:         '#fff',
              textTransform: 'uppercase',
            }}>
              SYNERGY
            </span>
            <span style={{
              fontFamily:  'Georgia, serif',
              fontSize:    '20px',
              fontWeight:  300,
              fontStyle:   'italic',
              color:       '#d4af37',
              marginLeft:  '6px',
            }}>
              Lux
            </span>
          </a>

          {/* Nav links */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '28px',
          }}>
            {['Fleet', 'FIFA 2026', 'Se habla español'].map(link => (
              <a key={link} href="#" style={{
                fontFamily:    'Georgia, serif',
                fontSize:      '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.70)',
                textDecoration: 'none',
                whiteSpace:    'nowrap',
              }}>
                {link}
              </a>
            ))}

            <a href="tel:8883306902" style={{
              fontFamily:    'Georgia, serif',
              fontSize:      '11px',
              letterSpacing: '2px',
              color:         '#d4af37',
              textDecoration: 'none',
              whiteSpace:    'nowrap',
            }}>
              (888) 330-6902
            </a>

            <a href="#" style={{
              fontFamily:    'Georgia, serif',
              fontSize:      '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color:         '#d4af37',
              border:        '1px solid rgba(212,175,55,0.65)',
              padding:       '8px 18px',
              textDecoration: 'none',
              whiteSpace:    'nowrap',
            }}>
              Book Now
            </a>
          </div>
        </nav>

        {/* ── Hero section ─────────────────────────────────────────────── */}
        <section style={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '0 24px',
        }}>
          <div style={{
            maxWidth:  '600px',
            width:     '100%',
            padding:   '44px',
            textAlign: 'center',
          }}>

            {/* Gold label */}
            <p style={{
              fontFamily:    'Georgia, serif',
              fontSize:      '11px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color:         '#d4af37',
              marginBottom:  '28px',
              margin:        '0 0 28px',
            }}>
              Premium Chauffeur · Dallas–Fort Worth
            </p>

            {/* Headline */}
            <h1 style={{
              fontFamily:   'Georgia, serif',
              fontSize:     'clamp(52px, 8vw, 88px)',
              fontWeight:   300,
              color:        '#fff',
              lineHeight:   1.05,
              margin:       '0 0 4px',
              letterSpacing: '2px',
            }}>
              Arrive in
            </h1>
            <h1 style={{
              fontFamily:   'Georgia, serif',
              fontSize:     'clamp(52px, 8vw, 88px)',
              fontWeight:   300,
              fontStyle:    'italic',
              color:        '#d4af37',
              lineHeight:   1.05,
              margin:       '0 0 32px',
              letterSpacing: '2px',
            }}>
              Style.
            </h1>

            {/* Subheadline */}
            <p style={{
              fontFamily:   'Georgia, serif',
              fontSize:     '16px',
              fontWeight:   300,
              color:        'rgba(255,255,255,0.75)',
              lineHeight:   1.7,
              margin:       '0 0 44px',
              letterSpacing: '0.3px',
            }}>
              Black-on-black 2024 Cadillac Escalade. Professional chauffeurs.
              Airport transfers, corporate travel, and FIFA 2026 ground service
              across DFW.
            </p>

            {/* CTA buttons */}
            <div style={{
              display:        'flex',
              gap:            '16px',
              justifyContent: 'center',
              flexWrap:       'wrap',
            }}>
              <a href="tel:8883306902" style={{
                fontFamily:    'Georgia, serif',
                fontSize:      '12px',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                fontWeight:    600,
                color:         '#06060a',
                background:    '#d4af37',
                padding:       '18px 36px',
                textDecoration: 'none',
                whiteSpace:    'nowrap',
                display:       'inline-block',
              }}>
                Book Your Ride
              </a>

              <a href="#quote" style={{
                fontFamily:    'Georgia, serif',
                fontSize:      '12px',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                fontWeight:    400,
                color:         '#fff',
                background:    'transparent',
                border:        '1px solid rgba(255,255,255,0.70)',
                padding:       '18px 36px',
                textDecoration: 'none',
                whiteSpace:    'nowrap',
                display:       'inline-block',
              }}>
                Get Instant Quote
              </a>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
