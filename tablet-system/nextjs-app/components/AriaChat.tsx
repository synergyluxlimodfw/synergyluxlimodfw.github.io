'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API — minimal types for graceful degradation
interface SpeechRecognitionEvent extends Event {
  results: { [i: number]: { [j: number]: { transcript: string } } };
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart:  ((e: Event) => void) | null;
  onend:    ((e: Event) => void) | null;
  onerror:  ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => ISpeechRecognition;
declare global {
  interface Window {
    SpeechRecognition?:       SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface Message {
  role:    'user' | 'assistant';
  content: string;
}

interface BookingData {
  name?:            string;
  phone?:           string;
  occasion?:        string;
  destination?:     string;
  pickup_location?: string;
  date?:            string;
  time?:            string;
  service?:         string;
}

const OPENING = 'Welcome to Prestige by Synergy Lux. I am Amirah, your personal concierge. What is the occasion for your ride?';

// ─────────────────────────────────────────────────────────
// BookingConfirmationCard
// ─────────────────────────────────────────────────────────

function BookingConfirmationCard({
  booking,
  message,
  onConfirm,
  onEdit,
  isConfirming,
  confirmed,
  tier,
}: {
  booking:      BookingData;
  message:      string;
  onConfirm:    () => void;
  onEdit:       () => void;
  isConfirming: boolean;
  confirmed:    boolean;
  tier?:        'high' | 'medium' | 'low' | null;
}) {
  const fields: { icon: string; label: string; value: string }[] = [];
  if (booking.service)         fields.push({ icon: '✦',  label: 'Service', value: booking.service });
  if (booking.pickup_location) fields.push({ icon: '📍', label: 'Pickup',  value: booking.pickup_location });
  if (booking.destination)     fields.push({ icon: '🏁', label: 'Drop-off', value: booking.destination });
  if (booking.date)            fields.push({ icon: '📅', label: 'Date',    value: booking.date });
  if (booking.time)            fields.push({ icon: '⏰', label: 'Time',    value: booking.time });
  if (booking.occasion)        fields.push({ icon: '🗒',  label: 'Occasion', value: booking.occasion });

  return (
    <div
      style={{
        background:     '#111111',
        border:         '1px solid rgba(201,168,76,0.30)',
        borderTop:      '2px solid rgba(201,168,76,0.55)',
        borderRadius:   '16px',
        padding:        '24px',
        display:        'flex',
        flexDirection:  'column',
        gap:            '18px',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ color: '#C9A84C', fontSize: '14px' }}>✦</span>
        <p
          className="font-[family-name:var(--font-cormorant)]"
          style={{ fontSize: '20px', fontWeight: 400, color: '#EFEFEF', margin: 0, letterSpacing: '0.02em' }}
        >
          Your Ride Details
        </p>
        {tier === 'high' && (
          <span style={{
            fontSize:        10,
            letterSpacing:   '1.5px',
            textTransform:   'uppercase',
            color:           'rgba(180,155,110,0.8)',
            background:      'rgba(180,155,110,0.1)',
            border:          '0.5px solid rgba(180,155,110,0.3)',
            borderRadius:    20,
            padding:         '3px 10px',
            fontFamily:      'sans-serif',
            fontWeight:      300,
          }}>
            Priority booking
          </span>
        )}
      </div>

      {/* Fields */}
      {fields.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {fields.map(f => (
            <div key={f.label} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', flexShrink: 0, width: '20px' }}>{f.icon}</span>
              <span style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', flexShrink: 0, width: '56px' }}>
                {f.label}
              </span>
              <span style={{ fontSize: '13.5px', color: '#EFEFEF', fontWeight: 300, letterSpacing: '0.01em' }}>
                {f.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(201,168,76,0.12)' }} />

      {/* Amirah's message / success */}
      {confirmed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4ADE80', fontSize: '14px' }}>✓</span>
          <p
            className="font-[family-name:var(--font-cormorant)]"
            style={{ fontSize: '15px', color: '#4ADE80', margin: 0, letterSpacing: '0.02em', fontWeight: 400 }}
          >
            You&apos;re all set. Mr. Rodriguez will take care of everything.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '13.5px', color: 'rgba(239,239,239,0.70)', margin: 0, lineHeight: 1.5, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {message}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              style={{
                width:         '100%',
                padding:       '13px',
                borderRadius:  '12px',
                border:        'none',
                background:    isConfirming ? 'rgba(201,168,76,0.40)' : 'linear-gradient(135deg, #D4AF5A, #C9A84C, #B8932E)',
                color:         '#06060A',
                fontSize:      '11px',
                fontWeight:    700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor:        isConfirming ? 'not-allowed' : 'pointer',
                transition:    'opacity 0.2s',
              }}
            >
              {isConfirming ? 'Reserving…' : 'Confirm & Reserve'}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={isConfirming}
              style={{
                width:         '100%',
                padding:       '12px',
                borderRadius:  '12px',
                border:        '1px solid rgba(201,168,76,0.22)',
                background:    'transparent',
                color:         'rgba(201,168,76,0.70)',
                fontSize:      '11px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor:        isConfirming ? 'not-allowed' : 'pointer',
                transition:    'opacity 0.2s',
              }}
            >
              Edit Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AriaChat
// ─────────────────────────────────────────────────────────

export default function AriaChat() {
  const [messages,        setMessages]        = useState<Message[]>([
    { role: 'assistant', content: OPENING },
  ]);
  const [input,           setInput]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [bookingCreated,  setBookingCreated]  = useState(false);

  // Confirmation card state
  const [pendingBooking,  setPendingBooking]  = useState<BookingData | null>(null);
  const [pendingMessage,  setPendingMessage]  = useState('');
  const [pendingTier,     setPendingTier]     = useState<'high' | 'medium' | 'low' | null>(null);
  const [isConfirming,    setIsConfirming]    = useState(false);
  const [confirmed,       setConfirmed]       = useState(false);

  // Mic state
  const [isListening,     setIsListening]     = useState(false);
  const [micSupported,    setMicSupported]    = useState(false);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Check Web Speech API support on mount
  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setMicSupported(!!SR);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang             = 'en-US';
    recognition.interimResults   = false;
    recognition.maxAlternatives  = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
      }
    };

    recognition.onerror  = () => setIsListening(false);
    recognition.onend    = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Auto-scroll on new messages or card appearance
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingBooking, confirmed]);

  // ── Send chat message ────────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message  = { role: 'user', content: text };
    const nextMessages      = [...messages, userMsg];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/aria', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();

      if (data.type === 'booking_confirmation') {
        // Show confirmation card — do not add a chat bubble
        setPendingBooking(data.booking);
        setPendingMessage(data.message ?? 'Shall I reserve this for you?');
        setPendingTier(data.tier ?? null);
        setConfirmed(false);
      } else {
        // Normal message or legacy bookingCreated path
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response ?? data.message ?? '' },
        ]);
        if (data.bookingCreated || data.type === 'booking_confirmed') {
          setBookingCreated(true);
        }
      }
    } catch (err) {
      console.error('[AriaChat]', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'I apologize — something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  // ── Confirm booking ──────────────────────────────────────────────────────

  async function handleConfirmBooking() {
    if (!pendingBooking || isConfirming) return;
    setIsConfirming(true);

    try {
      const res = await fetch('/api/aria', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ confirm: true, bookingData: pendingBooking }),
      });

      const data = await res.json();

      setConfirmed(true);
      setBookingCreated(true);

      // After a short pause add a success assistant message and clear the card
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response ?? "You're all set. Mr. Rodriguez will take care of everything." },
        ]);
        setPendingBooking(null);
      }, 1800);
    } catch (err) {
      console.error('[AriaChat/confirm]', err);
      setConfirmed(false);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong saving your booking. Please call us at (646) 879-1391.' },
      ]);
      setPendingBooking(null);
    } finally {
      setIsConfirming(false);
    }
  }

  // ── Edit details ─────────────────────────────────────────────────────────

  function handleEditDetails() {
    setPendingBooking(null);
    setConfirmed(false);
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Of course — what would you like to change?' },
    ]);
  }

  // ── Key handler ──────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      style={{
        width:         '100%',
        height:        '500px',
        display:       'flex',
        flexDirection: 'column',
        background:    '#06060A',
        border:        '1px solid rgba(201,168,76,0.25)',
        borderRadius:  '20px',
        overflow:      'hidden',
        position:      'relative',
      }}
    >
      {/* ── Top glow accent ──────────────────────────────────── */}
      <div style={{
        position:      'absolute',
        top: 0, left: '10%', right: '10%',
        height:        '1px',
        background:    'linear-gradient(to right, transparent, rgba(201,168,76,0.40), transparent)',
        pointerEvents: 'none',
      }} />

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        flexShrink:   0,
        padding:      '16px 20px 14px',
        borderBottom: '1px solid rgba(201,168,76,0.10)',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        background:   'linear-gradient(to bottom, rgba(201,168,76,0.04), transparent)',
      }}>
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   '50%',
          border:         '1px solid rgba(201,168,76,0.35)',
          background:     'radial-gradient(circle at 35% 35%, rgba(201,168,76,0.20), rgba(201,168,76,0.04))',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '12px',
          color:          '#C9A84C',
          flexShrink:     0,
        }}>✦</div>
        <div>
          <p style={{
            fontFamily:    '"Cormorant Garamond", Georgia, serif',
            fontSize:      '15px',
            fontWeight:    600,
            color:         '#EFEFEF',
            lineHeight:    1,
            letterSpacing: '0.01em',
            margin:        0,
          }}>Amirah</p>
          <p style={{
            fontSize:      '9px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase' as const,
            color:         '#C9A84C',
            opacity:       0.55,
            margin:        '3px 0 0',
          }}>Prestige Concierge</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width:        '7px',
            height:       '7px',
            borderRadius: '50%',
            background:   '#4ADE80',
            boxShadow:    '0 0 6px rgba(74,222,128,0.5)',
          }} />
          <span style={{
            fontSize:      '9px',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            color:         'rgba(74,222,128,0.70)',
          }}>Online</span>
        </div>
      </div>

      {/* ── Booking confirmed banner ──────────────────────────── */}
      {bookingCreated && !pendingBooking && (
        <div style={{
          flexShrink:   0,
          padding:      '10px 20px',
          background:   'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.06))',
          borderBottom: '1px solid rgba(201,168,76,0.25)',
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
        }}>
          <span style={{ color: '#C9A84C', fontSize: '13px' }}>✦</span>
          <p style={{
            fontSize:      '12px',
            color:         '#C9A84C',
            margin:        0,
            letterSpacing: '0.02em',
            fontFamily:    '"Cormorant Garamond", Georgia, serif',
            fontWeight:    500,
          }}>
            Your ride has been secured. We will be in touch shortly.
          </p>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        overflowY:      'auto',
        padding:        '18px 16px',
        display:        'flex',
        flexDirection:  'column',
        gap:            '14px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(201,168,76,0.15) transparent',
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap:           '4px',
            }}
          >
            <span style={{
              fontSize:      '9px',
              letterSpacing: '2.5px',
              textTransform: 'uppercase' as const,
              color:         msg.role === 'user'
                ? 'rgba(239,239,239,0.35)'
                : 'rgba(201,168,76,0.60)',
              fontWeight:    600,
            }}>
              {msg.role === 'user' ? 'You' : 'Amirah'}
            </span>

            <div style={{
              maxWidth:      '85%',
              padding:       '11px 15px',
              borderRadius:  msg.role === 'user'
                ? '16px 4px 16px 16px'
                : '4px 16px 16px 16px',
              background:    msg.role === 'user'
                ? 'rgba(239,239,239,0.95)'
                : '#141419',
              border:        msg.role === 'user'
                ? 'none'
                : '1px solid rgba(201,168,76,0.12)',
              color:         msg.role === 'user' ? '#06060A' : '#EFEFEF',
              fontSize:      '13.5px',
              lineHeight:    1.6,
              fontFamily:    msg.role === 'user'
                ? '"Montserrat", "Inter", system-ui, sans-serif'
                : '"Cormorant Garamond", Georgia, serif',
              fontWeight:    msg.role === 'user' ? 500 : 400,
              letterSpacing: msg.role === 'assistant' ? '0.01em' : 'normal',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* ── Booking confirmation card ─────────────────────── */}
        {pendingBooking && (
          <BookingConfirmationCard
            booking={pendingBooking}
            message={pendingMessage}
            onConfirm={handleConfirmBooking}
            onEdit={handleEditDetails}
            isConfirming={isConfirming}
            confirmed={confirmed}
            tier={pendingTier}
          />
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span style={{
              fontSize: '9px', letterSpacing: '2.5px',
              textTransform: 'uppercase' as const,
              color: 'rgba(201,168,76,0.60)', fontWeight: 600,
            }}>Amirah</span>
            <div style={{
              padding:      '12px 16px',
              borderRadius: '4px 16px 16px 16px',
              background:   '#141419',
              border:       '1px solid rgba(201,168,76,0.12)',
              display:      'flex',
              alignItems:   'center',
              gap:          '5px',
            }}>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    width:        '6px',
                    height:       '6px',
                    borderRadius: '50%',
                    background:   '#C9A84C',
                    opacity:      0.4,
                    display:      'inline-block',
                    animation:    `aria-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ───────────────────────────────────────── */}
      <div style={{
        flexShrink:  0,
        padding:     '10px 14px 14px',
        borderTop:   '1px solid rgba(201,168,76,0.10)',
        background:  'rgba(6,6,10,0.8)',
        display:     'flex',
        alignItems:  'flex-end',
        gap:         '10px',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading || !!pendingBooking}
          placeholder={pendingBooking ? 'Confirm or edit your booking above…' : 'Message Amirah…'}
          rows={1}
          style={{
            flex:           1,
            minHeight:      '42px',
            maxHeight:      '120px',
            padding:        '10px 14px',
            borderRadius:   '14px',
            border:         `1px solid ${input ? 'rgba(201,168,76,0.38)' : 'rgba(201,168,76,0.18)'}`,
            background:     '#141419',
            color:          '#EFEFEF',
            fontSize:       '13.5px',
            fontFamily:     '"Montserrat", "Inter", system-ui, sans-serif',
            resize:         'none' as const,
            outline:        'none',
            lineHeight:     1.45,
            transition:     'border-color 0.2s',
            scrollbarWidth: 'none' as const,
            opacity:        (isLoading || !!pendingBooking) ? 0.4 : 1,
          }}
        />

        {/* Mic button — only rendered when Web Speech API is supported */}
        {micSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || !!pendingBooking}
            title={isListening ? 'Stop listening' : 'Speak to Amirah'}
            style={{
              width:          '42px',
              height:         '42px',
              borderRadius:   '13px',
              border:         isListening
                ? '1px solid rgba(201,168,76,0.60)'
                : '1px solid rgba(201,168,76,0.22)',
              background:     isListening
                ? 'rgba(201,168,76,0.12)'
                : 'rgba(201,168,76,0.06)',
              color:          isListening ? '#C9A84C' : 'rgba(201,168,76,0.55)',
              fontSize:       '16px',
              cursor:         (isLoading || !!pendingBooking) ? 'not-allowed' : 'pointer',
              flexShrink:     0,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     'all 0.2s',
              opacity:        (isLoading || !!pendingBooking) ? 0.4 : 1,
              animation:      isListening ? 'mic-pulse 1.4s ease-in-out infinite' : 'none',
            }}
          >
            🎙
          </button>
        )}

        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || !!pendingBooking}
          style={{
            width:          '42px',
            height:         '42px',
            borderRadius:   '13px',
            border:         'none',
            background:     (isLoading || !input.trim() || !!pendingBooking)
              ? 'rgba(201,168,76,0.25)'
              : '#C9A84C',
            color:          '#06060A',
            fontSize:       '17px',
            cursor:         (isLoading || !input.trim() || !!pendingBooking) ? 'not-allowed' : 'pointer',
            flexShrink:     0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            transition:     'background 0.2s, transform 0.15s',
            fontWeight:     700,
          }}
          onMouseDown={e => { if (!isLoading && input.trim() && !pendingBooking) (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          ↑
        </button>
      </div>

    </div>
  );
}
