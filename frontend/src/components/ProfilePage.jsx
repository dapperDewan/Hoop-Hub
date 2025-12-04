import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

const quickLinks = [
  { label: 'Favorite players', description: 'Jump straight to your saved list to see how your stars are performing.', to: '/favorites' },
  { label: 'Favorite teams', description: 'Keep hometown clubs and new obsessions in one tidy place.', to: '/favorite-teams' },
  { label: 'Dream Team lab', description: 'Adjust lineups, experiment with roles, and share IDs with friends.', to: '/dream-team' },
  { label: 'Fixtures', description: 'See upcoming clashes, venues, and must-watch matchups.', to: '/fixtures' },
  { label: 'Merchandise', description: 'Update your cart with fresh drops before game night.', to: '/merchandise' },
  { label: 'Community teams', description: 'Look up lineups built by other fans using their user ID.', to: '/view-dreamteam' }
];

const emptyForm = {
  email: '',
  displayName: '',
  favoriteTeam: '',
  location: '',
  bio: ''
};

function ProfilePage({ username, isAdmin }) {
  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    let active = true;
    setLoading(true);
    apiClient.get('profile/me')
      .then(({ data }) => {
        if (!active) return;
        setProfileData(data);
        setForm({
          email: data.email || '',
          displayName: data.profile?.displayName || '',
          favoriteTeam: data.profile?.favoriteTeam || '',
          location: data.profile?.location || '',
          bio: data.profile?.bio || ''
        });
      })
      .catch(() => setError('Failed to load profile information'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const payload = {
        email: form.email,
        profile: {
          displayName: form.displayName,
          favoriteTeam: form.favoriteTeam,
          location: form.location,
          bio: form.bio
        }
      };
      const { data } = await apiClient.put('profile/me', payload);
      setProfileData(data);
      setStatus('Profile updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!username) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-semibold">Sign in to unlock your profile.</h1>
          <p className="text-slate-300">
            Hoop Hub keeps your favorites, dream teams, and cart items in one place. Log in to see everything tailored to you.
          </p>
          <Link to="/auth" className="inline-flex px-6 py-3 rounded-full bg-white text-slate-900 font-semibold">
            Go to the auth portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-700/40 via-purple-600/30 to-slate-900 p-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-200">Welcome back</p>
          <h1 className="text-4xl font-bold">Hey {username}, your hoops world is ready.</h1>
          <p className="text-slate-200 max-w-2xl">
            This profile page is now the first stop after login. Update your contact details, personalize your bio, and jump into the tools that keep Hoop Hub organized.
          </p>
          {isAdmin && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-semibold">
              Admin tools enabled
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Username</p>
                <p className="text-xl font-semibold">{username}</p>
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</p>
                <p className="text-xl font-semibold">{profileData?.email || '—'}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Display name</p>
                <p className="text-lg font-semibold text-white">{profileData?.profile?.displayName || 'Not set'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Favorite team</p>
                <p className="text-lg font-semibold text-white">{profileData?.profile?.favoriteTeam || 'Not set'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Location</p>
                <p className="text-lg font-semibold text-white">{profileData?.profile?.location || 'Not set'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Bio</p>
                <p className="text-sm text-slate-300 leading-relaxed">{profileData?.profile?.bio || 'Share a short note about your hoops journey.'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold">Edit profile</h2>
            {loading ? (
              <p className="mt-4 text-slate-300">Loading profile…</p>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300" htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300" htmlFor="displayName">Display name</label>
                  <input
                    id="displayName"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300" htmlFor="favoriteTeam">Favorite team</label>
                  <input
                    id="favoriteTeam"
                    name="favoriteTeam"
                    value={form.favoriteTeam}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300" htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300" htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={form.bio}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                </div>
                {status && <p className="text-sm text-emerald-400">{status}</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-white text-slate-900 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {quickLinks.map(({ label, description, to }) => (
            <article key={label} className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Shortcut</p>
                <h2 className="text-2xl font-semibold mt-1">{label}</h2>
                <p className="text-slate-300 text-sm mt-2">{description}</p>
              </div>
              <Link to={to} className="mt-auto inline-flex text-indigo-300 font-semibold hover:text-white">
                Go now →
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
