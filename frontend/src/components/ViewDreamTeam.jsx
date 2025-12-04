import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';

const ViewDreamTeam = () => {
  const [username, setUsername] = useState('');
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTeam(null);
    
    if (!username.trim()) {
      setError('Please enter a username.');
      setLoading(false);
      return;
    }
    
    try {
      const res = await apiClient.get(`dreamteam/username/${username}`);
      setTeam(res.data);
      if (!res.data.players || res.data.players.length === 0) {
        setError(`${username} hasn't created a dream team yet.`);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`User "${username}" not found. Please check the username and try again.`);
      } else {
        setError('Something went wrong while searching. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-indigo-700 mb-3 tracking-tight drop-shadow">Explore Dream Teams</h2>
        <p className="text-gray-600 text-lg">Discover and analyze other players' dream team selections</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter player username..."
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold text-lg">No Dream Team Found</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
      {team && team.players && team.players.length > 0 && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-green-700 tracking-wide">{username}'s Dream Team</h3>
                <p className="text-gray-600 mt-1">Team Name: <span className="font-semibold text-gray-800">{team.name || 'Unnamed Team'}</span></p>
              </div>
              <div className="bg-green-100 rounded-full px-4 py-2">
                <span className="text-green-800 font-semibold text-sm">{team.players.length} Players</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
              <h4 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Starting Five
              </h4>
            </div>
            <div className="p-4 space-y-3">{team.players.slice(0, 5).map((player, index) => (
                <div key={player._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition group">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <img
                      src={getPlayerImage(player)}
                      alt={player.name}
                      className="h-12 w-12 object-cover rounded-full border-2 border-green-300 group-hover:border-green-500 transition"
                      loading="lazy"
                      decoding="async"
                      width="48"
                      height="48"
                    />
                    <div>
                      <Link to={`/players/${player._id}`} className="text-lg font-semibold text-blue-700 hover:underline group-hover:text-blue-900 transition">
                        {player.name}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">{player.position} • #{player.number}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <div className="font-bold text-green-600">{player.stats?.pointsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">PPG</div>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <div className="font-bold text-green-600">{player.stats?.assistsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">APG</div>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <div className="font-bold text-green-600">{player.stats?.reboundsPerGame ?? '-'}</div>
                      <div className="text-xs text-gray-400">RPG</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {team.players.length > 5 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-4">
                <h4 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Bench Players
                </h4>
              </div>
              <div className="p-4 space-y-3">
                {team.players.slice(5, 10).map((player, index) => (
                  <div key={player._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition group">
                    <div className="flex items-center gap-4">
                      <div className="bg-yellow-100 text-yellow-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {index + 6}
                      </div>
                      <img
                        src={getPlayerImage(player)}
                        alt={player.name}
                        className="h-12 w-12 object-cover rounded-full border-2 border-yellow-300 group-hover:border-yellow-500 transition"
                        loading="lazy"
                        decoding="async"
                        width="48"
                        height="48"
                      />
                      <div>
                        <Link to={`/players/${player._id}`} className="text-lg font-semibold text-blue-700 hover:underline group-hover:text-blue-900 transition">
                          {player.name}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">{player.position} • #{player.number}</div>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                        <div className="font-bold text-yellow-600">{player.stats?.pointsPerGame ?? '-'}</div>
                        <div className="text-xs text-gray-400">PPG</div>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                        <div className="font-bold text-yellow-600">{player.stats?.assistsPerGame ?? '-'}</div>
                        <div className="text-xs text-gray-400">APG</div>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                        <div className="font-bold text-yellow-600">{player.stats?.reboundsPerGame ?? '-'}</div>
                        <div className="text-xs text-gray-400">RPG</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {team && (!team.players || team.players.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-100 rounded-full p-4">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-blue-800 font-semibold text-xl mb-2">No Dream Team Yet</h3>
              <p className="text-blue-600 text-lg">This player hasn't created their dream team yet.</p>
              <p className="text-blue-500 text-sm mt-2">Check back later or try searching for another player!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDreamTeam;
