import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useMemo, useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import './App.css';
import Footer from './components/Footer';

const HomePage = lazy(() => import('./components/HomePage'));
const PlayersPage = lazy(() => import('./components/PlayersPage'));
const TeamsPage = lazy(() => import('./components/TeamsPage'));

const TeamProfile = lazy(() => import('./components/TeamProfile'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const FavoritePlayersPage = lazy(() => import('./components/FavoritePlayersPage'));
const DreamTeamPage = lazy(() => import('./components/DreamTeamPage'));
const FavoriteTeamsPage = lazy(() => import('./components/FavoriteTeamsPage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ViewDreamTeam = lazy(() => import('./components/ViewDreamTeam'));
const FixturesPage = lazy(() => import('./components/FixturesPage'));
const FunFacts = lazy(() => import('./components/FunFacts'));
const MerchandisePage = lazy(() => import('./components/MerchandisePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const TeamOwnerApplicationPage = lazy(() => import('./components/TeamOwnerApplicationPage'));
const BlogDetailsPage = lazy(() => import('./components/BlogDetailsPage'));

const getSessionFromStorage = () => ({
  username: localStorage.getItem('username'),
  isAdmin: localStorage.getItem('isAdmin') === 'true',
  token: localStorage.getItem('token')
});

const persistSession = ({ username, isAdmin, token } = {}) => {
  if (username) {
    localStorage.setItem('username', username);
  }
  if (typeof isAdmin === 'boolean') {
    if (isAdmin) {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.removeItem('isAdmin');
    }
  }
  if (token) {
    localStorage.setItem('token', token);
  }
};

function App() {
  const [session, setSession] = useState(getSessionFromStorage);

  useEffect(() => {
    const handleStorage = () => setSession(getSessionFromStorage());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleAuthSuccess = (payload = {}) => {
    persistSession(payload);
    setSession(getSessionFromStorage());
  };

  return (
    <Router>
      <AppContent session={session} setSession={setSession} onAuthSuccess={handleAuthSuccess} />
    </Router>
  )
}

function AppContent({ session, setSession, onAuthSuccess }) {
  const navigate = useNavigate();
  const routeFallback = useMemo(() => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Loading route" />
    </div>
  ), []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setSession({ username: null, isAdmin: false, token: null });
    navigate('/auth');
  }, [setSession, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar
        isAuthenticated={Boolean(session.username)}
        isAdmin={session.isAdmin}
        username={session.username}
        onLogout={handleLogout}
      />
      <main>
          <Suspense fallback={routeFallback}>
            <Routes>
              <Route path="/" element={<HomePage isAuthenticated={Boolean(session.username)} />} />
              <Route path="/profile" element={<ProfilePage username={session.username} isAdmin={session.isAdmin} />} />
              <Route path="/players" element={<PlayersPage />} />
              
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/:id" element={<TeamProfile />} />
              <Route path="/favorites" element={<FavoritePlayersPage />} />
              <Route path="/favorite-teams" element={<FavoriteTeamsPage />} />
              <Route path="/dream-team" element={<DreamTeamPage />} />
              <Route path="/view-dreamteam" element={<ViewDreamTeam />} />
              <Route path="/team-owner-apply" element={<TeamOwnerApplicationPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/merchandise" element={<MerchandisePage isAuthenticated={Boolean(session.username)} isAdmin={session.isAdmin} />} />
              <Route path="/fun-facts" element={<FunFacts />} />
              <Route path="/blog/:id" element={<BlogDetailsPage />} />
              <Route path="/auth" element={<AuthPage onAuthSuccess={onAuthSuccess} />} />
              <Route path="*" element={<div className="flex min-h-[50vh] items-center justify-center text-white">Page not found.</div>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
  )
}

export default App;
