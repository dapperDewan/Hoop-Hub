import { useEffect, useState } from 'react';
import { getCoaches, bookCoach } from '../services/api';

const CoachesPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  // no cart -- direct buy flow

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCoaches();
        setCoaches(data);
      } catch (err) {
        console.error('Failed to fetch coaches', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const checkTeamOwner = async () => {
      const token = localStorage.getItem('token');
      if (!token) return setIsTeamOwner(false);
      try {
        const res = await fetch('/api/team-owner/my-profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) return setIsTeamOwner(false);
        const data = await res.json();
        setIsTeamOwner(!!data.teamOwner);
      } catch (err) {
        setIsTeamOwner(false);
      }
    };
    checkTeamOwner();
  }, []);

  const handleBuy = async (coach) => {
    if (!localStorage.getItem('token')) {
      setNotice('Please sign in to buy a coach.');
      return;
    }
    if (!isTeamOwner) {
      setNotice('Only team owners can buy coaches. Please apply to become a team owner.');
      return;
    }
    setNotice('Processing purchase...');
    try {
      const res = await bookCoach(coach.id);
      setNotice(res.message || 'Coach purchased. Locked for 30 days.');
      // refresh coaches list to reflect changes
      const updated = await getCoaches();
      setCoaches(updated);
    } catch (err) {
      console.error('Purchase failed', err);
      const msg = err?.response?.data?.error || err?.message || 'Purchase failed.';
      setNotice(msg);
    }
  };

  // No cart/checkout logic for coaches — direct buy flow only

  return (
    <div className="min-h-screen py-12 px-4 bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Coaches Marketplace</h1>
          <p className="text-slate-300">Hire professional coaches for 30-day training packages.</p>
        </header>

        {notice && (
          <div className="mb-4 rounded p-3 bg-amber-500/10 border border-amber-500/20 text-amber-200">{notice}</div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Available coaches</h2>
            <p className="text-sm text-slate-400">Admins add coaches; team owners buy directly for 30-day assignments.</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-400">Admins add coaches; team owners buy directly.</p>
          </div>
        </div>

        {loading ? (
          <div>Loading coaches...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {coaches.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                <div className="flex items-center gap-4">
                  <img src={c.image || '/placeholder.png'} alt={c.name} className="h-20 w-20 rounded" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{c.name}</h3>
                    <p className="text-sm text-slate-300">{c.title}</p>
                    <p className="text-sm text-slate-200 mt-2">Price: ${c.price?.toFixed ? c.price.toFixed(2) : c.price}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      if (!isTeamOwner) {
                        setNotice('Only team owners can buy coaches. Please apply to become a team owner.');
                        return;
                      }
                      handleBuy(c);
                    }}
                    disabled={!isTeamOwner}
                    className={`rounded-full px-4 py-2 font-semibold text-white ${isTeamOwner ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-700 opacity-60 cursor-not-allowed'}`}
                  >
                    {isTeamOwner ? `Buy coach - $${c.price}` : 'Team owners only'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default CoachesPage;
