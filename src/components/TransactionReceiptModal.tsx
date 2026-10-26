import React from 'react';
import { LedgerEntry } from '../types/index.ts';
import { X, Download, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LedgerEntry | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({ isOpen, onClose, entry }) => {
  if (!isOpen || !entry) return null;

  const isCredit = entry.amount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-modal relative">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--color-success)]" />
            <h3 className="font-extrabold text-sm text-[var(--text-main)]">Official Transaction Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Body */}
        <div className="mt-4 p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] font-mono text-xs space-y-3">
          <div className="text-center pb-3 border-b border-dashed border-[var(--border-color)]">
            <span className="text-base font-black tracking-tight text-[var(--text-main)]">STREAMER BUDDY</span>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Decentralized Creator Coin Ledger</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Receipt Ref:</span>
              <span className="font-bold text-[var(--text-main)]">{entry.receiptCode}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Date & Time:</span>
              <span className="text-[var(--text-main)]">
                {new Date(entry.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Operation Type:</span>
              <span className="font-bold uppercase text-[var(--accent-violet)]">{entry.type}</span>
            </div>

            {entry.counterpartyName && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Counterparty:</span>
                <span className="font-bold text-[var(--text-main)]">{entry.counterpartyName}</span>
              </div>
            )}

            {entry.giftName && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Item:</span>
                <span className="font-bold text-[var(--text-main)]">
                  {entry.giftName} {entry.giftCombo && entry.giftCombo > 1 ? `(x${entry.giftCombo})` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-dashed border-[var(--border-color)] space-y-1.5">
            <div className="flex justify-between text-sm font-black">
              <span className="text-[var(--text-main)]">Amount:</span>
              <span className={isCredit ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
                {isCredit ? `+${entry.amount}` : entry.amount} coins
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
              <span>Balance After:</span>
              <span className="font-bold tabular-nums text-[var(--text-main)]">{entry.balanceAfter} coins</span>
            </div>
          </div>

          {entry.message && (
            <div className="pt-2 text-[11px] text-[var(--text-muted)] italic border-t border-[var(--border-color)]">
              Note: "{entry.message}"
            </div>
          )}

          <div className="pt-2 text-center text-[9px] text-[var(--text-muted)]">
            Verified by Streamer Buddy Transaction Engine · Non-Repudiable
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-subtle)] flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[var(--accent-violet)] text-white hover:opacity-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
