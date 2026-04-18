'use client';

// ─────────────────────────────────────────────────────────
// MapEmbed
//
// Uses the Mapbox Static Images API — zero JS, fully
// non-interactive by design. Requires:
//   NEXT_PUBLIC_MAPBOX_TOKEN in .env
//
// Falls back to a styled grid placeholder when no token
// is configured.
// ─────────────────────────────────────────────────────────

interface MapEmbedProps {
  destination?: string;
  /** Override map center. Defaults to DFW metro area. */
  lng?: number;
  lat?: number;
  zoom?: number;
}

// DFW metro — sensible default for all Synergy Lux trips
const DEFAULT_LNG  = -97.0407;
const DEFAULT_LAT  = 32.8998;
const DEFAULT_ZOOM = 11;

export default function MapEmbed({
  destination,
  lng  = DEFAULT_LNG,
  lat  = DEFAULT_LAT,
  zoom = DEFAULT_ZOOM,
}: MapEmbedProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-lux-border/50 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px z-10 bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

      {/* Map layer */}
      {token ? (
        <MapboxStaticImage
          lng={lng}
          lat={lat}
          zoom={zoom}
          token={token}
        />
      ) : (
        <MapPlaceholder />
      )}

      {/* Destination label — gradient overlay */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-3 pt-6 pb-3 bg-gradient-to-t from-lux-black/95 via-lux-black/50 to-transparent pointer-events-none">
        <p className="text-[9px] tracking-[3px] uppercase text-gold/60 mb-0.5">
          En Route
        </p>
        {destination && (
          <p className="text-[12px] text-lux-white/85 font-medium truncate">
            {destination}
          </p>
        )}
      </div>

      {/* Non-interactive mask — prevents any accidental touch events */}
      <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }} />

    </div>
  );
}

// ── Mapbox Static Image ────────────────────────────────────

function MapboxStaticImage({
  lng,
  lat,
  zoom,
  token,
}: {
  lng: number;
  lat: number;
  zoom: number;
  token: string;
}) {
  // Gold destination pin
  const marker   = `pin-s+C9A84C(${lng},${lat})`;
  const center   = `${lng},${lat},${zoom},0`;
  const dims     = '560x360';
  const style    = 'mapbox/dark-v11';
  const src      = `https://api.mapbox.com/styles/v1/${style}/static/${marker}/${center}/${dims}@2x?access_token=${token}`;

  return (
    <img
      src={src}
      alt="Route map"
      width={560}
      height={360}
      draggable={false}
      className="block w-full h-full object-cover opacity-90 select-none"
    />
  );
}

// ── Placeholder (no token) ─────────────────────────────────

function MapPlaceholder() {
  return (
    <div className="relative w-full bg-lux-card2 flex items-center justify-center" style={{ height: '160px' }}>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Concentric rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 rounded-full border border-gold/10" />
        <div className="absolute w-12 h-12 rounded-full border border-gold/15" />
        <div className="w-2.5 h-2.5 rounded-full bg-gold/70 shadow-[0_0_14px_rgba(201,168,76,0.55)]" />
      </div>

    </div>
  );
}
