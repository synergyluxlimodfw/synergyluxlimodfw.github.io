'use client';

import { useState } from 'react';

const GOLD = 'rgba(180,155,110,0.9)';
const GOLD_DIM = 'rgba(180,155,110,0.5)';
const GOLD_FAINT = 'rgba(180,155,110,0.08)';
const GOLD_BORDER = 'rgba(180,155,110,0.2)';
const WHITE = '#f0ece4';
const WHITE_DIM = 'rgba(240,236,228,0.5)';
const WHITE_FAINT = 'rgba(240,236,228,0.3)';
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";
const BG = '#08080C';
const CARD_BG = 'rgba(22,20,18,0.98)';

export default function CorporatePage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    rides: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!formData.name || !formData.company || !formData.phone) return;
    setLoading(true);
    try {
      await fetch('/api/booking-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: formData.name,
          Phone: formData.phone,
          Email: formData.email,
          Service: `Corporate Account — ${formData.rides || 'TBD'} rides/month`,
          Pickup_Location: formData.company,
          Dropoff_Location: 'Corporate Account Inquiry',
          Date: new Date().toISOString().split('T')[0],
          Time: new Date().toTimeString().split(' ')[0],
          Passengers: '1',
          Notes: formData.notes,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitted(true);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS }}>

      {/* Nav */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        borderBottom: `0.5px solid ${GOLD_BORDER}`,
      }}>
        <a href="https://synergyluxlimodfw.com" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: WHITE }}>
            Synergy <span style={{ color: GOLD }}>Lux</span>
          </span>
        </a>
        <a href="tel:6468791391" style={{
          fontSize: 12,
          letterSpacing: '1px',
          color: GOLD_DIM,
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}>
          (646) 879-1391
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '100px 48px 80px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: GOLD_DIM,
          fontWeight: 300,
          marginBottom: 24,
        }}>
          Corporate Accounts · DFW
        </p>
        <h1 style={{
          fontFamily: SERIF,
          fontSize: 'clamp(42px, 7vw, 80px)',
          fontWeight: 300,
          color: WHITE,
          lineHeight: 1.1,
          marginBottom: 28,
        }}>
          Your executives deserve<br />
          <em style={{ color: GOLD, fontStyle: 'italic' }}>better than Uber.</em>
        </h1>
        <p style={{
          fontSize: 16,
          color: WHITE_DIM,
          fontWeight: 300,
          maxWidth: 560,
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          Dedicated black car service for DFW's most demanding professionals.
          One driver. One standard. Zero compromises.
        </p>
        <a href="#account" style={{
          display: 'inline-block',
          padding: '16px 40px',
          background: GOLD_FAINT,
          border: `0.5px solid ${GOLD_BORDER}`,
          borderRadius: 8,
          color: GOLD,
          fontSize: 12,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textDecoration: 'none',
          fontWeight: 400,
        }}>
          Set Up Your Account
        </a>
      </section>

      {/* Why Synergy Lux */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '80px 48px',
        borderTop: `0.5px solid ${GOLD_BORDER}`,
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: GOLD_DIM,
          fontWeight: 300,
          marginBottom: 48,
          textAlign: 'center',
        }}>
          The Standard
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {[
            {
              title: 'Same Driver. Every Time.',
              body: 'Mr. Rodriguez personally handles every corporate account. Your executives are never handed off to an unknown driver.',
            },
            {
              title: 'On Time. Guaranteed.',
              body: '10 minutes early is on time. Flight tracking active on every airport transfer. No surge pricing. Ever.',
            },
            {
              title: 'Discreet by Default.',
              body: 'Confidential travel is standard. No conversation unless requested. Your executives focus on what matters.',
            },
            {
              title: 'Technology-First.',
              body: 'Real-time ride tracking, instant confirmation, and a personalized in-car experience no other DFW operator offers.',
            },
          ].map((item) => (
            <div key={item.title} style={{
              background: CARD_BG,
              border: `0.5px solid ${GOLD_BORDER}`,
              borderRadius: 12,
              padding: '28px 24px',
            }}>
              <h3 style={{
                fontFamily: SERIF,
                fontSize: 20,
                fontWeight: 300,
                color: WHITE,
                marginBottom: 12,
                lineHeight: 1.3,
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: 13,
                color: WHITE_FAINT,
                fontWeight: 300,
                lineHeight: 1.7,
              }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Corporate Rates */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '80px 48px',
        borderTop: `0.5px solid ${GOLD_BORDER}`,
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: GOLD_DIM,
          fontWeight: 300,
          marginBottom: 48,
          textAlign: 'center',
        }}>
          Corporate Rates
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              tier: 'Standard',
              rides: '1–3 rides/month',
              discount: 'Standard rates',
              perks: ['Priority response', 'Dedicated driver', 'Flight tracking'],
              highlight: false,
            },
            {
              tier: 'Business',
              rides: '4–7 rides/month',
              discount: '10% off all rides',
              perks: ['Priority response', 'Dedicated driver', 'Flight tracking', 'Monthly invoice'],
              highlight: true,
            },
            {
              tier: 'Executive',
              rides: '8+ rides/month',
              discount: '15% off all rides',
              perks: ['Priority response', 'Dedicated driver', 'Flight tracking', 'Monthly invoice', 'Priority booking'],
              highlight: false,
            },
          ].map((plan) => (
            <div key={plan.tier} style={{
              background: plan.highlight ? 'rgba(180,155,110,0.1)' : CARD_BG,
              border: `0.5px solid ${plan.highlight ? GOLD : GOLD_BORDER}`,
              borderRadius: 12,
              padding: '32px 24px',
              position: 'relative',
            }}>
              {plan.highlight && (
                <p style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 9,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: BG,
                  background: GOLD,
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </p>
              )}
              <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: GOLD_DIM, fontWeight: 300, marginBottom: 8 }}>
                {plan.tier}
              </p>
              <p style={{ fontFamily: SERIF, fontSize: 28, color: WHITE, fontWeight: 300, marginBottom: 4 }}>
                {plan.discount}
              </p>
              <p style={{ fontSize: 12, color: WHITE_FAINT, fontWeight: 300, marginBottom: 24 }}>
                {plan.rides}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.perks.map((perk) => (
                  <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: GOLD, fontSize: 14 }}>✦</span>
                    <span style={{ fontSize: 12, color: WHITE_DIM, fontWeight: 300 }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vehicle */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '80px 48px',
        borderTop: `0.5px solid ${GOLD_BORDER}`,
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: GOLD_DIM,
          fontWeight: 300,
          marginBottom: 24,
        }}>
          The Fleet
        </p>
        <h2 style={{
          fontFamily: SERIF,
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 300,
          color: WHITE,
          marginBottom: 16,
          lineHeight: 1.2,
        }}>
          2024 Cadillac Escalade<br />
          <span style={{ color: GOLD }}>Premium Luxury</span>
        </h2>
        <p style={{
          fontSize: 14,
          color: WHITE_FAINT,
          fontWeight: 300,
          maxWidth: 480,
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Super Cruise technology. Massaging rear seats. Panoramic roof.
          Your executives arrive relaxed, focused, and on time.
        </p>
      </section>

      {/* Contact Form */}
      <section id="account" style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '80px 48px 120px',
        borderTop: `0.5px solid ${GOLD_BORDER}`,
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: GOLD_DIM,
          fontWeight: 300,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          Get Started
        </p>
        <h2 style={{
          fontFamily: SERIF,
          fontSize: 40,
          fontWeight: 300,
          color: WHITE,
          marginBottom: 48,
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          Set up your<br />corporate account
        </h2>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: `0.5px solid ${GOLD_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              background: GOLD_FAINT,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5L9.5 17L19 8" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontFamily: SERIF, fontSize: 28, color: WHITE, fontWeight: 300, marginBottom: 8 }}>
              Request Received
            </p>
            <p style={{ fontSize: 13, color: WHITE_FAINT, fontWeight: 300 }}>
              Mr. Rodriguez will be in touch within the hour.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Full Name', key: 'name', placeholder: 'Your full name', required: true },
              { label: 'Company', key: 'company', placeholder: 'Company or firm name', required: true },
              { label: 'Phone', key: 'phone', placeholder: '+1 (214) 000-0000', required: true },
              { label: 'Email', key: 'email', placeholder: 'your@company.com', required: false },
              { label: 'Estimated Rides Per Month', key: 'rides', placeholder: 'e.g. 4–6', required: false },
              { label: 'Notes', key: 'notes', placeholder: 'Routes, schedule, special requirements...', required: false },
            ].map((field) => (
              <div key={field.key}>
                <label style={{
                  display: 'block',
                  fontSize: 10,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: WHITE_FAINT,
                  fontWeight: 300,
                  marginBottom: 8,
                }}>
                  {field.label}{field.required && <span style={{ color: GOLD }}> *</span>}
                </label>
                {field.key === 'notes' ? (
                  <textarea
                    value={formData[field.key as keyof typeof formData]}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: '100%',
                      background: CARD_BG,
                      border: `0.5px solid ${GOLD_BORDER}`,
                      borderRadius: 8,
                      padding: '14px 16px',
                      color: WHITE,
                      fontSize: 14,
                      fontFamily: SANS,
                      fontWeight: 300,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.key as keyof typeof formData]}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      background: CARD_BG,
                      border: `0.5px solid ${GOLD_BORDER}`,
                      borderRadius: 8,
                      padding: '14px 16px',
                      color: WHITE,
                      fontSize: 14,
                      fontFamily: SANS,
                      fontWeight: 300,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.company || !formData.phone}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '18px',
                background: GOLD_FAINT,
                border: `0.5px solid ${GOLD_BORDER}`,
                borderRadius: 8,
                color: GOLD,
                fontSize: 12,
                fontFamily: SANS,
                fontWeight: 400,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Request Account Setup'}
            </button>

            <p style={{
              fontSize: 11,
              color: WHITE_FAINT,
              textAlign: 'center',
              fontWeight: 300,
              lineHeight: 1.6,
            }}>
              Mr. Rodriguez responds personally within the hour.
              No automated systems. No call centers.
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `0.5px solid ${GOLD_BORDER}`,
        padding: '32px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 300, color: WHITE_FAINT }}>
          Synergy <span style={{ color: GOLD }}>Lux</span> · DFW
        </span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="tel:6468791391" style={{ fontSize: 12, color: WHITE_FAINT, textDecoration: 'none' }}>
            (646) 879-1391
          </a>
          <a href="https://synergyluxlimodfw.com" style={{ fontSize: 12, color: GOLD_DIM, textDecoration: 'none' }}>
            synergyluxlimodfw.com
          </a>
        </div>
      </footer>

    </div>
  );
}
