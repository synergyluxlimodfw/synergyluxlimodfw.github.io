/**
 * lib/tipLinks.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Static Stripe Payment Links for gratuity.
 *
 * Future: replace with POST /api/tip/link?rideId=... to generate
 * dynamic per-ride links with metadata attached.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type TipKey = 'ten' | 'fifteen' | 'twenty' | 'custom';

export const TIP_LINKS: Record<TipKey, string> = {
  ten:     'https://buy.stripe.com/3cIfZb9Rafo373tdyT8Vi0i',
  fifteen: 'https://buy.stripe.com/4gM6oBaVe7VB87x0M78Vi0j',
  twenty:  'https://buy.stripe.com/cNibIVaVe4JpgE366r8Vi0k',
  custom:  '',
};
