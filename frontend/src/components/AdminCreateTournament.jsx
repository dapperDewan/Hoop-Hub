import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function AdminCreateTournament() {
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    apiClient.get('teams')
      .then(res => { if (mounted) setTeams(res.data || []); })
      .catch(() => { if (mounted) setTeams([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !startDate || !endDate) {
      setError('Name, start date and end date are required.');
      return;
    }
    if (selected.size < 2) {
      setError('Select at least two teams.');
      return;
    }
    const payload = {
      name,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      teams: Array.from(selected)
    };
    try {
      setSubmitting(true);
      const res = await apiClient.post('tournaments?admin=true', payload);
      // navigate back to admin dashboard or tournament list
      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create tournament');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl p-6 border border-white/6">
        <h1 className="text-2xl font-bold mb-4">Create Tournament</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg px-3 py-2 bg-slate-800 border border-white/6" />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 bg-slate-800 border border-white/6" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 bg-slate-800 border border-white/6" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 bg-slate-800 border border-white/6" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Select Teams (choose 2+)</label>
            {loading ? (
              <div className="text-sm text-slate-400">Loading teams…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2">
                {teams.map(t => (
                  <label key={t.id} className="flex items-center gap-2 rounded-lg p-2 border border-white/6 hover:bg-white/2 cursor-pointer">
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                    <div className="flex-1 text-sm">
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.city}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-700">
              {submitting ? 'Creating…' : 'Create Tournament'}
            </button>
            <button type="button" onClick={() => navigate('/admin')} className="rounded-lg bg-white/5 px-4 py-2 font-semibold">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
