import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface CooldownModalProps {
  untilTimestamp: number;
  onDismiss: () => void;
}

export const CooldownModal: React.FC<CooldownModalProps> = ({
  untilTimestamp,
  onDismiss
}) => {
  const [remainingSec, setRemainingSec] = useState(() =>
    Math.max(0, Math.ceil((untilTimestamp - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const sec = Math.max(0, Math.ceil((untilTimestamp - Date.now()) / 1000));
      setRemainingSec(sec);
      if (sec <= 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [untilTimestamp, onDismiss]);

  const m = Math.floor(remainingSec / 60);
  const s = remainingSec % 60;
  const timerStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[2147483647] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-sky-500/50 rounded-2xl p-6 text-center shadow-2xl shadow-sky-950/50">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss [Esc]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Breathing Circle Animation */}
        <div className="w-20 h-20 mx-auto rounded-full bg-sky-500/10 border-2 border-sky-400 flex items-center justify-center text-3xl shadow-lg shadow-sky-500/20 animate-pulse my-3">
          🧘
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Revenge-Trade Protection Active</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Cooling-Off Breaker</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          TradeGuard detected a recent position exit. To protect your capital from emotional impulse revenge trades, take 3 slow deep breaths before re-entering the market.
        </p>

        {/* Live Countdown Display */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl py-4 px-6 mb-6">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Enforced Discipline Window
          </div>
          <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
            {timerStr}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
        >
          I'm Calm &amp; Rational, Dismiss [Esc]
        </button>
      </div>
    </div>
  );
};
