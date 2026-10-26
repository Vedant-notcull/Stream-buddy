import React, { useState } from 'react';
import { User, LedgerEntry } from '../types/index.ts';
import {
  TrendingUp,
  Users,
  Coins,
  DollarSign,
  ArrowUpRight,
  ExternalLink,
  Radio,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Volume2,
} from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';

interface CreatorDashboardProps {
  creator: User;
  balance: number;
  inrValue: number;
  recentGifts: LedgerEntry[];
  onOpenCashout: () => void;
  onOpenWallOfFame: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  creator,
  balance,
  inrValue,
  recentGifts,
  onOpenCashout,
  onOpenWallOfFame,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);

  // 7-day earnings mock computation from ledger
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  const dailyEarnings = [150, 320, 210, 480, 650, 920, balance > 1000 ? 550 : 280];
  const maxDay = Math.max(...dailyEarnings, 1000);

  const copyObsUrl = () => {
    const url = `${window.location.origin}/overlay?creatorId=${creator.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendTestAlert = async (tier: 'tier1' | 'tier2' | 'tier3' | 'tier4') => {
    try {
      setTestSent(true);
      await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: creator.id, tier }),
      });
      setTimeout(() => setTestSent(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Studio Header Banner */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--accent-tint)] text-[var(--accent-violet)] text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Creator Broadcast Studio</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
            Welcome back, {creator.displayName}!
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Monitor real-time stream earnings, cash out to UPI or digital vouchers, and manage OBS overlays.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCashout}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-success)] text-white text-xs font-extrabold hover:opacity-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Cash Out</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-medium">
            <span>Available Coins</span>
            <div className="sb-coin w-4 h-4 text-[9px]">🪙</div>
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
            {balance.toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--accent-violet)] font-bold mt-1">Ready to cash out</p>
        </div>

        {/* Estimated Rupee Value */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-medium">
            <span>Estimated Value</span>
            <span className="font-bold text-xs text-emerald-600">₹ INR</span>
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
            ₹{inrValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Rate: 1 coin = ₹1.00</p>
        </div>

        {/* Coins This Week */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-medium">
            <span>Earnings This Week</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
            +{recentGifts.reduce((s, g) => s + g.amount, 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--color-success)] font-bold mt-1">↑ 24% vs last week</p>
        </div>

        {/* Supporters Count */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 font-medium">
            <span>Active Supporters</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
            {creator.followersCount.toLocaleString()}
          </div>
          <button
            onClick={onOpenWallOfFame}
            className="text-[11px] text-[var(--accent-violet)] font-bold mt-1 hover:underline block text-left"
          >
            View Wall of Fame →
          </button>
        </div>
      </div>

      {/* Grid: 7-Day Chart & OBS Overlay Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Earnings Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-sm text-[var(--text-main)]">7-Day Stream Revenue</h3>
              <p className="text-xs text-[var(--text-muted)]">Coins received per streaming day</p>
            </div>
            <span className="text-xs font-bold text-[var(--accent-violet)] px-2.5 py-1 rounded-lg bg-[var(--accent-tint)]">
              Total: {dailyEarnings.reduce((a, b) => a + b, 0).toLocaleString()} Coins
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 px-2 border-b border-[var(--border-color)]">
            {dailyEarnings.map((earn, i) => {
              const heightPct = Math.round((earn / maxDay) * 100);
              return (
                <div key={days[i]} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {earn}
                  </span>
                  <div className="w-full max-w-[40px] bg-[var(--bg-subtle)] rounded-t-lg overflow-hidden flex flex-col justify-end h-36">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        i === days.length - 1
                          ? 'bg-gradient-to-t from-[var(--accent-violet)] to-purple-400'
                          : 'bg-amber-400 group-hover:bg-amber-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-muted)]">{days[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* OBS Stream Overlay Tool Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <h3 className="font-extrabold text-sm text-[var(--text-main)]">OBS Live Overlay</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Add real-time animated popup alerts to your Twitch/YouTube stream in OBS Studio.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Browser Source URL:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/overlay?creatorId=${creator.id}`}
                  className="w-full text-[11px] font-mono p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] truncate"
                />
                <button
                  onClick={copyObsUrl}
                  className="p-2 rounded-lg bg-[var(--accent-violet)] text-white hover:opacity-90 shrink-0"
                  title="Copy URL"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Test Alert Buttons */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-[var(--text-main)] block">Send Test Stream Alert:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendTestAlert('tier1')}
                  className="p-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-[var(--border-color)] text-xs font-bold text-left flex items-center gap-1.5"
                >
                  <span>🌹</span>
                  <span>Rose (10)</span>
                </button>
                <button
                  onClick={() => handleSendTestAlert('tier2')}
                  className="p-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-[var(--border-color)] text-xs font-bold text-left flex items-center gap-1.5"
                >
                  <span>☕</span>
                  <span>Coffee (50)</span>
                </button>
                <button
                  onClick={() => handleSendTestAlert('tier3')}
                  className="p-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-yellow-50 dark:hover:bg-yellow-950/40 border border-[var(--border-color)] text-xs font-bold text-left flex items-center gap-1.5"
                >
                  <span>🏆</span>
                  <span>Trophy (500)</span>
                </button>
                <button
                  onClick={() => handleSendTestAlert('tier4')}
                  className="p-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-[var(--border-color)] text-xs font-bold text-left flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>Rocket (1000)</span>
                </button>
              </div>
              {testSent && (
                <p className="text-[11px] font-bold text-[var(--color-success)] text-center animate-fade-in">
                  ✓ Test alert fired to overlay!
                </p>
              )}
            </div>
          </div>

          <a
            href={`/overlay?creatorId=${creator.id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 w-full py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-center text-[var(--text-main)] hover:bg-[var(--bg-subtle)] flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Dedicated Overlay Tab</span>
          </a>
        </div>
      </div>

      {/* Recent Gifts Received Table */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-[var(--text-main)]">Recent Gifts Received</h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">{recentGifts.length} transactions</span>
        </div>

        {recentGifts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-muted)]">No gifts received yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold">
                  <th className="py-2.5 px-3">Supporter</th>
                  <th className="py-2.5 px-3">Gift</th>
                  <th className="py-2.5 px-3 text-right">Coins</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {recentGifts.slice(0, 8).map((gift) => (
                  <tr key={gift.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[var(--text-main)]">
                      {gift.isAnonymous ? 'Fan #Anonymous' : gift.counterpartyName || 'Supporter'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] font-semibold text-[var(--accent-violet)]">
                        {gift.giftName || 'Supercoins'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[var(--color-success)] tabular-nums">
                      +{gift.amount}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] max-w-xs truncate italic">
                      {gift.message ? `"${gift.message}"` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--text-muted)] font-mono text-[11px]">
                      {new Date(gift.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
};
