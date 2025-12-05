import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchForm, setMatchForm] = useState({ homeTeam: '', awayTeam: '', date: '', venue: '' });
  const [matchError, setMatchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (!username || !isAdmin) return;
    const fetchAll = async () => {
      try {
        const [usersRes, playersRes, teamsRes, matchesRes] = await Promise.all([
          apiClient.get('admin/users', { params: { admin: true } }),
          apiClient.get('players'),
          apiClient.get('teams'),
          apiClient.get('match'),
        ]);
        setUsers(usersRes.data);
        setPlayers(playersRes.data);
        setTeams(teamsRes.data);
        setMatches(matchesRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch admin data.');
        setLoading(false);
      }
    };
    fetchAll();
  }, [username, isAdmin]);

  if (!username || !isAdmin) {
    return <div className="p-8 text-center text-red-500">Unauthorized. Please <a href="/login" className="text-blue-600 underline">log in</a> as an admin.</div>;
  }
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Username</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id || u._id}>
                <td className="p-2 border-t">{u.username}</td>
                <td className="p-2 border-t">
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={async () => {
                    const userId = u.id || u._id;
                    await apiClient.delete(`admin/users/${userId}`, { params: { admin: true } });
                    setUsers(users => users.filter(user => (user.id || user._id) !== userId));
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Players</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Team</th>
              <th className="p-2">Position</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id || p._id}>
                <td className="p-2 border-t">{p.name}</td>
                <td className="p-2 border-t">{p.team}</td>
                <td className="p-2 border-t">{p.position}</td>
                <td className="p-2 border-t">
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={async () => {
                    const playerId = p.id || p._id;
                    await apiClient.delete(`admin/players/${playerId}`, { params: { admin: true } });
                    setPlayers(players => players.filter(player => (player.id || player._id) !== playerId));
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Teams</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => (
              <tr key={t.id || t._id}>
                <td className="p-2 border-t">{t.name}</td>
                <td className="p-2 border-t">
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={async () => {
                    const teamId = t.id || t._id;
                    await apiClient.delete(`admin/teams/${teamId}`, { params: { admin: true } });
                    setTeams(teams => teams.filter(team => (team.id || team._id) !== teamId));
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Match Fixtures</h2>
        <form className="mb-6 flex flex-wrap gap-2 items-center" onSubmit={async e => {
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
          <input value={matchForm.homeTeam} onChange={e => setMatchForm(f => ({ ...f, homeTeam: e.target.value }))} placeholder="Home Team" className="border px-2 py-1 rounded" required />
          <input value={matchForm.awayTeam} onChange={e => setMatchForm(f => ({ ...f, awayTeam: e.target.value }))} placeholder="Away Team" className="border px-2 py-1 rounded" required />
          <input value={matchForm.date} onChange={e => setMatchForm(f => ({ ...f, date: e.target.value }))} type="datetime-local" className="border px-2 py-1 rounded" required />
          <input value={matchForm.venue} onChange={e => setMatchForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue" className="border px-2 py-1 rounded" required />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Add Match</button>
          {matchError && <span className="text-red-500 ml-2">{matchError}</span>}
        </form>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Home</th>
              <th className="p-2">Away</th>
              <th className="p-2">Date</th>
              <th className="p-2">Venue</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id || match._id}>
                <td className="p-2 border-t">{match.homeTeam}</td>
                <td className="p-2 border-t">{match.awayTeam}</td>
                <td className="p-2 border-t">{new Date(match.date).toLocaleString()}</td>
                <td className="p-2 border-t">{match.venue}</td>
                <td className="p-2 border-t">{match.status}</td>
                <td className="p-2 border-t">
                  <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={async () => {
                    const matchId = match.id || match._id;
                    await apiClient.delete(`match/${matchId}`);
                    setMatches(matches => matches.filter(m => (m.id || m._id) !== matchId));
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
