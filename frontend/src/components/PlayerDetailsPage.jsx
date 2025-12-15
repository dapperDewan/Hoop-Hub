import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';

const PlayerDetailsPage = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('No player id provided.');
      setLoading(false);
      return;
    }
    const fetchPlayer = async () => {
      try {
        const res = await apiClient.get(`players/${id}`);
        setPlayer(res.data);
      } catch (err) {
        setError('Failed to load player.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <span className="ml-4 text-lg text-slate-300">Loading player...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-xl font-semibold mb-2 text-red-200">Player Not Found</h3>
            <p className="text-slate-400 mb-6">{error || 'The player you are looking for does not exist.'}</p>
            <Link
              to="/players"
              className="inline-block rounded-full bg-cyan-500 text-white px-6 py-3 text-sm font-semibold hover:bg-cyan-600 transition"
            >
              Back to Players
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = player.stats || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/players" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition">← Back to Players</Link>

        <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/50 via-slate-900 to-slate-950 shadow-2xl overflow-hidden p-6">
          <div className="flex items-center gap-6 mb-6">
            <img src={player.image || '/src/assets/react.svg'} alt={player.name} className="h-28 w-28 rounded-2xl object-cover border border-white/10" />
            <div>
              <h1 className="text-3xl font-bold">{player.name}</h1>
              <p className="text-slate-300">{player.team}</p>
              <p className="text-sm text-slate-400">{player.position} · #{player.number}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.pointsPerGame ?? stats.points ?? '—'}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">PPG</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.assistsPerGame ?? stats.assists ?? '—'}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">APG</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.reboundsPerGame ?? stats.rebounds ?? '—'}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RPG</p>
            </div>
          </div>

          <div className="space-y-4">
            {player.height && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Height</p>
                <p className="font-semibold">{player.height}</p>
              </div>
            )}
            {player.weight && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weight</p>
                <p className="font-semibold">{player.weight}</p>
              </div>
            )}
            {player.age && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Age</p>
                <p className="font-semibold">{player.age}</p>
              </div>
            )}
          </div>

        </article>
      </div>
    </div>
  );
};

export default PlayerDetailsPage;
