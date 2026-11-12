import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TradingViewTerminal } from './components/TradingViewTerminal';
import { KiteTerminal } from './components/KiteTerminal';
import { DhanTerminal } from './components/DhanTerminal';
import { GatekeeperModal } from './components/GatekeeperModal';
import { CooldownModal } from './components/CooldownModal';
import { PopupSimulator } from './components/PopupSimulator';
import { EventInspector } from './components/EventInspector';
import { CodeExplorer } from './components/CodeExplorer';
import { GitHubGuide } from './components/GitHubGuide';
import {
  BrokerTerminalType,
  InterceptedOrderContext,
  InterceptionLogEvent,
  TradeJournalEntry,
  UserPlanTier
} from './types';
import { Shield, Sparkles, AlertCircle, CheckCircle, ExternalLink, Clock, Crown } from 'lucide-react';

const INITIAL_RULES = [
  "Is my Stop-Loss strictly defined and entered?",
  "Am I risking less than 1% of total capital?",
  "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'popup' | 'events' | 'code' | 'github'>('sandbox');
  const [activeBroker, setActiveBroker] = useState<BrokerTerminalType>('tradingview');
  
  // Rules and Guard State (persisted in localStorage to simulate chrome.storage.local)
  const [rules, setRules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_rules');
      return saved ? JSON.parse(saved) : INITIAL_RULES;
    } catch {
      return INITIAL_RULES;
    }
  });

  const [isGuardEnabled, setIsGuardEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tradeguard_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  // User Plan & Account State (Free vs Pro)
  const [userPlan, setUserPlan] = useState<UserPlanTier>(() => {
    try {
      return (localStorage.getItem('tradeguard_plan') as UserPlanTier) || 'free';
    } catch {
      return 'free';
    }
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tradeguard_email') || null;
    } catch {
      return null;
    }
  });

  // MVP 1.1 Extended Features State
  const [capital, setCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_capital');
      return saved ? Number(saved) : 200000;
    } catch {
      return 200000;
    }
  });

  const [maxRiskPercent, setMaxRiskPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_maxrisk');
      return saved ? Number(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [cooldownMinutes, setCooldownMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_cooldown');
      return saved !== null ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });

  const [maxTradesPerDay, setMaxTradesPerDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_maxtrades');
      return saved ? Number(saved) : 5;
    } catch {
      return 5;
    }
  });

  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_cooldown_until');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [isCooldownModalOpen, setIsCooldownModalOpen] = useState<boolean>(false);

  const [tradeJournal, setTradeJournal] = useState<TradeJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('tradeguard_journal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Interception Modal State
  const [activeOrder, setActiveOrder] = useState<InterceptedOrderContext | null>(null);
  const [lastExecutedOrder, setLastExecutedOrder] = useState<InterceptedOrderContext | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const isBypassingRef = useRef<boolean>(false);

  // Real-time Event Log
  const [events, setEvents] = useState<InterceptionLogEvent[]>([]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('tradeguard_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('tradeguard_enabled', isGuardEnabled ? 'true' : 'false');
  }, [isGuardEnabled]);

  useEffect(() => {
    localStorage.setItem('tradeguard_plan', userPlan);
  }, [userPlan]);

  useEffect(() => {
    localStorage.setItem('tradeguard_email', userEmail || '');
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('tradeguard_capital', String(capital));
  }, [capital]);

  useEffect(() => {
    localStorage.setItem('tradeguard_maxrisk', String(maxRiskPercent));
  }, [maxRiskPercent]);

  useEffect(() => {
    localStorage.setItem('tradeguard_cooldown', String(cooldownMinutes));
  }, [cooldownMinutes]);

  useEffect(() => {
    localStorage.setItem('tradeguard_maxtrades', String(maxTradesPerDay));
  }, [maxTradesPerDay]);

  useEffect(() => {
    localStorage.setItem('tradeguard_cooldown_until', String(cooldownUntil));
  }, [cooldownUntil]);

  useEffect(() => {
    localStorage.setItem('tradeguard_journal', JSON.stringify(tradeJournal));
  }, [tradeJournal]);

  const addLogEvent = (
    stage: InterceptionLogEvent['stage'],
    message: string,
    details?: Record<string, any>,
    level: InterceptionLogEvent['level'] = 'info'
  ) => {
    const newEvent: InterceptionLogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString() + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
      stage,
      message,
      details,
      level
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 100));
  };

  // DOM Interception Handler
  const handleInterceptClick = (context: InterceptedOrderContext, targetEl: HTMLElement) => {
    // If currently bypassing, execute the real pass-through
    if (isBypassingRef.current) {
      addLogEvent(
        'ORDER_EXECUTED',
        `Clean pass-through click received. Order executed: ${context.side} ${context.quantity}x ${context.symbol}`,
        { ...context },
        'success'
      );
      setLastExecutedOrder(context);
      return;
    }

    // If master guard switch is OFF, allow normal execution
    if (!isGuardEnabled) {
      addLogEvent(
        'ORDER_EXECUTED',
        `TradeGuard is DISABLED in settings. Order bypassed directly: ${context.side} ${context.quantity}x ${context.symbol}`,
        { ...context },
        'warn'
      );
      setLastExecutedOrder(context);
      return;
    }

    // Check Cooling-Off Breaker: if cooling-off timer is currently active
    if (cooldownMinutes > 0 && cooldownUntil > Date.now()) {
      addLogEvent(
        'DOM_FREEZE',
        `Revenge-Trade Cooling-Off BREAKER ACTIVE! Order blocked to prevent emotional tilt re-entry.`,
        { cooldownRemainingSec: Math.ceil((cooldownUntil - Date.now()) / 1000) },
        'warn'
      );
      setIsCooldownModalOpen(true);
      return;
    }

    // Step 1: Capture Phase Intercept
    addLogEvent(
      'CAPTURE_INTERCEPT',
      `Capture phase listener intercepted click on <${targetEl.tagName.toLowerCase()}> with label "${targetEl.innerText.trim()}"`,
      { broker: context.broker, selector: targetEl.className },
      'info'
    );

    // Step 2: DOM Freeze
    addLogEvent(
      'DOM_FREEZE',
      `Invoked e.preventDefault(), e.stopPropagation(), and e.stopImmediatePropagation() to prevent broker payload dispatch`,
      {},
      'warn'
    );

    // Step 3: Screen Context Reader & Live Risk Calculator
    addLogEvent(
      'CONTEXT_SCRAPED',
      `Scraped active order context without broker API: Side=${context.side}, Symbol=${context.symbol}, Qty=${context.quantity}, Price=₹${context.price || 100}`,
      { ...context },
      'info'
    );

    // Step 4: Mount Shadow DOM Modal
    targetElementRef.current = targetEl;
    setActiveOrder(context);

    addLogEvent(
      'MODAL_MOUNT',
      `Injected isolated Shadow DOM modal with 1% Risk Calculator, Strategy Tags, and ${rules.length} verification rules`,
      { rulesCount: rules.length, capital, maxRiskPercent },
      'info'
    );
  };

  // Safe Replay Mechanism (FR-06) with Auto Journal Recording & Cooldown
  const handleConfirmOrder = (extraDetails?: { stopLoss: number; strategy: string; mindset: string }) => {
    if (!activeOrder) return;

    const currentOrder = activeOrder;
    const entryPrice = currentOrder.price || 100;
    const sl = extraDetails?.stopLoss || (currentOrder.side === 'SELL' ? entryPrice * 1.02 : entryPrice * 0.98);
    const riskPerShare = Math.abs(entryPrice - sl);
    const totalRisk = Math.round(riskPerShare * currentOrder.quantity);

    // Auto-Record to Local Trade Journal
    const newEntry: TradeJournalEntry = {
      id: 'tg_' + Date.now().toString(36),
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString(),
      broker: currentOrder.broker,
      symbol: currentOrder.symbol,
      side: currentOrder.side,
      price: entryPrice,
      quantity: currentOrder.quantity,
      stopLoss: Number(sl.toFixed(2)),
      riskAmount: totalRisk,
      strategyTag: extraDetails?.strategy || 'Breakout',
      mindsetTag: extraDetails?.mindset || 'Calm'
    };

    setTradeJournal((prev) => [newEntry, ...prev].slice(0, 100));

    addLogEvent(
      'PASS_THROUGH_REPLAY',
      `All checklist items satisfied! Strategy: [${newEntry.strategyTag}], Mindset: [${newEntry.mindsetTag}], Risk: ₹${totalRisk}. Logged to journal.`,
      { ...newEntry },
      'success'
    );

    // If exiting a position (SELL) and cooldown is enabled, trigger cooling-off timer
    if (currentOrder.side === 'SELL' && cooldownMinutes > 0) {
      const until = Date.now() + cooldownMinutes * 60 * 1000;
      setCooldownUntil(until);
      addLogEvent(
        'ORDER_EXECUTED',
        `Position exit recorded. Revenge-Trade Cooldown activated for ${cooldownMinutes} minutes.`,
        { cooldownMinutes, until: new Date(until).toLocaleTimeString() },
        'info'
      );
    }

    isBypassingRef.current = true;
    setActiveOrder(null);

    // Replay click cleanly
    if (targetElementRef.current) {
      targetElementRef.current.click();
    } else {
      setLastExecutedOrder(currentOrder);
    }

    // Reset bypass flag on next tick
    setTimeout(() => {
      isBypassingRef.current = false;
    }, 150);
  };

  const handleAbortOrder = () => {
    if (!activeOrder) return;

    addLogEvent(
      'ORDER_ABORTED',
      `Trader aborted order [Esc]. Broker handlers were never invoked; 0 capital risked.`,
      { symbol: activeOrder.symbol, side: activeOrder.side },
      'warn'
    );

    setActiveOrder(null);
    targetElementRef.current = null;
  };

  const handleRuleToggled = (ruleIndex: number, checked: boolean) => {
    addLogEvent(
      'KEYBOARD_CHECK',
      `Rule #${ruleIndex + 1} marked as ${checked ? 'VERIFIED [✓]' : 'UNCHECKED [ ]'}: "${rules[ruleIndex]}"`,
      { ruleIndex, checked },
      'info'
    );
  };

  const handleResetDefaults = () => {
    setRules(INITIAL_RULES);
    setIsGuardEnabled(true);
    setCapital(200000);
    setMaxRiskPercent(1.0);
    setCooldownMinutes(3);
    setMaxTradesPerDay(5);
    addLogEvent('KEYBOARD_CHECK', 'Reset settings and checklist rules to defaults', { rules: INITIAL_RULES });
  };

  const handleClearJournal = () => {
    setTradeJournal([]);
    addLogEvent('KEYBOARD_CHECK', 'Cleared local trade journal log', {});
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isGuardEnabled={isGuardEnabled}
        eventCount={events.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: TRADING SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            {/* Active Cooldown Banner (if active) */}
            {cooldownUntil > Date.now() && (
              <div className="bg-sky-950/50 border border-sky-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs animate-pulse">
                <div className="flex items-center gap-2.5 text-sky-300">
                  <span className="text-base">🧘</span>
                  <div>
                    <span className="font-bold text-white">Revenge-Trade Cooling-Off Breaker Active:</span> Orders are protected until{' '}
                    <span className="font-mono font-bold text-sky-200">{new Date(cooldownUntil).toLocaleTimeString()}</span> to prevent emotional re-entry.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCooldownModalOpen(true)}
                    className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Open Breather Screen
                  </button>
                  <button
                    onClick={() => setCooldownUntil(0)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Clear Cooldown
                  </button>
                </div>
              </div>
            )}

            {/* Context & Platform Switcher Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Interactive Terminal Sandbox</span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Zero-API Interception Live
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Test the pre-trade checklist on simulated versions of the 3 supported trading platforms.
                </p>
              </div>

              {/* Segmented Broker Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg shrink-0">
                <button
                  onClick={() => setActiveBroker('tradingview')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeBroker === 'tradingview'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TradingView
                </button>
                <button
                  onClick={() => setActiveBroker('kite')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeBroker === 'kite'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Zerodha Kite
                </button>
                <button
                  onClick={() => setActiveBroker('dhan')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeBroker === 'dhan'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dhan Web
                </button>
              </div>
            </div>

            {/* Active Broker Terminal */}
            {activeBroker === 'tradingview' && (
              <TradingViewTerminal
                onInterceptClick={handleInterceptClick}
                lastExecutedOrder={lastExecutedOrder}
              />
            )}

            {activeBroker === 'kite' && (
              <KiteTerminal
                onInterceptClick={handleInterceptClick}
                lastExecutedOrder={lastExecutedOrder}
              />
            )}

            {activeBroker === 'dhan' && (
              <DhanTerminal
                onInterceptClick={handleInterceptClick}
                lastExecutedOrder={lastExecutedOrder}
              />
            )}

            {/* Operational Instructions Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-2">
                  <span>1. Click Buy or Sell</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Click any order execution button in the terminal above. Notice how execution stops instantly via <code className="text-slate-300 font-mono">useCapture=true</code> before the order can be placed.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-2">
                  <span>2. Position Sizing &amp; Strategy</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Notice the automatic 1% Stop-Loss risk sizing calculation, 1-click strategy tags (<code className="text-slate-300 font-mono">Breakout</code>, <code className="text-slate-300 font-mono">Pullback</code>), and mindset verification.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-2">
                  <span>3. Anti-Revenge Cooldown</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Exiting a position triggers a configurable 3-minute cooling-off breaker with a guided breathing circle, preventing overtrading and emotional tilt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXTENSION POPUP SIMULATOR */}
        {activeTab === 'popup' && (
          <PopupSimulator
            rules={rules}
            setRules={setRules}
            isGuardEnabled={isGuardEnabled}
            setIsGuardEnabled={setIsGuardEnabled}
            onResetDefaults={handleResetDefaults}
            capital={capital}
            setCapital={setCapital}
            maxRiskPercent={maxRiskPercent}
            setMaxRiskPercent={setMaxRiskPercent}
            cooldownMinutes={cooldownMinutes}
            setCooldownMinutes={setCooldownMinutes}
            maxTradesPerDay={maxTradesPerDay}
            setMaxTradesPerDay={setMaxTradesPerDay}
            tradeJournal={tradeJournal}
            onClearJournal={handleClearJournal}
            userPlan={userPlan}
            setUserPlan={setUserPlan}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
          />
        )}

        {/* TAB 3: DOM EVENT INSPECTOR */}
        {activeTab === 'events' && (
          <EventInspector
            events={events}
            onClearEvents={() => setEvents([])}
          />
        )}

        {/* TAB 4: SOURCE CODE EXPLORER */}
        {activeTab === 'code' && <CodeExplorer />}

        {/* TAB 5: GITHUB & DEPLOYMENT GUIDE */}
        {activeTab === 'github' && <GitHubGuide />}
      </main>

      {/* Floating Active Gatekeeper Modal */}
      {activeOrder && (
        <GatekeeperModal
          orderContext={activeOrder}
          rules={rules}
          capital={capital}
          maxRiskPercent={maxRiskPercent}
          userPlan={userPlan}
          onConfirm={handleConfirmOrder}
          onAbort={handleAbortOrder}
          onRuleToggled={handleRuleToggled}
        />
      )}

      {/* Revenge-Trade Cooldown Modal */}
      {isCooldownModalOpen && cooldownUntil > Date.now() && (
        <CooldownModal
          untilTimestamp={cooldownUntil}
          onDismiss={() => setIsCooldownModalOpen(false)}
        />
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 px-6 text-xs text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <span>TradeGuard MVP 1.1 &middot; Zero-API Pre-Trade Discipline &amp; Risk Sizing Extension</span>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Chrome Manifest V3</span>
          <span>&middot;</span>
          <span>100% Client-Side Local Storage</span>
          <span>&middot;</span>
          <button
            onClick={() => setActiveTab('code')}
            className="hover:text-sky-400 transition-colors"
          >
            Inspect Source
          </button>
        </div>
      </footer>
    </div>
  );
}
