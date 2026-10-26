import React, { useState, useEffect } from 'react';
import { Poll, PaidQuestion, User } from '../types/index.ts';
import { HelpCircle, Vote, Sparkles, Send, MessageSquareText, Check, AlertCircle, Share2, Copy } from 'lucide-react';
import { soundEngine } from '../utils/audio.ts';

interface CommunityExtrasProps {
  currentUser: User;
  currentUserBalance: number;
  creators: User[];
  onOpenWallet: () => void;
  onCoinsDeducted: (newBalance: number) => void;
}

export const CommunityExtras: React.FC<CommunityExtrasProps> = ({
  currentUser,
  currentUserBalance,
  creators,
  onOpenWallet,
  onCoinsDeducted,
}) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questions, setQuestions] = useState<PaidQuestion[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(creators[0]?.id || 'usr_nova');
  const [questionText, setQuestionText] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resPolls, resQuestions] = await Promise.all([
        fetch('/api/polls'),
        fetch('/api/questions'),
      ]);
      if (resPolls.ok) setPolls(await resPolls.json());
      if (resQuestions.ok) setQuestions(await resQuestions.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string, cost: number) => {
    setErrorMsg(null);
    if (currentUserBalance < cost) {
      setErrorMsg(`You need ${cost} coins to vote in this community poll.`);
      return;
    }

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voting failed');

      soundEngine.playCoinDrop();
      onCoinsDeducted(data.balance);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Voting failed');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cost = 25;
    if (currentUserBalance < cost) {
      setErrorMsg(`Priority questions cost ${cost} coins. Please recharge your wallet.`);
      return;
    }

    if (!questionText.trim()) return;

    setIsAsking(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreatorId,
          question: questionText.trim(),
          coinsAmount: cost,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit question');

      soundEngine.playTier2();
      onCoinsDeducted(data.balance);
      setQuestionText('');
      setSuccessMsg('Your priority question was submitted to the creator!');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit question');
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://streamerbuddy.app/join?ref=${currentUser.username}`);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Referral & Growth Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-600/10 border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎁</span>
            <h3 className="font-extrabold text-sm text-[var(--text-main)]">Referral & Welcome Bonus</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Invite viewers to join Streamer Buddy! When they sign up, both of you get 100 starter coins.
          </p>
        </div>

        <button
          onClick={handleCopyReferral}
          className="px-4 py-2 rounded-xl bg-[var(--accent-violet)] text-white text-xs font-bold hover:opacity-95 flex items-center gap-1.5 shrink-0"
        >
          {copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedReferral ? 'Referral Link Copied!' : 'Copy Invite Link'}</span>
        </button>
      </div>

      {/* Grid: Paid Community Polls & Paid Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paid Polls */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-[var(--accent-violet)]" />
            <h3 className="font-extrabold text-sm text-[var(--text-main)]">Interactive Community Polls</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Spend 5 coins to cast your vote and direct the stream content!
          </p>

          {polls.map((poll) => (
            <div key={poll.id} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
              <h4 className="font-bold text-xs text-[var(--text-main)] leading-snug">{poll.question}</h4>

              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVotePoll(poll.id, opt.id, poll.costCoins)}
                      className="w-full text-left p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-violet)] relative overflow-hidden transition-all group"
                    >
                      {/* Fill percentage background bar */}
                      <div
                        style={{ width: `${pct}%` }}
                        className="absolute inset-y-0 left-0 bg-[var(--accent-tint)]/60 transition-all duration-500 pointer-events-none"
                      />
                      <div className="relative flex items-center justify-between text-xs z-10">
                        <span className="font-medium text-[var(--text-main)] group-hover:text-[var(--accent-violet)]">
                          {opt.text}
                        </span>
                        <span className="font-extrabold tabular-nums text-[var(--text-muted)] font-mono">
                          {pct}% ({opt.votes})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                <span>Total Votes: {poll.totalVotes}</span>
                <span className="font-bold text-[var(--accent-violet)]">Cost: {poll.costCoins} coins</span>
              </div>
            </div>
          ))}
        </div>

        {/* Paid Priority Questions */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-sm text-[var(--text-main)]">Priority Stream Q&A</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Ask a streamer a priority question for 25 coins to guarantee an answer.
          </p>

          <form onSubmit={handleAskQuestion} className="space-y-2.5">
            <select
              value={selectedCreatorId}
              onChange={(e) => setSelectedCreatorId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] font-semibold"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  Ask {c.displayName} ({c.category})
                </option>
              ))}
            </select>

            <textarea
              rows={2}
              placeholder="What would you like to ask the streamer?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] resize-none"
            />

            {errorMsg && (
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-[var(--color-error)] text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[var(--color-success)] text-[11px] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAsking || !questionText.trim()}
              className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Priority Question (25 Coins)</span>
            </button>
          </form>

          {/* Answered Questions List */}
          <div className="space-y-2 mt-4 max-h-56 overflow-y-auto pr-1">
            {questions.map((q) => (
              <div key={q.id} className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-main)]">{q.fanName} asked:</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    {q.coinsAmount} coins
                  </span>
                </div>
                <p className="text-[var(--text-muted)] italic">"{q.question}"</p>
                {q.answer && (
                  <div className="pt-1.5 border-t border-[var(--border-color)] text-[var(--text-main)]">
                    <span className="font-bold text-[var(--accent-violet)]">Streamer Answer: </span>
                    <span>{q.answer}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
