'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface CandidateRisk {
  id: string;
  name: string;
  totalBets: number;
  betCount: number;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export function CandidatesRisk() {
  const [candidates, setCandidates] = useState<CandidateRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidatesRisk();
    const interval = setInterval(fetchCandidatesRisk, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCandidatesRisk = async () => {
    try {
      const supabase = getSupabase();

      // Get all active candidates with their bets
      const { data: activeCandidates } = await supabase
        .from('candidates')
        .select('id, name, is_active')
        .eq('is_active', true);

      if (!activeCandidates) return;

      // Get bets for each candidate
      const candidateData = await Promise.all(
        activeCandidates.map(async (candidate) => {
          const { data: bets } = await supabase
            .from('bets')
            .select('amount')
            .eq('candidate_id', candidate.id);

          const totalBets = bets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;
          const betCount = bets?.length || 0;

          return {
            id: candidate.id,
            name: candidate.name,
            totalBets,
            betCount,
          };
        })
      );

      // Sort by total bets (highest first = most at risk)
      const sorted = candidateData.sort((a, b) => b.totalBets - a.totalBets);
      setCandidates(sorted);
    } catch (error) {
      console.error('Fetch candidates risk error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-slate-400">Loading risk...</div>;
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-slate-200">
        No votes yet.
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-4">⚠️ Risk Level</h2>

      <div className="space-y-2">
        {candidates.map((entry, idx) => (
          <div
            key={entry.id}
            className="flex justify-between items-center p-3 bg-slate-700 rounded-lg border-l-4 border-red-500 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-lg font-bold text-red-400 w-8 text-center">#{idx + 1}</span>
              <span className="text-slate-200 font-semibold flex-1">{entry.name}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-red-400 text-lg block">
                {entry.totalBets.toLocaleString()}
              </span>
              <span className="text-slate-400 text-xs">
                {entry.betCount} {entry.betCount === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Higher coins = higher risk of removal
      </p>
    </div>
  );
}
