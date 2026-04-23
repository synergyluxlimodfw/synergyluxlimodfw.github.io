console.log('Updated phone to +16468791391');
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = {};
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    if (k) env[k.trim()] = v.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: rides } = await supabase
  .from('rides')
  .select('id, guest_name, client_phone')
  .order('created_at', { ascending: false })
  .limit(1);

const ride = rides[0];
console.log('Found ride:', ride.id, 'Guest:', ride.guest_name);

const check = await supabase.from('rides').select('client_phone, date, time').eq('id', ride.id).single();console.log('After update, DB shows:',check.data);
await supabase
  .from('rides')
  .update({ client_phone: '+16468791391' })
  .eq('id', ride.id);
console.log('Updated phone to +16468791391');

const res = await fetch('https://synergyluxlimodfw-github-io.vercel.app/api/sms/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rideId: ride.id })
});

const result = await res.json();
console.log('Status:', res.status);
console.log('Response:', result);

