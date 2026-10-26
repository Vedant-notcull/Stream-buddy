import React, { useState, useEffect } from 'react';
import { PayoutRequest, PlatformSettings, SafetyReport, LedgerEntry } from '../types/index.ts';
import {
  Shield,
  Users,
  Coins,
  CheckCircle,
  XCircle,
  Settings,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface AdminStats {
  fansCount: number;
  creatorsCount: number;
  coinsSold: number;
  coinsGifted: number;
  pendingPayoutsCount: number;
  pendingPayoutsValue: number;
  totalFeesEarned: number;
  settings: PlatformSettings;
}

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [activeTab, setActiveTab] = useState<'payouts' | 'rates' | 'safety'>('payouts');

  // Rate editing form
  const [coinRate, setCoinRate] = useState<number>(1.0);
  const [feePercent, setFeePercent] = useState<number>(10);
  const [ratesSaved, setRatesSaved] = useState<boolean>(false);

  // Rejection modal
  const [rejectingPayoutId, setRejectingPayoutId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [resStats, resPayouts] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/payouts'),
      ]);

      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data);
        setCoinRate(data.settings.coinToInrRate);
        setFeePercent(data.settings.platformFeePercent);
      }
      if (resPayouts.ok) {
        const data = await resPayouts.json();
        setPayouts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayoutAction = async (payoutId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setRejectingPayoutId(null);
        setRejectReason('');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinToInrRate: coinRate,
          platformFeePercent: feePercent,
        }),
      });
      if (res.ok) {
        setRatesSaved(true);
        setTimeout(() => setRatesSaved(false), 2500);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-violet)] flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Admin Operations Console</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Financial governance, payout approvals, platform rates, and community moderation
            </p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] text-[var(--text-muted)]"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Global KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Active Fans</span>
            <span className="text-xl font-black text-[var(--text-main)] tabular-nums">{stats.fansCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Creators</span>
            <span className="text-xl font-black text-[var(--text-main)] tabular-nums">{stats.creatorsCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Coins Sold</span>
            <span className="text-xl font-black text-[var(--accent-violet)] tabular-nums">
              {stats.coinsSold.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Coins Gifted</span>
            <span className="text-xl font-black text-amber-500 tabular-nums">
              {stats.coinsGifted.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Pending Payouts</span>
            <span className="text-xl font-black text-[var(--color-error)] tabular-nums">
              {stats.pendingPayoutsCount}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Fees Earned (₹)</span>
            <span className="text-xl font-black text-[var(--color-success)] tabular-nums">
              ₹{stats.totalFeesEarned.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`py-3 px-5 text-xs font-bold transition-all relative ${
            activeTab === 'payouts'
              ? 'text-[var(--accent-violet)] border-b-2 border-[var(--accent-violet)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Payout Requests ({payouts.filter((p) => p.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`py-3 px-5 text-xs font-bold transition-all relative ${
            activeTab === 'rates'
              ? 'text-[var(--accent-violet)] border-b-2 border-[var(--accent-violet)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Rate & Fee Configurations
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`py-3 px-5 text-xs font-bold transition-all relative ${
            activeTab === 'safety'
              ? 'text-[var(--accent-violet)] border-b-2 border-[var(--accent-violet)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Safety & Moderation Review
        </button>
      </div>

      {/* Tab 1: Payout Approvals */}
      {activeTab === 'payouts' && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="font-bold text-xs text-[var(--text-main)]">Creator Cashout & Voucher Queue</h3>
            <span className="text-xs text-[var(--text-muted)]">
              Rejecting automatically refunds coins back to the creator's ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Method & VPA</th>
                  <th className="py-3 px-4 text-right">Coins</th>
                  <th className="py-3 px-4 text-right">Fee Deducted</th>
                  <th className="py-3 px-4 text-right">Net Payout (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">{p.creatorName}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {p.destination} {p.voucherCode ? `(Code: ${p.voucherCode})` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold tabular-nums">{p.coinsAmount}</td>
                    <td className="py-3 px-4 text-right text-[var(--color-error)] font-bold tabular-nums">
                      -₹{p.feeDeducted}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--color-success)] font-black text-sm tabular-nums">
                      ₹{p.inrAmount}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePayoutAction(p.id, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-[var(--color-success)] text-white font-bold hover:opacity-95"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingPayoutId(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:opacity-95"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rate Configurations */}
      {activeTab === 'rates' && (
        <form
          onSubmit={handleSaveRates}
          className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs max-w-xl space-y-4"
        >
          <h3 className="font-bold text-sm text-[var(--text-main)]">Platform Rates & Monetization Rules</h3>

          <div>
            <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
              Coin-to-Rupee Exchange Rate (₹ per 1 Coin)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              value={coinRate}
              onChange={(e) => setCoinRate(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] font-mono font-bold"
            />
            <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Default: 1.00 (1 coin = ₹1.00)</span>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-main)] block mb-1">
              Platform Fee Percentage on Payouts (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={feePercent}
              onChange={(e) => setFeePercent(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] font-mono font-bold"
            />
            <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
              Deducted during cashout. Default: 10%
            </span>
          </div>

          {ratesSaved && (
            <p className="text-xs text-[var(--color-success)] font-bold animate-fade-in">
              ✓ Platform rates updated successfully!
            </p>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-violet)] text-white text-xs font-bold hover:opacity-95"
          >
            Save Configuration
          </button>
        </form>
      )}

      {/* Tab 3: Safety & Moderation */}
      {activeTab === 'safety' && (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[var(--text-main)]">Community Safety & Content Filtering</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Built-in offensive word blacklist active: words like "abuse", "cheat", "scam", "trash" are rejected on send.
            Review flagged user reports below.
          </p>

          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs text-center text-[var(--text-muted)]">
            All user inputs are escaped and sanitized. No pending safety violations reported in current queue.
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingPayoutId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-modal space-y-3">
            <h3 className="font-bold text-sm text-[var(--text-main)]">Reject & Refund Payout</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Specify the reason for rejecting this payout. The coins will be atomically credited back to the creator's
              ledger.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Invalid UPI handle or KYC compliance failure"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingPayoutId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayoutAction(rejectingPayoutId, 'reject', rejectReason)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:opacity-95"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
