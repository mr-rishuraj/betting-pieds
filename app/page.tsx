'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import { CandidateCard } from './components/CandidateCard';
import { Leaderboard } from './components/Leaderboard';
import { MyBets } from './components/MyBets';
import { CandidatesRisk } from './components/CandidatesRisk';

interface Candidate {
  id: string;
  name: string;
  is_active: boolean;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [refreshBets, setRefreshBets] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  // Fetch user data from Supabase
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session?.user?.email]);

  const fetchUserData = async () => {
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', session?.user?.email)
        .single();

      if (userData) {
        setPlayerName(userData.name);
        setCoins(userData.coins);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } finally {
      setLoadingCandidates(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎲 Club Betting Platform</h1>
          <p className="text-xl font-semibold text-yellow-400 tracking-wide uppercase mb-4">Vote on who will be removed during probation</p>

          <div className="bg-slate-800 rounded-lg shadow-md p-4 inline-block border border-slate-700">
            <p className="text-slate-200 mb-2">
              Welcome, <span className="font-bold text-blue-400">{playerName || session?.user?.name}</span>!
            </p>
            <p className="text-slate-200 mb-3">
              Your Coins:{' '}
              <span className="text-2xl font-bold text-green-400">{coins.toLocaleString()} 💰</span>
            </p>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: '/auth' })}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Candidates Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">📋 Probation Candidates</h2>

            {loadingCandidates ? (
              <div className="text-center text-slate-400 py-8">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="bg-slate-700 border border-slate-600 rounded-lg p-6 text-slate-200 text-center">
                No active candidates at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    coins={coins}
                    onBetPlaced={() => {
                      fetchUserData();
                      setRefreshBets((r) => r + 1);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <MyBets refreshTrigger={refreshBets} />
            <CandidatesRisk />
            <Leaderboard />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm mt-8">
          <p>All votes are anonymous • Virtual coins are for entertainment only</p>
        </div>
      </div>
    </div>
  );
}
