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
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight text-center flex items-center justify-center gap-2">
          <TrophyIcon className="h-8 w-8 text-amber-400 inline-block" />
          Match Fixtures
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-300 animate-pulse">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No matches found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {matches.map(match => (
              <div key={match._id} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 hover:scale-[1.03] transition-transform duration-200">
                <div className="flex items-center gap-4">
                  <img
                    src={reactLogo}
                    alt="Home Team Logo"
                    className="h-10 w-10 rounded-full border border-white/10 bg-slate-900/60"
                    loading="lazy"
                    decoding="async"
                    width="40"
                    height="40"
                  />
                  <span className="font-bold text-xl text-white">{match.homeTeam}</span>
                  <span className="text-slate-400 font-semibold mx-2">vs</span>
                  <img
                    src={reactLogo}
                    alt="Away Team Logo"
                    className="h-10 w-10 rounded-full border border-white/10 bg-slate-900/60"
                    loading="lazy"
                    decoding="async"
                    width="40"
                    height="40"
                  />
                  <span className="font-bold text-xl text-white">{match.awayTeam}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CalendarDaysIcon className="h-5 w-5 text-cyan-300" />
                  <span>{new Date(match.date).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPinIcon className="h-5 w-5 text-pink-300" />
                  <span>{match.venue}</span>
                </div>
                <div className="flex items-center gap-3">
                  {match.status === 'finished' && match.score ? (
                    <span className="font-bold text-green-400 flex items-center gap-1">
                      <TrophyIcon className="h-5 w-5 text-green-400" /> Final Score: {match.score}
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <TrophyIcon className="h-5 w-5 text-amber-400" /> Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FixturesPage;
