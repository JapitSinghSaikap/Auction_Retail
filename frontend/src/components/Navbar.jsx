import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Chevron icon ─────────────────────────────────────────────────── */
const Chevron = ({ open }) => (
  <svg
    className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

/* ── Dropdown ─────────────────────────────────────────────────────── */
function Dropdown({ label, items, isOpen, onToggle }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) onToggle(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onToggle(!isOpen)}
        className={`nav-link flex items-center gap-[3px] ${isOpen ? 'text-primary' : ''}`}
      >
        {label} <Chevron open={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[14px] w-52
                        bg-white rounded-[12px] border border-[rgba(26,24,37,0.09)]
                        shadow-[0_8px_32px_rgba(26,24,37,0.12)] py-1.5 z-50 animate-slideUp">
          {/* Caret arrow */}
          <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px]
                            bg-white border-l border-t border-[rgba(26,24,37,0.09)] rotate-45" />
          {items.map(({ label: l, href, icon }) => (
            <a key={l} href={href}
              className="flex items-center gap-3 px-4 py-2.5
                         text-[13px] font-medium text-secondary hover:text-primary
                         hover:bg-[rgba(26,24,37,0.03)] transition-colors"
              onClick={() => onToggle(false)}
            >
              <span className="text-tertiary">{icon}</span>
              {l}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Icon helpers ─────────────────────────────────────────────────── */
const icons = {
  list:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7"/></svg>,
  info:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  plus:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>,
  book:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  chart:   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  help:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  spark:   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
};

/* ── Logo mark ────────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group shrink-0">
      <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-accent to-accent-dark
                      flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.3)]
                      group-hover:shadow-[0_3px_14px_rgba(0,113,227,0.4)] transition-shadow">
        <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
      </div>
      <div>
        <p className="text-[15.5px] font-extrabold tracking-[-0.04em] text-primary leading-none">
          Auction<span className="text-accent">Live</span>
        </p>
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-tertiary mt-[2px]">
          Premium Auctions
        </p>
      </div>
    </Link>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDD,   setOpenDD]   = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpenDD(null); setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const dash = user?.role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
  const active = (p) => location.pathname === p;

  const platformItems = [
    { label: 'Browse Auctions', href: '/',             icon: icons.list  },
    { label: 'How It Works',    href: '#how-it-works', icon: icons.info  },
    { label: 'Sell an Item',    href: '/register',     icon: icons.plus  },
  ];
  const resourceItems = [
    { label: 'Insights',        href: '#', icon: icons.spark },
    { label: 'Buyer Guide',     href: '#', icon: icons.book  },
    { label: 'Market Insights', href: '#', icon: icons.chart },
    { label: 'Help Center',     href: '#', icon: icons.help  },
  ];

  return (
    <>
      {/* Accent gradient line at very top */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none
                      bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <nav className={`fixed top-[2px] left-0 right-0 z-40 transition-all duration-300
        ${scrolled
          ? 'bg-[#f5f4ef]/90 backdrop-blur-[22px] shadow-[0_1px_0_rgba(26,24,37,0.09),0_4px_20px_rgba(26,24,37,0.05)]'
          : 'bg-[#f5f4ef]/80 backdrop-blur-[10px]'}
        border-b border-[rgba(26,24,37,0.09)]`}
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="flex items-center h-[58px] gap-4">

            {/* ── HEX-STYLE: Logo LEFT, then left-nav, then right-nav ── */}
            {/* On large screens we do: logo | left-links | flex-1 (spacer) | right-links */}

            {/* Logo */}
            <LogoMark />

            {/* Thin vertical divider */}
            <div className="hidden lg:block w-px h-5 bg-[rgba(26,24,37,0.12)] mx-1" />

            {/* Left nav links */}
            <div className="hidden lg:flex items-center gap-5 flex-1">
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
                  <Link to="/" className={`nav-link ${active('/') ? 'nav-link-active' : ''}`}>Auctions</Link>
                  <Link to={dash} className={`nav-link ${active(dash) ? 'nav-link-active' : ''}`}>Dashboard</Link>
                  <Dropdown label="Resources" items={resourceItems}
                    isOpen={openDD === 'resources'} onToggle={(v) => setOpenDD(v ? 'resources' : null)} />
                </>
              )}
            </div>

            {/* Spacer (pushes right items to far right) */}
            <div className="flex-1 hidden lg:block" />

            {/* Right nav items */}
            <div className="hidden lg:flex items-center gap-3">

              {/* LIVE pill */}
              <div className="flex items-center gap-1.5 bg-[rgba(232,52,28,0.08)] rounded-full px-2.5 py-1 border border-[rgba(232,52,28,0.15)]">
                <span className="w-[6px] h-[6px] rounded-full bg-live-red animate-pulse" />
                <span className="text-[10px] font-bold text-live-red tracking-[0.1em] uppercase">Live</span>
              </div>

              {isLoggedIn ? (
                <>
                  {/* User pill */}
                  <div className="flex items-center gap-2 bg-white border border-[rgba(26,24,37,0.10)]
                                  rounded-[9px] pl-2 pr-3 py-[6px]
                                  shadow-[0_1px_4px_rgba(26,24,37,0.07)]">
                    <div className="w-[26px] h-[26px] rounded-[6px] bg-gradient-to-br from-accent to-accent-dark
                                    flex items-center justify-center text-white text-[11px] font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="leading-none">
                      <p className="text-[12.5px] font-semibold text-primary">{user?.name?.split(' ')[0]}</p>
                      <p className="text-[10px] text-tertiary capitalize mt-[1.5px]">{user?.role}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="nav-link text-secondary hover:text-primary">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Log In</Link>
                  {/* HEX-style "Get started" — rectangular outline + dark fill on hover */}
                  <Link to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-[7px]
                               rounded-[7px] text-[13px] font-semibold text-primary
                               border-[1.5px] border-[rgba(26,24,37,0.3)]
                               hover:border-[rgba(26,24,37,0.65)] hover:bg-[rgba(26,24,37,0.04)]
                               active:scale-[0.97] transition-all duration-150">
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <button
              className="lg:hidden ml-auto w-9 h-9 flex items-center justify-center
                         rounded-[7px] text-secondary hover:text-primary hover:bg-surface transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}  d="M4 7h16M4 12h16M4 17h10"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-[#f5f4ef] border-t border-[rgba(26,24,37,0.08)]
                          px-5 pt-3 pb-5 flex flex-col gap-0.5 animate-slideUp
                          shadow-[0_8px_24px_rgba(26,24,37,0.08)]">
            {[
              { to: '/',             label: 'Auctions'   },
              { to: '#how-it-works', label: 'How It Works' },
              { to: '#categories',   label: 'Categories' },
              { to: '/register',     label: 'Sell an Item' },
              ...(isLoggedIn ? [{ to: dash, label: 'Dashboard' }] : []),
            ].map(({ to, label }) => (
              <a key={label} href={to}
                className="py-2.5 px-3 rounded-[7px] text-[14px] font-medium text-secondary
                           hover:text-primary hover:bg-[rgba(26,24,37,0.04)] transition-colors"
                onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <div className="h-px bg-[rgba(26,24,37,0.08)] my-2" />
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-accent to-accent-dark
                                  flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-primary">{user?.name}</p>
                    <p className="text-[11px] text-tertiary capitalize">{user?.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="text-left py-2.5 px-3 rounded-[7px] text-sm font-medium text-secondary
                             hover:text-primary hover:bg-surface transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <Link to="/login"
                  className="text-center py-2.5 text-[14px] font-medium text-secondary
                             hover:text-primary rounded-[7px] hover:bg-surface transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  Log In
                </Link>
                <Link to="/register"
                  className="text-center py-2.5 text-[14px] font-semibold text-primary
                             border-[1.5px] border-[rgba(26,24,37,0.3)] rounded-[7px]
                             hover:border-[rgba(26,24,37,0.6)] transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  Get started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* nav-link styles injected via a style tag so Tailwind arbitrary doesn't fight specificity */}
      <style>{`
        .nav-link {
          font-size: 13.5px;
          font-weight: 500;
          color: #6b6a72;
          letter-spacing: -0.005em;
          transition: color 150ms;
          cursor: pointer;
          text-decoration: none;
        }
        .nav-link:hover  { color: #1a1825; }
        .nav-link-active { color: #1a1825; font-weight: 600; }
      `}</style>
    </>
  );
}
