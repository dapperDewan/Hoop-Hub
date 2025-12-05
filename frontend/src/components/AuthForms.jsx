import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import apiClient from '../services/api';

const AuthForms = ({
  onAuth,
  defaultMode = 'login',
  redirectOnSuccess = false,
  postAuthRoute = '/'
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(defaultMode);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const persistSessionLocally = ({ username, isAdmin, token }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? 'signup' : 'login';
      const payload =
        mode === 'signup'
          ? form
          : {
              username: form.username,
              password: form.password
            };
      const res = await apiClient.post(endpoint, payload);
      const sessionPayload = {
        username: res.data?.username,
        token: res.data?.token,
        isAdmin: typeof res.data?.isAdmin === 'boolean' ? res.data.isAdmin : undefined
      };
      if (onAuth) {
        onAuth(sessionPayload);
      } else {
        persistSessionLocally(sessionPayload);
      }
      setForm({ username: '', email: '', password: '' });
      if (redirectOnSuccess) {
        navigate(postAuthRoute);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('google', {
        credential: credentialResponse.credential
      });
      const sessionPayload = {
        username: res.data?.username,
        token: res.data?.token,
        isAdmin: typeof res.data?.isAdmin === 'boolean' ? res.data.isAdmin : undefined
      };
      if (onAuth) {
        onAuth(sessionPayload);
      } else {
        persistSessionLocally(sessionPayload);
      }
      if (redirectOnSuccess) {
        navigate(postAuthRoute);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-slate-900 border border-transparent animate-border-glow shadow-2xl shadow-indigo-500/20"
        style={{
          backgroundImage: 'linear-gradient(to bottom right, rgb(15 23 42), rgb(30 27 75), rgb(15 23 42)), linear-gradient(135deg, #6366f1, #a855f7, #06b6d4, #6366f1)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box'
        }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {mode === 'signup' ? 'Join the Hoop Hub community' : 'Sign in to continue to Hoop Hub'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
          
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_black"
              size="large"
              shape="pill"
              text={mode === 'signup' ? 'signup_with' : 'signin_with'}
            />
          </div>
          
          <div className="mt-6 text-center">
            {mode === 'signup' ? (
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <button 
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors" 
                  onClick={() => setMode('login')}
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Don't have an account?{' '}
                <button 
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors" 
                  onClick={() => setMode('signup')}
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForms;
