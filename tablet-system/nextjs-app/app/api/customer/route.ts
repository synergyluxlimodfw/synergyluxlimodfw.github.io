import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, getAllCustomers } from '@/lib/store';

/** POST /api/customer — save or upsert a customer by phone */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone } = body as { name?: string; phone?: string };

    console.log('[API] POST /api/customer', { name, phone });

    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const customer = saveCustomer({ name: name ?? '', phone });
    return NextResponse.json({ customer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/** GET /api/customer — list all captured customers (admin use) */
export async function GET() {
  const customers = getAllCustomers();
  return NextResponse.json({ customers, total: customers.length });
}
