import React, { useState } from 'react';
import { User, Supergift } from '../types/index.ts';
import { X, Send, Flame, Sparkles, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';
import confetti from 'canvas-confetti';

interface SendSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
  currentUserBalance: number;
  onOpenWallet: () => void;
  onSupportSent: (receiptCode: string, newBalance: number, alert: any) => void;
}

export const SendSupportModal: React.FC<SendSupportModalProps> = ({
  isOpen,
  onClose,
  creator,
  currentUserBalance,
  onOpenWallet,
  onSupportSent,
}) => {
  const [mode, setMode] = useState<'supercoins' | 'supergifts'>('supergifts');

  // Supercoins state
  const [customCoins, setCustomCoins] = useState<number>(50);
  const quickCoinChips = [10, 50, 100, 500];

  // Supergifts state
  const supergifts: Supergift[] = [
    {
      id: 'gift_rose',
      name: 'Rose',
      cost: 10,
      icon: '🌹',
      tier: 'tier1',
      description: 'Sweet token of appreciation',
      animationType: 'rose',
    },
    {
      id: 'gift_coffee',
      name: 'Coffee',
      cost: 50,
      icon: '☕',
      tier: 'tier2',
      description: 'Fuel for the stream grind',
      animationType: 'coffee',
    },
    {
      id: 'gift_trophy',
      name: 'Trophy',
      cost: 500,
      icon: '🏆',
      tier: 'tier3',
      description: 'Champion status with golden fanfare',
      animationType: 'trophy',
    },
    {
      id: 'gift_rocket',
      name: 'Rocket',
      cost: 1000,
      icon: '🚀',
      tier: 'tier4',
      description: 'Epic stream blastoff celebration!',
      animationType: 'rocket',
    },
  ];
  const [selectedGift, setSelectedGift] = useState<Supergift>(supergifts[1]);

  // Combo streak counter
  const [lastGiftId, setLastGiftId] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState<number>(1);

  // Common message and options
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Error & loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const cost = mode === 'supercoins' ? customCoins : selectedGift.cost;
  const hasEnoughCoins = currentUserBalance >= cost;

  const handleSend = async () => {
    setErrorMsg(null);
    setSuccessNotice(null);

    if (cost <= 0) {
      setErrorMsg('Please specify a positive coin amount.');
      return;
    }

    if (!hasEnoughCoins) {
      setErrorMsg(`Insufficient coins. You need ${cost} coins, but your balance is ${currentUserBalance}.`);
      return;
    }

    // Determine combo
    let currentStreak = 1;
    const currentId = mode === 'supercoins' ? 'coins' : selectedGift.id;
    if (lastGiftId === currentId) {
      currentStreak = streakCount + 1;
      setStreakCount(currentStreak);
    } else {
      setLastGiftId(currentId);
      setStreakCount(1);
      currentStreak = 1;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/support/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          giftType: mode,
          amount: cost,
          giftDetails: {
            giftName: mode === 'supercoins' ? 'Supercoins' : selectedGift.name,
            giftIcon: mode === 'supercoins' ? '🪙' : selectedGift.icon,
            message: message.trim() || undefined,
            isAnonymous,
            tier: mode === 'supercoins' ? (cost >= 500 ? 'tier3' : cost >= 100 ? 'tier2' : 'tier1') : selectedGift.tier,
            comboCount: currentStreak,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send support');
      }

      // Audio and celebration effects
      if (mode === 'supercoins') {
        if (cost >= 500) soundEngine.playTier3();
        else soundEngine.playTier1();
      } else {
        if (selectedGift.tier === 'tier1') soundEngine.playTier1();
        else if (selectedGift.tier === 'tier2') soundEngine.playTier2();
        else if (selectedGift.tier === 'tier3') {
          soundEngine.playTier3();
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        } else if (selectedGift.tier === 'tier4') {
          soundEngine.playTier4();
          confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
        }
      }

      setIsLoading(false);
      setSuccessNotice(
        `Sent ${mode === 'supercoins' ? `${cost} Supercoins` : selectedGift.name} to ${creator.displayName}! ${
          currentStreak > 1 ? `🔥 Combo Streak x${currentStreak}!` : ''
        }`
      );

      onSupportSent(data.receiptCode, data.balance, data.alert);

      // Auto-clear message
      setMessage('');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Support transaction failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-modal relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <img
              src={creator.avatarUrl}
              alt={creator.displayName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
            />
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">Send Support to {creator.displayName}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Your Balance:{' '}
                <span className="font-extrabold text-[var(--text-main)] tabular-nums">
                  {currentUserBalance.toLocaleString()} coins
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

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setMode('supergifts')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'supergifts'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>🎁 Animated Supergifts</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('supercoins')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'supercoins'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>🪙 Supercoins</span>
          </button>
        </div>

        {/* Supergifts Selection Grid */}
        {mode === 'supergifts' ? (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              {supergifts.map((g) => {
                const isSelected = selectedGift.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGift(g)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)]/40 shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)]/50'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{g.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[var(--text-main)]">{g.name}</span>
                        <div className="flex items-center gap-1">
                          <div className="sb-coin w-3.5 h-3.5 text-[9px]">🪙</div>
                          <span className="text-xs font-extrabold text-[var(--text-main)] tabular-nums">{g.cost}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{g.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Streak Counter Indicator */}
            {streakCount > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-extrabold animate-pulse">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Active Gift Combo: x{streakCount} Streak!</span>
              </div>
            )}
          </div>
        ) : (
          /* Supercoins Custom Amount */
          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Quick Pick Chips</span>
              <div className="grid grid-cols-4 gap-2">
                {quickCoinChips.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomCoins(val)}
                    className={`py-2 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                      customCoins === val
                        ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="sb-coin w-3.5 h-3.5 text-[9px]">🪙</div>
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-1 font-medium">Custom Coin Amount</span>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={customCoins}
                  onChange={(e) => setCustomCoins(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-extrabold tabular-nums rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                />
                <div className="absolute right-3 top-2.5 flex items-center gap-1 pointer-events-none text-xs text-[var(--text-muted)]">
                  <span>Coins</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Message */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-[var(--text-main)] block">
            Add a Live Stream Message (Optional)
          </label>
          <textarea
            rows={2}
            maxLength={140}
            placeholder="Say something nice! This will pop up on the stream overlay..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)] resize-none"
          />
          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-[var(--border-color)] text-[var(--accent-violet)] focus:ring-0"
              />
              <span>Send anonymously (shows as "Fan #id")</span>
            </label>
            <span className="text-[var(--text-muted)] tabular-nums">{message.length}/140</span>
          </div>
        </div>

        {/* Notices & Errors */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-[var(--color-error)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMsg}</p>
              {!hasEnoughCoins && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWallet();
                  }}
                  className="mt-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-violet)] text-white text-[11px] font-bold hover:opacity-95"
                >
                  Recharge Wallet Now
                </button>
              )}
            </div>
          </div>
        )}

        {successNotice && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-[var(--color-success)] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)]">Total:</span>
            <div className="sb-coin w-4 h-4 text-[10px]">🪙</div>
            <span className="text-base font-extrabold text-[var(--text-main)] tabular-nums">{cost}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || cost <= 0}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[var(--accent-violet)] text-white hover:opacity-95 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Sending...' : 'Send Support'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
