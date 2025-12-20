import { useEffect, useState } from 'react';
import apiClient from '../services/api';

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient.get('tournaments')
      .then((res) => { if (mounted) setTournaments(res.data); })
      .catch(() => { if (mounted) setTournaments([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-8">Loading tournaments…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tournaments</h1>
      {tournaments.length === 0 && <p>No tournaments found.</p>}
      <ul className="space-y-4">
        {tournaments.map((t) => (
          <li key={t.id} className="p-4 rounded-lg border border-white/6 bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t.name}</h2>
                <p className="text-sm text-slate-400">{t.description}</p>
                <p className="text-xs text-slate-500 mt-2">{t.startDate ? new Date(t.startDate).toLocaleDateString() : ''} — {t.endDate ? new Date(t.endDate).toLocaleDateString() : ''}</p>
              </div>
              <div className="text-sm text-slate-300">{t.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
