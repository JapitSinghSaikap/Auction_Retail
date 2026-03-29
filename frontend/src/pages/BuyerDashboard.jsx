import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GET_MY_BIDS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Toast from '../components/Toast';
import CountdownTimer from '../components/CountdownTimer';
import { formatCurrency } from '../utils/formatters';
import { resolveImageUrl } from '../utils/imageUrl';

/* ── Sidebar nav item ──────────────────────────────────────────────── */
function SideItem({ icon, label, badge, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[8px]
        text-[13px] font-medium transition-all text-left
        ${active
          ? 'bg-[rgba(26,24,37,0.07)] text-primary font-semibold'
          : 'text-secondary hover:bg-[rgba(26,24,37,0.04)] hover:text-primary'}`}
    >
      <span className={`shrink-0 ${active ? 'text-primary' : 'text-tertiary'}`}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
          ${active ? 'bg-primary text-white' : 'bg-[rgba(26,24,37,0.08)] text-secondary'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent = false, suffix }) {
  return (
    <div className={`bg-white rounded-[12px] p-5 shadow-[0_1px_6px_rgba(26,24,37,0.07)]
      border border-[rgba(26,24,37,0.06)] relative overflow-hidden
      ${accent ? 'border-l-[3px] border-l-accent' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-tertiary">{label}</span>
        <span className={`p-1.5 rounded-[8px] ${accent ? 'bg-[rgba(0,113,227,0.08)]' : 'bg-[rgba(26,24,37,0.04)]'}`}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-[28px] font-bold leading-none ${accent ? 'text-accent' : 'text-primary'}`}>
          {value}
        </span>
        {suffix && <span className="text-[11px] font-semibold text-accent/70">{suffix}</span>}
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────── */
const Ic = {
  bids:    <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  watch:   <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
  won:     <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
  spend:   <span className="text-[13px] font-bold leading-none">₹</span>,
  home:    <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  trend:   <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  trophy:  <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  settings:<svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  help:    <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  bell:    <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  browse:  <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════════ */
export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { onBidUpdated } = useSocket();

  const [activeTab,  setActiveTab]  = useState('overview');
  const [sideActive, setSideActive] = useState('overview');
  const [liveAlert,  setLiveAlert]  = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const goToTab = (tab, side) => { setActiveTab(tab); setSideActive(side); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data, loading, error, refetch } = useQuery(GET_MY_BIDS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const bids = data?.getMyBids || [];

  /* Deduplicate — keep highest bid per item */
  const bidsByItem = {};
  bids.forEach((bid) => {
    const itemId = bid.item?.id;
    if (!itemId) return;
    if (!bidsByItem[itemId] || bid.amount > bidsByItem[itemId].myBestBid) {
      bidsByItem[itemId] = { ...bid, myBestBid: bid.amount };
    }
  });
  const uniqueBids   = Object.values(bidsByItem);
  const activeBids   = uniqueBids.filter((b) => b.item?.status !== 'closed');
  const winningBids  = activeBids.filter((b) => b.myBestBid >= (b.item?.currentPrice || 0));
  const wonBids      = uniqueBids.filter((b) => b.item?.status === 'closed' && b.myBestBid >= (b.item?.currentPrice || 0));
  const totalSpent   = wonBids.reduce((s, b) => s + b.myBestBid, 0);

  /* Live socket subscription */
  useEffect(() => {
    const cleanup = onBidUpdated((data) => {
      const match = uniqueBids.find((b) => String(b.item?.id) === String(data.itemId));
      if (!match) return;
      setLiveAlert({
        itemId: data.itemId,
        itemTitle: match.item?.title || `Lot #${data.itemId}`,
        newAmount: data.newPrice,
      });
      setTimeout(() => setLiveAlert(null), 8000);
    });
    return cleanup;
  }, [onBidUpdated, uniqueBids]);

  const tabs = ['Overview', 'My Bids', 'Won Items', 'Watchlist'];

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-[#f5f4ef] overflow-hidden">
      <Toast />

      {/* ══════════════════════════════════════════════════════════════
          SIDEBAR  (210 px, fixed left)
      ══════════════════════════════════════════════════════════════ */}
      <aside className="w-[210px] shrink-0 flex flex-col border-r border-[rgba(26,24,37,0.08)]
                        bg-[#f5f4ef] py-5 px-3 gap-1">

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 mb-5">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-gradient-to-br from-accent to-[#005bb5]
                          flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.28)]">
            <svg className="w-[16px] h-[16px] text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-[14px] font-extrabold tracking-[-0.04em] text-primary">
              Auction<span className="text-accent">Live</span>
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-tertiary mt-[2px]">Buyer</p>
          </div>
        </div>

        {/* Section: Main */}
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-tertiary px-3 mb-1">Main</p>
        <SideItem icon={Ic.home}   label="Overview"  active={sideActive === 'overview'}  onClick={() => goToTab('overview',  'overview')} />
        <SideItem icon={Ic.bids}   label="My Bids"   badge={activeBids.length || undefined} active={sideActive === 'bids'} onClick={() => goToTab('my bids', 'bids')} />
        <SideItem icon={Ic.watch}  label="Watchlist"  active={sideActive === 'watchlist'} onClick={() => goToTab('watchlist', 'watchlist')} />
        <SideItem icon={Ic.trophy} label="Won Items"  badge={wonBids.length || undefined}  active={sideActive === 'won'}  onClick={() => goToTab('won items', 'won')} />

        {/* Section: Explore */}
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-tertiary px-3 mt-4 mb-1">Explore</p>
        <SideItem icon={Ic.browse} label="Browse Auctions" active={false} onClick={() => navigate('/')} />
        <SideItem icon={Ic.trend}  label="Insights"        active={sideActive === 'insights'} onClick={() => setSideActive('insights')} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom links */}
        <div className="border-t border-[rgba(26,24,37,0.07)] pt-3 flex flex-col gap-0.5">
          <SideItem icon={Ic.help}     label="Help"     active={sideActive === 'help'} onClick={() => goToTab('help', 'help')} />
          <SideItem icon={Ic.settings} label="Settings" active={sideActive === 'settings'} onClick={() => goToTab('settings', 'settings')} />
          <Link to="/"
            className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[8px]
                       text-[13px] font-medium text-secondary hover:bg-[rgba(26,24,37,0.04)]
                       hover:text-primary transition-all mt-1">
            <span className="text-tertiary shrink-0">
              <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              </svg>
            </span>
            Back to site
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top header bar ──────────────────────────────────────── */}
        <header className="h-[52px] shrink-0 flex items-center justify-between gap-4
                           bg-[#f5f4ef] border-b border-[rgba(26,24,37,0.08)] px-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] font-medium text-secondary">
            <Link to="/" className="text-tertiary font-normal hover:text-primary transition-colors">AuctionLive</Link>
            <span className="text-tertiary">/</span>
            <span className="text-primary font-semibold">Buyer Dashboard</span>
          </div>

          {/* Tab nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { label: 'Overview',  tab: 'overview',   side: 'overview'  },
              { label: 'My Bids',   tab: 'my bids',    side: 'bids'      },
              { label: 'Won Items', tab: 'won items',   side: 'won'       },
              { label: 'Watchlist', tab: 'watchlist',   side: 'watchlist' },
            ].map(({ label, tab, side }) => (
              <button
                key={tab}
                onClick={() => goToTab(tab, side)}
                className={`px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium transition-all
                  ${activeTab === tab
                    ? 'bg-[rgba(26,24,37,0.07)] text-primary font-semibold'
                    : 'text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.04)]'}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2.5">
            {/* Live alert indicator */}
            {liveAlert && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-live-red uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-live-red animate-pulse" />
                Live
              </span>
            )}

            {/* Bell */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-[7px]
                               text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.05)] transition-colors">
              {Ic.bell}
              {activeBids.length > 0 && (
                <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-live-red" />
              )}
            </button>

            {/* Avatar + name */}
            <div className="flex items-center gap-2 bg-white border border-[rgba(26,24,37,0.09)]
                            rounded-[8px] pl-2 pr-2.5 py-[5px]
                            shadow-[0_1px_3px_rgba(26,24,37,0.06)]">
              <div className="w-[24px] h-[24px] rounded-[6px] bg-gradient-to-br from-[#7c3aed] to-[#4f46e5]
                              flex items-center justify-center text-white text-[10px] font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="leading-none hidden sm:block">
                <p className="text-[12px] font-semibold text-primary">{user?.name?.split(' ')[0]}</p>
                <p className="text-[9.5px] text-tertiary mt-[1px]">Buyer</p>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-[11.5px] font-medium text-secondary hover:text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Scrollable main content ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-7 py-7">

          {/* Greeting — Overview only */}
          {activeTab === 'overview' && (
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary mb-1">
              {greeting}
            </p>
            <h1 className="text-[30px] font-bold text-primary tracking-tight leading-tight">
              Your Bids, <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>{user?.name?.split(' ')[0]}.</span>
            </h1>
            <p className="text-[13.5px] text-secondary mt-1">
              Track your active pursuits and curated collection in real time.
            </p>
          </div>
          )}

          {/* ── Stats row — Overview only ───────────────────────────── */}
          {activeTab === 'overview' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Active Bids"
              value={activeBids.length}
              icon={<svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
            />
            <StatCard
              label="Winning"
              value={winningBids.length}
              suffix="Live"
              accent
              icon={<svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
            />
            <StatCard
              label="Won"
              value={wonBids.length}
              icon={<svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Total Spent"
              value={totalSpent >= 1000
                ? `₹${(totalSpent / 1000).toFixed(1)}k`
                : formatCurrency(totalSpent)}
              icon={<span className="w-4 h-4 flex items-center justify-center text-[13px] font-bold text-secondary">₹</span>}
            />
          </div>}

          {/* ── Bids Table — shared between Overview and My Bids tabs ── */}
          {(activeTab === 'overview' || activeTab === 'my bids') && (
          <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                          shadow-[0_1px_8px_rgba(26,24,37,0.06)] overflow-hidden mb-6">

            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-[rgba(26,24,37,0.06)]">
              <div>
                <h2 className="text-[14px] font-bold text-primary">
                  {activeTab === 'my bids' ? 'My Bids' : 'Active Bids'}
                </h2>
                <p className="text-[11.5px] text-secondary mt-0.5">
                  {activeTab === 'my bids'
                    ? `${uniqueBids.length} total bid${uniqueBids.length !== 1 ? 's' : ''}`
                    : `${activeBids.length} auction${activeBids.length !== 1 ? 's' : ''} in progress`}
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-[12px] font-semibold text-accent hover:text-[#005bb5] transition-colors
                           flex items-center gap-1"
              >
                Browse more
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-14">
                <div className="w-7 h-7 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm text-center py-10 px-6">{error.message}</p>
            )}

            {/* Empty */}
            {!loading && !error && uniqueBids.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 rounded-[14px] bg-[rgba(26,24,37,0.04)] flex items-center
                                justify-center text-3xl mx-auto mb-4">🔍</div>
                <p className="font-semibold text-primary mb-1.5">No bids placed yet</p>
                <p className="text-secondary text-[13px] mb-6 max-w-[280px] mx-auto">
                  Start bidding on live auctions to track them here in real time.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px]
                             bg-primary text-white text-[13px] font-semibold
                             hover:bg-[#2c2a38] active:scale-[0.97] transition-all
                             shadow-[0_2px_8px_rgba(26,24,37,0.22)]"
                >
                  Browse Auctions
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && uniqueBids.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[rgba(26,24,37,0.025)]">
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary
                                     px-6 py-3 border-b border-[rgba(26,24,37,0.05)]">Item</th>
                      <th className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary
                                     px-4 py-3 border-b border-[rgba(26,24,37,0.05)]">Status</th>
                      <th className="text-right text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary
                                     px-4 py-3 border-b border-[rgba(26,24,37,0.05)]">Current Bid</th>
                      <th className="text-right text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary
                                     px-4 py-3 border-b border-[rgba(26,24,37,0.05)]">Your Max</th>
                      <th className="text-right text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary
                                     px-6 py-3 border-b border-[rgba(26,24,37,0.05)]">Time Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'my bids' ? uniqueBids : activeBids).map((bid) => {
                      const item      = bid.item;
                      const isClosed  = item?.status === 'closed';
                      const isWinning = !isClosed && bid.myBestBid >= (item?.currentPrice || 0);
                      const isWon     = isClosed  && bid.myBestBid >= (item?.currentPrice || 0);

                      let statusEl;
                      if (isWon) {
                        statusEl = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold
                                           bg-green-50 text-green-700 border border-green-200
                                           px-2.5 py-0.5 rounded-full">
                            Won 🏆
                          </span>
                        );
                      } else if (isClosed) {
                        statusEl = (
                          <span className="inline-flex items-center text-[11px] font-medium
                                           bg-[rgba(26,24,37,0.05)] text-secondary
                                           px-2.5 py-0.5 rounded-full">
                            Ended
                          </span>
                        );
                      } else if (isWinning) {
                        statusEl = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold
                                           bg-green-50 text-green-700 border border-green-200
                                           px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Winning
                          </span>
                        );
                      } else {
                        statusEl = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold
                                           bg-red-50 text-red-500 border border-red-200
                                           px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Outbid
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={bid.id}
                          onClick={() => item && navigate(`/auction/${item.id}`)}
                          className="border-t border-[rgba(26,24,37,0.045)] hover:bg-[rgba(26,24,37,0.02)]
                                     cursor-pointer transition-colors group"
                        >
                          {/* Item */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[9px] bg-[#1a1825] shrink-0 overflow-hidden">
                                {item?.image ? (
                                  <img src={item.image} alt="" className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white
                                                  bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e] text-sm">
                                    🖼
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-accent group-hover:text-[#005bb5]
                                             truncate max-w-[180px] transition-colors">
                                  {item?.title || 'Unknown Item'}
                                </p>
                                <p className="text-[11px] text-secondary mt-0.5">
                                  Lot #{item?.id} · {item?.category?.name || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3.5">{statusEl}</td>
                          {/* Current bid */}
                          <td className="px-4 py-3.5 text-right text-[13px] font-semibold text-primary">
                            {formatCurrency(item?.currentPrice || 0)}
                          </td>
                          {/* Your max */}
                          <td className="px-4 py-3.5 text-right">
                            <span className={`text-[13px] font-semibold
                              ${isWinning ? 'text-green-600' : isClosed ? 'text-secondary' : 'text-red-500'}`}>
                              {formatCurrency(bid.myBestBid)}
                            </span>
                          </td>
                          {/* Time left */}
                          <td className="px-6 py-3.5 text-right">
                            {isClosed ? (
                              <span className="text-[11px] text-secondary">—</span>
                            ) : (
                              <CountdownTimer endTime={item?.endTime} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {/* Pro tip banner — Overview only */}
          {activeTab === 'overview' && (
          <div className="rounded-[12px] border border-[rgba(0,113,227,0.18)]
                          bg-gradient-to-r from-[rgba(0,113,227,0.05)] to-[rgba(0,113,227,0.02)]
                          px-5 py-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-[8px] bg-[rgba(0,113,227,0.1)] shrink-0
                            flex items-center justify-center text-base mt-0.5">
              💡
            </div>
            <div>
              <p className="text-[13px] font-semibold text-primary mb-0.5">Bid smarter</p>
              <p className="text-[12.5px] text-secondary leading-relaxed">
                Place your maximum bid once — our system automatically bids on your behalf up to that amount,
                keeping you in the lead without constant monitoring.
              </p>
            </div>
          </div>
          )}

          {/* ── Won Items ───────────────────────────────────────────── */}
          {activeTab === 'won items' && (
            <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                            shadow-[0_1px_8px_rgba(26,24,37,0.06)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(26,24,37,0.06)]">
                <div>
                  <h2 className="text-[14px] font-bold text-primary">Won Items</h2>
                  <p className="text-[11.5px] text-secondary mt-0.5">
                    {wonBids.length} auction{wonBids.length !== 1 ? 's' : ''} won
                  </p>
                </div>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-14">
                  <div className="w-7 h-7 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && wonBids.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="font-semibold text-primary mb-1.5">No wins yet</p>
                  <p className="text-secondary text-[13px] mb-5 max-w-[260px] mx-auto">
                    Keep bidding — your victories will appear here.
                  </p>
                  <button onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px]
                               bg-primary text-white text-[13px] font-semibold
                               hover:bg-[#2c2a38] active:scale-[0.97] transition-all
                               shadow-[0_2px_8px_rgba(26,24,37,0.22)]">
                    Browse Auctions
                  </button>
                </div>
              )}
              {!loading && wonBids.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[rgba(26,24,37,0.025)]">
                        <th className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary px-6 py-3 border-b border-[rgba(26,24,37,0.05)]">Item</th>
                        <th className="text-right text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary px-4 py-3 border-b border-[rgba(26,24,37,0.05)]">Winning Bid</th>
                        <th className="text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-tertiary px-4 py-3 border-b border-[rgba(26,24,37,0.05)]">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wonBids.map((bid) => (
                        <tr key={bid.id}
                          onClick={() => bid.item && navigate(`/auction/${bid.item.id}`)}
                          className="border-t border-[rgba(26,24,37,0.045)] hover:bg-[rgba(26,24,37,0.02)] cursor-pointer transition-colors group">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[9px] bg-[#1a1825] shrink-0 overflow-hidden">
                                {bid.item?.image ? (
                                  <img src={resolveImageUrl(bid.item.image)} alt="" className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e]">🏆</div>
                                )}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-accent group-hover:text-[#005bb5] truncate max-w-[200px] transition-colors">
                                  {bid.item?.title || 'Unknown'}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold
                                                 bg-green-50 text-green-700 border border-green-200
                                                 px-2 py-0.5 rounded-full mt-1">
                                  Won 🏆
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-[13px] font-bold text-green-600">
                            {formatCurrency(bid.myBestBid)}
                          </td>
                          <td className="px-4 py-3.5 text-[12px] text-secondary">
                            {bid.item?.category?.name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Watchlist ───────────────────────────────────────────── */}
          {activeTab === 'watchlist' && (
            <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                            shadow-[0_1px_8px_rgba(26,24,37,0.06)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(26,24,37,0.06)]">
                <h2 className="text-[14px] font-bold text-primary">Watchlist</h2>
                <p className="text-[11.5px] text-secondary mt-0.5">Items you're keeping an eye on</p>
              </div>
              <div className="text-center py-16 px-6">
                <div className="text-4xl mb-3">👀</div>
                <p className="font-semibold text-primary mb-1.5">Your watchlist is empty</p>
                <p className="text-secondary text-[13px] mb-5 max-w-[260px] mx-auto">
                  Save items from auctions to track them here.
                </p>
                <button onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px]
                             bg-primary text-white text-[13px] font-semibold
                             hover:bg-[#2c2a38] active:scale-[0.97] transition-all
                             shadow-[0_2px_8px_rgba(26,24,37,0.22)]">
                  Browse Auctions
                </button>
              </div>
            </div>
          )}

          {/* ── Settings ─────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-bold text-primary mb-1">Settings</h2>
                <p className="text-[13px] text-secondary">Manage your account preferences.</p>
              </div>

              {/* Profile */}
              <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                              shadow-[0_1px_8px_rgba(26,24,37,0.06)] p-6">
                <h3 className="text-[14px] font-bold text-primary mb-4">Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-tertiary mb-1.5">Name</label>
                    <input className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(26,24,37,0.12)]
                                      bg-[rgba(26,24,37,0.02)] text-[13px] text-primary outline-none
                                      focus:border-accent focus:ring-2 focus:ring-accent/10"
                      defaultValue={user?.name} readOnly />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-tertiary mb-1.5">Email</label>
                    <input className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(26,24,37,0.12)]
                                      bg-[rgba(26,24,37,0.02)] text-[13px] text-primary outline-none
                                      focus:border-accent focus:ring-2 focus:ring-accent/10"
                      defaultValue={user?.email} readOnly />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-tertiary mb-1.5">Role</label>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[12px] font-semibold capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Notifications prefs */}
              <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                              shadow-[0_1px_8px_rgba(26,24,37,0.06)] p-6">
                <h3 className="text-[14px] font-bold text-primary mb-4">Notification Preferences</h3>
                {['Outbid alerts', 'Auction ending soon', 'Won auction', 'New bids on my listings'].map((pref) => (
                  <label key={pref} className="flex items-center justify-between py-2.5 border-b border-[rgba(26,24,37,0.05)] last:border-0">
                    <span className="text-[13px] text-primary">{pref}</span>
                    <input type="checkbox" defaultChecked
                      className="w-4 h-4 rounded accent-accent cursor-pointer" />
                  </label>
                ))}
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                              shadow-[0_1px_8px_rgba(26,24,37,0.06)] p-6">
                <h3 className="text-[14px] font-bold text-primary mb-2">Account</h3>
                <p className="text-[12.5px] text-secondary mb-4">Sign out of your account.</p>
                <button onClick={() => { logout(); navigate('/'); }}
                  className="px-4 py-2 rounded-[8px] border border-red-200 text-red-600
                             text-[13px] font-semibold hover:bg-red-50 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* ── Help Center ───────────────────────────────────────── */}
          {activeTab === 'help' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-bold text-primary mb-1">Help Center</h2>
                <p className="text-[13px] text-secondary">Find answers to common questions.</p>
              </div>

              {[
                { q: 'How do I place a bid?', a: 'Navigate to any active auction and enter your bid amount. You can set a maximum bid and our system will automatically bid on your behalf up to that amount.' },
                { q: 'What happens when I win an auction?', a: 'You\'ll receive a notification when you win. The item will appear in your "Won Items" tab. The seller will be notified and you can communicate via the chat feature.' },
                { q: 'How does the countdown timer work?', a: 'Each auction has a set end time. The countdown shows remaining time. Some auctions may extend if a bid is placed in the final moments.' },
                { q: 'What is Auto-Snipe?', a: 'Auto-Snipe places a bid automatically in the last few seconds of an auction. Set your maximum amount and the system handles the rest.' },
                { q: 'How do I contact a seller?', a: 'After winning an auction, a chat room is automatically created between you and the seller. Access it from the Messages section.' },
                { q: 'Can I retract a bid?', a: 'Bids are binding and cannot be retracted once placed. Make sure to review your bid amount before confirming.' },
                { q: 'How is the winner determined?', a: 'The highest bidder when the auction ends wins the item. If you\'ve set a maximum bid, the system bids incrementally up to your limit.' },
              ].map(({ q, a }, i) => (
                <details key={i} className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                                shadow-[0_1px_8px_rgba(26,24,37,0.06)] overflow-hidden group">
                  <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between
                                      hover:bg-[rgba(26,24,37,0.02)] transition-colors">
                    <span className="text-[13.5px] font-semibold text-primary">{q}</span>
                    <svg className="w-4 h-4 text-tertiary shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-[13px] text-secondary leading-relaxed border-t border-[rgba(26,24,37,0.05)] pt-3">
                    {a}
                  </div>
                </details>
              ))}

              <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.07)]
                              shadow-[0_1px_8px_rgba(26,24,37,0.06)] p-6 text-center">
                <p className="text-[13px] text-secondary mb-3">Still need help?</p>
                <a href="mailto:support@auctionlive.com"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px]
                             bg-primary text-white text-[13px] font-semibold
                             hover:bg-[#2c2a38] active:scale-[0.97] transition-all
                             shadow-[0_2px_8px_rgba(26,24,37,0.22)]">
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {/* Footer spacer */}
          <div className="h-8" />
        </main>
      </div>

      {/* ── Live notification bar (fixed bottom) ─────────────────────── */}
      {liveAlert && (
        <div className="fixed bottom-0 left-[210px] right-0 z-30
                        bg-white border-t border-[rgba(29,28,31,0.08)]
                        shadow-[0_-4px_20px_rgba(26,24,37,0.08)] px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-live-red uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-live-red animate-pulse" />
                Live
              </span>
              <p className="text-[13px] text-primary font-medium">
                New bid: <span className="font-bold text-accent">{formatCurrency(liveAlert.newAmount)}</span>
                {' '}on{' '}
                <span className="text-secondary">{liveAlert.itemTitle}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { navigate(`/auction/${liveAlert.itemId}`); setLiveAlert(null); }}
                className="text-[12px] font-bold text-accent hover:text-[#005bb5] transition-colors"
              >
                Bid Now →
              </button>
              <button
                onClick={() => setLiveAlert(null)}
                className="text-secondary hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
