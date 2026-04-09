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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('User error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
