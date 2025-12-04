import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';

const PlayersPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        team: '',
        position: '',
        number: '',
        height: '',
        weight: '',
        age: '',
        pointsPerGame: '',
        assistsPerGame: '',
        reboundsPerGame: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await apiClient.get('players');
                setPlayers(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching players:', error);
                setLoading(false);
            }
        };
        fetchPlayers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const newPlayer = {
                name: form.name,
                team: form.team,
                position: form.position,
                number: Number(form.number),
                height: form.height,
                weight: form.weight && !isNaN(Number(form.weight)) ? Number(form.weight) : form.weight,
                age: Number(form.age),
                stats: {
                    pointsPerGame: Number(form.pointsPerGame),
                    assistsPerGame: Number(form.assistsPerGame),
                    reboundsPerGame: Number(form.reboundsPerGame)
                },
                image: form.image
            };
            const response = await apiClient.post('players', newPlayer);
            setPlayers([...players, response.data]);
            setShowModal(false);
            setForm({
                name: '', team: '', position: '', number: '', height: '', weight: '', age: '', pointsPerGame: '', assistsPerGame: '', reboundsPerGame: ''
            });
        } catch (err) {
            setError('Failed to add player. Please check your input.');
        }
    };

    // Dream Team logic (backend per-user)
    const [dreamTeam, setDreamTeam] = useState([]);
    const [dreamTeamError, setDreamTeamError] = useState('');
    const username = localStorage.getItem('username');
    // Fetch current user's dream team from backend
    useEffect(() => {
        if (!username) return;
        async function fetchDreamTeam() {
            try {
                const token = localStorage.getItem('token');
                const res = await apiClient.get('dreamteam/my');
                setDreamTeam(res.data.players ? res.data.players.map(p => p._id) : []);
            } catch (err) {
                setDreamTeam([]);
            }
        }
        fetchDreamTeam();
    }, [username]);
    // Update dream team in backend
    const handleDreamTeam = async (id) => {
        if (!username) {
            setDreamTeamError('Please log in to create your dream team.');
            return;
        }
        const strId = String(id);
        let updated;
        if (dreamTeam.includes(strId)) {
            updated = dreamTeam.filter(pid => pid !== strId);
            setDreamTeamError('');
        } else {
            if (dreamTeam.length >= 10) {
                setDreamTeamError('You can only add up to 10 players in your dream team.');
                return;
            }
            updated = [...dreamTeam, strId];
            setDreamTeamError('');
        }
        setDreamTeam(updated);
        try {
            await apiClient.put('dreamteam/my', { players: updated });
        } catch (err) {
            setDreamTeamError('Failed to update dream team.');
        }
    };

    // NBA player image mapping
    const nbaImages = {
        'LeBron James': 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png',
        'Stephen Curry': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png',
        'Giannis Antetokounmpo': 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png',
        'Kevin Durant': 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png',
        'Luka Doncic': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png',
        'Tyrese Haliburton': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630169.png',
        'Tyrese Hali': 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630169.png', // fallback for short name
        // Add more as needed
    };

    function getPlayerImage(player) {
        // Normalize name for matching
        const normalized = player.name.trim().toLowerCase();
        for (const key in nbaImages) {
            if (key.trim().toLowerCase() === normalized) {
                return nbaImages[key];
            }
        }
        if (player.image) return player.image;
        return 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png';
    }

    // Favorite players logic (per-user backend)
    const [favoritePlayers, setFavoritePlayers] = useState([]);
    useEffect(() => {
        if (!username) return;
        async function fetchFavorites() {
            try {
                const res = await apiClient.get('favorites/players');
                setFavoritePlayers(Array.isArray(res.data) ? res.data.map(p => typeof p === 'object' ? p._id : p) : []);
            } catch (err) {
                setFavoritePlayers([]);
            }
        }
        fetchFavorites();
    }, [username]);

    const handleFavorite = async (id) => {
        if (!username) return;
        const strId = String(id);
        let updated;
        if (favoritePlayers.includes(strId)) {
            updated = favoritePlayers.filter(pid => pid !== strId);
        } else {
            updated = [...favoritePlayers, strId];
        }
        setFavoritePlayers(updated);
        try {
            await apiClient.put('favorites/players', { favorites: updated });
        } catch (err) {
            // Optionally show error
        }
    };

    const summary = useMemo(() => {
        if (!players.length) {
            return { total: 0, avgPoints: 0, dreamSlots: dreamTeam.length, favorites: favoritePlayers.length };
        }
        const totals = players.reduce((acc, player) => {
            acc.points += Number(player?.stats?.pointsPerGame) || 0;
            return acc;
        }, { points: 0 });
        return {
            total: players.length,
            avgPoints: (totals.points / players.length).toFixed(1),
            dreamSlots: dreamTeam.length,
            favorites: favoritePlayers.length
        };
    }, [players, dreamTeam.length, favoritePlayers.length]);

    const skeletonCards = Array.from({ length: 6 });

    return (
        <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
            <div className="max-w-6xl mx-auto space-y-10">
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-950 p-8 shadow-2xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-4 max-w-2xl">
                            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Roster directory</p>
                            <h1 className="text-4xl font-bold leading-tight">Browse the players powering every Hoop Hub storyline.</h1>
                            <p className="text-slate-200">
                                Use this dashboard to save favorites, maintain your dream team, and discover new names to follow. Admins can add new players directly from here.
                            </p>
                            {!username && (
                                <p className="text-sm text-amber-200">Sign in to add players to your dream team and favorites.</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowModal(true)}
                                className="rounded-full bg-white text-slate-900 px-6 py-3 font-semibold shadow-lg shadow-indigo-900/40"
                            >
                                Add new player
                            </button>
                            <Link
                                to="/dream-team"
                                className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
                            >
                                Manage Dream Team
                            </Link>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Players tracked</p>
                            <p className="text-2xl font-semibold">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Avg points</p>
                            <p className="text-2xl font-semibold">{summary.avgPoints}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Dream team slots</p>
                            <p className="text-2xl font-semibold">{summary.dreamSlots}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Favorite saves</p>
                            <p className="text-2xl font-semibold">{summary.favorites}</p>
                        </div>
                    </div>
                </section>

                {dreamTeamError && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{dreamTeamError}</div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skeletonCards.map((_, idx) => (
                            <div key={idx} className="h-80 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {players.map((player) => (
                            <article key={player._id} className="group rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 shadow-lg shadow-indigo-900/20">
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
                                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{player.position} · #{player.number}</p>
                                    </div>
                                </div>
                                {player.stats && (
                                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                        <div>
                                            <p className="text-xl font-semibold text-white">{player.stats.pointsPerGame}</p>
                                            <p className="text-slate-400">PPG</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-semibold text-white">{player.stats.assistsPerGame}</p>
                                            <p className="text-slate-400">APG</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-semibold text-white">{player.stats.reboundsPerGame}</p>
                                            <p className="text-slate-400">RPG</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                                            dreamTeam.includes(String(player._id))
                                                ? 'bg-emerald-500/20 text-emerald-200'
                                                : 'bg-white/10 text-white'
                                        }`}
                                        onClick={() => handleDreamTeam(player._id)}
                                    >
                                        {dreamTeam.includes(String(player._id)) ? 'In Dream Team' : 'Add to Dream Team'}
                                    </button>
                                    <button
                                        className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                                            favoritePlayers.includes(String(player._id))
                                                ? 'bg-amber-400/20 text-amber-200'
                                                : 'bg-white/10 text-white'
                                        }`}
                                        onClick={() => handleFavorite(player._id)}
                                    >
                                        {favoritePlayers.includes(String(player._id)) ? 'Favorited' : 'Favorite player'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">Add new player</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">Close</button>
                        </div>
                        {error && <p className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>}
                        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
                            <input name="name" value={form.name} onChange={handleInputChange} placeholder="Name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="team" value={form.team} onChange={handleInputChange} placeholder="Team" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="position" value={form.position} onChange={handleInputChange} placeholder="Position" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="number" value={form.number} onChange={handleInputChange} placeholder="Number" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" required />
                            <input name="height" value={form.height} onChange={handleInputChange} placeholder="Height" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="weight" value={form.weight} onChange={handleInputChange} placeholder="Weight" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="age" value={form.age} onChange={handleInputChange} placeholder="Age" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="image" value={form.image} onChange={handleInputChange} placeholder="Image URL" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="pointsPerGame" value={form.pointsPerGame} onChange={handleInputChange} placeholder="Points Per Game" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="assistsPerGame" value={form.assistsPerGame} onChange={handleInputChange} placeholder="Assists Per Game" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <input name="reboundsPerGame" value={form.reboundsPerGame} onChange={handleInputChange} placeholder="Rebounds Per Game" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm" />
                            <div className="md:col-span-2 flex justify-end gap-4 pt-2">
                                <button type="button" className="rounded-full border border-white/20 px-6 py-2 text-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900">Save player</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayersPage;
