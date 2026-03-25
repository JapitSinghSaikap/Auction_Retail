import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';
import { GET_MY_ITEMS, GET_CATEGORIES } from '../graphql/queries';
import { CREATE_ITEM } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import Toast, { useToast } from '../components/Toast';
import { formatCurrency } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─────────────────────────────────────────────────────────────────────
   SIDEBAR NAV ITEM
───────────────────────────────────────────────────────────────────── */
function SideItem({ icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px]
        text-[13px] font-medium transition-all text-left group
        ${active
          ? 'bg-[rgba(0,113,227,0.08)] text-accent'
          : 'text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.04)]'
        }`}
    >
      <span className={`shrink-0 ${active ? 'text-accent' : 'text-tertiary group-hover:text-secondary'}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
          ${active ? 'bg-accent text-white' : 'bg-surface text-tertiary'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, delta, deltaPositive }) {
  return (
    <div className="bg-white rounded-[12px] border border-[rgba(26,24,37,0.08)]
                    shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-[8px] bg-[rgba(0,113,227,0.07)] flex items-center justify-center text-accent shrink-0">
          {icon}
        </div>
        {delta && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full
            ${deltaPositive
              ? 'bg-green-50 text-green-600 border border-green-100'
              : 'bg-[rgba(26,24,37,0.05)] text-tertiary border border-[rgba(26,24,37,0.08)]'
            }`}>
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-tertiary mb-1">{label}</p>
        <p className="text-[28px] font-bold text-primary tracking-[-0.025em] leading-none">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CREATE AUCTION FORM
───────────────────────────────────────────────────────────────────── */
function CreateForm({ categories, onSuccess }) {
  const { user, token } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', startingPrice: '', endTime: '', categoryId: '',
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState('');

  const [createItem, { loading: creating }] = useMutation(CREATE_ITEM);

  const change = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB.'); return; }
    setImageFile(f); setImagePreview(URL.createObjectURL(f)); setError('');
  };

  const uploadImg = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res  = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed.');
      return `${API_URL}${data.url}`;
    } catch (e) { setError(e.message); return null; }
    finally     { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startingPrice || !form.endTime || !form.categoryId) {
      setError('Please fill in all required fields.'); return;
    }
    const price = parseFloat(form.startingPrice);
    if (isNaN(price) || price <= 0) { setError('Starting price must be positive.'); return; }
    const end = new Date(form.endTime);
    if (end <= new Date()) { setError('End time must be in the future.'); return; }

    let img = null;
    if (imageFile) { img = await uploadImg(); if (!img) return; }

    try {
      await createItem({
        variables: {
          title: form.title.trim(), description: form.description.trim() || null,
          image: img, startingPrice: price, endTime: end.toISOString(),
          categoryId: form.categoryId, sellerId: user.id,
        },
      });
      setForm({ title: '', description: '', startingPrice: '', endTime: '', categoryId: '' });
      setImageFile(null); setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
      if (onSuccess) onSuccess();
    } catch (e) { setError(e.message || 'Failed to create item.'); }
  };

  const minDT = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const busy  = uploading || creating;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="field-label">Item Title <span className="text-live-red">*</span></label>
        <input name="title" className="field-input" value={form.title} onChange={change}
          placeholder="e.g. 1964 Vintage Chronograph" maxLength={120} />
      </div>
      <div>
        <label className="field-label">Photo Gallery</label>
        {imagePreview ? (
          <div className="relative h-36 rounded-[10px] overflow-hidden bg-[#111] group">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                            flex items-center justify-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-white text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-[6px] hover:bg-white/30">
                Change
              </button>
              <button type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); if (fileRef.current) fileRef.current.value = ''; }}
                className="text-white text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-[6px] hover:bg-white/30">
                Remove
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-[10px] border-[1.5px] border-dashed border-[rgba(26,24,37,0.18)]
                       hover:border-accent hover:bg-[rgba(0,113,227,0.03)] transition-all
                       flex flex-col items-center justify-center gap-1.5 text-tertiary hover:text-accent">
            <svg className="w-7 h-7 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
            <span className="text-[12px] font-semibold">Click to upload photo</span>
            <span className="text-[10px] opacity-60">High-resolution JPG or PNG up to 10MB</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Starting Bid <span className="text-live-red">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary text-sm font-medium">₹</span>
            <input name="startingPrice" type="number" className="field-input pl-6"
              value={form.startingPrice} onChange={change} placeholder="0.00" min="0.01" step="0.01" />
          </div>
        </div>
        <div>
          <label className="field-label">Category <span className="text-live-red">*</span></label>
          <select name="categoryId" className="field-input" value={form.categoryId} onChange={change}>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="field-label">Description</label>
        <textarea name="description" className="field-input resize-none" rows={2}
          value={form.description} onChange={change}
          placeholder="Condition, provenance, key features…" />
      </div>
      <div>
        <label className="field-label">Auction End Time <span className="text-live-red">*</span></label>
        <input name="endTime" type="datetime-local" className="field-input"
          min={minDT} value={form.endTime} onChange={change} />
      </div>
      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-[7px] px-3 py-2">{error}</p>
      )}
      <button type="submit" disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px]
                   bg-accent hover:bg-accent-dark active:scale-[0.97] text-white text-[13.5px] font-semibold
                   shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {busy
          ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>{uploading ? 'Uploading…' : 'Creating…'}</>
          : 'Create Auction'
        }
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PROFILE DROPDOWN
───────────────────────────────────────────────────────────────────── */
function ProfileDropdown({ user, onLogout, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref}
      className="absolute top-[calc(100%+8px)] right-0 w-[220px] bg-white rounded-[12px]
                 border border-[rgba(26,24,37,0.09)] shadow-[0_8px_32px_rgba(26,24,37,0.14)]
                 z-50 overflow-hidden animate-slideUp">
      {/* User info */}
      <div className="px-4 py-3.5 border-b border-[rgba(26,24,37,0.07)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-accent to-accent-dark
                          flex items-center justify-center text-white text-[15px] font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-primary truncate">{user?.name}</p>
            <p className="text-[11px] text-secondary truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent
                             bg-[rgba(0,113,227,0.08)] px-1.5 py-0.5 rounded-full mt-0.5">
              ✦ Seller · Premium
            </span>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        {[
          { icon: '🏠', label: 'Back to Home',    action: () => { onClose(); window.location.href = '/'; } },
          { icon: '⚙️', label: 'Account Settings', action: onClose },
          { icon: '🔔', label: 'Notifications',    action: onClose },
          { icon: '📊', label: 'Analytics',        action: onClose },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={action}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium
                       text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.03)] transition-colors text-left">
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Divider + Sign out */}
      <div className="border-t border-[rgba(26,24,37,0.07)] py-1.5">
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium
                     text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors text-left">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ANALYTICS VIEW — CSS bar charts, no library needed
───────────────────────────────────────────────────────────────────── */
function AnalyticsView({ items }) {
  const active = items.filter((i) => i.status === 'active');
  const closed = items.filter((i) => i.status === 'closed');
  const totalBids = items.reduce((s, i) => s + (i.bidCount || 0), 0);
  const totalRevenue = closed.reduce((s, i) => s + i.currentPrice, 0);
  const avgBidsPerItem = items.length ? (totalBids / items.length).toFixed(1) : 0;
  const winRate = items.length ? Math.round((closed.length / items.length) * 100) : 0;

  // Category breakdown
  const catMap = {};
  items.forEach((i) => {
    const cat = i.category?.name || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = cats[0]?.[1] || 1;

  // Bid activity per item (top 6)
  const topByBids = [...items].sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0)).slice(0, 6);
  const maxBids = topByBids[0]?.bidCount || 1;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',     value: formatCurrency(totalRevenue), icon: '₹',  color: 'text-green-600' },
          { label: 'Total Bids',        value: totalBids,                    icon: '⚡', color: 'text-accent' },
          { label: 'Avg Bids / Item',   value: avgBidsPerItem,               icon: '📊', color: 'text-primary' },
          { label: 'Sell-Through Rate', value: `${winRate}%`,                icon: '🏆', color: 'text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-[12px] border border-[rgba(26,24,37,0.08)]
                                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-tertiary mb-2">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-[26px] font-bold leading-none ${color}`}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bid Activity Chart */}
        <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                        shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-6">
          <h3 className="text-[14px] font-bold text-primary mb-1">Bid Activity by Item</h3>
          <p className="text-[12px] text-secondary mb-5">Top items ranked by total bids received</p>
          {topByBids.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-tertiary text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {topByBids.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <p className="text-[12px] font-medium text-secondary truncate w-[120px] shrink-0">
                    {item.title}
                  </p>
                  <div className="flex-1 h-2 bg-[rgba(26,24,37,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${((item.bidCount || 0) / maxBids) * 100}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-bold text-primary w-6 text-right shrink-0">
                    {item.bidCount || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                        shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-6">
          <h3 className="text-[14px] font-bold text-primary mb-1">Category Breakdown</h3>
          <p className="text-[12px] text-secondary mb-5">Listings distributed across categories</p>
          {cats.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-tertiary text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {cats.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <p className="text-[12px] font-medium text-secondary truncate w-[120px] shrink-0">{cat}</p>
                  <div className="flex-1 h-2 bg-[rgba(26,24,37,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7c3aed] to-accent rounded-full"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-bold text-primary w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-6">
        <h3 className="text-[14px] font-bold text-primary mb-4">Auction Status Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active',  count: active.length,  color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Closed',  count: closed.length,  color: 'bg-[#1a1825]', text: 'text-primary',   bg: 'bg-[rgba(26,24,37,0.05)]' },
            { label: 'Total',   count: items.length,   color: 'bg-accent',    text: 'text-accent',    bg: 'bg-[rgba(0,113,227,0.06)]' },
          ].map(({ label, count, color, text, bg }) => (
            <div key={label} className={`${bg} rounded-[10px] p-4 text-center`}>
              <p className={`text-[28px] font-bold ${text}`}>{count}</p>
              <p className="text-[11px] font-semibold text-secondary uppercase tracking-wide mt-1">{label}</p>
              <div className={`w-8 h-1 ${color} rounded-full mx-auto mt-2`} />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue per item */}
      {closed.length > 0 && (
        <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                        shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(26,24,37,0.06)]">
            <h3 className="text-[14px] font-bold text-primary">Completed Auctions Revenue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(26,24,37,0.025)]">
                  {['Item', 'Category', 'Starting Price', 'Final Price', 'Bids', 'Gain'].map((h) => (
                    <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em]
                                           text-tertiary px-5 py-3 border-b border-[rgba(26,24,37,0.05)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closed.map((item) => {
                  const gain = item.currentPrice - item.startingPrice;
                  const gainPct = item.startingPrice ? Math.round((gain / item.startingPrice) * 100) : 0;
                  return (
                    <tr key={item.id} className="border-b border-[rgba(26,24,37,0.04)] last:border-0
                                                 hover:bg-[rgba(26,24,37,0.02)] cursor-pointer">
                      <td className="px-5 py-3 text-[13px] font-semibold text-primary truncate max-w-[180px]">{item.title}</td>
                      <td className="px-5 py-3 text-[12px] text-secondary">{item.category?.name || '—'}</td>
                      <td className="px-5 py-3 text-[12px] text-secondary">{formatCurrency(item.startingPrice)}</td>
                      <td className="px-5 py-3 text-[13px] font-bold text-green-600">{formatCurrency(item.currentPrice)}</td>
                      <td className="px-5 py-3 text-[12px] text-secondary">{item.bidCount || 0}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full
                          ${gainPct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {gainPct >= 0 ? '+' : ''}{gainPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SETTINGS VIEW
───────────────────────────────────────────────────────────────────── */
function SettingsView({ user, onLogout }) {
  const [notifs, setNotifs] = useState({ newBid: true, auction_end: true, outbid: false, weekly: true });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setNotifs((p) => ({ ...p, [key]: !p[key] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Toggle = ({ on, onToggle }) => (
    <button onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-[rgba(26,24,37,0.15)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                        ${on ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-[700px]">
      {/* Account Info */}
      <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(26,24,37,0.06)]">
          <h3 className="text-[14px] font-bold text-primary">Account Information</h3>
          <p className="text-[12px] text-secondary mt-0.5">Your seller profile details</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[14px] bg-gradient-to-br from-accent to-accent-dark
                            flex items-center justify-center text-white text-[22px] font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[16px] font-bold text-primary">{user?.name}</p>
              <p className="text-[13px] text-secondary">{user?.email}</p>
              <span className="inline-flex items-center text-[10.5px] font-semibold text-accent
                               bg-[rgba(0,113,227,0.08)] px-2 py-0.5 rounded-full mt-1">
                ✦ Seller · Premium Tier
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: 'Full Name',  value: user?.name  || '—' },
              { label: 'Email',      value: user?.email || '—' },
              { label: 'Role',       value: 'Seller (Premium)' },
              { label: 'Member Since', value: 'Jan 2025' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-tertiary mb-1">{label}</p>
                <p className="text-[13.5px] font-medium text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(26,24,37,0.06)]">
          <h3 className="text-[14px] font-bold text-primary">Notification Preferences</h3>
          <p className="text-[12px] text-secondary mt-0.5">Control what alerts you receive</p>
        </div>
        <div className="px-6 py-2">
          {[
            { key: 'newBid',      label: 'New bid on my listing', desc: 'Get notified every time a buyer places a bid' },
            { key: 'auction_end', label: 'Auction ending soon',   desc: 'Alert 1 hour before your auction closes' },
            { key: 'outbid',      label: 'Outbid alerts',         desc: 'Notify when another seller beats a price' },
            { key: 'weekly',      label: 'Weekly digest',         desc: 'Weekly summary of your auction performance' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4
                                      border-b border-[rgba(26,24,37,0.05)] last:border-0">
              <div>
                <p className="text-[13.5px] font-medium text-primary">{label}</p>
                <p className="text-[12px] text-secondary mt-0.5">{desc}</p>
              </div>
              <Toggle on={notifs[key]} onToggle={() => toggle(key)} />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-[rgba(26,24,37,0.06)] flex items-center gap-3">
          <button onClick={save}
            className="px-5 py-2 rounded-[8px] bg-accent text-white text-[13px] font-semibold
                       hover:bg-accent-dark transition-all active:scale-[0.97]">
            {saved ? '✓ Saved' : 'Save Preferences'}
          </button>
          <p className="text-[12px] text-secondary">Changes apply immediately</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-[14px] border border-red-100
                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-red-50">
          <h3 className="text-[14px] font-bold text-red-600">Danger Zone</h3>
          <p className="text-[12px] text-secondary mt-0.5">Irreversible account actions</p>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[13.5px] font-medium text-primary">Sign out of all devices</p>
            <p className="text-[12px] text-secondary mt-0.5">Immediately end your current session</p>
          </div>
          <button onClick={onLogout}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-red-500
                       border border-red-200 hover:bg-red-50 transition-all active:scale-[0.97]">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FINANCIALS VIEW
───────────────────────────────────────────────────────────────────── */
function FinancialsView({ items }) {
  const closed = items.filter((i) => i.status === 'closed');
  const active = items.filter((i) => i.status === 'active');
  const totalRevenue   = closed.reduce((s, i) => s + i.currentPrice, 0);
  const pendingRevenue = active.reduce((s, i) => s + i.currentPrice, 0);
  const platformFee    = totalRevenue * 0.05;
  const netEarnings    = totalRevenue - platformFee;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue',    value: formatCurrency(totalRevenue),   color: 'text-green-600',   icon: '💰' },
          { label: 'Platform Fee (5%)',value: formatCurrency(platformFee),    color: 'text-red-500',     icon: '📋' },
          { label: 'Net Earnings',     value: formatCurrency(netEarnings),    color: 'text-primary',     icon: '✅' },
          { label: 'Pending (Active)', value: formatCurrency(pendingRevenue), color: 'text-accent',      icon: '⏳' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-[12px] border border-[rgba(26,24,37,0.08)]
                                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-tertiary">{label}</p>
              <span className="text-xl">{icon}</span>
            </div>
            <p className={`text-[22px] font-bold leading-none ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(26,24,37,0.06)]">
          <h3 className="text-[14px] font-bold text-primary">Transaction History</h3>
          <p className="text-[12px] text-secondary mt-0.5">All completed auction sales</p>
        </div>
        {closed.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💸</div>
            <p className="font-semibold text-primary mb-1">No completed sales yet</p>
            <p className="text-[13px] text-secondary">Revenue from closed auctions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(26,24,37,0.02)]">
                  {['Item', 'Category', 'Sale Price', 'Fee (5%)', 'Net', 'Status'].map((h) => (
                    <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em]
                                           text-tertiary px-5 py-3 border-b border-[rgba(26,24,37,0.05)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closed.map((item) => {
                  const fee = item.currentPrice * 0.05;
                  const net = item.currentPrice - fee;
                  return (
                    <tr key={item.id} className="border-b border-[rgba(26,24,37,0.04)] last:border-0
                                                 hover:bg-[rgba(26,24,37,0.02)]">
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-primary truncate max-w-[180px]">{item.title}</td>
                      <td className="px-5 py-3.5 text-[12px] text-secondary">{item.category?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-[13px] font-bold text-green-600">{formatCurrency(item.currentPrice)}</td>
                      <td className="px-5 py-3.5 text-[12px] text-red-400">-{formatCurrency(fee)}</td>
                      <td className="px-5 py-3.5 text-[13px] font-bold text-primary">{formatCurrency(net)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold bg-green-50 text-green-700
                                         border border-green-200 px-2 py-0.5 rounded-full">
                          Settled
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout info */}
      <div className="bg-[#1a1825] rounded-[14px] p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center text-xl shrink-0">💳</div>
        <div>
          <p className="text-[13px] font-bold text-white mb-1">Automatic Payouts</p>
          <p className="text-[12.5px] text-white/60 leading-relaxed max-w-lg">
            Earnings are automatically transferred to your registered bank account within 3-5 business days
            after an auction closes. Platform fee of 5% is deducted before transfer.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   INVENTORY / LIVE AUCTIONS TABLE
───────────────────────────────────────────────────────────────────── */
function ItemsTable({ items, filter, navigate, loading, error }) {
  const [search, setSearch] = useState('');

  const filtered = items
    .filter((i) => filter === 'all' || i.status === filter)
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-[rgba(26,24,37,0.1)] rounded-[8px]
                       text-[13px] font-medium text-primary placeholder-tertiary
                       focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10" />
        </div>
        <span className="text-[12px] text-secondary">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                      shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
        {loading && (
          <div className="flex justify-center py-14">
            <div className="w-7 h-7 border-[3px] border-accent border-t-transparent rounded-full animate-spin"/>
          </div>
        )}
        {error && <p className="text-red-500 text-sm text-center py-10 px-6">{error.message}</p>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-semibold text-primary mb-1">
              {items.length === 0 ? 'No listings yet' : 'No results found'}
            </p>
            <p className="text-[13px] text-secondary">
              {items.length === 0 ? 'Create your first auction to see it here.' : 'Try a different search term.'}
            </p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(26,24,37,0.02)]">
                  {['Item', 'Category', 'Starting', 'Current Bid', 'Bids', 'Status', 'Time Left'].map((h) => (
                    <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em]
                                           text-tertiary px-5 py-3 border-b border-[rgba(26,24,37,0.05)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}
                    onClick={() => navigate(`/auction/${item.id}`)}
                    className="border-b border-[rgba(26,24,37,0.04)] last:border-0 hover:bg-[rgba(26,24,37,0.02)]
                               cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[7px] bg-[#1a1825] shrink-0 overflow-hidden">
                          {item.image
                            ? <img src={item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                                   alt="" className="w-full h-full object-cover"
                                   onError={(e) => { e.target.style.display='none'; }} />
                            : <div className="w-full h-full flex items-center justify-center text-sm">🖼</div>}
                        </div>
                        <p className="text-[13px] font-semibold text-primary truncate max-w-[150px]">{item.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-secondary">{item.category?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-[12px] text-secondary">{formatCurrency(item.startingPrice)}</td>
                    <td className="px-5 py-3.5 text-[13px] font-bold text-primary">{formatCurrency(item.currentPrice)}</td>
                    <td className="px-5 py-3.5 text-[12px] text-secondary">{item.bidCount || 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border
                        ${item.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-[rgba(26,24,37,0.04)] text-tertiary border-[rgba(26,24,37,0.1)]'}`}>
                        {item.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>}
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.status === 'closed'
                        ? <span className="text-[11px] text-tertiary">Ended</span>
                        : <CountdownTimer endTime={item.endTime} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // single view state drives everything
  const [view, setView] = useState('dashboard'); // dashboard | live | inventory | financials | analytics | settings
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: catData } = useQuery(GET_CATEGORIES);
  const { data, loading, error, refetch } = useQuery(GET_MY_ITEMS, {
    variables: { sellerId: user?.id },
    skip: !user?.id,
    pollInterval: 30000,
  });

  const categories = catData?.getCategories || [];
  const items      = data?.getMyItems       || [];
  const active     = items.filter((i) => i.status === 'active');
  const closed     = items.filter((i) => i.status === 'closed');
  const totalBids    = items.reduce((s, i) => s + (i.bidCount || 0), 0);
  const totalRevenue = closed.reduce((s, i) => s + i.currentPrice, 0);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleLogout = () => { logout(); navigate('/'); };

  /* ── Derive active tab & nav from view ──────────────────────────── */
  const tabFromView   = { dashboard: 'dashboard', live: 'auctions', inventory: 'auctions', financials: 'financials', analytics: 'analytics', settings: 'settings' };
  const navFromView   = { dashboard: 'overview', live: 'live', inventory: 'inventory', financials: 'financials', analytics: 'overview', settings: 'overview' };
  const activeTab = tabFromView[view]  || 'dashboard';
  const activeNav = navFromView[view]  || 'overview';

  /* Clicking top tab → set a default view */
  const onTabClick = (tab) => {
    const defaults = { dashboard: 'dashboard', auctions: 'inventory', analytics: 'analytics', settings: 'settings', financials: 'financials' };
    setView(defaults[tab] || tab);
  };

  const sideNav = [
    { key: 'overview',   label: 'Overview',      badge: undefined,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> },
    { key: 'live',       label: 'Live Auctions',  badge: active.length || undefined,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
    { key: 'inventory',  label: 'Inventory',      badge: items.length || undefined,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg> },
    { key: 'financials', label: 'Financials',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
  ];

  const tabs = ['Dashboard', 'Auctions', 'Analytics', 'Settings'];

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Toast />

      <style>{`
        .field-label {
          display: block; font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase; color: #9e9da5; margin-bottom: 6px;
        }
        .field-input {
          width: 100%; background: #eceae3; border-radius: 8px; padding: 8px 12px;
          font-size: 13px; font-weight: 500; color: #1a1825; transition: all 0.18s;
          border: 1.5px solid transparent; outline: none; font-family: inherit;
        }
        .field-input::placeholder { color: #9e9da5; }
        .field-input:focus { background: #fff; border-color: rgba(0,113,227,0.35); box-shadow: 0 0 0 3px rgba(0,113,227,0.08); }
        @keyframes slideUp { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.18s ease; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════════════════════ */}
      <aside className="w-[210px] shrink-0 flex flex-col bg-white
                        border-r border-[rgba(26,24,37,0.08)]
                        shadow-[1px_0_0_rgba(26,24,37,0.04)]">

        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-[rgba(26,24,37,0.07)]">
          <Link to="/" className="flex items-center gap-2.5 group mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-accent to-accent-dark
                            flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.28)]">
              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-[13.5px] font-extrabold tracking-[-0.03em] text-primary leading-none">Seller Studio</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent mt-[2px]">Premium Tier</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4 overflow-y-auto">
          {sideNav.map(({ key, label, icon, badge }) => (
            <SideItem key={key} icon={icon} label={label} badge={badge}
              active={activeNav === key}
              onClick={() => setView(key === 'overview' ? 'dashboard' : key)} />
          ))}
        </nav>

        {/* CTA */}
        <div className="px-3 pb-4">
          <button
            onClick={() => setView('dashboard')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5
                       bg-accent hover:bg-accent-dark text-white text-[12.5px] font-bold
                       rounded-[8px] transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] active:scale-[0.97]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            List New Item
          </button>
        </div>

        {/* Bottom links */}
        <div className="border-t border-[rgba(26,24,37,0.07)] px-3 py-3 flex flex-col gap-0.5">
          <button onClick={() => {}}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-[12px] font-medium
                       text-tertiary hover:text-primary hover:bg-[rgba(26,24,37,0.04)] transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Help Center
          </button>
          <button onClick={() => setView('settings')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-[12px] font-medium transition-all
              ${view === 'settings' ? 'text-accent bg-[rgba(0,113,227,0.06)]' : 'text-tertiary hover:text-primary hover:bg-[rgba(26,24,37,0.04)]'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Settings
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top header bar ──────────────────────────────────── */}
        <header className="h-[52px] shrink-0 bg-white border-b border-[rgba(26,24,37,0.08)]
                           flex items-center px-6 gap-6 shadow-[0_1px_0_rgba(26,24,37,0.05)]">
          <nav className="flex items-center gap-0.5 flex-1">
            <Link to="/"
              className="text-[13px] font-semibold text-primary hover:text-accent transition-colors mr-3">
              AuctionLive
            </Link>
            <div className="w-px h-4 bg-[rgba(26,24,37,0.12)] mr-3" />
            {tabs.map((t) => {
              const key = t.toLowerCase();
              const on  = activeTab === key;
              return (
                <button key={t} onClick={() => onTabClick(key)}
                  className={`px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-all relative
                    ${on ? 'text-primary' : 'text-tertiary hover:text-primary hover:bg-[rgba(26,24,37,0.04)]'}`}>
                  {t}
                  {on && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full" />}
                </button>
              );
            })}
          </nav>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="relative w-8 h-8 rounded-[7px] flex items-center justify-center
                               text-tertiary hover:text-primary hover:bg-surface transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {active.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-live-red" />
              )}
            </button>

            {/* ── Profile button (clickable, shows dropdown) ── */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-[rgba(26,24,37,0.10)]
                           rounded-[8px] pl-1.5 pr-2.5 py-1
                           hover:border-[rgba(26,24,37,0.2)] hover:shadow-[0_2px_8px_rgba(26,24,37,0.08)]
                           transition-all cursor-pointer">
                <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-accent to-accent-dark
                                flex items-center justify-center text-white text-[11px] font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="leading-none hidden sm:block">
                  <p className="text-[12px] font-semibold text-primary">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[9.5px] text-tertiary mt-[1px] capitalize">{user?.role}</p>
                </div>
                <svg className={`w-3 h-3 text-tertiary transition-transform ml-0.5 ${profileOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {profileOpen && (
                <ProfileDropdown user={user} onLogout={handleLogout} onClose={() => setProfileOpen(false)} />
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable content ────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-8 py-8">

            {/* ── DASHBOARD VIEW ─────────────────────────────── */}
            {view === 'dashboard' && (
              <>
                <div className="mb-7">
                  <h1 className="text-[32px] font-bold text-primary tracking-[-0.025em] leading-tight">
                    {greeting}, {user?.name?.split(' ')[0]}.
                  </h1>
                  <p className="text-[14px] text-secondary mt-1">
                    Manage your digital showroom and track your auction performance.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Active Listings" value={active.length} delta="+12%" deltaPositive
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>} />
                  <StatCard label="Total Bids" value={totalBids.toLocaleString()} delta="+8%" deltaPositive
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>} />
                  <StatCard label="Revenue" value={formatCurrency(totalRevenue)} delta="—" deltaPositive={false}
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
                  <StatCard label="Items Sold" value={closed.length} delta={`${closed.length}`} deltaPositive={false}
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>} />
                </div>

                {/* Two-column: Form + Table */}
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
                  <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                                  shadow-[0_1px_4px_rgba(26,24,37,0.06)] p-6">
                    <h2 className="text-[15px] font-bold text-primary mb-5">List New Item</h2>
                    <CreateForm categories={categories} onSuccess={() => { showToast('Auction created!', 'success'); refetch(); }} />
                  </div>

                  <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                                  shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4
                                    border-b border-[rgba(26,24,37,0.07)]">
                      <h2 className="text-[15px] font-bold text-primary">My Listings</h2>
                      <button onClick={() => setView('inventory')}
                        className="text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors">
                        View All
                      </button>
                    </div>
                    {loading && <div className="flex justify-center py-14"><div className="w-7 h-7 border-[3px] border-accent border-t-transparent rounded-full animate-spin"/></div>}
                    {error && <p className="text-red-500 text-sm text-center py-10 px-6">{error.message}</p>}
                    {!loading && !error && items.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-14 h-14 rounded-[14px] bg-surface flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                          </svg>
                        </div>
                        <p className="font-semibold text-primary mb-1">No listings yet</p>
                        <p className="text-[13px] text-secondary mb-4 max-w-[240px]">Your showroom is empty. Create your first auction.</p>
                      </div>
                    )}
                    {!loading && !error && items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[rgba(26,24,37,0.02)] border-b border-[rgba(26,24,37,0.06)]">
                              <th className="th px-5 py-3">Item Detail</th>
                              <th className="th px-4 py-3 text-right">Current Bid</th>
                              <th className="th px-4 py-3 text-center">Status</th>
                              <th className="th px-5 py-3 text-right">Time Left</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.slice(0, 8).map((item, idx) => (
                              <tr key={item.id}
                                className={`border-b border-[rgba(26,24,37,0.05)] hover:bg-[rgba(26,24,37,0.02)]
                                            cursor-pointer transition-colors ${idx === items.slice(0,8).length-1 ? 'border-b-0' : ''}`}
                                onClick={() => navigate(`/auction/${item.id}`)}>
                                <td className="td px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-[42px] h-[42px] rounded-[8px] overflow-hidden bg-[#1a1a1a] shrink-0 border border-[rgba(26,24,37,0.08)]">
                                      {item.image
                                        ? <img src={item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                                        : <div className="w-full h-full flex items-center justify-center text-base">🖼</div>}
                                    </div>
                                    <div>
                                      <p className="text-[13.5px] font-semibold text-primary truncate max-w-[180px]">{item.title}</p>
                                      <p className="text-[11px] text-tertiary mt-0.5">Lot #{item.id} · {item.category?.name || '—'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="td px-4 text-right">
                                  <span className="text-[13.5px] font-bold text-primary">{formatCurrency(item.currentPrice)}</span>
                                  <p className="text-[10.5px] text-tertiary mt-0.5">{item.bidCount || 0} bid{item.bidCount !== 1 ? 's' : ''}</p>
                                </td>
                                <td className="td px-4 text-center">
                                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border
                                    ${item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[rgba(26,24,37,0.04)] text-tertiary border-[rgba(26,24,37,0.1)]'}`}>
                                    {item.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>}
                                    {item.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="td px-5 text-right">
                                  {item.status === 'closed' ? <span className="text-[12px] text-tertiary">—</span> : <CountdownTimer endTime={item.endTime} />}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips banner */}
                <div className="mt-6 rounded-[14px] bg-[#1a1825] p-6 flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">Auction Tips</p>
                    <p className="text-[15px] font-semibold text-white leading-snug mb-1">Items with 5+ photos sell 40% faster.</p>
                    <p className="text-[13px] text-white/50 leading-relaxed max-w-md">
                      Consistent lighting and high-contrast backgrounds increase bid activity by up to 60%.
                    </p>
                  </div>
                  <button onClick={() => setView('analytics')}
                    className="shrink-0 px-4 py-2 rounded-[7px] text-[12.5px] font-semibold text-white
                               border border-white/20 hover:border-white/40 hover:bg-white/05 transition-all">
                    View Analytics →
                  </button>
                </div>
              </>
            )}

            {/* ── LIVE AUCTIONS VIEW ───────────────────────────── */}
            {view === 'live' && (
              <>
                <div className="mb-7 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-live-red animate-pulse"/>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-live-red">Live Now</p>
                    </div>
                    <h1 className="text-[28px] font-bold text-primary tracking-tight">Live Auctions</h1>
                    <p className="text-[13.5px] text-secondary mt-1">
                      {active.length} auction{active.length !== 1 ? 's' : ''} currently running
                    </p>
                  </div>
                  <button onClick={() => setView('dashboard')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent text-white
                               text-[12.5px] font-semibold hover:bg-accent-dark transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                    </svg>
                    New Listing
                  </button>
                </div>
                <ItemsTable items={items} filter="active" navigate={navigate} loading={loading} error={error} />
              </>
            )}

            {/* ── INVENTORY VIEW ───────────────────────────────── */}
            {view === 'inventory' && (
              <>
                <div className="mb-7 flex items-start justify-between">
                  <div>
                    <h1 className="text-[28px] font-bold text-primary tracking-tight">Inventory</h1>
                    <p className="text-[13.5px] text-secondary mt-1">
                      All {items.length} listing{items.length !== 1 ? 's' : ''} · {active.length} active · {closed.length} closed
                    </p>
                  </div>
                  <button onClick={() => setView('dashboard')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent text-white
                               text-[12.5px] font-semibold hover:bg-accent-dark transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                    </svg>
                    New Listing
                  </button>
                </div>
                <ItemsTable items={items} filter="all" navigate={navigate} loading={loading} error={error} />
              </>
            )}

            {/* ── FINANCIALS VIEW ──────────────────────────────── */}
            {view === 'financials' && (
              <>
                <div className="mb-7">
                  <h1 className="text-[28px] font-bold text-primary tracking-tight">Financials</h1>
                  <p className="text-[13.5px] text-secondary mt-1">Revenue breakdown and transaction history</p>
                </div>
                <FinancialsView items={items} />
              </>
            )}

            {/* ── ANALYTICS VIEW ───────────────────────────────── */}
            {view === 'analytics' && (
              <>
                <div className="mb-7">
                  <h1 className="text-[28px] font-bold text-primary tracking-tight">Analytics</h1>
                  <p className="text-[13.5px] text-secondary mt-1">Performance insights for your auctions</p>
                </div>
                <AnalyticsView items={items} />
              </>
            )}

            {/* ── SETTINGS VIEW ────────────────────────────────── */}
            {view === 'settings' && (
              <>
                <div className="mb-7">
                  <h1 className="text-[28px] font-bold text-primary tracking-tight">Settings</h1>
                  <p className="text-[13.5px] text-secondary mt-1">Manage your account and preferences</p>
                </div>
                <SettingsView user={user} onLogout={handleLogout} />
              </>
            )}

            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  );
}
