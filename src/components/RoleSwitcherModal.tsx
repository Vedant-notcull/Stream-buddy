import React from 'react';
import { User, UserRole } from '../types/index.ts';
import { X, Check, Shield, Video, Sparkles, LogIn } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSwitchUser: (userId: string, role: UserRole) => void;
  onOpenAuthModal: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onOpenAuthModal,
}) => {
  if (!isOpen) return null;

  const demoAccounts = [
    {
      id: 'usr_sam',
      name: 'Sam',
      handle: '@sam_prime',
      role: 'fan' as UserRole,
      badge: 'Gold Fan (1,500 Coins)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SamPrime',
      desc: 'Active fan who sends supercoins, supergifts and votes in creator polls.',
    },
    {
      id: 'usr_riya',
      name: 'Riya',
      handle: '@riya_vibes',
      role: 'fan' as UserRole,
      badge: 'Silver Fan (850 Coins)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=RiyaVibes',
      desc: 'Community enthusiast who engages on stream posts and supports multiple creators.',
    },
    {
      id: 'usr_nova',
      name: 'Nova Plays',
      handle: '@novaplays',
      role: 'creator' as UserRole,
      badge: 'Gaming Streamer (Live)',
      avatar: '/src/assets/images/creator_novaplays_1793017028962.jpg',
      desc: 'Competitive esports streamer with real-time OBS alerts, Wall of Fame, and UPI cashouts.',
    },
    {
      id: 'usr_pete',
      name: 'Pixel Pete',
      handle: '@pixelpete',
      role: 'creator' as UserRole,
      badge: 'Digital Artist (Live)',
      avatar: '/src/assets/images/creator_pixelpete_1793017029781.jpg',
      desc: 'Speedpaint creator receiving supergifts, answering paid priority questions and vouchers.',
    },
    {
      id: 'usr_admin',
      name: 'System Admin',
      handle: '@admin',
      role: 'admin' as UserRole,
      badge: 'Moderator & Finance',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=AdminSB',
      desc: 'Controls platform rates (fees & coin rate), approves UPI payouts, and reviews safety reports.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 shadow-xl animate-modal relative">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">One-Click Role Switcher</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Instantly experience Streamer Buddy through any role
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {demoAccounts.map((acc) => {
            const isActive = currentUser.id === acc.id;
            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSwitchUser(acc.id, acc.role);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)]/40 shadow-xs'
                    : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)]/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-black/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-main)] truncate">{acc.name}</span>
                      <span className="text-xs text-[var(--text-muted)] truncate">{acc.handle}</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--accent-violet)] mt-0.5">
                      {acc.badge}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">{acc.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent-violet)] text-white text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-card)]">
                      Switch
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="text-xs font-semibold text-[var(--accent-violet)] hover:underline flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in with email or create new account
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
