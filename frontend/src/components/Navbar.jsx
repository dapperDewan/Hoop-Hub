import { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import ShieldCheckIcon from '@heroicons/react/24/outline/ShieldCheckIcon';
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';

const baseLinks = [
  { to: '/', label: 'Home' },
  { to: '/players', label: 'Players' },
  { to: '/teams', label: 'Teams' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/merchandise', label: 'Merch' }
];

const guestHighlights = [
  { to: '/fun-facts', label: 'Fun Facts' }
];

const memberLinks = [
  { to: '/profile', label: 'Profile hub' },
  { to: '/favorites', label: 'Favorite players' },
  { to: '/favorite-teams', label: 'Favorite teams' },
  { to: '/dream-team', label: 'Dream Team' },
  { to: '/view-dreamteam', label: 'Community teams' }
];

const NavItem = ({ to, label, onNavigate }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive ? 'text-white bg-indigo-600' : 'text-slate-100 hover:text-white hover:bg-indigo-500/50'
      }`
    }
    onClick={onNavigate}
  >
    {label}
  </NavLink>
);

const MobileNavItem = ({ to, label, onNavigate }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block w-full rounded-2xl px-4 py-3 text-base font-semibold ${
        isActive ? 'bg-white text-slate-900' : 'text-white/90 hover:bg-white/10'
      }`
    }
    onClick={onNavigate}
  >
    {label}
  </NavLink>
);

function Navbar({ isAuthenticated, isAdmin, username = 'Hooper', onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const handleClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const primaryLinks = [...baseLinks, ...(isAuthenticated ? [] : guestHighlights)];
  const dropdownLinks = isAuthenticated
    ? [...memberLinks, ...(isAdmin ? [{ to: '/admin', label: 'Admin tools' }] : [])]
    : [];

  const handleLogout = () => {
    onLogout?.();
    closeMobile();
    setUserMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'backdrop-blur bg-slate-900/85 shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 text-white">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Hoop Hub</p>
              <p className="text-xs text-slate-200/80 uppercase tracking-[0.2em]">Analytics</p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center space-x-2">
            {primaryLinks.map(({ to, label }) => (
              <NavItem key={to} to={to} label={label} />
            ))}
          </nav>

          <div className="hidden xl:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                >
                  Hi, {username || 'Hooper'}
                  <ChevronDownIcon className={`h-4 w-4 transition ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl">
                    <p className="px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">Member tools</p>
                    <div className="flex flex-col gap-1">
                      {dropdownLinks.map(({ to, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setUserMenuOpen(false)}
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-3 w-full rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-indigo-600 shadow-md hover:shadow-lg transition"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          <button
            className="xl:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
          <div className="absolute left-0 top-0 h-[90vh] min-h-[90vh] w-72 sm:w-80 bg-slate-950 shadow-2xl flex flex-col border-r border-white/10">
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 text-white">
              <p className="font-semibold">Menu</p>
              <button className="p-2" onClick={closeMobile} aria-label="Close menu">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 overscroll-contain touch-pan-y">
              <div className="space-y-3">
                {primaryLinks.map(({ to, label }) => (
                  <MobileNavItem key={to} to={to} label={label} onNavigate={closeMobile} />
                ))}
              </div>
              {isAuthenticated && (
                <div className="space-y-3">
                  <p className="px-1 text-xs uppercase tracking-[0.3em] text-slate-400">Member tools</p>
                  {[...dropdownLinks].map(({ to, label }) => (
                    <MobileNavItem key={to} to={to} label={label} onNavigate={closeMobile} />
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-6 border-t border-white/10 space-y-3">
              {isAuthenticated ? (
                <button
                  className="w-full py-3 rounded-2xl bg-red-500 text-white font-semibold"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={closeMobile}
                    className="block w-full text-center py-3 rounded-2xl bg-white text-indigo-600 font-semibold"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
