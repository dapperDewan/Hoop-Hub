import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";

function FavoritePlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        // Get user's favorite players (populated)
        const favoritesRes = await apiClient.get('favorites/players');
        
        const favoriteData = Array.isArray(favoritesRes.data) ? favoritesRes.data : [];
        setPlayers(favoriteData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching favorite players:', err);
        setError('Failed to load favorite players.');
        setLoading(false);
      }
    };

    fetchFavoritePlayers();
  }, [username]);

  // NBA player image mapping (same as PlayersPage)
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
  const handleFavorite = async (id) => {
    if (!username) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to manage favorite players.');
      return;
    }
    const strId = String(id);
    
    try {
      // Get current favorites
      const favoritesRes = await apiClient.get('favorites/players');
      
      const currentFavorites = Array.isArray(favoritesRes.data) ? 
        favoritesRes.data.map(fav => typeof fav === 'object' ? fav._id : fav) : [];
      
      // Remove from favorites
      const updatedFavorites = currentFavorites.filter(pid => pid !== strId);
      
      // Update backend
      await apiClient.put('favorites/players', { favorites: updatedFavorites });
      
      // Update UI by removing the player from the list
      setPlayers(players => players.filter(p => p._id !== strId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">My Favorite Players</h2>
      
      {!username && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Please log in to view your favorite players.</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">Go to Login</Link>
        </div>
      )}
      
      {username && loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading your favorites...</span>
        </div>
      )}
      
      {username && error && (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {username && !loading && !error && players.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No favorite players selected yet.</p>
          <Link to="/players" className="text-blue-600 hover:underline mt-2 inline-block">Browse Players to Add Favorites</Link>
        </div>
      )}
      
      {username && !loading && players.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map(player => (
            <div key={player._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="mb-4 flex justify-center">
                  <img
                    src={getPlayerImage(player)}
                    alt={player.name}
                    className="h-24 w-24 object-cover rounded-full border"
                    loading="lazy"
                    decoding="async"
                    width="96"
                    height="96"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{player.name}</h2>
                <p className="text-gray-600">{player.team}</p>
                <p className="text-gray-500">{player.position} | #{player.number}</p>
                {player.stats && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{player.stats.pointsPerGame}</p>
                      <p className="text-gray-500">PPG</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{player.stats.assistsPerGame}</p>
                      <p className="text-gray-500">APG</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{player.stats.reboundsPerGame}</p>
                      <p className="text-gray-500">RPG</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 justify-end">
                  <Link to={`/players/${player._id}`} className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-700">View Profile</Link>
                  <button
                    className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                    onClick={() => handleFavorite(player._id)}
                  >
                    Remove from Favorites
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritePlayersPage;
