import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";

function DreamTeamPage() {
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const username = localStorage.getItem('username');
  const [teamName, setTeamName] = useState(() => localStorage.getItem(`dreamTeamName_${username}`) || 'My Dream Team');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [viewUserId, setViewUserId] = useState("");

  useEffect(() => {
    async function fetchAllPlayers() {
      try {
        const res = await apiClient.get('players');
        setAllPlayers(res.data);
      } catch (err) {}
    }
    fetchAllPlayers();

    if (!username && !viewUserId) {
      setPlayers([]);
      setError('Please log in to view your dream team.');
      return;
    }
    async function fetchDreamTeam() {
      try {
        const token = localStorage.getItem('token');
        if (!token && !viewUserId) {
          setPlayers([]);
          setSelectedPlayers([]);
          setError('Please log in to view your dream team.');
          return;
        }
        let endpoint = 'dreamteam/my';
        if (viewUserId) {
          endpoint = `dreamteam/user/${viewUserId}`;
        }
        const res = await apiClient.get(endpoint);
        setPlayers(res.data.players || []);
        setSelectedPlayers((res.data.players || []).map(p => p._id));
        setError('');
      } catch (err) {
        setPlayers([]);
        setSelectedPlayers([]);
        setError('Failed to fetch dream team.');
      }
    }
    fetchDreamTeam();
  }, [username, viewUserId]);

  // Update team name when user changes
  useEffect(() => {
    if (username) {
      setTeamName(localStorage.getItem(`dreamTeamName_${username}`) || 'My Dream Team');
    }
  }, [username]);

  const handleSelectPlayer = (id) => {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(pid => pid !== id));
    } else {
      if (selectedPlayers.length >= 10) return;
      setSelectedPlayers([...selectedPlayers, id]);
    }
  };

  const handleSaveDreamTeam = async () => {
    const token = localStorage.getItem('token');
    try {
      if (!token) {
        setError('Please log in to save your dream team.');
        return;
      }
      await apiClient.put('dreamteam/my', { players: selectedPlayers, name: teamName });
      setError('Dream team saved!');
      const res = await apiClient.get('dreamteam/my');
      setPlayers(res.data.players || []);
    } catch (err) {
      setError('Failed to save dream team.');
    }
  };

  const handleDeleteDreamTeam = async () => {
    const token = localStorage.getItem('token');
    try {
      if (!token) {
        setError('Please log in to delete dream teams.');
        return;
      }
      await apiClient.delete(`dreamteam/user/${localStorage.getItem('userId')}`);
      setPlayers([]);
      setError('Dream team deleted.');
    } catch (err) {
      setError('Failed to delete dream team.');
    }
  };

  const handleNameChange = (e) => {
    setTeamName(e.target.value);
  };

  const handleNameSave = () => {
    localStorage.setItem(`dreamTeamName_${username}`, teamName);
    setEditing(false);
  };

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

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl">
        <div className="flex items-center mb-6">
          {editing ? (
            <>
              <input
                type="text"
                value={teamName}
                onChange={handleNameChange}
                className="border px-3 py-2 rounded-lg mr-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button onClick={handleNameSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">Save</button>
              <button onClick={() => setEditing(false)} className="ml-2 text-gray-500 hover:text-gray-700">Cancel</button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-extrabold text-indigo-700 mr-4 tracking-tight drop-shadow">{teamName}</h2>
              <button onClick={() => setEditing(true)} className="text-blue-600 underline hover:text-blue-800">Edit Name</button>
            </>
          )}
        </div>
        {username && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 text-blue-700">Select up to 10 players for your Dream Team:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlayers.map(player => (
                <div key={player._id} className={`flex items-center bg-white rounded-lg shadow p-3 ${selectedPlayers.includes(player._id) ? 'border-2 border-blue-500' : 'border'}`}>
                  <img
                    src={getPlayerImage(player)}
                    alt={player.name}
                    className="h-10 w-10 object-cover rounded-full mr-3"
                    loading="lazy"
                    decoding="async"
                    width="40"
                    height="40"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.position} | #{player.number}</div>
                  </div>
                  <button
                    className={`ml-2 px-2 py-1 rounded ${selectedPlayers.includes(player._id) ? 'bg-red-400 text-white' : 'bg-blue-400 text-white'}`}
                    onClick={() => handleSelectPlayer(player._id)}
                  >
                    {selectedPlayers.includes(player._id) ? 'Remove' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
              onClick={handleSaveDreamTeam}
              disabled={selectedPlayers.length === 0}
            >
              Save Dream Team
            </button>
          </div>
        )}
        {players.length > 0 && !error && (
          <div className="space-y-8">
            {isAdmin && (
              <div className="mb-4 text-right">
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
                  onClick={handleDeleteDreamTeam}
                >
                  Delete This User's Dream Team
                </button>
              </div>
            )}
            <h3 className="text-2xl font-bold mb-4 text-green-700 tracking-wide">Starting 5</h3>
            <div className="grid grid-cols-1 gap-4 mb-8">
              {players.slice(0, 5).map(player => (
                <div key={player._id} className="flex items-center justify-between bg-white rounded-xl shadow hover:shadow-lg p-4 transition group">
                  <div className="flex items-center gap-4">
                    <img
                      src={getPlayerImage(player)}
                      alt={player.name}
                      className="h-14 w-14 object-cover rounded-full border-2 border-blue-300 group-hover:border-blue-500"
                      loading="lazy"
                      decoding="async"
                      width="56"
                      height="56"
                    />
                    <div>
                      <Link to={`/players/${player._id}`} className="text-lg font-semibold text-blue-700 hover:underline group-hover:text-blue-900 transition">
                        {player.name}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">{player.position} | #{player.number}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="font-bold text-blue-600">{player.stats?.pointsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">PPG</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{player.stats?.assistsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">APG</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{player.stats?.reboundsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">RPG</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-yellow-700 tracking-wide">Substitutes</h3>
            <div className="grid grid-cols-1 gap-4">
              {players.slice(5, 10).map(player => (
                <div key={player._id} className="flex items-center justify-between bg-white rounded-xl shadow hover:shadow-lg p-4 transition group">
                  <div className="flex items-center gap-4">
                    <img
                      src={getPlayerImage(player)}
                      alt={player.name}
                      className="h-14 w-14 object-cover rounded-full border-2 border-yellow-300 group-hover:border-yellow-500"
                      loading="lazy"
                      decoding="async"
                      width="56"
                      height="56"
                    />
                    <div>
                      <Link to={`/players/${player._id}`} className="text-lg font-semibold text-blue-700 hover:underline group-hover:text-blue-900 transition">
                        {player.name}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">{player.position} | #{player.number}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="font-bold text-yellow-700">{player.stats?.pointsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">PPG</div>
                    </div>
                    <div>
                      <div className="font-bold text-yellow-700">{player.stats?.assistsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">APG</div>
                    </div>
                    <div>
                      <div className="font-bold text-yellow-700">{player.stats?.reboundsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">RPG</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
  );
}

export default DreamTeamPage;
