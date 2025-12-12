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
        reboundsPerGame: '',
        image: '',
        price: ''
    });
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const username = localStorage.getItem('username');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [isTeamOwner, setIsTeamOwner] = useState(false);

    useEffect(() => {
        const fetchTeamOwner = async () => {
            if (!username || isAdmin) return;
            try {
                const res = await apiClient.get('team-owner/my-profile');
                setIsTeamOwner(!!res.data.teamOwner);
            } catch (err) {
                setIsTeamOwner(false);
            }
        };
        fetchTeamOwner();
    }, [username, isAdmin]);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await apiClient.get(isAdmin ? 'players?admin=true' : 'players');
                setPlayers(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching players:', error);
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [isAdmin]);

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
                number: toNumberOrUndefined(form.number),
                height: form.height || undefined,
                weight: form.weight || undefined,
                age: toNumberOrUndefined(form.age),
                stats: {
                    points: toNumberOrUndefined(form.pointsPerGame),
                    assists: toNumberOrUndefined(form.assistsPerGame),
                    rebounds: toNumberOrUndefined(form.reboundsPerGame)
                },
                image: form.image || undefined,
                price: toNumberOrUndefined(form.price)
            };
            let response;
            if (editingPlayerId) {
                response = await apiClient.put(`players/${editingPlayerId}${isAdmin ? '?admin=true' : ''}`, newPlayer);
                setPlayers((prev) => prev.map((p) => toStringId(p) === editingPlayerId ? response.data : p));
                setNotice(isAdmin ? 'Player updated.' : 'Player update submitted (needs approval).');
            } else {
                response = await apiClient.post(isAdmin ? 'players?admin=true' : 'players', newPlayer);
                if (isAdmin) {
                    setPlayers([...players, response.data]);
                } else {
                    setNotice('Submitted for admin approval. It will appear once approved.');
                }
            }
            setShowModal(false);
            setForm({
                name: '', team: '', position: '', number: '', height: '', weight: '', age: '', pointsPerGame: '', assistsPerGame: '', reboundsPerGame: '', image: '', price: ''
            });
            setEditingPlayerId(null);
        } catch (err) {
            setError('Failed to add player. Please check your input.');
        }
    };

    // Dream Team logic (backend per-user)
    const [dreamTeam, setDreamTeam] = useState([]);
    const [dreamTeamError, setDreamTeamError] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    // Fetch current user's dream team from backend
    useEffect(() => {
        if (!username) return;
        async function fetchDreamTeam() {
            try {
                const token = localStorage.getItem('token');
                const res = await apiClient.get('dreamteam/my');
                const players = res.data.players || [];
                const ids = players.map((p) => toStringId(p));
                setDreamTeam(ids);
            } catch (err) {
                setDreamTeam([]);
            }
        }
        fetchDreamTeam();
    }, [username]);
    // Update dream team in backend
    const handleDreamTeam = async (player) => {
        if (!username) {
            setDreamTeamError('Please log in to create your dream team.');
            return;
        }
        const strId = toStringId(player);
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

    const getPlayerId = (player) => player?._id || player?.id || player?.name;
    const toStringId = (playerOrId) => typeof playerOrId === 'object' ? String(getPlayerId(playerOrId)) : String(playerOrId);
    const toNumberOrUndefined = (val) => (val === '' || val === undefined ? undefined : Number(val));

    // Favorite players logic (per-user backend)
    const [favoritePlayers, setFavoritePlayers] = useState([]);
    useEffect(() => {
        if (!username) return;
        async function fetchFavorites() {
            try {
                const res = await apiClient.get('favorites/players');
                const ids = Array.isArray(res.data) ? res.data.map((p) => toStringId(p)) : [];
                setFavoritePlayers(ids);
            } catch (err) {
                setFavoritePlayers([]);
            }
        }
        fetchFavorites();
    }, [username]);

    const handleFavorite = async (player) => {
        if (!username) return;
        const strId = toStringId(player);
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

    const handleDeletePlayer = async (player) => {
        const id = toStringId(player);
        try {
            await apiClient.delete(`players/${id}${isAdmin ? '?admin=true' : ''}`);
            setPlayers((prev) => prev.filter((p) => toStringId(p) !== id));
            setShowPlayerModal(false);
        } catch (err) {
            console.error('Failed to delete player', err);
        }
    };

    const beginEditPlayer = (player) => {
        setEditingPlayerId(toStringId(player));
        setForm({
            name: player.name || '',
            team: player.team || '',
            position: player.position || '',
            number: player.number ?? '',
            height: player.height || '',
            weight: player.weight || '',
            age: player.age ?? '',
            pointsPerGame: player.stats?.pointsPerGame ?? player.stats?.points ?? '',
            assistsPerGame: player.stats?.assistsPerGame ?? player.stats?.assists ?? '',
            reboundsPerGame: player.stats?.reboundsPerGame ?? player.stats?.rebounds ?? '',
            image: player.image || '',
            price: player.price ?? ''
        });
        setShowPlayerModal(false);
        setShowModal(true);
    };

    const handleApprove = async (player) => {
        const id = toStringId(player);
        try {
            const res = await apiClient.post(`admin/players/${id}/verify?admin=true`);
            setPlayers((prev) => prev.map((p) => toStringId(p) === id ? res.data : p));
        } catch (err) {
            console.error('Failed to approve player', err);
        }
    };

    const approvedPlayers = useMemo(
        () => players.filter((p) => p.verified !== false),
        [players]
    );
    const pendingPlayers = useMemo(
        () => players.filter((p) => p.verified === false),
        [players]
    );

    const summary = useMemo(() => {
        const source = approvedPlayers;
        if (!source.length) {
            return { total: 0, avgPoints: 0, dreamSlots: dreamTeam.length, favorites: favoritePlayers.length };
        }
        const totals = source.reduce((acc, player) => {
            const pointsVal = player?.stats?.pointsPerGame ?? player?.stats?.points;
            acc.points += Number(pointsVal) || 0;
            return acc;
        }, { points: 0 });
        return {
            total: source.length,
            avgPoints: (totals.points / source.length).toFixed(1),
            dreamSlots: dreamTeam.length,
            favorites: favoritePlayers.length
        };
    }, [approvedPlayers, dreamTeam.length, favoritePlayers.length]);

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
                                onClick={() => { if (username) { setEditingPlayerId(null); setShowModal(true); } else { setNotice('Please sign in to add players.'); } }}
                                disabled={!username}
                                className={`rounded-full px-6 py-3 font-semibold shadow-lg shadow-indigo-900/40 ${username ? 'bg-white text-slate-900 hover:-translate-y-0.5 transition' : 'bg-white/30 text-slate-500 cursor-not-allowed'}`}
                            >
                                {username ? 'Add new player' : 'Sign in to add'}
                            </button>
                            {(isTeamOwner || isAdmin) && (
                                <Link
                                    to="/dream-team"
                                    className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
                                >
                                    Manage Dream Team
                                </Link>
                            )}
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
                {notice && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{notice}</div>
                )}

                {isAdmin && pendingPlayers.length > 0 && (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Pending approval</h3>
                            <p className="text-sm text-amber-200">Admins must approve before players appear.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingPlayers.map((player) => (
                                <div key={getPlayerId(player)} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <img src={getPlayerImage(player)} alt={player.name} className="h-14 w-14 rounded-xl object-cover border border-white/10" />
                                        <div>
                                            <p className="font-semibold text-white">{player.name}</p>
                                            <p className="text-xs text-slate-400">{player.team}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleApprove(player)}
                                        className="rounded-full bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                                    >
                                        Approve
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skeletonCards.map((_, idx) => (
                            <div key={idx} className="h-80 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {approvedPlayers.map((player) => (
                            <article
                                key={getPlayerId(player)}
                                className="group rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 shadow-lg shadow-indigo-900/20 cursor-pointer hover:border-white/30"
                                onClick={() => { setSelectedPlayer(player); setShowPlayerModal(true); }}
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
                                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{player.position} · #{player.number}</p>
                                    </div>
                                </div>
                                {player.stats && (
                                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                        <div>
                                            <p className="text-xl font-semibold text-white">{player.stats.pointsPerGame ?? player.stats.points ?? 0}</p>
                                            <p className="text-slate-400">PPG</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-semibold text-white">{player.stats.assistsPerGame ?? player.stats.assists ?? 0}</p>
                                            <p className="text-slate-400">APG</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-semibold text-white">{player.stats.reboundsPerGame ?? player.stats.rebounds ?? 0}</p>
                                            <p className="text-slate-400">RPG</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {player.unavailableUntil && new Date(player.unavailableUntil) > new Date() && (
                                        <div className="flex-1 rounded-full px-3 py-2 text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                                            <div className="flex items-center justify-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                <span>In Dream Team</span>
                                            </div>
                                        </div>
                                    )}
                                    {(!player.unavailableUntil || new Date(player.unavailableUntil) <= new Date()) && (
                                        <div className="flex-1 rounded-full px-3 py-2 text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                                            <div className="flex items-center justify-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Available</span>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                                            favoritePlayers.includes(toStringId(player))
                                                ? 'bg-amber-400/20 text-amber-200'
                                                : 'bg-white/10 text-white'
                                        } ${username ? '' : 'opacity-60 cursor-not-allowed'}`}
                                        disabled={!username}
                                        onClick={(e) => { e.stopPropagation(); if (!username) { setNotice('Please sign in to favorite players.'); return; } handleFavorite(player); }}
                                    >
                                        {username ? (favoritePlayers.includes(toStringId(player)) ? 'Favorited' : 'Favorite player') : 'Sign in to favorite'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {showPlayerModal && selectedPlayer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowPlayerModal(false)}>
                    <div
                        className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={getPlayerImage(selectedPlayer)}
                                    alt={selectedPlayer.name}
                                    className="h-20 w-20 rounded-2xl object-cover border border-white/10"
                                />
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">{selectedPlayer.name}</h2>
                                    <p className="text-sm text-slate-300">{selectedPlayer.team}</p>
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{selectedPlayer.position} · #{selectedPlayer.number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                    {isAdmin && selectedPlayer.verified !== true && (
                                        <button
                                            onClick={() => { handleApprove(selectedPlayer); setShowPlayerModal(false); }}
                                            className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <>
                                            <button
                                                onClick={() => beginEditPlayer(selectedPlayer)}
                                                className="rounded-full bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/30 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlayer(selectedPlayer)}
                                                className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setShowPlayerModal(false)} className="text-slate-400 hover:text-white">Close</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xl font-semibold text-white">{selectedPlayer.stats?.pointsPerGame ?? selectedPlayer.stats?.points ?? 0}</p>
                                <p className="text-slate-400">PPG</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xl font-semibold text-white">{selectedPlayer.stats?.assistsPerGame ?? selectedPlayer.stats?.assists ?? 0}</p>
                                <p className="text-slate-400">APG</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xl font-semibold text-white">{selectedPlayer.stats?.reboundsPerGame ?? selectedPlayer.stats?.rebounds ?? 0}</p>
                                <p className="text-slate-400">RPG</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-300">
                            <p><span className="text-slate-400">Height:</span> {selectedPlayer.height || '—'}</p>
                            <p><span className="text-slate-400">Weight:</span> {selectedPlayer.weight || '—'}</p>
                            <p><span className="text-slate-400">Age:</span> {selectedPlayer.age || '—'}</p>
                            <p><span className="text-slate-400">Verified:</span> {selectedPlayer.verified === false ? 'Pending' : 'Approved'}</p>
                        </div>
                    </div>
                </div>
            )}

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
                            {isAdmin && (
                                <input name="price" value={form.price} onChange={handleInputChange} placeholder="Player Price (e.g., 2500000)" type="number" className="rounded-2xl border border-indigo-500/30 bg-slate-950 px-4 py-3 text-sm" />
                            )}
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
