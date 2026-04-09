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
      .from('users')
      .select('name, coins, created_at')
      .order('coins', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      leaderboard: data || [],
    });
  } catch (error) {
    console.error('Players leaderboard error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
