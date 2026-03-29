import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';
import { GET_ITEMS, GET_CATEGORIES } from '../graphql/queries';
import AuctionCard from '../components/AuctionCard';
import Toast from '../components/Toast';
import ActivityFeed from '../components/ActivityFeed';
import AuctionsEndingSoon from '../components/AuctionsEndingSoon';

function SkeletonCard() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton h-52 w-full rounded-b-none rounded-t-card" />
      <div className="p-5 flex flex-col gap-2.5">
        <div className="skeleton h-3.5 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-1/3 mt-1" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-3 w-1/4" />
          <div className="skeleton h-8 w-20 rounded-pill" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sync when navbar search navigates here
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearch(q);
      setTimeout(() => {
        document.getElementById('auctions')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [searchParams]);

  const { data: catData } = useQuery(GET_CATEGORIES);
  const { data, loading, error } = useQuery(GET_ITEMS, {
    variables: { status: 'active', categoryId: selectedCategory || undefined },
    pollInterval: 30000,
  });

  const categories = catData?.getCategories || [];
  const items = data?.getItems || [];
  const filtered = search
    ? items.filter((i) => {
        const q = search.toLowerCase();
        return i.title.toLowerCase().includes(q)
          || (i.description && i.description.toLowerCase().includes(q))
          || (i.category?.name && i.category.name.toLowerCase().includes(q));
      })
    : items;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base">
      <Toast />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-[86px] pb-16 px-6 text-center">
        {/* Eyebrow */}
        <p className="label-muted mb-6 tracking-[0.22em]">AuctionLive</p>

        {/* Mixed editorial heading — serif italic + bold sans (HEX style) */}
        <h1 className="max-w-[820px] mx-auto mb-6 leading-[1.07]">
          {/* Line 1: serif italic */}
          <span className="block font-serif italic text-[3.2rem] sm:text-[4.2rem] text-primary"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic' }}>
            The most beautiful way to
          </span>
          {/* Line 2: bold sans with accent */}
          <span className="block font-extrabold text-[3.4rem] sm:text-[4.6rem] tracking-[-0.035em] text-primary mt-1">
            bid on{' '}
            <span className="text-accent">anything.</span>
          </span>
        </h1>

        <p className="text-[1.05rem] text-secondary max-w-[480px] mx-auto mb-9 leading-relaxed font-medium">
          Finally — anyone can discover rare items, bid in real time, and win.
          Every second counts.
        </p>

        {/* CTAs — HEX outlined rectangular style */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-10">
          <a href="#auctions"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-[8px]
                       bg-primary text-white text-[14.5px] font-semibold
                       hover:bg-[#2c2a38] active:scale-[0.97] transition-all
                       shadow-[0_2px_8px_rgba(26,24,37,0.22)]">
            Browse Auctions
            <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
          <a href="#how-it-works"
            className="inline-flex items-center px-7 py-3 rounded-[8px]
                       text-[14.5px] font-semibold text-primary
                       border-[1.5px] border-[rgba(26,24,37,0.25)]
                       hover:border-[rgba(26,24,37,0.5)] hover:bg-[rgba(26,24,37,0.04)]
                       active:scale-[0.97] transition-all">
            Request a demo
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex -space-x-2">
            {['#0071e3','#34aadc','#5ac8fa','#007aff'].map((c, i) => (
              <div key={i}
                className="w-[26px] h-[26px] rounded-full border-2 border-[#f5f4ef]
                           flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: c }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-[13px] text-secondary">
            <span className="font-semibold text-primary">2,400+</span> active bidders worldwide
          </span>
        </div>
      </section>

      {/* Live Auctions Section */}
      <section id="auctions" className="bg-surface/70 py-14 px-6">
        <div className="max-w-[1400px] mx-auto">

          {/* Mobile sidebar toggle */}
          <div className="xl:hidden mb-4 flex justify-end">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] font-medium
                         text-secondary bg-white border border-[rgba(26,24,37,0.1)]
                         hover:text-primary hover:border-[rgba(26,24,37,0.2)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {sidebarOpen ? 'Hide' : 'Show'} Live Feed
            </button>
          </div>

          {/* 3-column layout on xl, 1-column on smaller */}
          <div className="flex gap-6 items-start">

            {/* ── Main content (auctions grid) ───────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Section header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Live Auctions</h2>
                  <p className="text-sm text-secondary mt-0.5">Ending soon — bid before it's too late</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-live-red animate-pulse" />
                  <span className="text-xs font-semibold text-live-red uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1 max-w-md">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <input className="input pl-10 bg-white shadow-sm" placeholder="Search auctions…"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`badge px-4 py-2 rounded-pill text-sm font-medium transition-all
                      ${!selectedCategory ? 'bg-accent text-white shadow-btn' : 'bg-white text-secondary hover:text-primary border border-[rgba(29,28,31,0.1)]'}`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                      className={`badge px-4 py-2 rounded-pill text-sm font-medium transition-all
                        ${selectedCategory === cat.id ? 'bg-accent text-white shadow-btn' : 'bg-white text-secondary hover:text-primary border border-[rgba(29,28,31,0.1)]'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              {!loading && !error && (
                <p className="text-sm text-secondary mb-5">
                  {filtered.length} auction{filtered.length !== 1 ? 's' : ''} found
                  {search && ` for "${search}"`}
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-16">
                  <p className="text-red-500 font-medium mb-1">Failed to load auctions</p>
                  <p className="text-sm text-secondary">{error.message}</p>
                </div>
              )}

              {/* Skeleton */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {/* Grid */}
              {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((item) => <AuctionCard key={item.id} item={item} />)}
                </div>
              )}

              {/* Empty */}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔨</div>
                  <h3 className="text-lg font-semibold text-primary mb-2">No Auctions Found</h3>
                  <p className="text-secondary text-sm">
                    {search ? 'Try a different search term.' : 'No active auctions right now. Check back soon!'}
                  </p>
                </div>
              )}
            </div>

            {/* ── Right sidebar ──────────────────────────────────────── */}
            {/* Desktop: always visible. Mobile: collapsible */}
            <aside className={`w-[280px] shrink-0 flex flex-col gap-0
                               ${sidebarOpen ? 'block' : 'hidden'} xl:block`}>
              <ActivityFeed />
              <AuctionsEndingSoon />
            </aside>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <p className="label-muted mb-5">The Concierge Experience</p>
          <h2 className="text-[2.6rem] font-extrabold text-primary tracking-[-0.025em] mb-4">
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>
              Designed for
            </span>{' '}
            serious collectors.
          </h2>
          <p className="text-[1rem] text-secondary max-w-md mx-auto leading-relaxed">
            From rare electronics to vintage fashion — bid with precision on curated lots.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: '🎯', title: 'Discover Curated Lots', desc: 'Hand-picked items across categories — from rare electronics to vintage fashion.' },
            { icon: '⚡', title: 'Bid with Precision', desc: 'Real-time socket-powered bidding with instant updates. No page refreshes needed.' },
            { icon: '🏆', title: 'Seamless Completion', desc: 'Winners are notified instantly. Sellers track performance from a clean dashboard.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-card bg-accent-light flex items-center justify-center text-2xl shadow-sm">
                {icon}
              </div>
              <h3 className="font-semibold text-primary">{title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface/80 border-t border-[rgba(26,24,37,0.08)] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-bold text-primary mb-3">AuctionLive</p>
              <p className="text-xs text-secondary leading-relaxed">The premium platform for real-time online auctions.</p>
            </div>
            {[
              { label: 'Auctions', links: ['Browse All', 'Live Now', 'Ending Soon', 'Categories'] },
              { label: 'Company', links: ['About', 'Careers', 'Press', 'Blog'] },
              { label: 'Support', links: ['Help Center', 'Contact', 'Privacy Policy', 'Terms'] },
            ].map(({ label, links }) => (
              <div key={label}>
                <p className="label-muted mb-3">{label}</p>
                <ul className="flex flex-col gap-2">
                  {links.map((l) => (
                    <li key={l}><a href="#" className="text-xs text-secondary hover:text-primary transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="h-px bg-[rgba(29,28,31,0.06)] mb-6" />
          <p className="text-xs text-secondary text-center">© 2026 AuctionLive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
