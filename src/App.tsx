/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  LedgerEntry,
  Post,
  StreamMoment,
  LiveAlertEvent,
  PlatformSettings,
  PayoutRequest,
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { RoleSwitcherModal } from './components/RoleSwitcherModal.tsx';
import { CoinWalletModal } from './components/CoinWalletModal.tsx';
import { SendSupportModal } from './components/SendSupportModal.tsx';
import { LiveAlertToast } from './components/LiveAlertToast.tsx';
import { OBSOverlayView } from './components/OBSOverlayView.tsx';
import { CreatorProfile } from './components/CreatorProfile.tsx';
import { CreatorDashboard } from './components/CreatorDashboard.tsx';
import { CashoutModal } from './components/CashoutModal.tsx';
import { WallOfFame } from './components/WallOfFame.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { CommunityExtras } from './components/CommunityExtras.tsx';
import { WalletView } from './components/WalletView.tsx';
import { TransactionReceiptModal } from './components/TransactionReceiptModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { soundEngine } from './utils/audio.ts';
import { Search, Radio, Filter, Flame, Heart, Sparkles, Plus, ExternalLink, ShieldCheck } from 'lucide-react';

export default function App() {
  // Check if current route is dedicated OBS overlay view
  const isOverlayMode =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/overlay') || window.location.search.includes('obs=true'));

  if (isOverlayMode) {
    const params = new URLSearchParams(window.location.search);
    const creatorId = params.get('creatorId') || 'usr_nova';
    return <OBSOverlayView creatorId={creatorId} />;
  }

  // Main App State
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_sam',
    username: 'sam_prime',
    displayName: 'Sam',
    email: 'sam@sb.com',
    role: 'fan',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SamPrime',
    followersCount: 15,
    followingCount: 4,
    fanLevel: 'Gold',
    createdAt: '2026-10-10T08:00:00Z',
  });

  const [balance, setBalance] = useState<number>(1500);
  const [inrValue, setInrValue] = useState<number>(1500);
  const [settings, setSettings] = useState<PlatformSettings>({
    coinToInrRate: 1.0,
    platformFeePercent: 10,
    welcomeBonus: 100,
    minCashoutCoins: 100,
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('creators');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('usr_nova');
  const [creators, setCreators] = useState<User[]>([]);
  const [selectedCreatorData, setSelectedCreatorData] = useState<{
    creator: User;
    streamMoments: StreamMoment[];
    posts: Post[];
  } | null>(null);

  // Search & Categories for Creator Directory
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Ledger history
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntry[]>([]);

  // Modals
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [sendSupportModalOpen, setSendSupportModalOpen] = useState<boolean>(false);
  const [cashoutModalOpen, setCashoutModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<LedgerEntry | null>(null);

  // Real-time alerts
  const [currentAlertToast, setCurrentAlertToast] = useState<LiveAlertEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('sb_theme') === 'dark' ||
        (!('sb_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('sb_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('sb_theme', 'light');
    }
  }, [isDark]);

  // Initial Load
  useEffect(() => {
    loadSession();
    loadCreators();
    loadLedger();

    // Subscribe to SSE real-time stream alerts
    const eventSource = new EventSource('/api/alerts/stream');
    eventSource.onmessage = (event) => {
      try {
        const alert: LiveAlertEvent = JSON.parse(event.data);
        setCurrentAlertToast(alert);
        setUnreadCount((c) => c + 1);

        // Sound chime
        if (alert.tier === 'tier1') soundEngine.playTier1();
        else if (alert.tier === 'tier2') soundEngine.playTier2();
        else if (alert.tier === 'tier3') soundEngine.playTier3();
        else if (alert.tier === 'tier4') soundEngine.playTier4();
        else soundEngine.playCoinDrop();

        // Refresh balance and ledger in case we were sender/receiver
        loadSession();
        loadLedger();
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // When selected creator changes, load profile details
  useEffect(() => {
    if (selectedCreatorId) {
      loadCreatorProfile(selectedCreatorId);
    }
  }, [selectedCreatorId]);

  const loadSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setBalance(data.balance);
        setInrValue(data.inrValue);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCreators = async () => {
    try {
      const res = await fetch(`/api/creators?search=${encodeURIComponent(searchQuery)}&category=${categoryFilter}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCreatorProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/creators/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCreatorData({
          creator: data.creator,
          streamMoments: data.streamMoments,
          posts: data.posts,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLedger = async () => {
    try {
      const res = await fetch('/api/wallet/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedgerHistory(data.history || []);
        setBalance(data.balance);
        setInrValue(data.inrValue);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchUser = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setBalance(data.balance);
        setInrValue(data.inrValue);

        // Adjust tab if appropriate
        if (role === 'creator') {
          setSelectedCreatorId(data.user.id);
          setActiveTab('creator-dashboard');
        } else if (role === 'admin') {
          setActiveTab('admin-panel');
        } else {
          setActiveTab('creators');
        }

        loadLedger();
        loadCreators();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async () => {
    if (!selectedCreatorData) return;
    try {
      const res = await fetch(`/api/creators/${selectedCreatorData.creator.id}/follow`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCreatorData((prev) =>
          prev
            ? {
                ...prev,
                creator: {
                  ...prev.creator,
                  followersCount: data.followersCount,
                  isFollowedByMe: data.isFollowedByMe,
                },
              }
            : null
        );
        loadCreators();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportContent = async (type: 'user' | 'post' | 'comment', id: string, text: string) => {
    try {
      await fetch('/api/safety/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: type,
          targetId: id,
          targetContent: text,
          reason: 'User flagged in community review',
        }),
      });
      alert('Content reported to platform administrators for review.');
    } catch (err) {
      console.error(err);
    }
  };

  // Active creator to send support to
  const activeCreatorForSupport =
    selectedCreatorData?.creator || creators.find((c) => c.id === selectedCreatorId) || creators[0] || currentUser;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors">
      {/* Live Alert Toast notification */}
      <LiveAlertToast alert={currentAlertToast} onDismiss={() => setCurrentAlertToast(null)} />

      {/* Top Navbar adhering to Top Bar Contract */}
      <Navbar
        currentUser={currentUser}
        balance={balance}
        unreadCount={unreadCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWallet={() => setWalletModalOpen(true)}
        onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
        onOpenNotifications={() => {
          setUnreadCount(0);
          setActiveTab('wallet');
        }}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isDark={isDark}
        setIsDark={setIsDark}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* VIEW 1: CREATORS DIRECTORY */}
        {activeTab === 'creators' && (
          <div className="space-y-6 pb-12">
            {/* Hero Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-800 text-white shadow-md relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Support Your Favourite Streamers</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Send Supercoins & Supergifts to Live Creators
                </h1>
                <p className="text-sm text-white/85 mt-2 leading-relaxed">
                  Fuel their stream grind, pop up on their live OBS overlay with custom animations, and climb the weekly
                  Wall of Fame!
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button
                    onClick={() => setWalletModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <div className="sb-coin w-4 h-4 text-[10px]">🪙</div>
                    <span>Recharge Coins (Get +100 Bonus)</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCreatorId('usr_nova');
                      setActiveTab('creator-profile');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs border border-white/20 cursor-pointer"
                  >
                    View Live Streamer Profile →
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Category Segmented Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-color)]">
                {['all', 'Gaming', 'Art', 'Music', 'Tech'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setTimeout(loadCreators, 50);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search streamer or game..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={loadCreators}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                />
              </div>
            </div>

            {/* Creators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs hover:border-[var(--accent-violet)]/60 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Preview */}
                    <div className="h-28 w-full bg-gradient-to-r from-violet-700 to-indigo-800 relative overflow-hidden">
                      {c.coverUrl && (
                        <img
                          src={c.coverUrl}
                          alt="Cover"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {c.isLive && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wide uppercase flex items-center gap-1 animate-pulse shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>LIVE</span>
                        </span>
                      )}
                      {c.category && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-[10px]">
                          {c.category}
                        </span>
                      )}
                    </div>

                    {/* Avatar & Creator Info */}
                    <div className="p-5 pt-0 relative">
                      <div className="flex items-end justify-between -mt-10 mb-3">
                        <img
                          src={c.avatarUrl}
                          alt={c.displayName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover border-3 border-[var(--bg-card)] shadow-md bg-[var(--bg-card)]"
                        />
                        <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                          {c.followersCount} followers
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-[var(--text-main)] group-hover:text-[var(--accent-violet)] transition-colors">
                        {c.displayName}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">@{c.username}</p>

                      {c.streamTitle && (
                        <div className="mt-2 text-xs font-semibold text-[var(--text-main)] line-clamp-1 bg-[var(--bg-subtle)] p-2 rounded-lg border border-[var(--border-color)]">
                          🎮 {c.streamTitle}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{c.bio}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 border-t border-[var(--border-color)] mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCreatorId(c.id);
                        setActiveTab('creator-profile');
                      }}
                      className="flex-1 py-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--text-main)] text-center cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCreatorId(c.id);
                        setSendSupportModalOpen(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-[var(--accent-violet)] text-white text-xs font-bold hover:opacity-95 text-center flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <div className="sb-coin w-3.5 h-3.5 text-[9px]">🪙</div>
                      <span>Send Support</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: CREATOR PROFILE (MINI-INSTAGRAM) */}
        {activeTab === 'creator-profile' && selectedCreatorData && (
          <CreatorProfile
            creator={selectedCreatorData.creator}
            currentUser={currentUser}
            currentUserBalance={balance}
            onOpenSendSupport={() => setSendSupportModalOpen(true)}
            onOpenWallet={() => setWalletModalOpen(true)}
            onFollowToggle={handleFollowToggle}
            isFollowedByMe={!!selectedCreatorData.creator.isFollowedByMe}
            followersCount={selectedCreatorData.creator.followersCount}
            streamMoments={selectedCreatorData.streamMoments}
            posts={selectedCreatorData.posts}
            onRefreshPosts={() => loadCreatorProfile(selectedCreatorData.creator.id)}
            onReportContent={handleReportContent}
          />
        )}

        {/* VIEW 3: COMMUNITY FEED & POLLS */}
        {activeTab === 'feed' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <CommunityExtras
              currentUser={currentUser}
              currentUserBalance={balance}
              creators={creators}
              onOpenWallet={() => setWalletModalOpen(true)}
              onCoinsDeducted={(newBal) => setBalance(newBal)}
            />
          </div>
        )}

        {/* VIEW 4: WALLET & TRANSACTION LEDGER */}
        {activeTab === 'wallet' && (
          <WalletView
            currentUser={currentUser}
            balance={balance}
            inrValue={inrValue}
            settings={settings}
            ledgerHistory={ledgerHistory}
            onOpenBuyCoins={() => setWalletModalOpen(true)}
            onOpenReceipt={(entry) => {
              setSelectedReceipt(entry);
              setReceiptModalOpen(true);
            }}
            onOpenCashout={() => setCashoutModalOpen(true)}
          />
        )}

        {/* VIEW 5: WEEKLY WALL OF FAME */}
        {activeTab === 'wall-of-fame' && (
          <WallOfFame
            creators={creators}
            selectedCreatorId={selectedCreatorId}
            onSelectCreator={(id) => setSelectedCreatorId(id)}
            onOpenSendSupport={() => setSendSupportModalOpen(true)}
          />
        )}

        {/* VIEW 6: CREATOR DASHBOARD (STUDIO) */}
        {activeTab === 'creator-dashboard' && (
          <CreatorDashboard
            creator={currentUser}
            balance={balance}
            inrValue={inrValue}
            recentGifts={ledgerHistory.filter((l) => l.type === 'gift_received')}
            onOpenCashout={() => setCashoutModalOpen(true)}
            onOpenWallOfFame={() => setActiveTab('wall-of-fame')}
          />
        )}

        {/* VIEW 7: ADMIN OPERATIONS CONSOLE */}
        {activeTab === 'admin-panel' && <AdminPanel />}
      </main>

      {/* MODALS */}
      <RoleSwitcherModal
        isOpen={roleSwitcherOpen}
        onClose={() => setRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      <CoinWalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        currentBalance={balance}
        onCoinsPurchased={(addedCoins, newBal) => {
          setBalance(newBal);
          setInrValue(newBal * settings.coinToInrRate);
          loadLedger();
        }}
      />

      <SendSupportModal
        isOpen={sendSupportModalOpen}
        onClose={() => setSendSupportModalOpen(false)}
        creator={activeCreatorForSupport}
        currentUserBalance={balance}
        onOpenWallet={() => setWalletModalOpen(true)}
        onSupportSent={(receiptCode, newBal, alert) => {
          setBalance(newBal);
          setInrValue(newBal * settings.coinToInrRate);
          loadLedger();
          if (selectedCreatorData) loadCreatorProfile(selectedCreatorData.creator.id);
        }}
      />

      <CashoutModal
        isOpen={cashoutModalOpen}
        onClose={() => setCashoutModalOpen(false)}
        availableBalance={balance}
        settings={settings}
        onCashoutRequested={(payout, newBal) => {
          setBalance(newBal);
          setInrValue(newBal * settings.coinToInrRate);
          loadLedger();
        }}
      />

      <TransactionReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        entry={selectedReceipt}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user, bal) => {
          setCurrentUser(user);
          setBalance(bal);
          setInrValue(bal * settings.coinToInrRate);
          loadLedger();
          loadCreators();
        }}
      />
    </div>
  );
}
