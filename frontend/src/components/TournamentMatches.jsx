import { useEffect, useState } from 'react';
import apiClient from '../services/api';

function TournamentMatches({ tournamentId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    let mounted = true;
    let poll = null;
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`match?tournamentId=${tournamentId}`);
        if (!mounted) return;
        setMatches(res.data || []);
        const hasLive = Array.isArray(res.data) && res.data.some(m => m.status === 'live' || m.isLive);
        if (hasLive && !poll) {
          poll = setInterval(async () => {
            try {
              const r = await apiClient.get(`match?tournamentId=${tournamentId}`);
              if (!mounted) return;
              setMatches(r.data || []);
            } catch (e) {}
          }, 4000);
        }
        if (!hasLive && poll) { clearInterval(poll); poll = null; }
      } catch (e) {
        if (mounted) setMatches([]);
      } finally { if (mounted) setLoading(false); }
    };
    fetchMatches();
    return () => { mounted = false; if (poll) clearInterval(poll); };
  }, [tournamentId]);

  return (
    <div className="space-y-3">
      {loading && <div>Loading matches…</div>}
      {!loading && matches.length === 0 && <div className="text-slate-400">No matches</div>}
      {matches.map(m => (
        <div key={m.id || m._id} className="p-3 rounded bg-white/5 flex items-center justify-between">
          <div>
            <div className="font-semibold">{m.homeTeamName || (typeof m.homeTeam === 'string' ? m.homeTeam : (m.homeTeam?.name || m.teams?.[0]))} vs {m.awayTeamName || (typeof m.awayTeam === 'string' ? m.awayTeam : (m.awayTeam?.name || m.teams?.[1]))}</div>
            <div className="text-sm text-slate-400">{m.date ? new Date(m.date).toLocaleString() : '—'} <span className="ml-2 inline-block text-xs text-slate-300 px-2 py-0.5 rounded bg-white/5">{m.stage || 'group'}</span></div>
          </div>
          <div className="text-right">
            {m.status === 'live' || m.isLive ? (
              <div className="text-rose-400 font-bold">Live: {m.score ? `${m.score.home} - ${m.score.away}` : '0 - 0'}</div>
            ) : m.status === 'completed' || m.status === 'finished' ? (
              <div className="text-green-400 font-bold">Final: {m.score ? `${m.score.home} - ${m.score.away}` : '—'}</div>
            ) : (
              <div className="text-amber-400">Upcoming</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TournamentMatches;
