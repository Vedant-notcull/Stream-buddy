import React from 'react';
import { LedgerEntry, User, PlatformSettings } from '../types/index.ts';
import { Coins, Plus, FileText, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface WalletViewProps {
  currentUser: User;
  balance: number;
  inrValue: number;
  settings: PlatformSettings;
  ledgerHistory: LedgerEntry[];
  onOpenBuyCoins: () => void;
  onOpenReceipt: (entry: LedgerEntry) => void;
  onOpenCashout?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  balance,
  inrValue,
  settings,
  ledgerHistory,
  onOpenBuyCoins,
  onOpenReceipt,
  onOpenCashout,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Wallet Hero Card */}
      <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              {currentUser.displayName}'s Coin Wallet
            </span>
            <div className="flex items-center gap-3">
              <div className="sb-coin w-10 h-10 text-xl">🪙</div>
              <span className="text-4xl sm:text-5xl font-black text-[var(--text-main)] tabular-nums">
                {balance.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-[var(--text-muted)]">Coins</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Estimated Real-Money Valuation:{' '}
              <span className="font-extrabold text-[var(--color-success)] text-sm tabular-nums">
                ₹{inrValue.toLocaleString()}
              </span>{' '}
              (Rate: 1 coin = ₹{settings.coinToInrRate.toFixed(2)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenBuyCoins}
              className="px-5 py-3 rounded-2xl bg-[var(--accent-violet)] text-white text-xs font-extrabold hover:opacity-95 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buy Coin Packs</span>
            </button>

            {currentUser.role === 'creator' && onOpenCashout && (
              <button
                onClick={onOpenCashout}
                className="px-5 py-3 rounded-2xl bg-[var(--color-success)] text-white text-xs font-extrabold hover:opacity-95 shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Cash Out / Vouchers</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledger History Table */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[var(--text-main)]">Immutable Transaction Ledger</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Every coin movement is an auditable row with downloadable verification receipts
            </p>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono">{ledgerHistory.length} total entries</span>
        </div>

        {ledgerHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4">Receipt Ref</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description / Details</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {ledgerHistory.map((row) => {
                  const isPositive = row.amount > 0;
                  const typeLabels: Record<string, { label: string; badge: string }> = {
                    purchase: { label: 'Pack Purchase', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
                    bonus: { label: 'Welcome Bonus', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
                    gift_sent: { label: 'Gift Sent', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                    gift_received: { label: 'Gift Received', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
                    payout: { label: 'Cashout Payout', badge: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
                    payout_refund: { label: 'Payout Refund', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
                    voucher: { label: 'Voucher Redeem', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
                    poll_vote: { label: 'Poll Vote', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                    paid_question: { label: 'Priority Q&A', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                  };

                  const typeInfo = typeLabels[row.type] || {
                    label: row.type,
                    badge: 'bg-slate-100 text-slate-700',
                  };

                  return (
                    <tr key={row.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[var(--text-main)] text-[11px]">
                        {row.receiptCode}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)] font-mono text-[11px]">
                        {new Date(row.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeInfo.badge}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-main)]">
                        {row.counterpartyName ? (
                          <span>
                            {row.type === 'gift_sent' ? 'To ' : 'From '}
                            <span className="font-bold">{row.counterpartyName}</span>{' '}
                            {row.giftName ? `(${row.giftName})` : ''}
                          </span>
                        ) : (
                          <span>{row.message || 'Standard balance adjustment'}</span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black text-xs tabular-nums ${
                          isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                        }`}
                      >
                        {isPositive ? `+${row.amount}` : row.amount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-main)] tabular-nums">
                        {row.balanceAfter}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenReceipt(row)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-[11px] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
