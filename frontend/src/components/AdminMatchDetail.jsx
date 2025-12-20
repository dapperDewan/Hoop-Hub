import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

function AdminMatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [status, setStatus] = useState('scheduled');
  const [isLive, setIsLive] = useState(false);
  const [stage, setStage] = useState('group');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClient.get(`match/${id}`)
      .then(({ data }) => {
        if (!mounted) return;
        setMatch(data);
        setStatus(data.status || 'scheduled');
        setIsLive(Boolean(data.isLive));
        setScoreHome(data?.score?.home ?? 0);
        setScoreAway(data?.score?.away ?? 0);
        setStage(data?.stage || 'group');
      })
      .catch(() => { if (mounted) setMatch(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        score: { home: Number(scoreHome), away: Number(scoreAway) },
        status,
        isLive,
        stage
      };
      if (status === 'completed') {
        if (scoreHome > scoreAway) payload.winner = match.homeTeam || match.teams?.[0];
        else if (scoreAway > scoreHome) payload.winner = match.awayTeam || match.teams?.[1];
      }
      const res = await apiClient.put(`match/${id}`, payload, { headers });
      setMatch(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!match) return <div className="p-6">Match not found.</div>;

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 px-3 py-1 bg-white/5 rounded">← Back</button>
        <h2 className="text-2xl font-extrabold mb-4">Manage Match</h2>

        <div className="rounded p-4 bg-slate-900/50 space-y-4 border border-white/6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{match.homeTeamName || (typeof match.homeTeam === 'string' ? match.homeTeam : (match.homeTeam?.name || match.homeTeam?.teamName || match.teams?.[0]))} <span className="text-slate-400">vs</span> {match.awayTeamName || (typeof match.awayTeam === 'string' ? match.awayTeam : (match.awayTeam?.name || match.awayTeam?.teamName || match.teams?.[1]))}</div>
                <div className="text-sm text-slate-400">{match.date ? new Date(match.date).toLocaleString() : '—'}</div>
              </div>
              <div className="text-xs text-slate-300 ml-4">
                <div className="text-xs">Stage</div>
                <div className="text-sm text-slate-200 font-medium">{match.stage || stage}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-300">Status</div>
              <div className={"font-semibold " + (isLive || status === 'live' ? 'text-rose-400' : 'text-amber-300')}>{status}{isLive ? ' · live' : ''}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="text-center">
              <div className="text-xs text-slate-400">Home</div>
              <input type="number" value={scoreHome} onChange={e => setScoreHome(e.target.value)} className="mt-1 w-full text-center text-3xl font-bold p-2 bg-slate-800 rounded" />
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Away</div>
              <input type="number" value={scoreAway} onChange={e => setScoreAway(e.target.value)} className="mt-1 w-full text-center text-3xl font-bold p-2 bg-slate-800 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input id="isLive" type="checkbox" checked={isLive} onChange={e=>setIsLive(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="isLive" className="text-sm">Mark live</label>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <select value={stage} onChange={e=>setStage(e.target.value)} className="p-2 bg-slate-800 rounded text-white">
                <option value="group">Group</option>
                <option value="round_of_16">Round of 16</option>
                <option value="quarterfinal">Quarterfinal</option>
                <option value="semi_final">Semi final</option>
                <option value="final">Final</option>
                <option value="third_place">Third place</option>
              </select>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="p-2 bg-slate-800 rounded">
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button disabled={saving} onClick={handleSave} className="px-4 py-2 bg-cyan-600 rounded text-white shadow">Save changes</button>
            </div>
          </div>

          {error && <div className="text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default AdminMatchDetail;
