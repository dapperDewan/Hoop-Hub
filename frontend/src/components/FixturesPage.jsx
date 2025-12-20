import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import MapPinIcon from '@heroicons/react/24/outline/MapPinIcon';
import TrophyIcon from '@heroicons/react/24/outline/TrophyIcon';
import reactLogo from '../assets/react.svg'; // Placeholder logo

function FixturesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamMap, setTeamMap] = useState({});

  useEffect(() => {
    let mounted = true;
    let pollId = null;

    async function fetchMatches() {
      try {
        const res = await apiClient.get('match');
        if (!mounted) return;
        // defensive handling: API may return array or object wrapper
        const payload = res && res.data;
        console.debug('Fixtures fetch response:', payload);
      const isCancelled = (m) => {
        const s = (m?.status || '').toString().toLowerCase();
        return s === 'cancelled' || s === 'canceled' || s === 'cancel';
      };
      if (Array.isArray(payload)) setMatches(payload.filter(m => !isCancelled(m)));
      else if (payload && Array.isArray(payload.matches)) setMatches(payload.matches.filter(m => !isCancelled(m)));
      else if (payload && payload.data && Array.isArray(payload.data)) setMatches(payload.data.filter(m => !isCancelled(m)));
      else if (payload && typeof payload === 'object') setMatches(!isCancelled(payload) ? [payload] : []);
      else setMatches([]);
        // resolve any team ids to names in background
        resolveTeamNames(payload);
        // start polling if any match is live
        const hasLive = Array.isArray(res.data) && res.data.some(m => m.status === 'live' || m.isLive);
        if (hasLive && !pollId) {
          pollId = setInterval(async () => {
            try {
              const r = await apiClient.get('match');
              if (!mounted) return;
              const p = r && r.data;
              const isCancelled = (m) => {
                const s = (m?.status || '').toString().toLowerCase();
                return s === 'cancelled' || s === 'canceled' || s === 'cancel';
              };
              if (Array.isArray(p)) setMatches(p.filter(m => !isCancelled(m)));
              else if (p && Array.isArray(p.matches)) setMatches(p.matches.filter(m => !isCancelled(m)));
              else if (p && p.data && Array.isArray(p.data)) setMatches(p.data.filter(m => !isCancelled(m)));
              else if (p && typeof p === 'object') setMatches(!isCancelled(p) ? [p] : []);
              else setMatches([]);
              resolveTeamNames(p);
            } catch (e) {
              // ignore
            }
          }, 4000);
        } else if (!hasLive && pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      } catch {
        if (mounted) setMatches([]);
      }
      if (mounted) setLoading(false);
    }
    fetchMatches();

    return () => {
      mounted = false;
      if (pollId) clearInterval(pollId);
    };
  }, []);

  // fetch team names for any team IDs we don't yet have
  const resolveTeamNames = async (payload) => {
    try {
      const items = Array.isArray(payload) ? payload : (payload && payload.matches) ? payload.matches : (payload && payload.data) ? payload.data : (payload ? [payload] : []);
      const ids = new Set();
      items.forEach(m => {
        const pushIfId = (v) => {
          if (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v) && !teamMap[v]) ids.add(v);
        };
        pushIfId(m.homeTeam);
        pushIfId(m.awayTeam);
        (m.teams || []).forEach(pushIfId);
      });
      if (ids.size === 0) return;
      const res = await apiClient.post('features/teams/byIds', { ids: Array.from(ids) });
      const teams = res.data || [];
      const next = { ...teamMap };
      teams.forEach(t => { if (t && t.id) next[t.id] = t.name || t.teamName || t.name; });
      setTeamMap(next);
    } catch (e) {
      console.debug('resolveTeamNames error', e?.message || e);
    }
  };

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
            {matches.map(match => {
              const homeLabel = match.homeTeamName || teamMap[match.homeTeam] || (typeof match.homeTeam === 'string' ? match.homeTeam : (match.homeTeam?.name || match.homeTeam?.teamName || match.teams?.[0]));
              const awayLabel = match.awayTeamName || teamMap[match.awayTeam] || (typeof match.awayTeam === 'string' ? match.awayTeam : (match.awayTeam?.name || match.awayTeam?.teamName || match.teams?.[1]));
              return (
              <div key={match._id || match.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 hover:scale-[1.03] transition-transform duration-200">
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
                  <span className="font-bold text-xl text-white">{homeLabel}</span>
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
                  <span className="font-bold text-xl text-white">{awayLabel}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CalendarDaysIcon className="h-5 w-5 text-cyan-300" />
                  <span>{match.date ? new Date(match.date).toLocaleString() : 'TBD'}</span>
                  <span className="ml-3 inline-block text-xs text-slate-400 px-2 py-1 rounded bg-white/3">{match.stage || 'group'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPinIcon className="h-5 w-5 text-pink-300" />
                  <span>{match.venue || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3">
                  { (match.status === 'completed' || match.status === 'finished') && match.score ? (
                    <span className="font-bold text-green-400 flex items-center gap-2">
                      <TrophyIcon className="h-5 w-5 text-green-400" /> Final: {match.score.home} - {match.score.away}
                    </span>
                  ) : match.status === 'live' || match.isLive ? (
                    <span className="font-bold text-rose-400 flex items-center gap-2">
                      <TrophyIcon className="h-5 w-5 text-rose-400" /> Live: {match.score ? `${match.score.home} - ${match.score.away}` : '0 - 0'}
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <TrophyIcon className="h-5 w-5 text-amber-400" /> Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FixturesPage;
