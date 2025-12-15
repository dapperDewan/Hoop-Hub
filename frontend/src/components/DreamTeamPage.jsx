import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../services/api";

// Helper to get player ID consistently (handles both id and _id)
const getPlayerId = (player) => player?.id || player?._id;

function DreamTeamPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const username = localStorage.getItem('username');
  const [teamName, setTeamName] = useState(() => localStorage.getItem(`dreamTeamName_${username}`) || 'My Dream Team');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [viewUserId, setViewUserId] = useState("");
  const [teamOwner, setTeamOwner] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPlayers = useCallback(async () => {
    const res = await apiClient.get('players');
    return res.data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchTeamOwner() {
      try {
        if (username && !isAdmin) {
          const res = await apiClient.get('team-owner/my-profile');
          if (cancelled) return;
          if (!res.data.teamOwner) {
            setError('Only team owners can access this page.');
            setTimeout(() => navigate('/team-owner-apply'), 2000);
            setLoading(false);
            return;
          }
          setTeamOwner(res.data.teamOwner);
        }
        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (!isAdmin) {
          setError('Only team owners can access this page.');
          setTimeout(() => navigate('/team-owner-apply'), 2000);
        }
        setLoading(false);
      }
    }
    
    fetchTeamOwner();

    if (!username && !viewUserId) {
      setPlayers([]);
      setSelectedPlayers([]);
      setError('Please log in to view your dream team.');
      return () => {
        cancelled = true;
      };
    }

    async function fetchDreamTeam() {
      try {
        const token = localStorage.getItem('token');
        if (!token && !viewUserId) {
          if (!cancelled) {
            setPlayers([]);
            setSelectedPlayers([]);
            setError('Please log in to view your dream team.');
          }
          return;
        }
        let endpoint = 'dreamteam/my';
        if (viewUserId) {
          endpoint = `dreamteam/user/${viewUserId}`;
        }
        const res = await apiClient.get(endpoint);
        if (!cancelled) {
          setPlayers(res.data.players || []);
          setSelectedPlayers((res.data.players || []).map(p => getPlayerId(p)));
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setPlayers([]);
          setSelectedPlayers([]);
          setError('Failed to fetch dream team.');
        }
      }
    }
    fetchDreamTeam();

    return () => {
      cancelled = true;
    };
  }, [username, viewUserId, isAdmin, navigate]);

  // Update team name when user changes
  useEffect(() => {
    if (username) {
      setTeamName(localStorage.getItem(`dreamTeamName_${username}`) || 'My Dream Team');
    }
  }, [username]);

  // Track which players are already owned by the current team owner (already paid for)
  const alreadyOwnedPlayerIds = allPlayers
    .filter(p => teamOwner && p.currentOwner === teamOwner.id)
    .map(p => getPlayerId(p));

  useEffect(() => {
    let cancelled = false;

    const syncPlayers = async () => {
      try {
        const data = await loadPlayers();
        if (!cancelled) {
          setAllPlayers(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch players list', err);
        }
      }
    };

    syncPlayers();

    return () => {
      cancelled = true;
    };
  }, [loadPlayers, teamOwner?.id, username, isAdmin]);

  // Calculate total cost when selected players change
  // Only count NEW players that need to be purchased (not already owned by this team owner)
  useEffect(() => {
    const cost = selectedPlayers.reduce((sum, playerId) => {
      const player = allPlayers.find(p => getPlayerId(p) === playerId);
      if (!player) return sum;
      
      // Check if this player is already owned by the current team owner (already paid for)
      const isAlreadyOwned = teamOwner && player.currentOwner === teamOwner.id;
      
      // Only add to cost if the player is NOT already owned by me
      if (!isAlreadyOwned) {
        return sum + (player.price || 0);
      }
      return sum;
    }, 0);
    setTotalCost(cost);
  }, [selectedPlayers, allPlayers, teamOwner]);

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
      if (!teamOwner) {
        setError('Only team owners can save dream teams. Please apply to become a team owner.');
        return;
      }
      const response = await apiClient.put('dreamteam/my', { players: selectedPlayers, name: teamName });
      setError(`Dream team saved! Cost: $${response.data.totalCost?.toLocaleString()}, Remaining Budget: $${response.data.remainingBudget?.toLocaleString()}`);
      
      // Refresh data
      const res = await apiClient.get('dreamteam/my');
      setPlayers(res.data.players || []);
      
      const ownerRes = await apiClient.get('team-owner/my-profile');
      setTeamOwner(ownerRes.data.teamOwner);
    } catch (err) {
      let message = err.response?.data?.error || 'Failed to save dream team.';
      const availabilityDetails = err.response?.data?.details;
      const unavailableMatch = message.match(/^Player\s+([a-f0-9]{24}):\s+(.*)$/i);

      if (unavailableMatch) {
        const [, failedPlayerId, reason] = unavailableMatch;
        const playerName = allPlayers.find(p => getPlayerId(p) === failedPlayerId)?.name;
        if (playerName) {
          message = `${playerName}: ${reason}`;
        }
        if (availabilityDetails?.unavailableUntil) {
          message = `${message} (locked until ${new Date(availabilityDetails.unavailableUntil).toLocaleDateString()})`;
        }
        setSelectedPlayers(prev => prev.filter(id => id !== failedPlayerId));
      }

      setError(message);

      try {
        const refreshed = await loadPlayers();
        setAllPlayers(refreshed);
      } catch (refreshError) {
        console.error('Failed to refresh players after save error', refreshError);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto p-8 bg-slate-900 rounded-2xl shadow-xl border border-slate-700">
        {/* Team Owner Status */}
        {username && teamOwner && (
          <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border border-indigo-500/50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{teamOwner.teamName}</h3>
                <p className="text-sm opacity-90">Team Owner</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${teamOwner.currentBudget?.toLocaleString()}</p>
                <p className="text-xs opacity-90">Available Budget</p>
              </div>
            </div>
          </div>
        )}

        {/* Team Owner Warning */}
        {username && !teamOwner && (
          <div className="mb-6 bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-yellow-200">
              <strong>Note:</strong> Only team owners can create/update dream teams. 
              <Link to="/team-owner-apply" className="ml-2 text-blue-600 underline hover:text-blue-800">
                Apply to become a team owner
              </Link>
            </p>
          </div>
        )}

        <div className="flex items-center mb-6">
          {editing ? (
            <>
              <input
                type="text"
                value={teamName}
                onChange={handleNameChange}
                className="bg-slate-800 border border-slate-600 text-white px-3 py-2 rounded-lg mr-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={handleNameSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition">Save</button>
              <button onClick={() => setEditing(false)} className="ml-2 text-gray-400 hover:text-gray-300">Cancel</button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-extrabold text-white mr-4 tracking-tight drop-shadow">{teamName}</h2>
              <button onClick={() => setEditing(true)} className="text-indigo-400 underline hover:text-indigo-300">Edit Name</button>
            </>
          )}
        </div>
        {username && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 text-indigo-400">Select up to 10 players for your Dream Team:</h3>
            
            {/* Budget Summary for Team Owners */}
            {teamOwner && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-indigo-500/30">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Selected: </span>
                    <span className="font-semibold text-white">{selectedPlayers.length}/10 players</span>
                    {alreadyOwnedPlayerIds.length > 0 && selectedPlayers.some(id => alreadyOwnedPlayerIds.includes(id)) && (
                      <span className="text-xs text-green-400 ml-2">
                        ({selectedPlayers.filter(id => alreadyOwnedPlayerIds.includes(id)).length} already owned)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">New Purchase Cost: </span>
                    <span className="font-semibold text-lg text-white">${totalCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">After Purchase: </span>
                    <span className={`font-semibold text-lg ${teamOwner.currentBudget - totalCost < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${(teamOwner.currentBudget - totalCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlayers.map(player => {
                const playerId = getPlayerId(player);
                const isUnavailable = player.unavailableUntil && new Date(player.unavailableUntil) > new Date();
                const isSelected = selectedPlayers.includes(playerId);
                // Check if this player is already owned by the current team owner
                const isAlreadyOwnedByMe = teamOwner && player.currentOwner === teamOwner.id;
                // Check if owned by someone else
                const isOwnedByOther = isUnavailable && !isAlreadyOwnedByMe;
                // Only check budget for players that aren't already owned by me
                const playerCost = isAlreadyOwnedByMe ? 0 : (player.price || 0);
                const wouldExceedBudget = teamOwner && !isSelected && !isAlreadyOwnedByMe && (totalCost + playerCost > teamOwner.currentBudget);
                const isDisabled = isOwnedByOther || wouldExceedBudget;
                
                return (
                  <div 
                    key={playerId} 
                    className={`flex flex-col bg-slate-800 rounded-lg shadow p-3 border ${
                      isSelected ? 'border-2 border-indigo-500 bg-indigo-900/20' : 
                      isAlreadyOwnedByMe ? 'border border-green-500/50 bg-green-900/20' :
                      isOwnedByOther ? 'border border-red-500/50 bg-red-900/20' : 
                      wouldExceedBudget ? 'border border-orange-500/50 bg-orange-900/20' :
                      'border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
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
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.position} | #{player.number}</div>
                      </div>
                    </div>
                    
                    {/* Price and availability info for team owners */}
                    {teamOwner && (
                      <div className="mt-2 pt-2 border-t border-slate-700 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price:</span>
                          <span className="font-semibold text-white">
                            ${player.price?.toLocaleString() || 'N/A'}
                            {isAlreadyOwnedByMe && <span className="text-green-400 ml-1">(Owned)</span>}
                          </span>
                        </div>
                        {isAlreadyOwnedByMe && (
                          <div className="text-green-400 font-semibold">✓ Already Owned by You</div>
                        )}
                        {isOwnedByOther && (
                          <div className="text-red-400">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="font-semibold">Owned by Another</span>
                            </div>
                            {player.ownerInfo && (
                              <div className="flex justify-between">
                                <span>Owner:</span>
                                <span className="font-semibold">{player.ownerInfo.teamName}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Until:</span>
                              <span>{new Date(player.unavailableUntil).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                        {!isUnavailable && !isAlreadyOwnedByMe && (
                          <div className="text-green-400 font-semibold">✓ Available</div>
                        )}
                      </div>
                    )}
                    
                    {/* Already owned players cannot be removed (locked for 30 days) */}
                    {isAlreadyOwnedByMe ? (
                      <div className="mt-2 px-2 py-1 rounded text-sm font-semibold bg-green-700/30 text-green-400 border border-green-600/50 text-center">
                        ✓ Owned (Locked 30 days)
                      </div>
                    ) : (
                      <button
                        className={`mt-2 px-2 py-1 rounded text-sm font-semibold transition ${
                          isDisabled ? 'bg-slate-700 text-gray-500 cursor-not-allowed' :
                          isSelected ? 'bg-red-500 text-white hover:bg-red-600' : 
                          'bg-indigo-500 text-white hover:bg-indigo-600'
                        }`}
                        onClick={() => !isDisabled && handleSelectPlayer(playerId)}
                        disabled={isDisabled || (!isSelected && selectedPlayers.length >= 10)}
                      >
                        {isOwnedByOther ? 'Unavailable' : 
                         wouldExceedBudget ? 'Budget Insufficient' : 
                         isSelected ? 'Remove' : 'Add'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              className={`mt-4 px-6 py-2 rounded-lg shadow transition font-semibold ${
                !teamOwner || selectedPlayers.length === 0 || totalCost > teamOwner.currentBudget
                  ? 'bg-slate-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
              }`}
              onClick={handleSaveDreamTeam}
              disabled={!teamOwner || selectedPlayers.length === 0 || totalCost > teamOwner?.currentBudget}
            >
              Save Dream Team {teamOwner && `($${totalCost.toLocaleString()})`}
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
            <h3 className="text-2xl font-bold mb-4 text-green-400 tracking-wide">Starting 5</h3>
            <div className="grid grid-cols-1 gap-4 mb-8">
              {players.slice(0, 5).map(player => {
                const playerId = getPlayerId(player);
                return (
                <div key={playerId} className="flex items-center justify-between bg-slate-800 rounded-xl shadow-lg hover:shadow-xl border border-slate-700 hover:border-indigo-500/50 p-4 transition group">
                  <div className="flex items-center gap-4">
                    <img
                      src={getPlayerImage(player)}
                      alt={player.name}
                      className="h-14 w-14 object-cover rounded-full border-2 border-green-500 group-hover:border-green-400"
                      loading="lazy"
                      decoding="async"
                      width="56"
                      height="56"
                    />
                    <div>
                      <Link to={`/players/${playerId}`} className="text-lg font-semibold text-indigo-400 hover:underline group-hover:text-indigo-300 transition">
                        {player.name}
                      </Link>
                      <div className="text-sm text-gray-400 mt-1">{player.position} | #{player.number}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="font-bold text-green-400">{player.stats?.points ?? player.stats?.pointsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-500">PPG</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">{player.stats?.assists ?? player.stats?.assistsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-500">APG</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">{player.stats?.rebounds ?? player.stats?.reboundsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-500">RPG</div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-yellow-400 tracking-wide">Substitutes</h3>
            <div className="grid grid-cols-1 gap-4">
              {players.slice(5, 10).map(player => {
                const playerId = getPlayerId(player);
                return (
                <div key={playerId} className="flex items-center justify-between bg-slate-800 rounded-xl shadow-lg hover:shadow-xl border border-slate-700 hover:border-indigo-500/50 p-4 transition group">
                  <div className="flex items-center gap-4">
                    <img
                      src={getPlayerImage(player)}
                      alt={player.name}
                      className="h-14 w-14 object-cover rounded-full border-2 border-yellow-500 group-hover:border-yellow-400"
                      loading="lazy"
                      decoding="async"
                      width="56"
                      height="56"
                    />
                    <div>
                      <Link to={`/players/${playerId}`} className="text-lg font-semibold text-indigo-400 hover:underline group-hover:text-indigo-300 transition">
                        {player.name}
                      </Link>
                      <div className="text-sm text-gray-400 mt-1">{player.position} | #{player.number}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="font-bold text-yellow-400">{player.stats?.points ?? player.stats?.pointsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-500">PPG</div>
                    </div>
                    <div>
                        <div className="font-bold text-yellow-400">{player.stats?.assists ?? player.stats?.assistsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-500">APG</div>
                    </div>
                    <div>
                        <div className="font-bold text-yellow-400">{player.stats?.rebounds ?? player.stats?.reboundsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-500">RPG</div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500 text-red-400 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default DreamTeamPage;
