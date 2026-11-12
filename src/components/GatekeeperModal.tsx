import React, { useEffect, useState, useCallback } from 'react';
import { Shield, X, AlertTriangle, ArrowRight, Calculator, Tag, Sparkles, Crown } from 'lucide-react';
import { InterceptedOrderContext, UserPlanTier } from '../types';

interface GatekeeperModalProps {
  orderContext: InterceptedOrderContext;
  rules: string[];
  capital?: number;
  maxRiskPercent?: number;
  userPlan?: UserPlanTier;
  onConfirm: (extraDetails?: { stopLoss: number; strategy: string; mindset: string }) => void;
  onAbort: () => void;
  onRuleToggled?: (ruleIndex: number, checked: boolean) => void;
}

export const GatekeeperModal: React.FC<GatekeeperModalProps> = ({
  orderContext,
  rules,
  capital = 200000,
  maxRiskPercent = 1.0,
  userPlan = 'free',
  onConfirm,
  onAbort,
  onRuleToggled
}) => {
  const isPro = userPlan === 'pro';
  const effectiveRules = isPro ? rules : rules.slice(0, 3);

  const [checkedState, setCheckedState] = useState<boolean[]>(() =>
    new Array(effectiveRules.length).fill(false)
  );

  const isSell = orderContext.side === 'SELL';
  const entryPrice = orderContext.price || 100;
  const defaultSl = isSell ? entryPrice * 1.02 : entryPrice * 0.98;

  const [stopLoss, setStopLoss] = useState<number>(() => parseFloat(defaultSl.toFixed(2)));
  const [strategyTag, setStrategyTag] = useState<string>('Breakout');
  const [mindsetTag, setMindsetTag] = useState<string>('Calm');

  const riskPerShare = Math.abs(entryPrice - stopLoss);
  const totalRisk = Math.round(riskPerShare * orderContext.quantity);
  const riskPercent = capital > 0 ? parseFloat(((totalRisk / capital) * 100).toFixed(2)) : 0;
  const isRiskSafe = riskPercent <= maxRiskPercent;

  const allChecked = checkedState.length > 0 && checkedState.every(Boolean);

  const toggleRule = useCallback(
    (index: number) => {
      if (index < 0 || index >= effectiveRules.length) return;
      setCheckedState((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        if (onRuleToggled) {
          onRuleToggled(index, next[index]);
        }
        return next;
      });
    },
    [effectiveRules.length, onRuleToggled]
  );

  const handleConfirmOrder = useCallback(() => {
    if (!allChecked) return;
    onConfirm({
      stopLoss,
      strategy: strategyTag,
      mindset: mindsetTag
    });
  }, [allChecked, onConfirm, stopLoss, strategyTag, mindsetTag]);

  // Keyboard Rapid-Check listener (FR-04)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if focused on input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= effectiveRules.length) {
        e.preventDefault();
        e.stopPropagation();
        toggleRule(keyNum - 1);
        return;
      }

      if (e.key === 'Enter') {
        if (allChecked) {
          e.preventDefault();
          e.stopPropagation();
          handleConfirmOrder();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onAbort();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [allChecked, rules.length, toggleRule, handleConfirmOrder, onAbort]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onAbort();
      }}
    >
      <div
        className="w-full max-w-[480px] bg-[#0f172a] border border-slate-700/80 rounded-xl p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-sky-400 leading-none">
                  TradeGuard Gatekeeper
                </h3>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                  isPro
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isPro ? '👑 PRO' : 'FREE'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Pre-Trade Discipline Interceptor</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                isSell
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {orderContext.side}
            </span>
            <button
              onClick={onAbort}
              className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Close and abort order [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Risk & Position Sizing Card */}
        <div className="mb-3 text-xs bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">TARGET:</span>
            <span className="text-white font-bold">{orderContext.symbol}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <span>Qty: <strong className="text-white">{orderContext.quantity}</strong></span>
            <span>Price: <strong className="text-white">₹{orderContext.price.toFixed(2)}</strong></span>
          </div>

          {/* Sizing & Stop Loss Row */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400 font-medium">Stop-Loss:</span>
              <input
                type="number"
                step="0.05"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || entryPrice)}
                className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono font-bold text-white text-right outline-none focus:border-sky-400"
              />
            </div>

            <div
              className={`px-2 py-1 rounded text-[11px] font-mono font-bold border flex items-center gap-1 ${
                isRiskSafe
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse'
              }`}
            >
              <span>{isRiskSafe ? '✓' : '⚠️'}</span>
              <span>₹{totalRisk} Risk ({riskPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Strategy & Mindset Tagging */}
        <div className="mb-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Setup:</span>
            {['Breakout', 'Pullback', 'VWAP', 'Scalp'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setStrategyTag(tag)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                  strategyTag === tag
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {['Calm', 'FOMO'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMindsetTag(m)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  mindsetTag === m
                    ? m === 'Calm'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 mb-4">
          {!isPro && rules.length > 3 && (
            <div className="text-[10.5px] text-amber-400 bg-amber-950/30 border border-amber-500/30 p-2 rounded flex items-center justify-between">
              <span>Free Tier: Verifying 3 of {rules.length} rules</span>
              <span className="font-semibold text-[10px]">Upgrade to verify all</span>
            </div>
          )}
          {effectiveRules.map((rule, idx) => {
            const isChecked = checkedState[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleRule(idx)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-sky-950/30 border-sky-600/60 text-white'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[11px] shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {idx + 1}
                </span>

                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleRule(idx)}
                  className="mt-0.5 w-4 h-4 rounded accent-sky-400 cursor-pointer"
                />

                <span className="flex-1 leading-snug">{rule}</span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onAbort}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Abort [Esc]
          </button>

          <button
            type="button"
            disabled={!allChecked}
            onClick={handleConfirmOrder}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              allChecked
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <span>Confirm & Place Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rapid-Check Key Hints */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            Keys <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">1-{rules.length}</kbd> toggle
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Enter</kbd> submit
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Esc</kbd> abort
          </span>
        </div>
      </div>
    </div>
  );
};
