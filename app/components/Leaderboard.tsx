'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  winnings: number;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard && data.leaderboard.length > 0) {
        setLeaderboard(data.leaderboard);
        setHasResults(true);
      } else {
        setHasResults(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-slate-400">Loading leaderboard...</div>;
  }

  if (!hasResults) {
    return (
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-slate-200">
        No results yet. Voting is ongoing!
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-4">🏆 Winners</h2>

      <div className="space-y-2">
        {leaderboard.map((entry, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-3 bg-slate-700 rounded-lg border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-blue-400">#{idx + 1}</span>
              <span className="text-slate-200 font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-green-400 text-lg">
              {entry.winnings.toLocaleString()} 💰
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
