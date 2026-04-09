import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('results')
      .select('*, users(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const leaderboard = data?.map((result: any) => ({
      userId: result.user_id,
      name: result.users?.name || 'Unknown',
      winnings: 100,
    })) || [];

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
