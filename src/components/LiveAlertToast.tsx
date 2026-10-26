import React, { useEffect, useState } from 'react';
import { LiveAlertEvent } from '../types/index.ts';
import { Sparkles, Flame, X } from 'lucide-react';

interface LiveAlertToastProps {
  alert: LiveAlertEvent | null;
  onDismiss: () => void;
}

export const LiveAlertToast: React.FC<LiveAlertToastProps> = ({ alert, onDismiss }) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  if (!alert || !visible) return null;

  // Style configurations per tier
  const tierStyles = {
    tier1: {
      border: 'border-pink-300 dark:border-pink-800',
      bg: 'bg-white dark:bg-[#1a1523]',
      highlight: 'text-pink-600 dark:text-pink-400',
      badge: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300',
    },
    tier2: {
      border: 'border-amber-300 dark:border-amber-800',
      bg: 'bg-white dark:bg-[#201a14]',
      highlight: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    },
    tier3: {
      border: 'border-yellow-400 dark:border-yellow-600',
      bg: 'bg-white dark:bg-[#221c10]',
      highlight: 'text-yellow-600 dark:text-yellow-400',
      badge: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300',
    },
    tier4: {
      border: 'border-purple-400 dark:border-purple-600',
      bg: 'bg-white dark:bg-[#1c1228]',
      highlight: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    },
  };

  const style = tierStyles[alert.tier] || tierStyles.tier1;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-toast">
      <div
        className={`p-4 rounded-2xl border ${style.border} ${style.bg} shadow-2xl backdrop-blur-md relative overflow-hidden`}
      >
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <span className="text-4xl block animate-bounce">{alert.giftIcon}</span>
            {alert.comboCount > 1 && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-xs">
                x{alert.comboCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Live Stream Alert
              </span>
              <button
                onClick={onDismiss}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm text-[var(--text-main)] truncate max-w-[140px]">
                {alert.senderName}
              </span>
              <span className="text-xs text-[var(--text-muted)]">sent</span>
              <span className={`text-xs font-black ${style.highlight}`}>{alert.giftName}</span>
              <div className="inline-flex items-center gap-0.5 ml-auto">
                <div className="sb-coin w-3.5 h-3.5 text-[9px]">🪙</div>
                <span className="text-xs font-extrabold text-[var(--text-main)] tabular-nums">
                  {alert.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {alert.message && (
              <p className="mt-2 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-subtle)] p-2 rounded-lg border border-[var(--border-color)] italic line-clamp-2">
                "{alert.message}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
