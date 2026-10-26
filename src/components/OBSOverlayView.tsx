import React, { useEffect, useState } from 'react';
import { LiveAlertEvent } from '../types/index.ts';
import { soundEngine } from '../utils/audio.ts';
import confetti from 'canvas-confetti';
import { Sparkles, Radio, Play, Volume2, Copy, Check } from 'lucide-react';

interface OBSOverlayViewProps {
  creatorId?: string;
}

export const OBSOverlayView: React.FC<OBSOverlayViewProps> = ({ creatorId = 'usr_nova' }) => {
  const [activeAlert, setActiveAlert] = useState<LiveAlertEvent | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedCreator, setSelectedCreator] = useState<string>(creatorId);

  useEffect(() => {
    const url = `/api/alerts/stream?creatorId=${selectedCreator}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data: LiveAlertEvent = JSON.parse(event.data);
        handleIncomingAlert(data);
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [selectedCreator]);

  const handleIncomingAlert = (alert: LiveAlertEvent) => {
    setActiveAlert(alert);

    // Audio chime
    if (alert.tier === 'tier1') soundEngine.playTier1();
    else if (alert.tier === 'tier2') soundEngine.playTier2();
    else if (alert.tier === 'tier3') {
      soundEngine.playTier3();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } else if (alert.tier === 'tier4') {
      soundEngine.playTier4();
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.4 } });
    } else {
      soundEngine.playCoinDrop();
    }

    setTimeout(() => {
      setActiveAlert(null);
    }, 6000);
  };

  const triggerTestAlert = async (tier: 'tier1' | 'tier2' | 'tier3' | 'tier4') => {
    try {
      await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: selectedCreator, tier }),
      });
    } catch (err) {
      console.error('Error triggering test alert:', err);
    }
  };

  const copyOverlayUrl = () => {
    const fullUrl = `${window.location.origin}/overlay?creatorId=${selectedCreator}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-6 bg-transparent overflow-hidden font-sans">
      {/* OBS Overlay Banner Display */}
      {activeAlert ? (
        <div className="animate-modal transition-all max-w-xl w-full">
          <div className="relative p-6 rounded-3xl bg-black/85 text-white border-2 border-amber-400 shadow-[0_0_50px_rgba(240,169,28,0.5)] backdrop-blur-md overflow-hidden text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEW SUPERGIFT SUPPORT!</span>
            </div>

            {/* Giant Gift Animation & Avatar */}
            <div className="flex items-center justify-center gap-4 my-2">
              <img
                src={activeAlert.senderAvatar}
                alt={activeAlert.senderName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full border-2 border-amber-300 object-cover shadow-md"
              />
              <div className="text-6xl animate-bounce">{activeAlert.giftIcon}</div>
              {activeAlert.comboCount > 1 && (
                <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-xl shadow-lg animate-pulse">
                  x{activeAlert.comboCount}
                </div>
              )}
            </div>

            {/* Supporter and Gift Info */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              <span className="text-amber-400">{activeAlert.senderName}</span> gifted{' '}
              <span className="text-amber-300 underline underline-offset-4">{activeAlert.giftName}</span>!
            </h1>

            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-extrabold text-sm tabular-nums">
              <div className="sb-coin w-4 h-4 text-[10px]">🪙</div>
              <span>{activeAlert.amount.toLocaleString()} Coins</span>
            </div>

            {/* Stream message */}
            {activeAlert.message && (
              <p className="mt-4 text-base font-semibold text-white/95 bg-white/10 p-3 rounded-2xl border border-white/20 italic">
                "{activeAlert.message}"
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xs max-w-md text-white/70">
          <Radio className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-2" />
          <h3 className="font-bold text-white text-base">OBS Stream Overlay Active</h3>
          <p className="text-xs text-white/70 mt-1">
            Listening for live gifts and supercoins for creator:{' '}
            <span className="text-amber-300 font-bold">{selectedCreator === 'usr_nova' ? 'Nova Plays' : 'Pixel Pete'}</span>
          </p>
          <p className="text-[11px] text-white/50 mt-1">
            Add this URL as a Browser Source in OBS Studio with width 1920 and height 1080.
          </p>
        </div>
      )}

      {/* Control panel for testing (floating at bottom) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-slate-900/90 text-white border border-slate-700 shadow-2xl backdrop-blur-md flex flex-wrap items-center gap-3 text-xs z-50">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-slate-400">Streamer:</span>
          <select
            value={selectedCreator}
            onChange={(e) => setSelectedCreator(e.target.value)}
            className="bg-slate-800 text-white border border-slate-600 rounded-lg px-2 py-1 text-xs"
          >
            <option value="usr_nova">Nova Plays</option>
            <option value="usr_pete">Pixel Pete</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-bold mr-1">Test Alerts:</span>
          <button
            onClick={() => triggerTestAlert('tier1')}
            className="px-2.5 py-1 rounded-lg bg-pink-700 hover:bg-pink-600 font-bold"
          >
            🌹 Rose (10)
          </button>
          <button
            onClick={() => triggerTestAlert('tier2')}
            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 font-bold"
          >
            ☕ Coffee (50)
          </button>
          <button
            onClick={() => triggerTestAlert('tier3')}
            className="px-2.5 py-1 rounded-lg bg-yellow-600 hover:bg-yellow-500 font-bold text-black"
          >
            🏆 Trophy (500)
          </button>
          <button
            onClick={() => triggerTestAlert('tier4')}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold"
          >
            🚀 Rocket (1000)
          </button>
        </div>

        <button
          onClick={copyOverlayUrl}
          className="ml-auto px-3 py-1 rounded-lg bg-[var(--accent-violet)] text-white font-bold flex items-center gap-1 hover:opacity-95"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied OBS Link!' : 'Copy OBS Browser Source URL'}</span>
        </button>
      </div>
    </div>
  );
};
