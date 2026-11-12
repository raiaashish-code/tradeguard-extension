import React, { useState } from 'react';
import { Shield, Plus, Trash2, RotateCcw, CheckCircle2, HardDrive, Download, Clock, Sliders, BookOpen } from 'lucide-react';
import { TradeJournalEntry } from '../types';

interface PopupSimulatorProps {
  rules: string[];
  setRules: React.Dispatch<React.SetStateAction<string[]>>;
  isGuardEnabled: boolean;
  setIsGuardEnabled: (enabled: boolean) => void;
  onResetDefaults: () => void;
  capital: number;
  setCapital: (cap: number) => void;
  maxRiskPercent: number;
  setMaxRiskPercent: (risk: number) => void;
  cooldownMinutes: number;
  setCooldownMinutes: (cd: number) => void;
  maxTradesPerDay: number;
  setMaxTradesPerDay: (trades: number) => void;
  tradeJournal: TradeJournalEntry[];
  onClearJournal: () => void;
}

export const PopupSimulator: React.FC<PopupSimulatorProps> = ({
  rules,
  setRules,
  isGuardEnabled,
  setIsGuardEnabled,
  onResetDefaults,
  capital,
  setCapital,
  maxRiskPercent,
  setMaxRiskPercent,
  cooldownMinutes,
  setCooldownMinutes,
  maxTradesPerDay,
  setMaxTradesPerDay,
  tradeJournal,
  onClearJournal
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'risk' | 'journal'>('rules');
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

  const handleExportCsv = () => {
    if (tradeJournal.length === 0) {
      alert('No trades recorded yet in your journal.');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Date Time', 'Broker', 'Side', 'Symbol', 'Qty', 'Price', 'StopLoss', 'RiskAmount', 'StrategyTag', 'MindsetTag'];
    const rows = tradeJournal.map(t => [
      t.id,
      t.timestamp,
      `"${t.timeString || new Date(t.timestamp).toLocaleString()}"`,
      t.broker || 'dhan',
      t.side,
      `"${t.symbol}"`,
      t.quantity,
      t.price,
      t.stopLoss || '',
      t.riskAmount || '',
      `"${t.strategyTag || ''}"`,
      `"${t.mindsetTag || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TradeGuard_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Context Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Chrome Toolbar Popup Simulator (v1.1)</span>
            <span className="text-[11px] font-mono text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded">
              popup.html & popup.js
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure pre-trade discipline rules, live 1% position risk sizing, anti-revenge cooling-off timers, and review your local trade journal.
          </p>
        </div>

        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Centered Realistic Extension Popup Window */}
      <div className="flex flex-col items-center justify-center p-6 bg-[#070b13] border border-slate-800/80 rounded-2xl relative overflow-hidden">
        {/* Browser Chrome Toolbar Simulation Bar */}
        <div className="w-[360px] max-w-full bg-[#1b2230] px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate">chrome-extension://tradeguard/popup.html</span>
          <span className="text-sky-400 font-semibold">350px &times; Auto</span>
        </div>

        {/* The Exact Extension Popup Body (350px width) */}
        <div className="w-[360px] max-w-full bg-[#0f172a] border border-slate-700/80 rounded-b-lg p-4 text-[#f8fafc] shadow-2xl space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-sky-400 m-0">TradeGuard v1.1</h2>
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

          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                activeTab === 'rules' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rules
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('risk')}
              className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                activeTab === 'risk' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk & Cooldown
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all ${
                activeTab === 'journal' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Trade Log ({tradeJournal.length})
            </button>
          </div>

          {/* Tab 1: Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <form onSubmit={handleAddRule} className="flex gap-1.5">
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

              {validationError && (
                <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-500/30 p-2 rounded">
                  {validationError}
                </div>
              )}

              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
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
            </div>
          )}

          {/* Tab 2: Risk & Cooldown */}
          {activeTab === 'risk' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Total Trading Capital (₹ / $)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 200000)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Used by Gatekeeper to validate your 1% position sizing rule.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Max Allowed Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={maxRiskPercent}
                  onChange={(e) => setMaxRiskPercent(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Flags an amber warning if your Stop-Loss risks more than this percentage.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Revenge-Trade Cooldown</div>
                  <div className="text-[10px] text-slate-400">Forces breathing pause after position exit.</div>
                </div>
                <select
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(parseInt(e.target.value, 10) || 0)}
                  className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-xs text-white outline-none font-mono"
                >
                  <option value={0}>Off</option>
                  <option value={1}>1 Min</option>
                  <option value={3}>3 Mins</option>
                  <option value={5}>5 Mins</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Daily Trade Limit</div>
                  <div className="text-[10px] text-slate-400">Caps maximum orders per trading session.</div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={maxTradesPerDay}
                  onChange={(e) => setMaxTradesPerDay(parseInt(e.target.value, 10) || 5)}
                  className="w-16 bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-xs text-white outline-none text-center font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Trade Journal */}
          {activeTab === 'journal' && (
            <div className="space-y-3">
              <div className="max-h-[190px] overflow-y-auto space-y-2 pr-0.5">
                {tradeJournal.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded">
                    No trades logged yet. Place an order in Dhan/Kite simulator to see it here!
                  </div>
                ) : (
                  tradeJournal.slice().reverse().map((t) => (
                    <div key={t.id} className="bg-[#1e293b] border border-[#334155] rounded p-2 text-xs font-mono">
                      <div className="flex justify-between items-center font-bold">
                        <span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.side} {t.quantity}x {t.symbol}
                        </span>
                        <span className="text-white">@ ₹{t.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <span>{t.timeString}</span>
                        {t.strategyTag && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">
                            {t.strategyTag}
                          </span>
                        )}
                        {t.mindsetTag && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {t.mindsetTag}
                          </span>
                        )}
                        {t.riskAmount && (
                          <span className="text-emerald-400">
                            Risk: ₹{t.riskAmount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onClearJournal}
                  className="bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 py-1.5 px-3 rounded text-xs transition-colors"
                >
                  Clear Log
                </button>
              </div>
            </div>
          )}

          {/* Status line */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 font-mono">
            <HardDrive className="w-3 h-3 text-slate-400" />
            <span>100% Local Storage &middot; Zero API Keys</span>
          </div>
        </div>
      </div>

      {/* Feature Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1.5">
            <Sliders className="w-4 h-4" />
            <span>Live 1% Risk Sizing</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calculates cash at risk = <code className="text-slate-300 font-mono">(Entry - SL) * Qty</code> directly inside the Gatekeeper modal, ensuring you never risk more than 1% of your account.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1.5">
            <Clock className="w-4 h-4" />
            <span>Anti-Revenge Cooldown</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enforces a 3-minute cooling-off period following an exit order, displaying a breathing guide to prevent immediate tilt or impulsive re-entry.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1.5">
            <BookOpen className="w-4 h-4" />
            <span>1-Click Trade Journal</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tags your trades with setup type (<code className="text-slate-300 font-mono">Breakout</code>, <code className="text-slate-300 font-mono">Pullback</code>) and mindset (<code className="text-slate-300 font-mono">Calm</code>, <code className="text-slate-300 font-mono">FOMO</code>), downloadable to CSV anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
