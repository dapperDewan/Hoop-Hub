import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [matchForm, setMatchForm] = useState({ homeTeam: '', awayTeam: '', date: '', venue: '' });
  const [matchError, setMatchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (!username || !isAdmin) return;
    const fetchAll = async () => {
      try {
        const [usersRes, playersRes, teamsRes, matchesRes, applicationsRes] = await Promise.all([
          apiClient.get('admin/users', { params: { admin: true } }),
          apiClient.get('players'),
          apiClient.get('teams'),
          apiClient.get('match'),
          apiClient.get('team-owner/applications'),
        ]);
        setUsers(usersRes.data);
        setPlayers(playersRes.data);
        setTeams(teamsRes.data);
        setMatches(matchesRes.data);
        setApplications(applicationsRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch admin data.');
        setLoading(false);
      }
    };
    fetchAll();
  }, [username, isAdmin]);

  const pendingApplications = applications.filter(app => app.status === 'pending');

  if (!username || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-12 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2 text-red-200">Unauthorized Access</h3>
            <p className="text-slate-400 mb-6">Please log in as an admin to access this page.</p>
            <a
              href="/auth"
              className="inline-block rounded-full bg-red-500 text-white px-6 py-3 text-sm font-semibold hover:bg-red-600 transition"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <span className="ml-4 text-lg text-slate-300">Loading admin data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const adminBlocks = [
    {
      id: 'applications',
      icon: '📋',
      title: 'Team Owner Applications',
      count: pendingApplications.length,
      subtitle: 'pending reviews',
      gradient: 'from-amber-600/30 to-orange-600/30',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'users',
      icon: '👥',
      title: 'Manage Users',
      count: users.length,
      subtitle: 'registered users',
      gradient: 'from-blue-600/30 to-cyan-600/30',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'players',
      icon: '🏀',
      title: 'Manage Players',
      count: players.length,
      subtitle: 'players in database',
      gradient: 'from-indigo-600/30 to-purple-600/30',
      borderColor: 'border-indigo-500/30',
    },
    {
      id: 'teams',
      icon: '🏆',
      title: 'Manage Teams',
      count: teams.length,
      subtitle: 'teams registered',
      gradient: 'from-purple-600/30 to-pink-600/30',
      borderColor: 'border-purple-500/30',
    },
    {
      id: 'matches',
      icon: '📅',
      title: 'Match Fixtures',
      count: matches.length,
      subtitle: 'scheduled matches',
      gradient: 'from-emerald-600/30 to-teal-600/30',
      borderColor: 'border-emerald-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/50 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Control Center</p>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-200 max-w-3xl">
              Manage all aspects of Hoop Hub from one place. Click on any section below to view details and take action.
            </p>
          </div>
          
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Total Users</p>
              <p className="text-2xl font-semibold">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Total Players</p>
              <p className="text-2xl font-semibold">{players.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Total Teams</p>
              <p className="text-2xl font-semibold">{teams.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Pending Applications</p>
              <p className="text-2xl font-semibold text-amber-400">{pendingApplications.length}</p>
            </div>
          </div>
        </section>

        {/* Admin Blocks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminBlocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setActiveModal(block.id)}
              className={`group rounded-3xl border ${block.borderColor} bg-gradient-to-br ${block.gradient} p-8 text-left shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-200`}
            >
              <div className="text-5xl mb-4">{block.icon}</div>
              <h3 className="text-xl font-bold mb-2">{block.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{block.count}</span>
                <span className="text-sm text-slate-300">{block.subtitle}</span>
              </div>
              <p className="mt-4 text-sm text-slate-400 group-hover:text-slate-200 transition">
                Click to manage →
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Applications Modal */}
      {activeModal === 'applications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8" onClick={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Team Owner Applications</h2>
                <p className="text-slate-400 text-sm">{applications.length} total applications</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-3xl">×</button>
            </div>
            
            {applications.length === 0 ? (
              <p className="text-center py-8 text-slate-400">No applications yet.</p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {applications.map(app => (
                  <div key={app.id || app._id} className={`rounded-2xl border p-5 ${
                    app.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30' :
                    app.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                    'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{app.teamName}</h3>
                        <p className="text-sm text-slate-400">by {app.user?.username}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        app.status === 'pending' ? 'bg-amber-500/30 text-amber-200' :
                        app.status === 'approved' ? 'bg-emerald-500/30 text-emerald-200' :
                        'bg-red-500/30 text-red-200'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-slate-400">Requested Budget</p>
                        <p className="font-semibold">${app.requestedBudget?.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-slate-400">Application Fee</p>
                        <p className="font-semibold">৳{app.applicationFee?.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-slate-400">Submitted</p>
                        <p className="font-semibold">{new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                      {app.reviewedAt && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs text-slate-400">Reviewed</p>
                          <p className="font-semibold">{new Date(app.reviewedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {app.paymentInfo && (
                      <div className="rounded-xl bg-white/5 p-3 mb-4">
                        <p className="text-xs font-bold text-slate-300 mb-2">Payment Details</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span><span className="text-slate-400">Method:</span> <span className={app.paymentInfo.method === 'bkash' ? 'text-pink-400' : 'text-orange-400'}>{app.paymentInfo.method === 'bkash' ? 'bKash' : 'Nagad'}</span></span>
                          <span><span className="text-slate-400">Phone:</span> {app.paymentInfo.phoneNumber}</span>
                          <span><span className="text-slate-400">TrxID:</span> <code className="text-cyan-300">{app.paymentInfo.transactionId}</code></span>
                        </div>
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <div className="flex gap-3">
                        <button 
                          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition"
                          onClick={async () => {
                            try {
                              await apiClient.post(`team-owner/applications/${app.id || app._id}/approve`, {
                                approvedBudget: app.requestedBudget
                              });
                              setApplications(apps => apps.map(a => 
                                (a.id || a._id) === (app.id || app._id) ? { ...a, status: 'approved', reviewedAt: new Date() } : a
                              ));
                            } catch (err) {
                              alert('Failed to approve application');
                            }
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="rounded-full bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
                          onClick={async () => {
                            try {
                              await apiClient.post(`team-owner/applications/${app.id || app._id}/reject`);
                              setApplications(apps => apps.map(a => 
                                (a.id || a._id) === (app.id || app._id) ? { ...a, status: 'rejected', reviewedAt: new Date() } : a
                              ));
                            } catch (err) {
                              alert('Failed to reject application');
                            }
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Modal */}
      {activeModal === 'users' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8" onClick={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Manage Users</h2>
                <p className="text-slate-400 text-sm">{users.length} registered users</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-3xl">×</button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id || u._id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{u.username}</span>
                    </div>
                    <button 
                      className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
                      onClick={async () => {
                        if (!confirm(`Delete user "${u.username}"?`)) return;
                        const userId = u.id || u._id;
                        await apiClient.delete(`admin/users/${userId}`, { params: { admin: true } });
                        setUsers(users => users.filter(user => (user.id || user._id) !== userId));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Players Modal */}
      {activeModal === 'players' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8" onClick={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Manage Players</h2>
                <p className="text-slate-400 text-sm">{players.length} players in database</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-3xl">×</button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="grid gap-3">
                {players.map(p => (
                  <div key={p.id || p._id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                        {p.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-slate-400">{p.team} · {p.position}</p>
                      </div>
                    </div>
                    <button 
                      className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
                      onClick={async () => {
                        if (!confirm(`Delete player "${p.name}"?`)) return;
                        const playerId = p.id || p._id;
                        await apiClient.delete(`admin/players/${playerId}`, { params: { admin: true } });
                        setPlayers(players => players.filter(player => (player.id || player._id) !== playerId));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teams Modal */}
      {activeModal === 'teams' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8" onClick={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Manage Teams</h2>
                <p className="text-slate-400 text-sm">{teams.length} teams registered</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-3xl">×</button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {teams.map(t => (
                  <div key={t.id || t._id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-4">
                      {t.logo ? (
                        <img src={t.logo} alt={t.name} className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                          {t.name?.slice(0, 2)}
                        </div>
                      )}
                      <span className="font-semibold">{t.name}</span>
                    </div>
                    <button 
                      className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
                      onClick={async () => {
                        if (!confirm(`Delete team "${t.name}"?`)) return;
                        const teamId = t.id || t._id;
                        await apiClient.delete(`admin/teams/${teamId}`, { params: { admin: true } });
                        setTeams(teams => teams.filter(team => (team.id || team._id) !== teamId));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matches Modal */}
      {activeModal === 'matches' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8" onClick={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Match Fixtures</h2>
                <p className="text-slate-400 text-sm">{matches.length} scheduled matches</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-3xl">×</button>
            </div>
            
            {/* Add Match Form */}
            <form className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={async e => {
              e.preventDefault();
              setMatchError('');
              try {
                const res = await apiClient.post('match', matchForm);
                setMatches(m => [...m, res.data]);
                setMatchForm({ homeTeam: '', awayTeam: '', date: '', venue: '' });
              } catch {
                setMatchError('Failed to add match.');
              }
            }}>
              <p className="text-sm font-semibold mb-3 text-slate-300">Add New Match</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input 
                  value={matchForm.homeTeam} 
                  onChange={e => setMatchForm(f => ({ ...f, homeTeam: e.target.value }))} 
                  placeholder="Home Team" 
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm" 
                  required 
                />
                <input 
                  value={matchForm.awayTeam} 
                  onChange={e => setMatchForm(f => ({ ...f, awayTeam: e.target.value }))} 
                  placeholder="Away Team" 
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm" 
                  required 
                />
                <input 
                  value={matchForm.date} 
                  onChange={e => setMatchForm(f => ({ ...f, date: e.target.value }))} 
                  type="datetime-local" 
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm" 
                  required 
                />
                <input 
                  value={matchForm.venue} 
                  onChange={e => setMatchForm(f => ({ ...f, venue: e.target.value }))} 
                  placeholder="Venue" 
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm" 
                  required 
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button type="submit" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition">
                  Add Match
                </button>
                {matchError && <span className="text-sm text-red-400">{matchError}</span>}
              </div>
            </form>

            <div className="max-h-[40vh] overflow-y-auto">
              <div className="space-y-3">
                {matches.map(match => (
                  <div key={match.id || match._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-lg font-bold">
                          <span>{match.homeTeam}</span>
                          <span className="text-slate-500">vs</span>
                          <span>{match.awayTeam}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                          <span>📅 {new Date(match.date).toLocaleString()}</span>
                          <span>📍 {match.venue}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-200' :
                            match.status === 'live' ? 'bg-green-500/20 text-green-200' :
                            'bg-slate-500/20 text-slate-200'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
                        onClick={async () => {
                          if (!confirm('Delete this match?')) return;
                          const matchId = match.id || match._id;
                          await apiClient.delete(`match/${matchId}`);
                          setMatches(matches => matches.filter(m => (m.id || m._id) !== matchId));
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
