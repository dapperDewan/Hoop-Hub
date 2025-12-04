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
    <div className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">{mode === 'signup' ? 'Sign Up' : 'Log In'}</h2>
      {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Username"
          className="w-full border px-3 py-2 rounded"
          required
        />
        {mode === 'signup' && (
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border px-3 py-2 rounded"
            required
          />
        )}
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mode === 'signup' ? 'Sign Up' : 'Log In'}
        </button>
      </form>
      
      <div className="my-4 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-3 text-gray-500 text-sm">or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>
      
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="outline"
          size="large"
          width="100%"
          text={mode === 'signup' ? 'signup_with' : 'signin_with'}
        />
      </div>
      
      <div className="mt-4 text-center">
        {mode === 'signup' ? (
          <span>Already have an account? <button className="text-blue-600 underline" onClick={() => setMode('login')}>Log In</button></span>
        ) : (
          <span>Don't have an account? <button className="text-blue-600 underline" onClick={() => setMode('signup')}>Sign Up</button></span>
        )}
      </div>
    </div>
  );
};

export default AuthForms;
