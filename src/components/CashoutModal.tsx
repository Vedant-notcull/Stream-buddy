import React, { useState, useEffect } from 'react';
import { PayoutRequest, PlatformSettings } from '../types/index.ts';
import { X, ArrowUpRight, Gift, CheckCircle2, AlertCircle, Building, Smartphone, ShoppingBag, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  settings: PlatformSettings;
  onCashoutRequested: (payout: PayoutRequest, newBalance: number) => void;
}

export const CashoutModal: React.FC<CashoutModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  settings,
  onCashoutRequested,
}) => {
  const [tab, setTab] = useState<'upi' | 'voucher' | 'history'>('upi');

  // UPI Cashout state
  const [coinsToCashout, setCoinsToCashout] = useState<number>(200);
  const [upiId, setUpiId] = useState<string>('');

  // Voucher state
  const [selectedVoucherProvider, setSelectedVoucherProvider] = useState<string>('Amazon India');
  const [voucherCoins, setVoucherCoins] = useState<number>(100);

  // History list
  const [payoutsHistory, setPayoutsHistory] = useState<PayoutRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<PayoutRequest | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/payouts');
      if (res.ok) {
        const data = await res.json();
        setPayoutsHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  // Real-time calculations
  const grossInr = coinsToCashout * settings.coinToInrRate;
  const feeDeducted = Math.round((grossInr * settings.platformFeePercent) / 100);
  const netInr = grossInr - feeDeducted;

  const voucherGrossInr = voucherCoins * settings.coinToInrRate;
  const voucherFee = Math.round((voucherGrossInr * settings.platformFeePercent) / 100);
  const voucherNetInr = voucherGrossInr - voucherFee;

  const handleRequestUpiPayout = async () => {
    setErrorMsg(null);
    setSuccessResult(null);

    if (coinsToCashout < settings.minCashoutCoins) {
      setErrorMsg(`Minimum cashout is ${settings.minCashoutCoins} coins.`);
      return;
    }

    if (coinsToCashout > availableBalance) {
      setErrorMsg(`Insufficient coins. You have ${availableBalance} coins available.`);
      return;
    }

    if (!upiId.trim() || !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. yourname@okhdfcbank)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'upi',
          coinsAmount: coinsToCashout,
          destination: upiId.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payout request failed');

      soundEngine.playCoinDrop();
      setSuccessResult(data.payout);
      onCashoutRequested(data.payout, data.newBalance);
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeemVoucher = async () => {
    setErrorMsg(null);
    setSuccessResult(null);

    if (voucherCoins < settings.minCashoutCoins) {
      setErrorMsg(`Minimum voucher redemption is ${settings.minCashoutCoins} coins.`);
      return;
    }

    if (voucherCoins > availableBalance) {
      setErrorMsg(`Insufficient coins. You have ${availableBalance} coins available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'voucher',
          coinsAmount: voucherCoins,
          destination: selectedVoucherProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voucher redemption failed');

      soundEngine.playTier2();
      setSuccessResult(data.payout);
      onCashoutRequested(data.payout, data.newBalance);
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Voucher redemption failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-modal relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[var(--color-success)] font-bold">
              ₹
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-main)]">Creator Cash Out & Vouchers</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Available to Withdraw:{' '}
                <span className="font-extrabold text-[var(--text-main)] tabular-nums">
                  {availableBalance.toLocaleString()} coins
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] mt-4">
          <button
            onClick={() => {
              setTab('upi');
              setSuccessResult(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'upi'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Direct UPI Transfer
          </button>
          <button
            onClick={() => {
              setTab('voucher');
              setSuccessResult(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'voucher'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Gift Vouchers
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'history'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Activity History
          </button>
        </div>

        {/* Success Confirmation Card */}
        {successResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 animate-modal text-xs">
            <div className="flex items-center gap-2 mb-2 text-[var(--color-success)] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {successResult.type === 'upi' ? 'UPI Payout Request Submitted!' : 'Voucher Code Generated!'}
              </span>
            </div>
            {successResult.voucherCode ? (
              <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] my-2 font-mono text-center">
                <span className="text-[10px] text-[var(--text-muted)] block">YOUR REDEMPTION CODE:</span>
                <span className="text-base font-black text-[var(--accent-violet)] tracking-widest">
                  {successResult.voucherCode}
                </span>
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">
                Your request of ₹{successResult.inrAmount} has been sent to the admin queue. Payouts are reviewed and
                credited within 24 hours.
              </p>
            )}
          </div>
        )}

        {/* Tab 1: UPI Cash Out */}
        {tab === 'upi' && (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-bold text-[var(--text-main)] block mb-1">Coins to Cash Out (Min 100)</label>
              <input
                type="number"
                min={100}
                max={availableBalance}
                step={50}
                value={coinsToCashout}
                onChange={(e) => setCoinsToCashout(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm font-extrabold tabular-nums rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
              />
            </div>

            <div>
              <label className="font-bold text-[var(--text-main)] block mb-1">Your UPI ID (VPA)</label>
              <input
                type="text"
                placeholder="streamer@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Works with Google Pay, PhonePe, Paytm, BHIM and all Indian bank UPI IDs.
              </span>
            </div>

            {/* Live Fee Breakdown Box */}
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Gross Value ({coinsToCashout} coins @ ₹1):</span>
                <span className="font-bold text-[var(--text-main)] tabular-nums">₹{grossInr}</span>
              </div>
              <div className="flex justify-between text-[var(--color-error)]">
                <span>Platform Fee ({settings.platformFeePercent}%):</span>
                <span className="font-bold tabular-nums">-₹{feeDeducted}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border-color)] flex justify-between text-sm font-extrabold">
                <span className="text-[var(--text-main)]">Net Amount to Receive:</span>
                <span className="text-[var(--color-success)] tabular-nums">₹{netInr}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[var(--color-error)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleRequestUpiPayout}
              disabled={isSubmitting || coinsToCashout < settings.minCashoutCoins || coinsToCashout > availableBalance}
              className="w-full py-2.5 rounded-xl bg-[var(--color-success)] text-white font-bold hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : `Confirm Cash Out of ₹${netInr}`}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Gift Vouchers */}
        {tab === 'voucher' && (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-bold text-[var(--text-main)] block mb-1.5">Choose Voucher Brand</label>
              <div className="grid grid-cols-3 gap-2">
                {['Amazon India', 'Swiggy', 'Steam'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedVoucherProvider(v)}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      selectedVoucherProvider === v
                        ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)] shadow-xs'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mx-auto mb-1" />
                    <span>{v}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-[var(--text-main)] block mb-1">Redeem Amount in Coins</label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setVoucherCoins(amt)}
                    className={`py-2 rounded-xl border font-extrabold text-xs tabular-nums ${
                      voucherCoins === amt
                        ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                        : 'border-[var(--border-color)] text-[var(--text-main)]'
                    }`}
                  >
                    {amt} coins
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Voucher Value:</span>
                <span className="font-extrabold text-[var(--text-main)] tabular-nums">₹{voucherNetInr}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                <span>Platform Processing:</span>
                <span className="tabular-nums font-mono">{settings.platformFeePercent}% deducted</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[var(--color-error)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleRedeemVoucher}
              disabled={isSubmitting || voucherCoins > availableBalance}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>{isSubmitting ? 'Redeeming...' : `Instant Redeem ₹${voucherNetInr} Voucher`}</span>
            </button>
          </div>
        )}

        {/* Tab 3: History */}
        {tab === 'history' && (
          <div className="mt-4 space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
            {isLoadingHistory ? (
              <p className="text-center py-4 text-[var(--text-muted)]">Loading payouts...</p>
            ) : payoutsHistory.length === 0 ? (
              <p className="text-center py-4 text-[var(--text-muted)]">No cashout requests yet.</p>
            ) : (
              payoutsHistory.map((p) => {
                const statusStyles = {
                  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                  rejected: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
                };
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[var(--text-main)] uppercase">
                          {p.type === 'upi' ? 'UPI Payout' : `${p.destination} Voucher`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[p.status]}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                        {p.destination} {p.voucherCode ? `• Code: ${p.voucherCode}` : ''}
                      </p>
                      {p.rejectionReason && (
                        <p className="text-[10px] text-[var(--color-error)] mt-1">Reason: {p.rejectionReason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm text-[var(--text-main)] tabular-nums">₹{p.inrAmount}</div>
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-mono">
                        {p.coinsAmount} coins
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
