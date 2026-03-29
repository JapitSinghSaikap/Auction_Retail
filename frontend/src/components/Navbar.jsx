import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import NotificationToast from './NotificationToast';
import useNotifications from '../hooks/useNotifications';

/* ── Chevron ──────────────────────────────────────────────────────── */
const Chevron = ({ open }) => (
  <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

/* ── Dropdown ─────────────────────────────────────────────────────── */
function Dropdown({ label, items, isOpen, onToggle }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) onToggle(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen, onToggle]);

  const handleNav = (href) => {
    onToggle(false);
    if (!href || href === '#') return;
    if (href.startsWith('/') && !href.includes('#')) { navigate(href); return; }
    if (href.startsWith('/') && href.includes('#')) {
      const [path, hash] = href.split('#');
      navigate(path || '/');
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 150);
      return;
    }
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else { navigate('/'); setTimeout(() => document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150); }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onToggle(!isOpen)}
        className={`nav-link flex items-center gap-1 ${isOpen ? '!text-primary' : ''}`}
      >
        {label} <Chevron open={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52
                        bg-white rounded-[12px] border border-[rgba(26,24,37,0.09)]
                        shadow-[0_12px_40px_rgba(0,0,0,0.35)] py-1.5 z-50 animate-slideUp">
          <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px]
                           bg-white border-l border-t border-[rgba(26,24,37,0.09)] rotate-45" />
          {items.map(({ label: l, href, icon }) => (
            <button key={l}
              onClick={() => handleNav(href)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                         text-[13px] font-medium text-secondary hover:text-primary
                         hover:bg-[rgba(26,24,37,0.03)] transition-colors"
            >
              <span className="text-tertiary">{icon}</span>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────── */
const icons = {
  list:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7"/></svg>,
  info:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  plus:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>,
  book:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  chart: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  help:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  spark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
};

/* ── Broadcast / signal icon ──────────────────────────────────────── */
const BroadcastIcon = () => (
  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
  </svg>
);

/* ── Main ─────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [openDD,      setOpenDD]      = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    notifications, unreadCount,
    isOpen: notifOpen, setIsOpen: setNotifOpen,
    markRead, markAllRead,
    newToast, dismissToast,
  } = useNotifications();

  const notifRef = useRef(null);
  useEffect(() => {
    if (!notifOpen) return;
    const close = (e) => { if (!notifRef.current?.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen, setNotifOpen]);

  useEffect(() => { setOpenDD(null); setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const dash   = user?.role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
  const active = (p) => location.pathname === p;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    // Scroll to auctions section after navigation
    setTimeout(() => {
      document.getElementById('auctions')?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const platformItems = [
    { label: 'Browse Auctions', href: '/',             icon: icons.list },
    { label: 'How It Works',    href: '#how-it-works', icon: icons.info },
    { label: 'Sell an Item',    href: '/register',     icon: icons.plus },
  ];
  const resourceItems = [
    { label: 'Insights',        href: '/#auctions',     icon: icons.spark },
    { label: 'Buyer Guide',     href: '/#how-it-works', icon: icons.book  },
    { label: 'Market Insights', href: '/#auctions',     icon: icons.chart },
    { label: 'Help Center',     href: '/#how-it-works', icon: icons.help  },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40
                      bg-[rgba(245,244,239,0.92)] backdrop-blur-xl
                      border-b border-[rgba(26,24,37,0.08)]
                      shadow-[0_1px_0_rgba(26,24,37,0.04),0_2px_12px_rgba(26,24,37,0.06)]">
        <div className="w-full px-6 lg:px-10">
          <div className="flex items-center h-[58px] gap-4">

            {/* ── Logo ──────────────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[#0071e3] to-[#0051b3]
                              flex items-center justify-center
                              shadow-[0_2px_8px_rgba(0,113,227,0.4)]
                              group-hover:shadow-[0_3px_12px_rgba(0,113,227,0.55)] transition-shadow">
                <svg className="w-[15px] h-[15px] text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <span className="text-[15px] font-bold tracking-[-0.03em] text-primary">
                Auction<span className="text-accent">Live</span>
              </span>
            </Link>

            {/* Divider */}
            <div className="hidden lg:block w-px h-5 bg-[rgba(26,24,37,0.1)] mx-1 shrink-0" />

            {/* ── Search bar ────────────────────────────────────── */}
            <form onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2 shrink-0
                         bg-white border border-[rgba(26,24,37,0.12)] hover:border-[rgba(26,24,37,0.22)]
                         rounded-full px-3.5 h-[34px] w-[220px]
                         focus-within:border-[rgba(26,24,37,0.3)] focus-within:shadow-[0_0_0_3px_rgba(0,113,227,0.08)]
                         transition-all duration-200">
              <svg className="w-3.5 h-3.5 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search auctions..."
                className="bg-transparent text-[13px] text-primary placeholder-[rgba(26,24,37,0.35)]
                           outline-none w-full font-medium"
              />
            </form>

            {/* Divider */}
            <div className="hidden lg:block w-px h-5 bg-[rgba(26,24,37,0.1)] mx-1 shrink-0" />

            {/* ── Centre nav links ──────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-0.5">
              {!isLoggedIn ? (
                <>
                  <Dropdown label="Platform" items={platformItems}
                    isOpen={openDD === 'platform'} onToggle={(v) => setOpenDD(v ? 'platform' : null)} />
                  <a href="#auctions" className="nav-link">Auctions</a>
                  <a href="#how-it-works" className="nav-link">How It Works</a>
                  <Dropdown label="Resources" items={resourceItems}
                    isOpen={openDD === 'resources'} onToggle={(v) => setOpenDD(v ? 'resources' : null)} />
                </>
              ) : (
                <>
                  <Link to="/"    className={`nav-link ${active('/') ? 'nav-active' : ''}`}>Auctions</Link>
                  <Link to={dash} className={`nav-link ${active(dash) ? 'nav-active' : ''}`}>Dashboard</Link>
                  <Dropdown label="Resources" items={resourceItems}
                    isOpen={openDD === 'resources'} onToggle={(v) => setOpenDD(v ? 'resources' : null)} />
                </>
              )}
            </div>

            {/* Flex spacer — pushes right cluster to the far right */}
            <div className="flex-1" />

            {/* ── Right cluster ─────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-1.5">

              {/* LIVE pill — only show when logged out (activity feed has its own indicator) */}
              {!isLoggedIn && (
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1
                                border border-live-red/30 bg-live-red/[0.07] mr-1">
                  <span className="w-[5px] h-[5px] rounded-full bg-live-red animate-pulse" />
                  <span className="text-[10px] font-bold text-live-red tracking-[0.1em] uppercase">Live</span>
                </div>
              )}

              {isLoggedIn ? (
                <>
                  {/* Broadcast / signal icon */}
                  <button className="nav-icon-btn" title="Live streams">
                    <BroadcastIcon />
                  </button>

                  {/* Messages */}
                  <Link to="/chat" className="nav-icon-btn" title="Messages">
                    <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </Link>

                  {/* Notification bell */}
                  <div ref={notifRef} className="relative">
                    <button
                      onClick={() => setNotifOpen((o) => !o)}
                      className={`nav-icon-btn relative ${notifOpen ? '!text-primary bg-[rgba(26,24,37,0.06)]' : ''}`}
                      title="Notifications">
                      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-[3px]
                                         bg-live-red text-white text-[8.5px] font-bold rounded-full
                                         flex items-center justify-center leading-none
                                         ring-[1.5px] ring-[#f5f4ef]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && (
                      <NotificationPanel
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkRead={markRead}
                        onMarkAllRead={markAllRead}
                        onClose={() => setNotifOpen(false)}
                      />
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-[rgba(26,24,37,0.1)] mx-1" />

                  {/* User pill */}
                  <div className="flex items-center gap-2.5 pl-1">
                    {/* Avatar */}
                    <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#4da3ff] to-[#0051b3]
                                    flex items-center justify-center text-white text-[12px] font-bold
                                    ring-[1.5px] ring-[rgba(26,24,37,0.1)] shrink-0">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="leading-none">
                      <p className="text-[12.5px] font-semibold text-primary leading-snug">
                        {user?.name?.split(' ')[0]}
                      </p>
                      <button onClick={handleLogout}
                        className="text-[10px] text-secondary hover:text-primary transition-colors mt-[1px]">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="nav-link px-3 py-1.5 rounded-[7px]
                               hover:bg-[rgba(26,24,37,0.05)] transition-colors">
                    Log In
                  </Link>
                  <Link to="/register"
                    className="inline-flex items-center px-4 py-[7px] rounded-[7px]
                               text-[13px] font-semibold text-white
                               bg-[#0071e3] hover:bg-[#0062c4]
                               shadow-[0_2px_8px_rgba(0,113,227,0.35)]
                               active:scale-[0.97] transition-all duration-150">
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile burger ─────────────────────────────────── */}
            <button
              className="lg:hidden ml-auto w-8 h-8 flex items-center justify-center
                         rounded-[7px] text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.06)] transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile menu ─────────────────────────────────────────── */}
        {menuOpen && (
          <div className="lg:hidden bg-[rgba(245,244,239,0.98)] border-t border-[rgba(26,24,37,0.08)]
                          px-5 pt-3 pb-5 flex flex-col gap-0.5">
            {/* Mobile search */}
            <form onSubmit={handleSearch}
              className="flex items-center gap-2 bg-white border border-[rgba(26,24,37,0.12)]
                         rounded-full px-3.5 h-9 mb-3">
              <svg className="w-3.5 h-3.5 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search auctions..."
                className="bg-transparent text-[13px] text-primary placeholder-[rgba(26,24,37,0.35)] outline-none w-full" />
            </form>

            {[
              { to: '/',             label: 'Auctions'    },
              { to: '#how-it-works', label: 'How It Works' },
              { to: '/register',     label: 'Sell an Item' },
              ...(isLoggedIn ? [{ to: dash, label: 'Dashboard' }] : []),
            ].map(({ to, label }) => (
              <a key={label} href={to}
                className="py-2.5 px-3 rounded-[7px] text-[14px] font-medium
                           text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.04)] transition-colors"
                onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <div className="h-px bg-[rgba(26,24,37,0.07)] my-2" />
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4da3ff] to-[#0051b3]
                                  flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-primary">{user?.name}</p>
                    <p className="text-[11px] text-secondary capitalize">{user?.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="text-left py-2.5 px-3 rounded-[7px] text-sm font-medium
                             text-secondary hover:text-primary hover:bg-[rgba(26,24,37,0.04)] transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <Link to="/login" className="text-center py-2.5 text-[14px] font-medium text-secondary
                           hover:text-primary rounded-[7px] hover:bg-[rgba(26,24,37,0.04)] transition-colors"
                  onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link to="/register" className="text-center py-2.5 text-[14px] font-semibold text-white
                           bg-[#0071e3] rounded-[7px] hover:bg-[#0062c4] transition-colors"
                  onClick={() => setMenuOpen(false)}>Get started</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Notification toast */}
      {isLoggedIn && newToast && (
        <NotificationToast toast={newToast} onDismiss={dismissToast} />
      )}

      <style>{`
        .nav-link {
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(26,24,37,0.55);
          letter-spacing: -0.005em;
          padding: 6px 10px;
          border-radius: 7px;
          transition: color 150ms, background 150ms;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-link:hover  { color: #1a1825; background: rgba(26,24,37,0.05); }
        .nav-active      { color: #1a1825 !important; font-weight: 600; background: rgba(26,24,37,0.06); }
        .nav-icon-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          color: rgba(26,24,37,0.45);
          transition: color 150ms, background 150ms;
          cursor: pointer;
          background: transparent;
          border: none;
          position: relative;
          text-decoration: none;
        }
        .nav-icon-btn:hover { color: #1a1825; background: rgba(26,24,37,0.06); }
      `}</style>
    </>
  );
}
