import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('All fields are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed.'); return; }
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
      <div className="w-full max-w-[440px] animate-fadeIn">
        <div className="card p-8 shadow-card">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-[18px] bg-accent flex items-center justify-center shadow-btn">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-primary text-center mb-1">Create Account</h1>
          <p className="text-sm text-secondary text-center mb-7">Join the AuctionLive community</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Role selector */}
            <div className="mb-1">
              <p className="text-xs font-semibold text-secondary mb-2.5 uppercase tracking-wider">Select your role</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'buyer', label: 'Bidder', icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )},
                  { value: 'seller', label: 'Auctioneer', icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )},
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: value }))}
                    className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-card text-sm font-semibold transition-all duration-200
                      ${form.role === value
                        ? 'bg-accent-light border-2 border-accent text-accent shadow-sm'
                        : 'bg-surface border-2 border-transparent text-secondary hover:border-[rgba(0,113,227,0.3)]'
                      }`}
                  >
                    {form.role === value && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <span className={form.role === value ? 'text-accent' : 'text-secondary'}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <input name="name" className="input" placeholder="First Name" value={form.name} onChange={handleChange} autoComplete="given-name" />
              <input name="lastName" className="input" placeholder="Last Name (optional)" onChange={() => {}} autoComplete="family-name" />
            </div>

            <input name="email" type="email" className="input" placeholder="Email Address"
              value={form.email} onChange={handleChange} autoComplete="email" />

            <input name="password" type="password" className="input" placeholder="Create Password (min. 6 chars)"
              value={form.password} onChange={handleChange} autoComplete="new-password" />

            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 rounded-input px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-1" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[rgba(29,28,31,0.08)]" />
            <span className="text-xs text-secondary uppercase tracking-wider">or sign up with</span>
            <div className="flex-1 h-px bg-[rgba(29,28,31,0.08)]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 bg-primary text-white rounded-pill py-2.5 text-sm font-medium hover:bg-[#333] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
            <button className="flex items-center justify-center gap-2 bg-white border border-[rgba(29,28,31,0.12)] rounded-pill py-2.5 text-sm font-medium text-primary hover:bg-surface transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          <p className="text-center text-[13px] text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:text-accent-dark">
              Sign in →
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-secondary mt-5 opacity-60">
          Privacy Policy · Terms of Service · Help Center
        </p>
      </div>
    </div>
  );
}
