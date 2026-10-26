import React, { useState, useEffect } from 'react';
import { WallOfFameSupporter, User } from '../types/index.ts';
import { Trophy, Medal, Sparkles, Flame, Clock, Award, Filter, ShieldCheck, Heart } from 'lucide-react';

interface WallOfFameProps {
  creators: User[];
  selectedCreatorId: string;
  onSelectCreator: (id: string) => void;
  onOpenSendSupport: () => void;
}

export const WallOfFame: React.FC<WallOfFameProps> = ({
  creators,
  selectedCreatorId,
  onSelectCreator,
  onOpenSendSupport,
}) => {
  const [sortBy, setSortBy] = useState<'coins' | 'count'>('coins');
  const [supporters, setSupporters] = useState<WallOfFameSupporter[]>([]);
  const [currentWeek, setCurrentWeek] = useState<string>('Week 43');
  const [selectedArchiveWeek, setSelectedArchiveWeek] = useState<string>('current');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadWallOfFame();
  }, [selectedCreatorId, sortBy, selectedArchiveWeek]);

  const loadWallOfFame = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wall-of-fame/${selectedCreatorId}?sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setSupporters(data.supporters || []);
        setCurrentWeek(data.currentWeek);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCreator = creators.find((c) => c.id === selectedCreatorId) || creators[0];

  const medalIcons: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: '🥇 Gold', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-950/60' },
    2: { label: '🥈 Silver', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
    3: { label: '🥉 Bronze', color: 'text-amber-700 dark:text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Weekly Wall of Fame</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
              Top Stream Champions & Supporters
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Resets every Monday 00:00 UTC · Spotlight for {activeCreator?.displayName}</span>
            </p>
          </div>

          {/* Creator Selection Dropdown */}
          <div className="shrink-0">
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Select Streamer</label>
            <select
              value={selectedCreatorId}
              onChange={(e) => onSelectCreator(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.category || 'Creator'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-muted)]">Rank By:</span>
            <div className="flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <button
                onClick={() => setSortBy('coins')}
                className={`px-3 py-1 font-bold rounded-lg transition-all ${
                  sortBy === 'coins'
                    ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                🪙 Total Coins Gifted
              </button>
              <button
                onClick={() => setSortBy('count')}
                className={`px-3 py-1 font-bold rounded-lg transition-all ${
                  sortBy === 'count'
                    ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                🎁 Number of Gifts
              </button>
            </div>
          </div>

          {/* Archive Week Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-muted)]">Week:</span>
            <select
              value={selectedArchiveWeek}
              onChange={(e) => setSelectedArchiveWeek(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] text-xs font-semibold"
            >
              <option value="current">Current Week (Active)</option>
              <option value="w42">Week 42 (Archived)</option>
              <option value="w41">Week 41 (Archived)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Streamer's Choice Pinned Fan Spotlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-amber-950 font-black flex items-center justify-center shadow-md">
            ⭐
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              <span>Streamer's Choice · Supporter of the Week</span>
            </div>
            <h4 className="font-extrabold text-sm text-[var(--text-main)]">
              Sam (@sam_prime) — MVP for Clutch Cheering
            </h4>
          </div>
        </div>

        <button
          onClick={onOpenSendSupport}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--accent-violet)] text-white text-xs font-bold hover:opacity-95 shrink-0"
        >
          Join Leaderboard
        </button>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <span className="font-bold text-xs text-[var(--text-main)]">Current Week Top Supporters</span>
          <span className="text-xs text-[var(--text-muted)]">{supporters.length} participants</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">Computing leaderboard...</div>
        ) : supporters.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            No gifts recorded this week yet. Be the first to claim Rank 1!
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {supporters.map((sup) => {
              const medal = medalIcons[sup.rank];
              return (
                <div
                  key={sup.userId}
                  className={`p-4 flex items-center justify-between gap-4 transition-all hover:bg-[var(--bg-subtle)] ${
                    sup.rank <= 3 ? 'bg-[var(--bg-card)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-8 text-center shrink-0">
                      {medal ? (
                        <span className="text-base font-black">{medal.label.split(' ')[0]}</span>
                      ) : (
                        <span className="text-xs font-extrabold text-[var(--text-muted)] tabular-nums">
                          #{sup.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <img
                      src={sup.avatarUrl}
                      alt={sup.displayName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
                    />

                    {/* Name & Fan Badge */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[var(--text-main)] truncate">{sup.displayName}</span>
                        {sup.isStreamersChoice && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-black uppercase">
                            ⭐ Streamer's Pick
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sup.fanLevel === 'Diamond'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : sup.fanLevel === 'Gold'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {sup.fanLevel} Tier
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">@{sup.username}</span>
                    </div>
                  </div>

                  {/* Coins & Gifts Stat */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 font-black text-sm text-[var(--text-main)] tabular-nums">
                      <div className="sb-coin w-4 h-4 text-[9px]">🪙</div>
                      <span>{sup.coinsGifted.toLocaleString()}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums font-mono">
                      {sup.giftsCount} {sup.giftsCount === 1 ? 'gift' : 'gifts'} sent
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
