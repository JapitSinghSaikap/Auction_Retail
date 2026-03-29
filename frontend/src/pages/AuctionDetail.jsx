import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ITEM } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useCountdown } from '../hooks/useCountdown';
import Toast, { useToast } from '../components/Toast';
import { formatCurrency, formatDate, timeAgo, getPlaceholderImage } from '../utils/formatters';
import AuctionIQ from '../components/AuctionIQ';
import BidBattle from '../components/BidBattle';
import EmojiReactions from '../components/EmojiReactions';
import useBidBattle from '../hooks/useBidBattle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Countdown inside bid card ───────────────────────────────────────── */
function BidCardCountdown({ endTime }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endTime);
  if (isExpired) return (
    <p className="text-center text-sm font-semibold text-secondary py-1">Auction Ended</p>
  );
  const pad = (n) => String(n).padStart(2, '0');
  const isUrgent = days === 0 && hours < 1;
  const units = [{ v: pad(days), l: 'DAYS' }, { v: pad(hours), l: 'HRS' }, { v: pad(minutes), l: 'MIN' }, { v: pad(seconds), l: 'SEC' }];
  return (
    <div>
      <p className="text-[10px] font-bold text-secondary tracking-widest text-center mb-2">ENDING IN</p>
      <div className="flex items-end justify-between gap-2">
        {units.map(({ v, l }) => (
          <div key={l} className="flex-1 flex flex-col items-center">
            <span className={`text-[30px] font-bold tabular-nums leading-none ${isUrgent ? 'text-live-red' : 'text-primary'}`}>{v}</span>
            <span className="text-[9px] font-bold text-secondary tracking-widest mt-1">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Live bidder notification strip ─────────────────────────────────── */
function LiveBidderStrip({ bids, onDismiss }) {
  const latest = bids[0];
  if (!latest) return null;
  return (
    <div className="flex items-center gap-3 bg-white border border-[rgba(29,28,31,0.08)] rounded-[10px] px-3 py-2 shadow-sm">
      {/* Avatars */}
      <div className="flex -space-x-1.5">
        {bids.slice(0, 3).map((bid, i) => (
          <div key={i}
            className="w-6 h-6 rounded-full border-2 border-white bg-accent flex items-center justify-center text-white text-[9px] font-bold"
            title={bid.user?.name}>
            {bid.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        ))}
      </div>
      {/* Toggle-style live indicator */}
      <div className="flex items-center gap-1.5 bg-accent rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-white text-[10px] font-bold">LIVE</span>
      </div>
      {/* Bid info */}
      <p className="text-xs text-secondary flex-1">
        <span className="font-semibold text-primary">{latest.user?.name?.split(' ')[0] || 'M'}.</span>
        {' bid '}
        <span className="font-bold text-accent">{formatCurrency(latest.amount)}</span>
      </p>
      {/* Second bidder name + dismiss */}
      {bids[1] && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-secondary font-medium">{bids[1].user?.name?.split(' ')[0]}</span>
          <button onClick={onDismiss}
            className="text-secondary hover:text-primary text-base leading-none transition-colors">×</button>
        </div>
      )}
    </div>
  );
}

/* ── Page footer ─────────────────────────────────────────────────────── */
function PageFooter() {
  return (
    <footer className="bg-base border-t border-[rgba(29,28,31,0.07)] mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <p className="text-[15px] font-bold text-primary mb-2">AuctionLive</p>
            <p className="text-xs text-secondary leading-relaxed">
              The world's premier digital showroom for luxury assets and certified technology.
            </p>
          </div>
          {/* Columns */}
          {[
            { label: 'Platform',  links: ['Curated Collections', 'Seller Portal', 'Market Insights'] },
            { label: 'Trust',     links: ['Buyer Protection', 'Verification Lab', 'Privacy Hub'] },
            { label: 'Support',   links: ['Concierge Service', 'Help Center', 'Contact'] },
          ].map(({ label, links }) => (
            <div key={label}>
              <p className="label-muted mb-3">{label}</p>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-px bg-[rgba(29,28,31,0.07)] mb-5" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-secondary uppercase tracking-wider">
            © 2026 AuctionLive. The Digital Concierge for Luxury Assets.
          </p>
          <div className="flex items-center gap-3">
            {[
              <svg key="globe" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
              <svg key="shield" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
              <svg key="grid" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
            ].map((icon, i) => (
              <button key={i} className="text-secondary hover:text-primary transition-colors">{icon}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, token } = useAuth();
  const { joinAuction, leaveAuction, onBidUpdated, onOutbidAlert, emitBid, onBidSuccess, onBidError } = useSocket();
  const { showToast } = useToast();

  const [currentPrice, setCurrentPrice] = useState(null);
  const [bidCount, setBidCount]         = useState(0);
  const [liveBids, setLiveBids]         = useState([]);
  const [priceFlash, setPriceFlash]     = useState(false);
  const [activeThumb, setActiveThumb]   = useState(0);
  const [activeTab, setActiveTab]       = useState('description');
  const [bidAmount, setBidAmount]       = useState('');
  const [bidLoading, setBidLoading]     = useState(false);
  const [bidError, setBidError]         = useState('');
  const [isFavorited, setIsFavorited]   = useState(false);
  const [showStrip, setShowStrip]       = useState(true);
  const cleanupRef = useRef([]);

  const { isBattleActive, fighter1, fighter2, currentPrice: battlePrice, commentary, winner: battleWinner } = useBidBattle(id);

  const { data, loading, error } = useQuery(GET_ITEM, { variables: { id } });
  const item = data?.getItem;

  useEffect(() => {
    if (item) {
      setCurrentPrice(item.currentPrice);
      setBidCount(item.bidCount ?? 0);
      setLiveBids(item.bids ? [...item.bids].sort((a, b) => b.amount - a.amount) : []);
    }
  }, [item]);

  useEffect(() => {
    if (!id) return;
    joinAuction(id);
    return () => leaveAuction(id);
  }, [id]);

  useEffect(() => {
    return onBidUpdated((data) => {
      if (String(data.itemId) !== String(id)) return;
      setCurrentPrice(data.newPrice);
      setBidCount(data.bidCount);
      setPriceFlash(true);
      setTimeout(() => setPriceFlash(false), 700);
      setLiveBids((prev) => [{
        id: Date.now(), amount: data.newPrice,
        createdAt: data.timestamp,
        user: { id: data.bidderId, name: data.bidderName },
      }, ...prev].slice(0, 20));
      setShowStrip(true);
    });
  }, [onBidUpdated, id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    return onOutbidAlert((d) => {
      showToast(`You've been outbid — new bid: ${formatCurrency(d.newAmount)}`, 'warning');
    });
  }, [onOutbidAlert, isLoggedIn]);

  const { isExpired } = useCountdown(item?.endTime || new Date().toISOString());
  const isBuyer = user?.role === 'buyer';
  const canBid  = isLoggedIn && isBuyer && item?.status === 'active' && !isExpired;
  const minBid  = Math.floor(currentPrice ?? 0) + 1;

  const handlePlaceBid = (e) => {
    e.preventDefault();
    setBidError('');
    const num = parseFloat(bidAmount);
    if (!num || num <= (currentPrice ?? 0)) {
      setBidError(`Bid must exceed ${formatCurrency(currentPrice ?? 0)}`);
      return;
    }
    setBidLoading(true);
    const s = onBidSuccess(() => {
      setBidLoading(false); setBidAmount('');
      showToast(`Bid of ${formatCurrency(num)} placed!`, 'success');
      cleanupRef.current.forEach((fn) => fn()); cleanupRef.current = [];
    });
    const er = onBidError((d) => {
      setBidLoading(false); setBidError(d.message || 'Failed to place bid.');
      cleanupRef.current.forEach((fn) => fn()); cleanupRef.current = [];
    });
    cleanupRef.current = [s, er];
    setTimeout(() => { setBidLoading(false); cleanupRef.current.forEach((fn) => fn()); cleanupRef.current = []; }, 8000);
    emitBid(id, user.id, num, token);
  };

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-10 pt-[72px] animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="skeleton aspect-square rounded-card" />
        <div className="flex flex-col gap-4 pt-4">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-9 w-4/5 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="card p-6 flex flex-col gap-4 mt-2">
            <div className="skeleton h-10 w-2/5 rounded" />
            <div className="skeleton h-14 w-full rounded-card" />
            <div className="skeleton h-11 w-full rounded-pill" />
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !item) return (
    <div className="text-center py-28 px-6">
      <p className="text-primary font-bold text-xl mb-2">Auction not found</p>
      <p className="text-secondary text-sm mb-6">{error?.message}</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  const imageUrl = item.image?.startsWith('http')
    ? item.image
    : item.image?.startsWith('/uploads')
      ? `${API_URL}${item.image}`
      : getPlaceholderImage(item.title);

  const thumbImages = [imageUrl, imageUrl, imageUrl, imageUrl];

  // Parse description into bullet points if it contains newlines or dashes
  const descLines = (item.description || '')
    .split(/\n|•|-/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-base">
      <Toast />

      {/* Breadcrumb */}
      <div className="border-b border-[rgba(29,28,31,0.07)] bg-surface">
        <div className="max-w-6xl mx-auto px-6 pt-[62px] pb-2">
          <nav className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest">
            <button onClick={() => navigate('/')} className="text-secondary hover:text-accent transition-colors">
              Auctions
            </button>
            <span className="text-secondary/40">›</span>
            <button className="text-secondary hover:text-accent transition-colors">
              {item.category?.name || 'All'}
            </button>
            <span className="text-secondary/40">›</span>
            <span className="text-accent truncate max-w-[200px]">
              {item.title.toUpperCase().slice(0, 28)}{item.title.length > 28 ? '…' : ''}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

          {/* ── LEFT ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Main image */}
            <div className="rounded-card overflow-hidden bg-[#111] aspect-square relative group">
              <img
                src={thumbImages[activeThumb]}
                alt={item.title}
                className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.02]"
                onError={(e) => { e.target.src = getPlaceholderImage(item.title); }}
              />
              {/* Favorite */}
              <button onClick={() => setIsFavorited((v) => !v)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center">
                <svg className={`w-4 h-4 ${isFavorited ? 'fill-red-400 text-red-400' : 'text-white'}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-2.5">
              {thumbImages.map((src, i) => (
                <button key={i} onClick={() => setActiveThumb(i)}
                  className={`aspect-square rounded-[10px] overflow-hidden bg-[#1a1a1a] transition-all
                    ${activeThumb === i ? 'ring-2 ring-accent ring-offset-2' : 'opacity-40 hover:opacity-70'}`}>
                  <img src={src} alt="" className="w-full h-full object-contain p-1"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-2">
              <div className="flex border-b border-[rgba(29,28,31,0.09)] mb-4">
                {[
                  { key: 'description', label: 'Description' },
                  { key: 'bids',        label: 'Bid History' },
                  { key: 'details',     label: 'Item Details' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`mr-5 pb-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px
                      ${activeTab === key
                        ? 'text-primary border-primary'
                        : 'text-secondary border-transparent hover:text-primary'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'description' && (
                <div className="text-sm text-secondary leading-relaxed">
                  {item.description ? (
                    descLines.length > 1 ? (
                      <>
                        <p className="mb-3">{descLines[0]}</p>
                        <ul className="flex flex-col gap-2 mt-3">
                          {descLines.slice(1).map((line, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                              {line}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : <p>{item.description}</p>
                  ) : (
                    <p className="italic text-secondary/60">No description provided.</p>
                  )}
                </div>
              )}

              {activeTab === 'bids' && (
                <div className="flex flex-col divide-y divide-[rgba(29,28,31,0.06)]">
                  {liveBids.length === 0
                    ? <p className="text-secondary text-sm text-center py-8">No bids yet.</p>
                    : liveBids.slice(0, 10).map((bid, idx) => (
                      <div key={bid.id || idx} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold
                            ${idx === 0 ? 'bg-accent text-white' : 'bg-surface text-secondary'}`}>
                            {bid.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-primary">{bid.user?.name}</p>
                            <p className="text-[11px] text-secondary">{timeAgo(bid.createdAt)}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${idx === 0 ? 'text-accent' : 'text-primary'}`}>
                          {formatCurrency(bid.amount)}
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}

              {activeTab === 'details' && (
                <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {[
                    ['Lot #',          `#${item.id}`],
                    ['Category',       item.category?.name || '—'],
                    ['Seller',         item.seller?.name || '—'],
                    ['Starting Price', formatCurrency(item.startingPrice)],
                    ['Current Price',  formatCurrency(currentPrice ?? item.currentPrice)],
                    ['Ends',           formatDate(item.endTime)],
                    ['Status',         item.status],
                    ['Total Bids',     bidCount],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">{label}</dt>
                      <dd className="font-semibold text-primary capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* Live bidder strip */}
            {showStrip && liveBids.length > 0 && (
              <div className="mt-2 animate-slideUp">
                <LiveBidderStrip bids={liveBids} onDismiss={() => setShowStrip(false)} />
              </div>
            )}
          </div>

          {/* ── RIGHT ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Title */}
            <h1 className="text-[22px] font-bold text-primary leading-snug">{item.title}</h1>

            {/* Seller row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent-light overflow-hidden border border-[rgba(0,113,227,0.15)] flex items-center justify-center text-accent text-xs font-bold">
                  {item.seller?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-primary leading-none">{item.seller?.name || 'Seller'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-[11px] text-secondary">4.9 Digital Trust Score</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-surface hover:bg-[rgba(29,28,31,0.08)] flex items-center justify-center text-secondary hover:text-primary transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button onClick={() => setIsFavorited((v) => !v)}
                  className="w-8 h-8 rounded-full bg-surface hover:bg-[rgba(29,28,31,0.08)] flex items-center justify-center transition-colors">
                  <svg className={`w-4 h-4 ${isFavorited ? 'fill-red-400 text-red-400' : 'text-secondary'}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── BID CARD ─────────────────────────────────────────── */}
            <div className="rounded-[16px] border border-[rgba(29,28,31,0.10)] bg-white shadow-card p-5 flex flex-col gap-4">

              {/* Current bid + reserve met */}
              <div>
                <div className="flex items-start justify-between mb-1">
                  <p className="label-muted">Current Bid</p>
                  <span className="badge bg-green-50 text-green-600 border border-green-200 text-[10px] uppercase tracking-wide">
                    ✓ Reserve Met
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-[38px] font-bold tabular-nums leading-none transition-all duration-300
                    ${priceFlash ? 'animate-priceFlash' : 'text-primary'}`}>
                    {formatCurrency(currentPrice ?? item.currentPrice)}
                  </span>
                  <span className="text-xs text-secondary font-semibold">INR</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-secondary">{bidCount} active bids</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(29,28,31,0.07)]" />

              {/* Bid Battle banner */}
              {isBattleActive && (
                <BidBattle
                  itemId={id}
                  fighter1={fighter1}
                  fighter2={fighter2}
                  currentPrice={battlePrice || currentPrice}
                  commentary={commentary}
                  winner={battleWinner}
                />
              )}

              {/* Countdown */}
              {item.status === 'active' && !isExpired && (
                <BidCardCountdown endTime={item.endTime} />
              )}

              {/* Won / closed */}
              {(item.status === 'closed' || isExpired) && (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-[10px] p-3 text-center">
                    <p className="text-sm font-bold text-green-700">
                      {item.winner ? `🏆 Won by ${item.winner.name}` : 'Auction Ended'}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">Final: {formatCurrency(item.currentPrice)}</p>
                  </div>
                  {/* Chat button — visible to winner and seller */}
                  {isLoggedIn && (
                    String(user?.id) === String(item.winner?.id) ||
                    String(user?.id) === String(item.seller?.id)
                  ) && (
                    <Link to={`/chat?room=auction_${item.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5
                                 rounded-[9px] bg-[#1a1825] text-white text-[13px] font-semibold
                                 hover:bg-[#2d2b3a] transition-all active:scale-[0.97]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      Chat with {String(user?.id) === String(item.seller?.id) ? 'Buyer' : 'Seller'}
                    </Link>
                  )}
                </div>
              )}

              {/* Bid input */}
              {canBid && (
                <form onSubmit={handlePlaceBid} className="flex flex-col gap-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      className="input pl-7 py-3 text-[15px]"
                      placeholder={`${minBid}.00 or more`}
                      value={bidAmount}
                      min={minBid}
                      step="0.01"
                      onChange={(e) => { setBidAmount(e.target.value); setBidError(''); }}
                      disabled={bidLoading}
                    />
                  </div>
                  {bidError && <p className="text-xs text-red-500">{bidError}</p>}
                  <button type="submit" disabled={bidLoading || !bidAmount}
                    className="btn-primary w-full justify-center py-3.5 text-[15px] font-bold">
                    {bidLoading
                      ? <><svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>Placing bid…</>
                      : 'Place Bid Now'
                    }
                  </button>
                  <p className="text-[10px] text-secondary text-center leading-relaxed">
                    Bid securely. Our{' '}
                    <span className="text-accent cursor-pointer hover:text-accent-dark underline-offset-2">Protection Policy</span>
                    {' '}covers all premium hardware transactions.
                  </p>
                </form>
              )}

              {!isLoggedIn && (
                <button className="btn-primary w-full justify-center py-3.5 text-[15px]"
                  onClick={() => navigate('/login')}>
                  Sign In to Bid
                </button>
              )}
              {isLoggedIn && !isBuyer && (
                <p className="text-xs text-secondary text-center">Sellers cannot place bids.</p>
              )}
            </div>

            {/* Authenticity Guaranteed */}
            <div className="rounded-[12px] border border-[rgba(29,28,31,0.08)] bg-white p-4 flex items-start gap-3">
              <div className="flex -space-x-1.5 shrink-0 mt-0.5">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center z-10">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold text-primary">Authenticity Guaranteed</p>
                <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
                  Includes original serial verification and hardware health check.
                </p>
              </div>
            </div>
          {/* AuctionIQ panel */}
          {item.status === 'active' && (
            <AuctionIQ itemId={id} currentPrice={currentPrice} />
          )}

          {/* Emoji reactions — subtle inline strip */}
          {item.status === 'active' && (
            <div className="px-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-tertiary mb-2">Reactions</p>
              <EmojiReactions itemId={id} />
            </div>
          )}
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
