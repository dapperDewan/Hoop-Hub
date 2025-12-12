import { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/api';

const TeamsPage = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        city: '',
        conference: '',
        division: '',
        championships: '',
        establishedYear: '',
        logo: ''
    });
    const [error, setError] = useState('');
    const username = localStorage.getItem('username');
    const [favoriteTeams, setFavoriteTeams] = useState([]);
    const [savingTeamId, setSavingTeamId] = useState(null); // Track which specific team is being saved

    useEffect(() => {
        let isMounted = true;
        async function fetchTeams() {
            try {
                const res = await apiClient.get('teams');
                if (!isMounted) return;
                setTeams(Array.isArray(res.data) ? res.data : []);
                setError('');
            } catch (err) {
                if (isMounted) {
                    setError(err?.response?.data?.message || 'Failed to load teams.');
                    setTeams([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchTeams();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!username) return;
        async function fetchFavoriteTeams() {
            try {
                const res = await apiClient.get('favorites/teams');
                // Prisma returns 'id', not '_id'
                const ids = Array.isArray(res.data) ? res.data.map((team) => team.id || team) : [];
                setFavoriteTeams(ids.map((id) => String(id)));
            } catch {
                setFavoriteTeams([]);
            }
        }
        fetchFavoriteTeams();
    }, [username]);

    const handleFavorite = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        
        const strId = String(id);
        
        // Prevent action if not logged in or already saving this team
        if (!username || savingTeamId === strId) return;
        
        const isCurrentlyFavorite = favoriteTeams.includes(strId);
        const updated = isCurrentlyFavorite
            ? favoriteTeams.filter((teamId) => teamId !== strId)
            : [...favoriteTeams, strId];
        
        // Store previous state for rollback
        const previousFavorites = [...favoriteTeams];
        
        // Optimistic UI update
        setFavoriteTeams(updated);
        setSavingTeamId(strId);
        
        try {
            await apiClient.put('favorites/teams', { favoriteTeams: updated });
        } catch (err) {
            // Revert on error
            console.error('Failed to update favorites:', err);
            setFavoriteTeams(previousFavorites);
        } finally {
            setSavingTeamId(null);
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        const payload = {
            ...form,
            championships: form.championships ? Number(form.championships) : 0,
            establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined
        };
        try {
            const res = await apiClient.post('teams', payload);
            setTeams((prev) => [res.data, ...prev]);
            setShowModal(false);
            setForm({
                name: '',
                city: '',
                conference: '',
                division: '',
                championships: '',
                establishedYear: '',
                logo: ''
            });
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to add team.');
        }
    };

    const summary = useMemo(() => {
        const total = teams.length;
        const trophies = teams.reduce((sum, team) => sum + (Number(team.championships) || 0), 0);
        const favoriteTotal = favoriteTeams.length;
        const estAverage = teams.length
            ? Math.round(teams.reduce((sum, team) => sum + (Number(team.establishedYear) || 0), 0) / teams.length)
            : 0;
        return { total, trophies, favoriteTotal, estAverage };
    }, [teams, favoriteTeams]);

    const skeletonCards = Array.from({ length: 6 });

    return (
        <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
            <div className="max-w-6xl mx-auto space-y-10">
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-950 p-8 shadow-2xl">
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-[0.4em] text-violet-200">Club index</p>
                        <h1 className="text-4xl font-bold">Find franchises, track rivalries, and save hometown teams.</h1>
                        <p className="text-slate-200 max-w-3xl">
                            Every card surfaces the essentials: conference, division, championships, and when the club was founded. Use it to follow the teams you love and discover new ones to add to your watchlist.
                        </p>
                        {!username && <p className="text-sm text-amber-200">Sign in to favorite teams and sync them to your profile.</p>}
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <button
                            onClick={() => setShowModal(true)}
                            className="rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold shadow-lg shadow-purple-900/30"
                        >
                            Add new team
                        </button>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Teams</p>
                            <p className="text-2xl font-semibold">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Total trophies</p>
                            <p className="text-2xl font-semibold">{summary.trophies}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Favorites</p>
                            <p className="text-2xl font-semibold">{summary.favoriteTotal}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Avg founding year</p>
                            <p className="text-2xl font-semibold">{summary.estAverage || '—'}</p>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skeletonCards.map((_, idx) => (
                            <div key={idx} className="h-72 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => {
                            const teamId = team.id || team._id; // Support both Prisma (id) and Mongoose (_id)
                            const favorite = favoriteTeams.includes(String(teamId));
                            return (
                                <article key={teamId} className="group rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 shadow-lg shadow-purple-900/20">
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
                                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{team.conference} · {team.division}</p>
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
                                    <button
                                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${favorite ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-white'} ${savingTeamId === String(teamId) ? 'opacity-50 cursor-wait' : ''}`}
                                        onClick={(e) => handleFavorite(e, teamId)}
                                        disabled={savingTeamId === String(teamId)}
                                    >
                                        {savingTeamId === String(teamId) ? 'Saving...' : favorite ? 'Favorited' : 'Add to favorites'}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">Add new team</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">Close</button>
                        </div>
                        {error && <p className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>}
                        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
                            <input name="name" value={form.name} onChange={handleInputChange} placeholder="Team Name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="city" value={form.city} onChange={handleInputChange} placeholder="City" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="conference" value={form.conference} onChange={handleInputChange} placeholder="Conference" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="division" value={form.division} onChange={handleInputChange} placeholder="Division" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="championships" value={form.championships} onChange={handleInputChange} placeholder="Championships" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="establishedYear" value={form.establishedYear} onChange={handleInputChange} placeholder="Established Year" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="logo" value={form.logo} onChange={handleInputChange} placeholder="Logo URL" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm md:col-span-2" />
                            <div className="md:col-span-2 flex justify-end gap-4 pt-2">
                                <button type="button" className="rounded-full border border-white/20 px-6 py-2 text-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900">Save team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsPage;
