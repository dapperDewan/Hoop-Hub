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
        // Get favorite teams directly from backend (now populated)
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
      // Get current favorites
      const currentFavoritesResponse = await apiClient.get('favorites/teams');
      
      const currentFavorites = currentFavoritesResponse.data || [];
      const updatedFavoriteIds = currentFavorites
        .filter(team => team._id !== teamId)
        .map(team => team._id);
      
      // Update favorites on backend
      await apiClient.put('favorites/teams', { favoriteTeams: updatedFavoriteIds });
      
      // Update local state
      setTeams(currentTeams => currentTeams.filter(team => team._id !== teamId));
      
    } catch (err) {
      console.error('Error removing team from favorites:', err);
      setError('Failed to remove team from favorites.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading your favorite teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Favorite Teams</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {teams.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No favorite teams selected.</p>
          <Link 
            to="/teams" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Browse teams to add to your favorites
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {teams.map(team => (
            <li key={team._id} className="py-4 flex items-center justify-between">
              <Link 
                to={`/teams/${team._id}`} 
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {team.name}
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {team.city} | {team.conference}
                </span>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  onClick={() => removeFromFavorites(team._id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FavoriteTeamsPage;
