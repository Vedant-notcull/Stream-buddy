import React from 'react';
import { User } from '../types/index.ts';
import { Bell, Volume2, VolumeX, Moon, Sun, Shield, Sparkles, UserCheck, FileText } from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';

interface NavbarProps {
  currentUser: User;
  balance: number;
  unreadCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWallet: () => void;
  onOpenRoleSwitcher: () => void;
  onOpenNotifications: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  balance,
  unreadCount,
  activeTab,
  setActiveTab,
  onOpenWallet,
  onOpenRoleSwitcher,
  onOpenNotifications,
  soundEnabled,
  setSoundEnabled,
  isDark,
  setIsDark,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-color)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('creators')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-sm border border-amber-300">
            <span className="text-amber-950 font-black text-sm">SB</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[var(--text-main)] whitespace-nowrap">
            Streamer Buddy
          </span>
        </div>

        {/* Zone 2: 4–5 Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
          <button
            onClick={() => setActiveTab('creators')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'creators'
                ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                : 'hover:text-[var(--text-main)]'
            }`}
          >
            Creators
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'feed'
                ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                : 'hover:text-[var(--text-main)]'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'wallet'
                ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                : 'hover:text-[var(--text-main)]'
            }`}
          >
            Wallet & Ledger
          </button>
          <button
            onClick={() => setActiveTab('wall-of-fame')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'wall-of-fame'
                ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                : 'hover:text-[var(--text-main)]'
            }`}
          >
            Wall of Fame
          </button>
          {currentUser.role === 'creator' && (
            <button
              onClick={() => setActiveTab('creator-dashboard')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'creator-dashboard'
                  ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                  : 'hover:text-[var(--text-main)]'
              }`}
            >
              Creator Studio
            </button>
          )}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin-panel')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1 ${
                activeTab === 'admin-panel'
                  ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                  : 'hover:text-[var(--text-main)]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
          <button
            onClick={() => setActiveTab('documentation')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1 ${
              activeTab === 'documentation'
                ? 'text-[var(--accent-violet)] font-bold border-b-2 border-[var(--accent-violet)]'
                : 'hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Black Book (PDF)</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Signature Coin Balance Chip */}
          <button
            onClick={onOpenWallet}
            title="Click to recharge or view ledger"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--accent-tint)] border border-[var(--border-color)] transition-colors group cursor-pointer"
          >
            <div className="sb-coin w-5 h-5 text-xs">🪙</div>
            <span className="text-sm font-extrabold text-[var(--text-main)] tabular-nums group-hover:text-[var(--accent-violet)]">
              {balance.toLocaleString()}
            </span>
            <span className="hidden sm:inline text-xs text-[var(--accent-violet)] font-semibold">+ Buy</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEngine.enabled = next;
              if (next) soundEngine.playCoinDrop();
            }}
            title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            aria-label="Sound settings"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--color-success)]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title="Toggle light/dark theme"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            aria-label="Theme toggle"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-error)]" />
            )}
          </button>

          {/* Role Switcher Indicator Button */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)] border border-[var(--border-color)] transition-all cursor-pointer"
            title="Switch demo account"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-black/10"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[var(--text-main)] leading-none truncate max-w-[80px]">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] capitalize leading-none mt-0.5">
                {currentUser.role}
              </span>
            </div>
            <UserCheck className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
          </button>
        </div>
      </div>
    </header>
  );
};
