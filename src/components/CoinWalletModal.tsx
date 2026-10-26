import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, CreditCard, Smartphone, Building2, Download, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';
import confetti from 'canvas-confetti';

interface CoinWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onCoinsPurchased: (coins: number, newBalance: number) => void;
}

export const CoinWalletModal: React.FC<CoinWalletModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onCoinsPurchased,
}) => {
  const [selectedPack, setSelectedPack] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Form states
  const [upiOption, setUpiOption] = useState<'app' | 'id'>('app');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('GPay');
  const [customUpiId, setCustomUpiId] = useState<string>('');

  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'rupay' | 'unknown'>('unknown');

  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [purchasedEntry, setPurchasedEntry] = useState<any>(null);
  const [netBankingSimOpen, setNetBankingSimOpen] = useState<boolean>(false);

  // Animated balance count-up state
  const [displayedBalance, setDisplayedBalance] = useState<number>(currentBalance);

  useEffect(() => {
    setDisplayedBalance(currentBalance);
  }, [currentBalance]);

  if (!isOpen) return null;

  const packs = [
    { coins: 100, price: 100, tag: 'Starter' },
    { coins: 500, price: 500, tag: 'Popular', bonus: '+25 Bonus Coins' },
    { coins: 1000, price: 950, tag: 'Best Value', bonus: '+80 Bonus Coins' },
    { coins: 5000, price: 4500, tag: 'VIP Creator Backer', bonus: '+500 Bonus Coins' },
  ];

  // Card detection
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);

    if (raw.startsWith('4')) setCardType('visa');
    else if (/^(5[1-5]|2[2-7])/.test(raw)) setCardType('mastercard');
    else if (/^(60|65|508)/.test(raw)) setCardType('rupay');
    else setCardType('unknown');
  };

  const handleExpiryChange = (val: string) => {
    let raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  const executePurchase = async (simulateFailure = false) => {
    setPaymentError(null);
    setIsProcessing(true);
    setProcessingStep('Connecting to secure payment gateway...');

    try {
      await new Promise((r) => setTimeout(r, 600));

      if (simulateFailure) {
        throw new Error('Payment declined by issuing bank. Please check your details or try UPI.');
      }

      setProcessingStep('Authorizing transaction...');
      await new Promise((r) => setTimeout(r, 700));

      setProcessingStep('Allocating coins to transactional ledger...');

      const response = await fetch('/api/wallet/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinsAmount: selectedPack,
          paymentMethod,
          metadata: {
            upiApp: paymentMethod === 'upi' ? (upiOption === 'app' ? selectedUpiApp : undefined) : undefined,
            upiId: paymentMethod === 'upi' ? (upiOption === 'id' ? customUpiId : undefined) : undefined,
            cardLast4: paymentMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : undefined,
            bankName: paymentMethod === 'netbanking' ? selectedBank : undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      soundEngine.playCoinDrop();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      setIsProcessing(false);
      setPaymentSuccess(true);
      setPurchasedEntry(data.entry);

      // Animate count-up of balance
      const start = currentBalance;
      const end = data.balance;
      const duration = 1000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentVal = Math.round(start + (end - start) * progress);
        setDisplayedBalance(currentVal);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          onCoinsPurchased(selectedPack, end);
        }
      };
      requestAnimationFrame(animate);
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  const handleStartPurchase = () => {
    // Validation
    if (paymentMethod === 'upi' && upiOption === 'id') {
      if (!customUpiId.includes('@')) {
        setPaymentError('Please enter a valid UPI ID (e.g., name@okhdfcbank)');
        return;
      }
    }
    if (paymentMethod === 'card') {
      const cleanDigits = cardNumber.replace(/\s/g, '');
      if (cleanDigits.length < 15) {
        setPaymentError('Please enter a complete 16-digit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setPaymentError('Please enter card expiry as MM/YY.');
        return;
      }
      if (cardCvv.length < 3) {
        setPaymentError('Please enter a valid 3-digit CVV.');
        return;
      }
    }

    if (paymentMethod === 'netbanking') {
      setNetBankingSimOpen(true);
      return;
    }

    executePurchase(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-modal relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="sb-coin w-7 h-7 text-sm">🪙</div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-main)]">Recharge Coin Wallet</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Current Balance:{' '}
                <span className="font-extrabold text-[var(--text-main)] tabular-nums">
                  {displayedBalance.toLocaleString()} coins
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

        {/* Net Banking Simulator Modal */}
        {netBankingSimOpen && (
          <div className="p-4 my-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 animate-modal">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-sm text-[var(--text-main)]">{selectedBank} Gateway Simulator</h4>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              This simulates the standard bank Net Banking authorization flow. Total amount: ₹
              {packs.find((p) => p.coins === selectedPack)?.price}.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNetBankingSimOpen(false);
                  executePurchase(false);
                }}
                className="px-4 py-2 rounded-lg bg-[var(--color-success)] text-white text-xs font-bold hover:opacity-95"
              >
                Approve & Pay ₹{packs.find((p) => p.coins === selectedPack)?.price}
              </button>
              <button
                onClick={() => {
                  setNetBankingSimOpen(false);
                  executePurchase(true); // simulate failure
                }}
                className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Simulate Bank Decline
              </button>
            </div>
          </div>
        )}

        {/* Success View */}
        {paymentSuccess ? (
          <div className="py-6 text-center animate-modal">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[var(--color-success)] mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Payment Successful!</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
              {selectedPack.toLocaleString()} coins have been atomically credited to your ledger balance.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] max-w-md mx-auto text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Receipt Code:</span>
                <span className="font-bold text-[var(--text-main)]">{purchasedEntry?.receiptCode || 'SB-REC-9182'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Coins Credited:</span>
                <span className="font-bold text-[var(--accent-violet)]">+{selectedPack.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">New Balance:</span>
                <span className="font-bold text-[var(--text-main)]">{displayedBalance.toLocaleString()} coins</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setPaymentSuccess(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold text-sm hover:opacity-95 shadow-sm"
              >
                Done
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] text-sm font-semibold hover:bg-[var(--bg-subtle)] flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Step 1: Coin Packs */}
            <div>
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider block mb-2">
                1. Select Coin Pack
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {packs.map((p) => {
                  const isSelected = selectedPack === p.coins;
                  return (
                    <div
                      key={p.coins}
                      onClick={() => setSelectedPack(p.coins)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                        isSelected
                          ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)]/50 shadow-xs'
                          : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)]/60'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-[var(--accent-violet)] block">
                        {p.tag}
                      </span>
                      <div className="flex items-center justify-center gap-1 my-1">
                        <div className="sb-coin w-4 h-4 text-[10px]">🪙</div>
                        <span className="font-extrabold text-base text-[var(--text-main)] tabular-nums">
                          {p.coins.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-muted)]">₹{p.price}</span>
                      {p.bonus && (
                        <div className="text-[9px] text-[var(--color-success)] font-bold mt-0.5 truncate">
                          {p.bonus}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payment Rails */}
            <div>
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider block mb-2">
                2. Choose Payment Method (Razorpay Test Mode Ready)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  UPI Instant
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    paymentMethod === 'card'
                      ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card (Debit/Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Net Banking
                </button>
              </div>

              {/* Sub-form for UPI */}
              {paymentMethod === 'upi' && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUpiOption('app')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md ${
                        upiOption === 'app'
                          ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Choose UPI App
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiOption('id')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md ${
                        upiOption === 'id'
                          ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Enter UPI ID
                    </button>
                  </div>

                  {upiOption === 'app' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {['GPay', 'PhonePe', 'Paytm'].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setSelectedUpiApp(app)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold text-center ${
                            selectedUpiApp === app
                              ? 'border-[var(--accent-violet)] bg-[var(--bg-card)] text-[var(--accent-violet)]'
                              : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="username@okhdfcbank"
                        value={customUpiId}
                        onChange={(e) => setCustomUpiId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sub-form for Card */}
              {paymentMethod === 'card' && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-[var(--text-muted)]">Card Number</span>
                      <span className="text-[10px] font-bold uppercase text-[var(--accent-violet)]">
                        {cardType !== 'unknown' ? cardType : 'All Cards Accepted'}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8812"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block mb-1">Valid Thru</span>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block mb-1">CVV</span>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[var(--color-success)]" />
                    Cards are securely tokenized. We never store raw card numbers.
                  </p>
                </div>
              )}

              {/* Sub-form for Net Banking */}
              {paymentMethod === 'netbanking' && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2">
                  <span className="text-[11px] text-[var(--text-muted)] block">Select Your Bank</span>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-[var(--color-error)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-center space-y-2 animate-pulse">
                <RefreshCw className="w-6 h-6 text-[var(--accent-violet)] animate-spin mx-auto" />
                <p className="text-xs font-bold text-[var(--text-main)]">{processingStep}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Please do not close or reload this window</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Payable Amount:</span>
                <span className="text-base font-extrabold text-[var(--text-main)]">
                  ₹{packs.find((p) => p.coins === selectedPack)?.price}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartPurchase}
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[var(--accent-violet)] text-white hover:opacity-95 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span>Pay & Add Coins</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
