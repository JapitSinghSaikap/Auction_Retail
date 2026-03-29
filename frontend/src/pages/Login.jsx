import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        // Exchange access token for user info, then send to backend
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google-token`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userInfo }) }
        );
        const data = await res.json();
        if (!res.ok) { setError(data.message || 'Google login failed.'); return; }
        login(data.token, data.user);
        navigate(data.user.role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard');
      } catch {
        setError('Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed.'); return; }
      login(data.token, data.user);
      navigate(data.user.role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-[400px] animate-fadeIn">

        {/* Card */}
        <div className="card p-8 shadow-card">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-[18px] bg-accent flex items-center justify-center shadow-btn">
              {/* Bid/auction icon */}
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-primary text-center mb-1">Sign in</h1>
          <p className="text-sm text-secondary text-center mb-7">Use your AuctionLive Account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              name="email" type="email" className="input"
              placeholder="Email or Phone Number"
              value={form.email} onChange={handleChange} autoComplete="email"
            />
            <div className="relative">
              <input
                name="password" type="password" className="input pr-16"
                placeholder="Password"
                value={form.password} onChange={handleChange} autoComplete="current-password"
              />
              <Link to="#" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-accent hover:text-accent-dark">
                Forgot?
              </Link>
            </div>

            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 rounded-input px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-1" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[rgba(29,28,31,0.08)]" />
            <span className="text-xs text-secondary">or</span>
            <div className="flex-1 h-px bg-[rgba(29,28,31,0.08)]" />
          </div>

          {/* SSO */}
          <button
            type="button"
            onClick={() => handleGoogleSuccess()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[rgba(29,28,31,0.12)] rounded-pill py-2.5 text-sm font-medium text-primary hover:bg-surface transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[13px] text-secondary mt-6">
            New to AuctionLive?{' '}
            <Link to="/register" className="text-accent font-semibold hover:text-accent-dark">
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
