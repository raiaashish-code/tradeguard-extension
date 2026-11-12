import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TradingViewTerminal } from './components/TradingViewTerminal';
import { KiteTerminal } from './components/KiteTerminal';
import { DhanTerminal } from './components/DhanTerminal';
import { GatekeeperModal } from './components/GatekeeperModal';
import { PopupSimulator } from './components/PopupSimulator';
import { EventInspector } from './components/EventInspector';
import { CodeExplorer } from './components/CodeExplorer';
import { GitHubGuide } from './components/GitHubGuide';
import {
  BrokerTerminalType,
  InterceptedOrderContext,
  InterceptionLogEvent
} from './types';
import { Shield, Sparkles, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

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

    // Step 3: Screen Context Reader
    addLogEvent(
      'CONTEXT_SCRAPED',
      `Scraped active order context without broker API: Side=${context.side}, Symbol=${context.symbol}, Qty=${context.quantity}`,
      { ...context },
      'info'
    );

    // Step 4: Mount Shadow DOM Modal
    targetElementRef.current = targetEl;
    setActiveOrder(context);

    addLogEvent(
      'MODAL_MOUNT',
      `Injected isolated Shadow DOM dark-mode overlay (#tradeguard-shadow-host) with ${rules.length} verification rules`,
      { rulesCount: rules.length },
      'info'
    );
  };

  // Safe Replay Mechanism (FR-06)
  const handleConfirmOrder = () => {
    if (!activeOrder) return;

    addLogEvent(
      'PASS_THROUGH_REPLAY',
      `All checklist items satisfied! Setting isBypassing = true and triggering targetButton.click() programmatic replay`,
      { symbol: activeOrder.symbol, side: activeOrder.side },
      'success'
    );

    isBypassingRef.current = true;
    const currentOrder = activeOrder;
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
    addLogEvent('KEYBOARD_CHECK', 'Reset checklist rules to default initial set', { rules: INITIAL_RULES });
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
                  <span>2. Press Keys 1, 2, 3</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Active day traders don't need to reach for the mouse. Press number keys <code className="text-slate-300 font-mono">1</code>, <code className="text-slate-300 font-mono">2</code>, and <code className="text-slate-300 font-mono">3</code> on your physical keyboard to rapidly toggle the verification items.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
                <div className="font-bold text-sky-400 mb-1 flex items-center gap-2">
                  <span>3. Hit Enter to Execute</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Once all checklist rules are satisfied, the button unlocks. Press <code className="text-slate-300 font-mono">Enter</code> to safely replay the click, or press <code className="text-slate-300 font-mono">Esc</code> to abort without risking capital.
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
          onConfirm={handleConfirmOrder}
          onAbort={handleAbortOrder}
          onRuleToggled={handleRuleToggled}
        />
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 px-6 text-xs text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <span>TradeGuard MVP 1.0 &middot; Zero-API Pre-Trade Checklist Extension</span>
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
