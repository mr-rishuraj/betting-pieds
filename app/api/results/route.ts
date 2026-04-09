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

    const { candidateId } = await request.json();
    const supabase = getSupabase();

    const { error } = await supabase
      .from('results')
      .insert({ removed_candidate_id: candidateId });

    if (error) throw error;

    // Mark candidate as inactive
    await supabase
      .from('candidates')
      .update({ is_active: false })
      .eq('id', candidateId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Results error:', error);
    return NextResponse.json({ error: 'Failed to post result' }, { status: 500 });
  }
}
