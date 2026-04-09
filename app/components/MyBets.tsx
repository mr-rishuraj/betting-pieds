'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

interface Bet {
  id: string;
  amount: number;
  candidates: { name: string };
  created_at: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export function MyBets({ refreshTrigger }: { refreshTrigger: number }) {
  const { data: session } = useSession();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;

    fetchBets();
    const interval = setInterval(fetchBets, 5000);
    return () => clearInterval(interval);
  }, [session?.user?.email, refreshTrigger]);

  const fetchBets = async () => {
    try {
      const supabase = getSupabase();

      // Get user
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', session?.user?.email)
        .single();

      if (!userData) return;

      // Get user's bets
      const { data: betsData } = await supabase
        .from('bets')
        .select('*, candidates(name)')
        .eq('user_id', userData.id);

      if (betsData) {
        setBets(betsData);
      }
    } catch (error) {
      console.error('Fetch bets error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-4">Loading your bets...</div>;
  }

  if (bets.length === 0) {
    return (
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-slate-200">
        No bets placed yet. Choose a candidate to get started!
      </div>
    );
  }

  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-4">📊 Your Bets</h2>

      <div className="space-y-2 mb-4">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className="flex justify-between items-center p-3 bg-slate-700 rounded-lg border-l-4 border-green-500"
          >
            <span className="text-slate-200">{bet.candidates.name}</span>
            <span className="font-bold text-green-400">{bet.amount} coins</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-600 pt-3">
        <p className="text-slate-200">
          <span className="font-semibold">Total Bet:</span>{' '}
          <span className="text-lg font-bold text-green-400">{totalBet.toLocaleString()} coins</span>
        </p>
      </div>
    </div>
  );
}
