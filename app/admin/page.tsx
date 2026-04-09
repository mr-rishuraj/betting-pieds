'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

const ADMIN_EMAIL = '07rishuraj@gmail.com';

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [adminToken, setAdminToken] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (sessionStatus === 'loading') return null;
  if (!session || session.user?.email !== ADMIN_EMAIL) redirect('/');

  async function handleReset() {
    if (!adminToken) {
      setStatus({ type: 'error', message: 'Enter admin token first.' });
      return;
    }
    if (!confirm('This will delete ALL bets, reset ALL coins to 10,000, reactivate ALL candidates, and clear ALL results. Are you sure?')) {
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setStatus({ type: 'success', message: data.message });
    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Reset failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="max-w-md bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-red-400">Reset Database</h2>
        <p className="text-slate-400 text-sm mb-4">
          Clears all bets and results, resets every user&apos;s coins to <span className="text-green-400 font-bold">1,000,000</span>, and reactivates all candidates.
        </p>

        <input
          type="password"
          placeholder="Admin token"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 mb-4 text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {loading ? 'Resetting...' : 'Reset Database'}
        </button>

        {status && (
          <p className={`mt-4 text-sm font-medium ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {status.type === 'success' ? '✓ ' : '✗ '}{status.message}
          </p>
        )}
      </div>
    </div>
  );
}
