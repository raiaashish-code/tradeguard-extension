import React, { useState } from 'react';
import { Shield, Plus, Trash2, RotateCcw, CheckCircle2, HardDrive, Download, Clock, Sliders, BookOpen, Crown, X, Sparkles, Check } from 'lucide-react';
import { TradeJournalEntry, UserPlanTier } from '../types';

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
  userPlan?: UserPlanTier;
  setUserPlan?: (plan: UserPlanTier) => void;
  userEmail?: string | null;
  setUserEmail?: (email: string | null) => void;
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
  onClearJournal,
  userPlan = 'free',
  setUserPlan,
  userEmail = null,
  setUserEmail
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'risk' | 'journal' | 'guide'>('rules');
  const [newRuleText, setNewRuleText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isPro = userPlan === 'pro';

  const handleAddRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newRuleText.trim();
    if (!text) return;

    // Free plan: strictly limit to 3 rules
    if (!isPro && rules.length >= 3) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (rules.length >= 20) {
      setValidationError('TradeGuard supports up to 20 rules to ensure fast pre-trade execution.');
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

  const handleActivatePro = () => {
    if (setUserPlan) setUserPlan('pro');
    if (setUserEmail && !userEmail) setUserEmail('rai.aashish@gmail.com');
    setIsUpgradeModalOpen(false);
  };

  const handleDowngradeFree = () => {
    if (setUserPlan) setUserPlan('free');
    setIsUpgradeModalOpen(false);
  };

  const handleToggleSignIn = () => {
    if (userEmail) {
      if (setUserEmail) setUserEmail(null);
      if (setUserPlan) setUserPlan('free');
    } else {
      const email = prompt('Enter your Google email to sign in:', 'rai.aashish@gmail.com') || 'rai.aashish@gmail.com';
      if (setUserEmail) setUserEmail(email);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Context Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Chrome Toolbar Popup Simulator (v1.2)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              isPro
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : 'bg-sky-950/40 border-sky-500/30 text-sky-400'
            }`}>
              {isPro ? '👑 Pro Trader Unlocked' : 'Free Tier (3 Rules Max)'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Experience how the extension behaves for both Free users (3 rules) and Pro subscribers (unlimited rules, custom cooldowns, and cloud sync).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (setUserPlan) setUserPlan(isPro ? 'free' : 'pro');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              isPro
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{isPro ? 'Switch to Free Mode' : 'Switch to Pro Mode'}</span>
          </button>

          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Centered Realistic Extension Popup Window */}
      <div className="flex flex-col items-center justify-center p-6 bg-[#070b13] border border-slate-800/80 rounded-2xl relative overflow-hidden">
        {/* Browser Chrome Toolbar Simulation Bar */}
        <div className="w-[360px] max-w-full bg-[#1b2230] px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate">chrome-extension://tradeguard/popup.html</span>
          <span className="text-sky-400 font-semibold">360px &times; Auto</span>
        </div>

        {/* The Exact Extension Popup Body (360px width) */}
        <div className="w-[360px] max-w-full bg-[#0f172a] border border-slate-700/80 rounded-b-lg p-4 text-[#f8fafc] shadow-2xl space-y-3 relative">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-sky-400 m-0">TradeGuard v1.2</h2>
              <span
                onClick={() => setIsUpgradeModalOpen(true)}
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider cursor-pointer border ${
                  isPro
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isPro ? '👑 Pro' : 'Free'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                  isPro
                    ? 'text-amber-300 border-amber-500/40 bg-amber-950/30'
                    : 'text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>{isPro ? 'Pro Active' : 'Upgrade'}</span>
              </button>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGuardEnabled}
                  onChange={(e) => setIsGuardEnabled(e.target.checked)}
                  className="accent-sky-400 cursor-pointer w-3.5 h-3.5"
                />
                <span className={isGuardEnabled ? 'text-sky-400' : 'text-slate-500'}>
                  {isGuardEnabled ? 'Active' : 'Off'}
                </span>
              </label>
            </div>
          </div>

          {/* Plan Status Banner */}
          <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] ${
            isPro
              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <span>
              {isPro ? (
                <span>👑 Pro Trader: <strong>Unlimited Rules Unlocked</strong></span>
              ) : (
                <span>Free Plan: <strong>3 Rules max</strong></span>
              )}
            </span>
            {!isPro && (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                Unlock Unlimited
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold transition-all ${
                activeTab === 'rules' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rules ({rules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('risk')}
              className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold transition-all ${
                activeTab === 'risk' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold transition-all ${
                activeTab === 'journal' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Journal ({tradeJournal.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-1 px-1.5 rounded text-[11px] font-semibold transition-all ${
                activeTab === 'guide' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Guide ℹ️
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
                  placeholder={!isPro && rules.length >= 3 ? "Free limit reached (3 rules)..." : "Add pre-trade rule..."}
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
                <label className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Trading Capital (₹ / $)</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/40 px-1.5 py-0.2 rounded">
                    PRO SIZING
                  </span>
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 200000)}
                  min={1000}
                  step={5000}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400 font-mono"
                />
                <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                  Used by TradeGuard to validate your 1% risk rule during order popups.
                </span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">
                  Max Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  value={maxRiskPercent}
                  onChange={(e) => setMaxRiskPercent(parseFloat(e.target.value) || 1.0)}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400 font-mono"
                />
                <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                  Warns if Stop-Loss risk exceeds this percentage of capital.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-300">Revenge-Trade Cooldown</div>
                  <div className="text-[10.5px] text-slate-500">Breathing period after position exits.</div>
                </div>
                <select
                  value={cooldownMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isPro && (val === 1 || val === 5)) {
                      setIsUpgradeModalOpen(true);
                      return;
                    }
                    setCooldownMinutes(val);
                  }}
                  className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-xs text-white outline-none"
                >
                  <option value={0}>Off</option>
                  <option value={1}>1 Minute {!isPro && '[PRO]'}</option>
                  <option value={3}>3 Minutes (Default)</option>
                  <option value={5}>5 Minutes {!isPro && '[PRO]'}</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-300">Max Daily Trades</div>
                  <div className="text-[10.5px] text-slate-500">Prevents overtrading chop.</div>
                </div>
                <input
                  type="number"
                  value={maxTradesPerDay}
                  onChange={(e) => setMaxTradesPerDay(parseInt(e.target.value, 10) || 5)}
                  min={1}
                  max={50}
                  className="w-14 text-center bg-[#1e293b] border border-[#334155] rounded px-1.5 py-1 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Trade Journal */}
          {activeTab === 'journal' && (
            <div className="space-y-2">
              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5 font-mono text-[11px]">
                {tradeJournal.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded">
                    No trades logged yet. Place a trade in the sandbox to test auto-journaling.
                  </div>
                ) : (
                  (isPro ? tradeJournal : tradeJournal.slice(0, 5)).map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-[#1e293b] border border-[#334155] p-2 rounded flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className={trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                          {trade.side} {trade.quantity}x {trade.symbol}
                        </span>
                        <span className="text-slate-200">@ ₹{trade.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                        <span>{trade.timeString}</span>
                        <div className="flex gap-1">
                          {trade.strategyTag && (
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                              {trade.strategyTag}
                            </span>
                          )}
                          {trade.mindsetTag && (
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                              {trade.mindsetTag}
                            </span>
                          )}
                          {trade.riskAmount && (
                            <span className="text-sky-400 font-semibold font-mono">
                              ₹{trade.riskAmount} risk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!isPro && tradeJournal.length > 5 && (
                <div className="text-center text-[10.5px] text-amber-400 bg-amber-950/30 p-1.5 rounded border border-amber-500/20">
                  Showing 5 of {tradeJournal.length} trades. Upgrade to Pro for unlimited history.
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
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

          {/* Tab 4: Guide & Help */}
          {activeTab === 'guide' && (
            <div className="space-y-2 text-xs max-h-[220px] overflow-y-auto pr-1">
              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>How It Intercepts Orders</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Catches clicks on Dhan, Kite, and TradingView using browser capture (<code className="font-mono text-sky-300">useCapture: true</code>). The order is paused until your checklist rules are verified.
                </p>
              </div>

              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Live 1% Risk Sizing</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Enter your intended Stop-Loss. TradeGuard calculates <code className="font-mono text-sky-300">Risk = |Price - SL| * Qty</code> and compares it to your Capital to display a live Safe/Danger badge.
                </p>
              </div>

              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Anti-Revenge Cooldown</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Exiting a position triggers a configurable cooling-off timer (e.g. 3 min) with a breathing guide to prevent emotional tilt re-entries.
                </p>
              </div>

              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5">
                <div className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Strategy &amp; Mindset Tags</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Tag setups (<code className="font-mono text-purple-300">Breakout</code>, <code className="font-mono text-purple-300">Pullback</code>) and mindset (<code className="font-mono text-purple-300">Calm 🧘</code>, <code className="font-mono text-purple-300">FOMO 🚀</code>) before submitting.
                </p>
              </div>

              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <span>⌨️ Keyboard Shortcuts</span>
                </div>
                <div className="text-slate-300 text-[11px] space-y-1">
                  <div>• <code className="font-mono text-slate-200 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">1 - 5</code>: Toggle checklist rules</div>
                  <div>• <code className="font-mono text-slate-200 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">Enter</code>: Submit verified order</div>
                  <div>• <code className="font-mono text-slate-200 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">Esc</code>: Abort order (0 risk) / dismiss cooldown</div>
                </div>
              </div>

              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <span>🔒 Trading-Sites Only &amp; Zero Lag</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Runs strictly on trading platforms (Dhan, Kite, TradingView, Upstox, Fyers, Angel One) — never on general sites. Sub-microsecond canvas bypass (<code className="font-mono text-sky-300">&lt;0.002ms</code>) keeps charts at 60 FPS.
                </p>
              </div>
            </div>
          )}

          {/* Status line */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>Trading Terminals Only</span>
            </span>
            <span className={isPro ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {isPro ? '👑 Pro Active' : 'Free Tier'}
            </span>
          </div>

          {/* Pro Upgrade & Account Modal */}
          {isUpgradeModalOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm p-4 flex flex-col justify-between rounded-b-lg border border-amber-500/50 animate-in fade-in duration-150">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-400">TradeGuard Pro</h3>
                  </div>
                  <button
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Account / Google Sign In */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 my-2.5 text-center">
                  <div className="text-[11px] text-slate-400 mb-1.5">
                    {userEmail ? `Signed in as: ${userEmail}` : 'Sign in with Google to sync across all your trading laptops:'}
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSignIn}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-1.5 px-3 rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{userEmail ? 'Sign Out' : 'Continue with Google'}</span>
                  </button>
                </div>

                {/* Pricing Banner */}
                <div className="bg-gradient-to-r from-amber-950/40 to-amber-900/20 border border-amber-500/30 rounded-lg p-2.5 text-center my-2">
                  <div className="text-[11px] text-amber-300 font-semibold">Pro Trader Subscription</div>
                  <div className="text-lg font-extrabold text-white font-mono">
                    ₹499 <span className="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">or ₹3,999 / year (Save 33%)</div>
                </div>

                {/* Perks Checklist */}
                <div className="text-[11px] space-y-1 text-slate-300 my-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlimited Pre-Trade Rules (4 to 20 rules)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Custom Cooldown Timers (1m, 3m, 5m, 10m)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Advanced 1% Risk Sizing Calculator</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlimited Cloud Trade Journal &amp; CSV Export</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {isPro ? (
                  <button
                    type="button"
                    onClick={handleDowngradeFree}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-xs transition-colors cursor-pointer"
                  >
                    Switch back to Free Plan (Test)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleActivatePro}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    ⭐ Activate Pro License (Instant Test)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
            <Crown className="w-4 h-4" />
            <span>Free vs. Pro Rules Gating</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Free accounts are limited to 3 rules. Adding a 4th rule instantly triggers the Pro Upgrade offer, enabling monetization without sacrificing initial virality.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1.5">
            <Sliders className="w-4 h-4" />
            <span>1% Risk Position Calculator</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calculates cash at risk = <code className="text-slate-300 font-mono">(Entry - SL) * Qty</code> directly inside the Gatekeeper modal, ensuring risk never exceeds 1%.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1.5">
            <Clock className="w-4 h-4" />
            <span>Anti-Revenge Cooldown</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enforces a cooling-off breathing period following exit orders to prevent immediate tilt or impulsive re-entries.
          </p>
        </div>
      </div>
    </div>
  );
};
