'use client';

import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface Message {
  role:    'user' | 'assistant';
  content: string;
}

const OPENING = 'Welcome to Prestige by Synergy Lux. What is the occasion for your ride?';

// ─────────────────────────────────────────────────────────
// AriaChat
// ─────────────────────────────────────────────────────────

export default function AriaChat() {
  const [messages,       setMessages]       = useState<Message[]>([
    { role: 'assistant', content: OPENING },
  ]);
  const [input,          setInput]          = useState('');
  const [isLoading,      setIsLoading]      = useState(false);
  const [bookingCreated, setBookingCreated] = useState(false);

  console.log('messages:', messages);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages     = [...messages, userMsg];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/aria', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);

      if (data.bookingCreated) {
        setBookingCreated(true);
      }
    } catch (err) {
      console.error('[AriaChat]', err);
      setMessages(prev => [
        ...prev,
        {
          role:    'assistant',
          content: 'I apologize — something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  return (
    <div
      ref={containerRef}
      style={{
        width:        '100%',
        height:       '500px',
        display:      'flex',
        flexDirection: 'column',
        background:   '#06060A',
        border:       '1px solid rgba(201,168,76,0.25)',
        borderRadius: '20px',
        overflow:     'hidden',
        position:     'relative',
      }}
    >
      {/* ── Top glow accent ──────────────────────────────────── */}
      <div style={{
        position:   'absolute',
        top:        0, left: '10%', right: '10%',
        height:     '1px',
        background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.40), transparent)',
        pointerEvents: 'none',
      }} />

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        flexShrink:    0,
        padding:       '16px 20px 14px',
        borderBottom:  '1px solid rgba(201,168,76,0.10)',
        display:       'flex',
        alignItems:    'center',
        gap:           '10px',
        background:    'linear-gradient(to bottom, rgba(201,168,76,0.04), transparent)',
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
          }}>Aria</p>
          <p style={{
            fontSize:      '9px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase' as const,
            color:         '#C9A84C',
            opacity:       0.55,
            margin:        '3px 0 0',
          }}>Prestige Concierge</p>
        </div>
        <div style={{
          marginLeft:  'auto',
          display:     'flex',
          alignItems:  'center',
          gap:         '6px',
        }}>
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

      {/* ── Booking confirmation banner ───────────────────────── */}
      {bookingCreated && (
        <div style={{
          flexShrink:    0,
          padding:       '10px 20px',
          background:    'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.06))',
          borderBottom:  '1px solid rgba(201,168,76,0.25)',
          display:       'flex',
          alignItems:    'center',
          gap:           '8px',
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
        flex:          1,
        overflowY:     'auto',
        padding:       '18px 16px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '14px',
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
            {/* Role label */}
            <span style={{
              fontSize:      '9px',
              letterSpacing: '2.5px',
              textTransform: 'uppercase' as const,
              color:         msg.role === 'user'
                ? 'rgba(239,239,239,0.35)'
                : 'rgba(201,168,76,0.60)',
              fontWeight:    600,
            }}>
              {msg.role === 'user' ? 'You' : 'Aria'}
            </span>

            {/* Bubble */}
            <div style={{
              maxWidth:     '85%',
              padding:      '11px 15px',
              borderRadius: msg.role === 'user'
                ? '16px 4px 16px 16px'
                : '4px 16px 16px 16px',
              background: msg.role === 'user'
                ? 'rgba(239,239,239,0.95)'
                : '#141419',
              border: msg.role === 'user'
                ? 'none'
                : '1px solid rgba(201,168,76,0.12)',
              color:      msg.role === 'user' ? '#06060A' : '#EFEFEF',
              fontSize:   '13.5px',
              lineHeight: 1.6,
              fontFamily: msg.role === 'user'
                ? '"Montserrat", "Inter", system-ui, sans-serif'
                : '"Cormorant Garamond", Georgia, serif',
              fontWeight: msg.role === 'user' ? 500 : 400,
              letterSpacing: msg.role === 'assistant' ? '0.01em' : 'normal',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span style={{
              fontSize: '9px', letterSpacing: '2.5px',
              textTransform: 'uppercase' as const,
              color: 'rgba(201,168,76,0.60)', fontWeight: 600,
            }}>Aria</span>
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
          disabled={isLoading}
          placeholder="Message Aria…"
          rows={1}
          style={{
            flex:        1,
            minHeight:   '42px',
            maxHeight:   '120px',
            padding:     '10px 14px',
            borderRadius: '14px',
            border:      `1px solid ${input ? 'rgba(201,168,76,0.38)' : 'rgba(201,168,76,0.18)'}`,
            background:  '#141419',
            color:       '#EFEFEF',
            fontSize:    '13.5px',
            fontFamily:  '"Montserrat", "Inter", system-ui, sans-serif',
            resize:      'none' as const,
            outline:     'none',
            lineHeight:  1.45,
            transition:  'border-color 0.2s',
            scrollbarWidth: 'none' as const,
            opacity:     isLoading ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            width:          '42px',
            height:         '42px',
            borderRadius:   '13px',
            border:         'none',
            background:     isLoading || !input.trim()
              ? 'rgba(201,168,76,0.25)'
              : '#C9A84C',
            color:          '#06060A',
            fontSize:       '17px',
            cursor:         isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink:     0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            transition:     'background 0.2s, transform 0.15s',
            fontWeight:     700,
          }}
          onMouseDown={e => { if (!isLoading && input.trim()) (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          ↑
        </button>
      </div>

    </div>
  );
}
