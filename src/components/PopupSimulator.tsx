import React, { useState } from 'react';
import { Shield, Plus, Trash2, RotateCcw, CheckCircle2, HardDrive } from 'lucide-react';

interface PopupSimulatorProps {
  rules: string[];
  setRules: React.Dispatch<React.SetStateAction<string[]>>;
  isGuardEnabled: boolean;
  setIsGuardEnabled: (enabled: boolean) => void;
  onResetDefaults: () => void;
}

export const PopupSimulator: React.FC<PopupSimulatorProps> = ({
  rules,
  setRules,
  isGuardEnabled,
  setIsGuardEnabled,
  onResetDefaults
}) => {
  const [newRuleText, setNewRuleText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newRuleText.trim();
    if (!text) return;

    if (rules.length >= 5) {
      setValidationError('MVP1 supports up to 5 active rules to keep pre-trade execution fast.');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    setRules((prev) => [...prev, text]);
    setNewRuleText('');
    setValidationError(null);
  };

  const handleDeleteRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
    setValidationError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Context Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Chrome Toolbar Popup Simulator</span>
            <span className="text-[11px] font-mono text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded">
              popup.html & popup.js
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            This interactive simulator reflects the exact UI that appears when clicking the TradeGuard icon in Chrome's toolbar. All rules configured here persist in <code className="text-sky-300 font-mono">chrome.storage.local</code> and control the live DOM interceptor.
          </p>
        </div>

        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default Rules</span>
        </button>
      </div>

      {/* Centered Realistic Extension Popup Window */}
      <div className="flex flex-col items-center justify-center p-6 bg-[#070b13] border border-slate-800/80 rounded-2xl relative overflow-hidden">
        {/* Browser Chrome Toolbar Simulation Bar */}
        <div className="w-[340px] max-w-full bg-[#1b2230] px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate">chrome-extension://tradeguard/popup.html</span>
          <span className="text-sky-400 font-semibold">320px &times; Auto</span>
        </div>

        {/* The Exact Extension Popup Body (320px width) */}
        <div className="w-[340px] max-w-full bg-[#0f172a] border border-slate-700/80 rounded-b-lg p-3.5 text-[#f8fafc] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-sky-400 m-0">TradeGuard MVP1</h2>
            </div>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGuardEnabled}
                onChange={(e) => setIsGuardEnabled(e.target.checked)}
                className="accent-sky-400 cursor-pointer w-3.5 h-3.5"
              />
              <span className={isGuardEnabled ? 'text-sky-400' : 'text-slate-500'}>
                {isGuardEnabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="flex gap-1.5 mb-3">
            <input
              type="text"
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              placeholder="Add pre-trade rule (max 5)..."
              maxLength={90}
              className="flex-1 bg-[#1e293b] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded text-xs transition-colors shrink-0 cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Validation Notice if > 5 */}
          {validationError && (
            <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-500/30 p-2 rounded mb-2">
              {validationError}
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto mb-3 pr-0.5">
            {rules.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs border border-dashed border-slate-800 rounded">
                No rules active. Add a rule to guard your trades.
              </div>
            ) : (
              rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-[#1e293b] border border-[#334155] px-2.5 py-2 rounded text-xs text-slate-200"
                >
                  <span className="flex-1 leading-snug">
                    <span className="text-sky-400 font-mono font-semibold mr-1">{idx + 1}.</span>
                    {rule}
                  </span>
                  <button
                    onClick={() => handleDeleteRule(idx)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 p-1 rounded transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Status line */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 font-mono">
            <HardDrive className="w-3 h-3 text-slate-400" />
            <span>100% Local Storage &middot; Zero API Keys</span>
          </div>
        </div>
      </div>

      {/* Rules Guidance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rule 1: Stop-Loss Discipline</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Forces you to verify that a hard stop-loss is placed in the broker ticket before submission, eliminating open-ended downside exposure.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rule 2: Capital Risk Control</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Prevents oversized lot allocations. Ensures individual trade risk is strictly capped below 1-2% of total trading portfolio.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rule 3: Anti-FOMO Verification</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Checks that the entry conforms to higher-timeframe trend alignment, eliminating revenge trades and impulsive candle chases.
          </p>
        </div>
      </div>
    </div>
  );
};
