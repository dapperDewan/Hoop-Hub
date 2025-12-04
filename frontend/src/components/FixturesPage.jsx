import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import MapPinIcon from '@heroicons/react/24/outline/MapPinIcon';
import TrophyIcon from '@heroicons/react/24/outline/TrophyIcon';
import reactLogo from '../assets/react.svg'; // Placeholder logo

function FixturesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await apiClient.get('match');
        setMatches(res.data);
      } catch {
        setMatches([]);
      }
      setLoading(false);
    }
    fetchMatches();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl shadow-2xl animate-fade-in">
      <h2 className="text-4xl font-extrabold text-indigo-800 mb-8 tracking-tight drop-shadow text-center flex items-center justify-center gap-2">
        <TrophyIcon className="h-8 w-8 text-yellow-500 inline-block" />
        Match Fixtures
      </h2>
      {loading ? (
        <div className="text-center py-8 text-blue-500 animate-pulse">Loading...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No matches found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {matches.map(match => (
            <div key={match._id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:scale-[1.03] transition-transform duration-200 border border-indigo-100">
              <div className="flex items-center gap-4">
                <img
                  src={reactLogo}
                  alt="Home Team Logo"
                  className="h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-50"
                  loading="lazy"
                  decoding="async"
                  width="40"
                  height="40"
                />
                <span className="font-bold text-xl text-blue-700">{match.homeTeam}</span>
                <span className="text-gray-400 font-semibold mx-2">vs</span>
                <img
                  src={reactLogo}
                  alt="Away Team Logo"
                  className="h-10 w-10 rounded-full border-2 border-indigo-300 bg-indigo-50"
                  loading="lazy"
                  decoding="async"
                  width="40"
                  height="40"
                />
                <span className="font-bold text-xl text-indigo-700">{match.awayTeam}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                <span>{new Date(match.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPinIcon className="h-5 w-5 text-pink-500" />
                <span>{match.venue}</span>
              </div>
              <div className="flex items-center gap-3">
                {match.status === 'finished' && match.score ? (
                  <span className="font-bold text-green-600 flex items-center gap-1">
                    <TrophyIcon className="h-5 w-5 text-green-500" /> Final Score: {match.score}
                  </span>
                ) : (
                  <span className="font-semibold text-yellow-600 flex items-center gap-1">
                    <TrophyIcon className="h-5 w-5 text-yellow-500" /> Upcoming
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FixturesPage;
