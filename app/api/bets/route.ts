import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('session_token', sessionToken)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: bets, error } = await supabase
      .from('bets')
      .select('*, candidates(name)')
      .eq('user_id', userData.id);

    if (error) throw error;
    return NextResponse.json(bets || []);
  } catch (error) {
    console.error('Bets error:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');
    const { candidateId, amount } = await request.json();

    if (!sessionToken || !candidateId || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (!userData || userData.coins < amount) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    const { error: betError } = await supabase
      .from('bets')
      .insert({ user_id: userData.id, candidate_id: candidateId, amount });

    if (betError) throw betError;

    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: userData.coins - amount })
      .eq('id', userData.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      remainingCoins: userData.coins - amount,
    });
  } catch (error) {
    console.error('Bet error:', error);
    return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 });
  }
}
