'use client';

import { useState } from 'react';
import TipQRCode from '@/components/TipQRCode';
import { TIP_LINKS } from '@/lib/tipLinks';
import { experienceStore } from '@/lib/experienceStore';
import type { TipKey } from '@/lib/tipLinks';

// ─────────────────────────────────────────────────────────
// TipSelector
//
// Non-pressuring, optional gratuity UI with live QR code.
// Calm, respectful — feels like a concierge offering,
// not a payment screen.
// ─────────────────────────────────────────────────────────

type PresetKey = 'ten' | 'fifteen' | 'twenty';

const PRESETS: { key: PresetKey; label: string; percent: number }[] = [
  { key: 'ten',     label: '10%', percent: 10 },
  { key: 'fifteen', label: '15%', percent: 15 },
  { key: 'twenty',  label: '20%', percent: 20 },
];

interface TipSelectorProps {
  /** Future: pass rideId to generate dynamic Stripe links per ride */
  rideId?: string;
  onTip?: (percent: number | null, dollar: number | null) => void;
}

export default function TipSelector({ onTip }: TipSelectorProps) {
  const [selected, setSelected] = useState<PresetKey>('twenty');

  const url = TIP_LINKS[selected as TipKey];

  function handleSelect(key: PresetKey, percent: number) {
    setSelected(key);
    const { rideId, guestName } = experienceStore.getState();
    fetch('/api/tips/insert', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ride_id:    rideId,
        guest_name: guestName || null,
        percent,
        stripe_key: key,
      }),
    }).catch(err => console.error('[TipSelector] tips/insert error:', err));
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">

      {/* Label */}
      <p className="text-[10px] tracking-[4px] uppercase text-lux-muted/50">
        Optional gratuity
      </p>

      {/* Preset buttons */}
      <div className="flex items-center gap-3">
        {PRESETS.map(({ key, label, percent }) => (
          <TipButton
            key={key}
            label={label}
            active={selected === key}
            onClick={() => handleSelect(key, percent)}
          />
        ))}
      </div>

      {/* Social proof */}
      <p style={{
        fontSize: 11,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'rgba(180,155,110,0.5)',
        textAlign: 'center',
        fontWeight: 300,
        marginTop: 8,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Most guests choose 20%
      </p>

      {/* Live QR code */}
      <TipQRCode url={url} />

      {/* Scan hint */}
      <p className="text-[11px] text-lux-muted/50 tracking-wide">
        Scan with your phone to add gratuity
      </p>

      {/* Direct link fallback */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-lux-muted/40 hover:text-gold/60 transition-colors duration-200 tracking-wide underline underline-offset-2"
        onClick={() => onTip?.(null, null)}
      >
        Or tap here
      </a>

    </div>
  );
}

// ── TipButton ──────────────────────────────────────────────

function TipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-6 py-2.5 rounded-xl text-[12px] font-medium tracking-wide',
        'border transition-all duration-200',
        active
          ? 'border-gold/50 bg-gold/10 text-gold'
          : 'border-lux-border text-lux-muted hover:border-gold/25 hover:text-lux-white',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
