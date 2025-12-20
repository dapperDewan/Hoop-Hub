import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";

function FavoritePlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    
    const fetchFavoritePlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your favorite players.');
          setLoading(false);
          return;
        }
        const favoritesRes = await apiClient.get('favorites/players');
        const favoriteData = Array.isArray(favoritesRes.data) ? favoritesRes.data : [];
        // Normalize favorites so components can rely on `_id` (support Prisma `id` and legacy `_id`)
        const normalized = favoriteData.map(item => {
          if (typeof item === 'string' || typeof item === 'number') {
            return { _id: String(item), id: item };
          }
          const resolvedId = item._id ?? item.id ?? '';
          return { ...item, _id: String(resolvedId) };
        });
        setPlayers(normalized);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching favorite players:', err);
        setError('Failed to load favorite players.');
        setLoading(false);
      }
    };

    fetchFavoritePlayers();
  }, [username]);

  // NBA player image mapping
  const nbaImages = {
    'LeBron James': 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png',
    'Stephen Curry': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png',
    'Giannis Antetokounmpo': 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png',
    'Kevin Durant': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png',
    'Luka Doncic': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png',
    'Tyrese Haliburton': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630169.png',
    'Tyrese Hali': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630169.png',
  };

  function getPlayerImage(player) {
    const normalized = player.name.trim().toLowerCase();
    for (const key in nbaImages) {
      if (key.trim().toLowerCase() === normalized) {
        return nbaImages[key];
      }
    }
    if (player.image) return player.image;
    return 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png';
  }

  const handleRemoveFavorite = async (id) => {
    if (!username) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to manage favorite players.');
      return;
    }
    const strId = String(id);
    
    try {
      const favoritesRes = await apiClient.get('favorites/players');
        const currentFavorites = Array.isArray(favoritesRes.data)
          ? favoritesRes.data.map(fav => (typeof fav === 'object' ? (fav._id || fav.id) : fav))
          : [];

        const updatedFavorites = currentFavorites.map(String).filter(pid => pid !== strId);
      await apiClient.put('favorites/players', { favorites: updatedFavorites });
      
      setPlayers(players => players.filter(p => p._id !== strId));
      setShowModal(false);
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites.');
    }
  };

  const calculateStats = () => {
    if (players.length === 0) return { avgPPG: 0, avgAPG: 0, avgRPG: 0 };
    
    const totals = players.reduce((acc, player) => {
      acc.ppg += Number(player.stats?.pointsPerGame || player.stats?.points || 0);
      acc.apg += Number(player.stats?.assistsPerGame || player.stats?.assists || 0);
      acc.rpg += Number(player.stats?.reboundsPerGame || player.stats?.rebounds || 0);
      return acc;
    }, { ppg: 0, apg: 0, rpg: 0 });

    return {
      avgPPG: (totals.ppg / players.length).toFixed(1),
      avgAPG: (totals.apg / players.length).toFixed(1),
      avgRPG: (totals.rpg / players.length).toFixed(1)
    };
  };

  const stats = calculateStats();
  const skeletonCards = Array.from({ length: 6 });

  if (!username) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
            <p className="text-slate-400 mb-6">Please log in to view your favorite players.</p>
            <Link
              to="/auth"
              className="inline-block rounded-full bg-indigo-500 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-600 transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-950 p-8 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">My Collection</p>
            <h1 className="text-4xl font-bold mt-2">Favorite Players</h1>
            <p className="text-slate-200 mt-4">Loading your favorite players...</p>
          </section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletonCards.map((_, idx) => (
              <div key={idx} className="h-80 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">My Collection</p>
            <h1 className="text-4xl font-bold">Favorite Players</h1>
            <p className="text-slate-200 max-w-3xl">
              Your personally curated roster of favorite players. Track their stats, follow their careers, and never miss an update on the athletes you care about most.
            </p>
          </div>
          
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Players Saved</p>
              <p className="text-2xl font-semibold">{players.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Avg PPG</p>
              <p className="text-2xl font-semibold">{stats.avgPPG}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Avg APG</p>
              <p className="text-2xl font-semibold">{stats.avgAPG}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Avg RPG</p>
              <p className="text-2xl font-semibold">{stats.avgRPG}</p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/players"
              className="inline-block rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-900/30 hover:-translate-y-0.5 transition"
            >
              Browse More Players
            </Link>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Empty State */}
        {players.length === 0 && !error && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">No Favorite Players Yet</h3>
            <p className="text-slate-400 mb-6">Start building your roster by exploring players.</p>
            <Link
              to="/players"
              className="inline-block rounded-full bg-indigo-500 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-600 transition"
            >
              Explore Players
            </Link>
          </div>
        )}

        {/* Players Grid */}
        {players.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map(player => (
              <article
                key={player._id}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 shadow-lg shadow-indigo-900/20 cursor-pointer hover:border-white/30 transition"
                onClick={() => { setSelectedPlayer(player); setShowModal(true); }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={getPlayerImage(player)}
                    alt={player.name}
                    className="h-20 w-20 rounded-2xl object-cover border border-white/10"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{player.name}</h2>
                    <p className="text-sm text-slate-300">{player.team}</p>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                      {player.position} · #{player.number}
                    </p>
                  </div>
                </div>

                {player.stats && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center">
                      <p className="text-xl font-semibold text-white">
                        {player.stats.pointsPerGame || player.stats.points || '—'}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">PPG</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center">
                      <p className="text-xl font-semibold text-white">
                        {player.stats.assistsPerGame || player.stats.assists || '—'}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">APG</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center">
                      <p className="text-xl font-semibold text-white">
                        {player.stats.reboundsPerGame || player.stats.rebounds || '—'}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RPG</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/players/${player._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(player._id); }}
                    className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/30 transition"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {showModal && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowModal(false)}>
          <div 
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={getPlayerImage(selectedPlayer)}
                  alt={selectedPlayer.name}
                  className="h-24 w-24 rounded-2xl object-cover border border-white/10"
                />
                <div>
                  <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
                  <p className="text-slate-300">{selectedPlayer.team}</p>
                  <p className="text-sm text-slate-400">{selectedPlayer.position} · #{selectedPlayer.number}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {selectedPlayer.stats && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {selectedPlayer.stats.pointsPerGame || selectedPlayer.stats.points || '—'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">PPG</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {selectedPlayer.stats.assistsPerGame || selectedPlayer.stats.assists || '—'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">APG</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {selectedPlayer.stats.reboundsPerGame || selectedPlayer.stats.rebounds || '—'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RPG</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              {selectedPlayer.height && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Height</p>
                  <p className="font-semibold">{selectedPlayer.height}</p>
                </div>
              )}
              {selectedPlayer.weight && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weight</p>
                  <p className="font-semibold">{selectedPlayer.weight}</p>
                </div>
              )}
              {selectedPlayer.age && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Age</p>
                  <p className="font-semibold">{selectedPlayer.age}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                to={`/players/${selectedPlayer._id}`}
                className="flex-1 rounded-full bg-white text-slate-900 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-100 transition"
              >
                View Full Profile
              </Link>
              <button
                onClick={() => handleRemoveFavorite(selectedPlayer._id)}
                className="rounded-full bg-red-500/20 px-6 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
              >
                Remove from Favorites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FavoritePlayersPage;
