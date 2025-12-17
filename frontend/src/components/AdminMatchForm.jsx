import { useState } from 'react';
import apiClient from '../services/api';

function AdminMatchForm({ tournament, onCreated }) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [duration, setDuration] = useState(48);
  const [stage, setStage] = useState('group');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const teams = tournament.teams || [];
  const teamId = (t) => (typeof t === 'string' ? t : (t.id || t._id || JSON.stringify(t)));
  const teamLabel = (t) => (typeof t === 'string' ? t : (t.name || t.teamName || t.id || t._id || JSON.stringify(t)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!homeTeam || !awayTeam) return setError('Select both teams');
    if (homeTeam === awayTeam) return setError('Home and away must differ');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        tournamentId: tournament.id || tournament._id,
        homeTeam,
        awayTeam,
        date: date || null,
        venue,
        durationMin: duration,
        stage
      };
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiClient.post('match', payload, { headers });
      onCreated && onCreated();
      setHomeTeam(''); setAwayTeam(''); setDate(''); setVenue(''); setDuration(48);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create match');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded p-4 bg-slate-900/60">
      <h3 className="font-semibold mb-3 text-lg">Create Match</h3>
      {error && <div className="text-red-400 mb-3">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-slate-300">Home team</label>
          <select value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} className="w-full mt-1 p-2 bg-slate-800 rounded text-white">
            <option value="">Select home</option>
            {teams.map(t=> <option key={teamId(t)} value={teamId(t)}>{teamLabel(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-300">Away team</label>
          <select value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} className="w-full mt-1 p-2 bg-slate-800 rounded text-white">
            <option value="">Select away</option>
            {teams.map(t=> <option key={teamId(t)} value={teamId(t)}>{teamLabel(t)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-2">
          <label className="text-xs text-slate-300">Date & time</label>
          <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="w-full mt-1 p-2 bg-slate-800 rounded text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Duration (min)</label>
          <input type="number" min={10} value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full mt-1 p-2 bg-slate-800 rounded text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-1">
          <label className="text-xs text-slate-300">Stage</label>
          <select value={stage} onChange={e=>setStage(e.target.value)} className="w-full mt-1 p-2 bg-slate-800 rounded text-white">
            <option value="group">Group</option>
            <option value="round_of_16">Round of 16</option>
            <option value="quarterfinal">Quarterfinal</option>
            <option value="semi_final">Semi final</option>
            <option value="final">Final</option>
            <option value="third_place">Third place</option>
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-slate-300">Venue</label>
        <input placeholder="Venue" value={venue} onChange={e=>setVenue(e.target.value)} className="w-full mt-1 p-2 bg-slate-800 rounded text-white" />
      </div>

      <div className="flex gap-3">
        <button disabled={saving} className="px-4 py-2 bg-cyan-600 rounded text-white shadow">{saving ? 'Saving…' : 'Create match'}</button>
        <button type="button" onClick={()=>{ setHomeTeam(''); setAwayTeam(''); setDate(''); setVenue(''); setDuration(48); }} className="px-4 py-2 bg-white/5 rounded">Reset</button>
      </div>
    </form>
  );
}

export default AdminMatchForm;
