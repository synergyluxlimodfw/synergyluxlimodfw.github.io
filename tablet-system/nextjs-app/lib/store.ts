// lib/store.ts
// Server-side in-memory store.
// Persists for the lifetime of the Node.js process.
// Replace with Supabase / Postgres when ready — swap only this file.

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type ConversionRecord = {
  id: string;
  event: 'viewed_offer' | 'clicked_book' | 'completed_payment';
  customerId: string;
  service: string;
  timestamp: string;
};

export type ConversionStats = {
  viewed: number;
  clicked: number;
  completed: number;
  conversionRate: number; // completed / clicked * 100
};

// ── Singletons ─────────────────────────────────────────────
const _customers: CustomerRecord[]   = [];
const _conversions: ConversionRecord[] = [];

// ── Customers ───────────────────────────────────────────────

export function saveCustomer(data: Pick<CustomerRecord, 'name' | 'phone'>): CustomerRecord {
  const phone = data.phone.trim();
  const name  = data.name.trim() || 'Guest';

  // Upsert by phone — update name if already exists
  const existing = _customers.find(c => c.phone === phone);
  if (existing) {
    existing.name = name;
    console.log('[Store] Customer updated:', existing);
    return existing;
  }

  const record: CustomerRecord = {
    id:        crypto.randomUUID(),
    name,
    phone,
    createdAt: new Date().toISOString(),
  };
  _customers.push(record);
  console.log('[Store] Customer saved:', record);
  return record;
}

export function getAllCustomers(): CustomerRecord[] {
  return [..._customers].reverse(); // newest first
}

export function getCustomerById(id: string): CustomerRecord | undefined {
  return _customers.find(c => c.id === id);
}

// ── Conversions ─────────────────────────────────────────────

export function saveConversion(data: Omit<ConversionRecord, 'id'>): ConversionRecord {
  const record: ConversionRecord = { id: crypto.randomUUID(), ...data };
  _conversions.push(record);
  console.log('[Store] Conversion saved:', record);
  return record;
}

export function getAllConversions(): ConversionRecord[] {
  return [..._conversions].reverse(); // newest first
}

export function getConversionStats(): ConversionStats {
  const viewed    = _conversions.filter(e => e.event === 'viewed_offer').length;
  const clicked   = _conversions.filter(e => e.event === 'clicked_book').length;
  const completed = _conversions.filter(e => e.event === 'completed_payment').length;
  return {
    viewed,
    clicked,
    completed,
    conversionRate: clicked > 0 ? Math.round((completed / clicked) * 100) : 0,
  };
}
