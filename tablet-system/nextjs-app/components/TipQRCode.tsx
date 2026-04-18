'use client';

import { QRCodeSVG } from 'qrcode.react';

// ─────────────────────────────────────────────────────────
// TipQRCode
//
// Renders a scannable QR code for a Stripe Payment Link.
// Gold-on-transparent, minimal container.
// Future: accept rideId prop and call dynamic link endpoint.
// ─────────────────────────────────────────────────────────

interface TipQRCodeProps {
  url: string;
}

export default function TipQRCode({ url }: TipQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-gold/20 bg-lux-card2 p-4 shadow-[0_0_32px_rgba(201,168,76,0.06)]">
        <QRCodeSVG
          value={url}
          size={160}
          bgColor="transparent"
          fgColor="#C9A84C"
          quietZone={8}
          level="M"
        />
      </div>
    </div>
  );
}
