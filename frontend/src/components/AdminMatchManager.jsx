import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import AdminMatchForm from './AdminMatchForm';

function AdminMatchManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamMap, setTeamMap] = useState({});

  useEffect(() => {
    let mounted = true;
    apiClient.get('tournaments')
      .then(({ data }) => { if (mounted) setTournaments(data || []); })
      .catch(() => { if (mounted) setTournaments([]); })
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    let mounted = true;
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const tid = selectedTournament.id || selectedTournament._id;
        const res = await apiClient.get(`match?tournamentId=${tid}`);
        if (!mounted) return;
        const payload = res.data || [];
        setMatches(payload);
        // resolve team names for admin view
        resolveTeamNames(payload);
      } catch (e) {
        if (mounted) setMatches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMatches();
    return () => { mounted = false; };
  }, [selectedTournament]);

  const handleDelete = async (id) => {
    // mark as cancelled instead of hard delete (backend does not provide DELETE)
    try {
      await apiClient.put(`match/${id}`, { status: 'cancelled' });
      // refetch to get updated data
      if (selectedTournament) {
        const tid = selectedTournament.id || selectedTournament._id;
        const res = await apiClient.get(`match?tournamentId=${tid}`);
        setMatches(res.data || []);
      }
    } catch (e) {
      setError('Failed to cancel match');
    }
  };

  const resolveTeamNames = async (items) => {
    try {
      const arr = Array.isArray(items) ? items : (items && items.matches) ? items.matches : (items && items.data) ? items.data : (items ? [items] : []);
      const ids = new Set();
      arr.forEach(m => {
        const push = v => { if (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v) && !teamMap[v]) ids.add(v); };
        push(m.homeTeam); push(m.awayTeam); (m.teams || []).forEach(push);
      });
      if (!ids.size) return;
      const res = await apiClient.post('features/teams/byIds', { ids: Array.from(ids) });
      const teams = res.data || [];
      const next = { ...teamMap };
      teams.forEach(t => { if (t && t.id) next[t.id] = t.name; });
      setTeamMap(next);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold">Admin — Match Manager</h2>
          <div className="text-sm text-slate-400">Manage tournament matches and live scoring</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="col-span-1 bg-slate-900/50 p-4 rounded-lg border border-white/6">
            <label className="block text-sm text-slate-300 mb-2">Select tournament</label>
            <select
              value={selectedTournament?.id || selectedTournament?._id || ''}
              onChange={(e) => {
                const tid = e.target.value;
                const t = tournaments.find(t => (t.id || t._id) === tid);
                setSelectedTournament(t || null);
                setMatches([]);
              }}
              className="w-full bg-slate-800 p-2 rounded text-white"
            >
              <option value="">— choose —</option>
              {tournaments.map(t => (
                <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
              ))}
            </select>

            {selectedTournament && (
              <div className="mt-4 text-sm text-slate-300">
                <div className="font-semibold">Participants</div>
                <div className="mt-2 space-y-1 max-h-48 overflow-auto pr-2">
                  {(selectedTournament.teams || []).map((t, i) => {
                    const id = typeof t === 'string' ? t : (t.id || t._id || JSON.stringify(t));
                    const label = typeof t === 'string' ? t : (t.name || t.teamName || t.id || t._id);
                    return <div key={id} className="text-sm text-slate-300">{i+1}. {label}</div>;
                  })}
                </div>
              </div>
            )}
          </aside>

          <main className="col-span-2 space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/6">
              <h3 className="text-lg font-semibold mb-3">Create / Schedule Match</h3>
              {selectedTournament ? (
                <AdminMatchForm
                  tournament={selectedTournament}
                  onCreated={async () => {
                    // refresh list after creation
                    const tid = selectedTournament.id || selectedTournament._id;
                    setLoading(true);
                    try {
                      const res = await apiClient.get(`match?tournamentId=${tid}`);
                      setMatches(res.data || []);
                    } catch (e) {
                      setMatches([]);
                    } finally { setLoading(false); }
                  }}
                />
              ) : (
                <div className="text-slate-400">Select a tournament on the left to create matches.</div>
              )}
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/6">
              <h3 className="text-lg font-semibold mb-3">Latest match</h3>
              {loading ? (
                <div>Loading…</div>
              ) : matches.length === 0 ? (
                <div className="text-slate-400">No matches</div>
              ) : (
                (() => {
                  const sorted = [...matches].sort((a,b)=> new Date(b.date || 0) - new Date(a.date || 0));
                  const m = sorted[0];
                  const teamLabel = (t) => (typeof t === 'string' ? t : (t.name || t.teamName || t.id || t._id));
                  return (
                    <div className="rounded p-4 bg-white/3 flex items-center justify-between">
                      <div>
                          <div className="font-semibold text-lg">{m.homeTeamName || teamMap[m.homeTeam] || (teamLabel(m.homeTeam || m.teams?.[0]))} <span className="text-slate-400">vs</span> {m.awayTeamName || teamMap[m.awayTeam] || (teamLabel(m.awayTeam || m.teams?.[1]))}</div>
                        <div className="text-sm text-slate-400 mt-1">{m.date ? new Date(m.date).toLocaleString() : '—'}</div>
                        <div className="text-sm mt-1">Status: <span className={m.isLive || m.status === 'live' ? 'text-rose-400 font-semibold' : 'text-amber-300'}>{m.status}{m.isLive ? ' · live' : ''}</span></div>
                        <div className="text-xs text-slate-300 mt-1">Stage: <span className="text-slate-200 font-medium">{m.stage || 'group'}</span></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => window.location.href = `/admin/matches/${m.id || m._id}`}
                          className="px-4 py-2 rounded bg-cyan-600 text-white shadow"
                        >Manage</button>
                        <button onClick={() => handleDelete(m.id || m._id)} className="px-4 py-2 rounded bg-red-600 text-white">Cancel</button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminMatchManager;
