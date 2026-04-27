import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from('leads')
    .select('id, first_name, last_name, name, job_title, company, location, linkedin_url, email, lead_type, priority, status, email_subject, email_body, linkedin_message, followup_message, created_at, last_contacted_at, follow_up_due')
    .in('source', ['linkedin-apify', 'serpapi-google', 'manual'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { id } = await req.json();
  const followUp = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('leads')
    .update({
      status: 'contacted',
      last_contacted_at: new Date().toISOString(),
      follow_up_due: followUp,
      contact_attempts: 1,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
