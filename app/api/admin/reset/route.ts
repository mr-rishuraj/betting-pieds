import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Delete all bets
    const { error: betsError } = await supabase.from('bets').delete().not('id', 'is', null);
    if (betsError) throw new Error(`Failed to clear bets: ${betsError.message}`);

    // Delete all results
    const { error: resultsError } = await supabase.from('results').delete().not('id', 'is', null);
    if (resultsError) throw new Error(`Failed to clear results: ${resultsError.message}`);

    // Reset all users' coins to 1000000
    const { error: coinsError } = await supabase.from('users').update({ coins: 1000000 }).not('id', 'is', null);
    if (coinsError) throw new Error(`Failed to reset coins: ${coinsError.message}`);

    // Reactivate all candidates
    const { error: candidatesError } = await supabase.from('candidates').update({ is_active: true }).not('id', 'is', null);
    if (candidatesError) throw new Error(`Failed to reactivate candidates: ${candidatesError.message}`);

    return NextResponse.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
