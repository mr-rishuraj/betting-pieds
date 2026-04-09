'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

interface Candidate {
  id: string;
  name: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export function CandidateCard({ candidate, coins, onBetPlaced }: { candidate: Candidate; coins: number; onBetPlaced: () => void }) {
  const { data: session } = useSession();
  const [betAmount, setBetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.email || !betAmount || parseInt(betAmount) <= 0) {
      setMessage('Invalid bet amount');
      return;
    }

    const amount = parseInt(betAmount);
    if (amount > coins) {
      setMessage('Not enough coins');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const supabase = getSupabase();

      // Get user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id, coins')
        .eq('email', session.user.email)
        .single();

      if (!userData || userData.coins < amount) {
        setMessage('Not enough coins');
        return;
      }

      // Place bet
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userData.id,
          candidate_id: candidate.id,
          amount,
        });

      if (betError) throw betError;

      // Deduct coins
      const { error: updateError } = await supabase
        .from('users')
        .update({ coins: userData.coins - amount })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      setBetAmount('');
      setMessage(`Bet placed! ${amount} coins on ${candidate.name}`);
      onBetPlaced();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Bet error:', error);
      setMessage('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border-2 border-slate-700 hover:border-blue-500 transition">
      <h3 className="text-xl font-bold text-white mb-4">{candidate.name}</h3>

      <form onSubmit={handleBet} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Bet Amount (coins)
          </label>
          <input
            type="number"
            min="1"
            max={coins}
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={loading || coins === 0}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter amount"
          />
        </div>

        <button
          type="submit"
          disabled={loading || coins === 0 || !betAmount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          {loading ? 'Placing bet...' : 'Place Bet'}
        </button>
      </form>

      {message && (
        <p className={`mt-3 text-sm ${message.includes('placed') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
