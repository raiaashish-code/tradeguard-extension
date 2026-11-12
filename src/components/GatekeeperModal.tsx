import React, { useEffect, useState, useCallback } from 'react';
import { Shield, X, AlertTriangle, ArrowRight } from 'lucide-react';
import { InterceptedOrderContext } from '../types';

interface GatekeeperModalProps {
  orderContext: InterceptedOrderContext;
  rules: string[];
  onConfirm: () => void;
  onAbort: () => void;
  onRuleToggled?: (ruleIndex: number, checked: boolean) => void;
}

export const GatekeeperModal: React.FC<GatekeeperModalProps> = ({
  orderContext,
  rules,
  onConfirm,
  onAbort,
  onRuleToggled
}) => {
  const [checkedState, setCheckedState] = useState<boolean[]>(() =>
    new Array(rules.length).fill(false)
  );

  const allChecked = checkedState.length > 0 && checkedState.every(Boolean);
  const isSell = orderContext.side === 'SELL';

  const toggleRule = useCallback(
    (index: number) => {
      if (index < 0 || index >= rules.length) return;
      setCheckedState((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        if (onRuleToggled) {
          onRuleToggled(index, next[index]);
        }
        return next;
      });
    },
    [rules.length, onRuleToggled]
  );

  // Keyboard Rapid-Check listener (FR-04)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Keys 1-9
      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= rules.length) {
        e.preventDefault();
        e.stopPropagation();
        toggleRule(keyNum - 1);
        return;
      }

      // Enter key to confirm once unlocked
      if (e.key === 'Enter') {
        if (allChecked) {
          e.preventDefault();
          e.stopPropagation();
          onConfirm();
        }
        return;
      }

      // Escape key to dismiss
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onAbort();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [allChecked, rules.length, toggleRule, onConfirm, onAbort]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onAbort();
      }}
    >
      <div
        className="w-full max-w-[440px] bg-[#0f172a] border border-slate-700/80 rounded-xl p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sky-400 leading-none">
                TradeGuard Gatekeeper
              </h3>
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

        {/* Order Context Banner */}
        <div className="mb-4 text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
          <div className="flex items-center justify-between font-mono text-[11px] mb-1">
            <span className="text-slate-400">INTERCEPTED TARGET:</span>
            <span className="text-white font-bold">{orderContext.symbol}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Qty: {orderContext.quantity} &middot; Type: {orderContext.orderType}</span>
            <span>Ref Price: ${orderContext.price.toFixed(2)}</span>
          </div>
          <p className="mt-1.5 text-slate-300 text-[11px] flex items-center gap-1.5 border-t border-slate-800/60 pt-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Complete mandatory rational verification to unlock broker execution.</span>
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2 mb-4">
          {rules.map((rule, idx) => {
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
            onClick={onConfirm}
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
