import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";

function FavoriteTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
      setError('Please log in to view your favorite teams.');
      setLoading(false);
      return;
    }

    async function fetchFavoriteTeams() {
      try {
        setLoading(true);
        const response = await apiClient.get('favorites/teams');
        setTeams(response.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching favorite teams:', err);
        setError('Failed to fetch favorite teams.');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFavoriteTeams();
  }, []);

  const removeFromFavorites = async (teamId) => {
    const token = localStorage.getItem('token');
    
    try {
      const currentFavoritesResponse = await apiClient.get('favorites/teams');
      const currentFavorites = currentFavoritesResponse.data || [];
      const updatedFavoriteIds = currentFavorites
        .filter(team => team._id !== teamId)
        .map(team => team._id);
      
      await apiClient.put('favorites/teams', { favoriteTeams: updatedFavoriteIds });
      setTeams(currentTeams => currentTeams.filter(team => team._id !== teamId));
    } catch (err) {
      console.error('Error removing team from favorites:', err);
      setError('Failed to remove team from favorites.');
    }
  };

  const skeletonCards = Array.from({ length: 6 });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-950 p-8 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-200">My Collection</p>
            <h1 className="text-4xl font-bold mt-2">Favorite Teams</h1>
            <p className="text-slate-200 mt-4">Loading your favorite teams...</p>
          </section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletonCards.map((_, idx) => (
              <div key={idx} className="h-72 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
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
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-violet-200">My Collection</p>
            <h1 className="text-4xl font-bold">Favorite Teams</h1>
            <p className="text-slate-200 max-w-3xl">
              Your hand-picked collection of teams. Track their progress, championships, and stay updated with your favorite franchises.
            </p>
          </div>
          
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Teams Saved</p>
              <p className="text-2xl font-semibold">{teams.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Total Championships</p>
              <p className="text-2xl font-semibold">
                {teams.reduce((sum, team) => sum + (Number(team.championships) || 0), 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Conferences</p>
              <p className="text-2xl font-semibold">
                {[...new Set(teams.map(t => t.conference).filter(Boolean))].length}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/teams"
              className="inline-block rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold shadow-lg shadow-purple-900/30 hover:-translate-y-0.5 transition"
            >
              Browse More Teams
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
        {teams.length === 0 && !error && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-xl font-semibold mb-2">No Favorite Teams Yet</h3>
            <p className="text-slate-400 mb-6">Start building your collection by exploring teams.</p>
            <Link
              to="/teams"
              className="inline-block rounded-full bg-purple-500 text-white px-6 py-3 text-sm font-semibold hover:bg-purple-600 transition"
            >
              Explore Teams
            </Link>
          </div>
        )}

        {/* Teams Grid */}
        {teams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <article 
                key={team._id} 
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 shadow-lg shadow-purple-900/20 hover:border-white/30 transition"
              >
                <div className="flex items-center gap-4">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-white/10"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold">
                      {team.name?.slice(0, 2) ?? '?'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">{team.name}</h2>
                    <p className="text-sm text-slate-300">{team.city}</p>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                      {team.conference} · {team.division}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Championships</p>
                    <p className="text-xl font-semibold text-white">{team.championships ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Established</p>
                    <p className="text-xl font-semibold text-white">{team.establishedYear || '—'}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/teams/${team._id}`}
                    className="flex-1 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    View Team
                  </Link>
                  <button
                    onClick={() => removeFromFavorites(team._id)}
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
    </div>
  );
}

export default FavoriteTeamsPage;
