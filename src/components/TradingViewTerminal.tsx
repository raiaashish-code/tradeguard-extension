import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, Sliders, ShieldAlert } from 'lucide-react';
import { InterceptedOrderContext } from '../types';

interface TradingViewTerminalProps {
  onInterceptClick: (context: InterceptedOrderContext, targetEl: HTMLElement) => void;
  lastExecutedOrder: InterceptedOrderContext | null;
}

const TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 182.4, change: '+1.45%' },
  { symbol: 'NIFTY 50', name: 'NSE Nifty 50 Index', basePrice: 22450.0, change: '+0.68%' },
  { symbol: 'BTCUSDT', name: 'Bitcoin / Tether', basePrice: 68420.0, change: '+2.12%' },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 218.8, change: '-1.15%' }
];

export const TradingViewTerminal: React.FC<TradingViewTerminalProps> = ({
  onInterceptClick,
  lastExecutedOrder
}) => {
  const [activeTicker, setActiveTicker] = useState(TICKERS[0]);
  const [currentPrice, setCurrentPrice] = useState(activeTicker.basePrice);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [quantity, setQuantity] = useState(50);
  const [stopLoss, setStopLoss] = useState(activeTicker.basePrice * 0.985);
  const [takeProfit, setTakeProfit] = useState(activeTicker.basePrice * 1.035);
  const [timeframe, setTimeframe] = useState('5m');

  // Slight live tick drift
  useEffect(() => {
    setCurrentPrice(activeTicker.basePrice);
    setStopLoss(Number((activeTicker.basePrice * 0.985).toFixed(2)));
    setTakeProfit(Number((activeTicker.basePrice * 1.035).toFixed(2)));

    const interval = setInterval(() => {
      setCurrentPrice((prev) => {
        const delta = (Math.random() - 0.49) * (activeTicker.basePrice * 0.001);
        return Number((prev + delta).toFixed(2));
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [activeTicker]);

  // Risk calculation: Risk = (Price - StopLoss) * Quantity
  const totalValue = currentPrice * quantity;
  const riskAmount = Math.max(0, (currentPrice - stopLoss) * quantity);
  const estimatedAccountSize = 25000;
  const riskPercent = (riskAmount / estimatedAccountSize) * 100;

  const handleOrderSubmit = (side: 'BUY' | 'SELL', e: React.MouseEvent<HTMLButtonElement>) => {
    const context: InterceptedOrderContext = {
      side,
      symbol: activeTicker.symbol,
      price: currentPrice,
      quantity,
      orderType,
      stopLossPrice: stopLoss,
      timestamp: Date.now(),
      broker: 'tradingview'
    };
    onInterceptClick(context, e.currentTarget);
  };

  const handleClosePosition = (e: React.MouseEvent<HTMLButtonElement>) => {
    const context: InterceptedOrderContext = {
      side: 'SELL',
      symbol: activeTicker.symbol,
      price: currentPrice,
      quantity: 50,
      orderType: 'MARKET',
      timestamp: Date.now(),
      broker: 'tradingview'
    };
    onInterceptClick(context, e.currentTarget);
  };

  return (
    <div className="bg-[#131722] text-[#d1d4dc] rounded-xl border border-[#2a2e39] overflow-hidden shadow-2xl flex flex-col">
      {/* TradingView Top Toolbar */}
      <div className="bg-[#1e222d] border-b border-[#2a2e39] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
            <span className="text-sky-400 font-mono">TV //</span>
            <span>TradingView Paper Terminal</span>
          </div>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Ticker Selector */}
          <div className="flex items-center gap-1">
            {TICKERS.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setActiveTicker(t)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                  activeTicker.symbol === t.symbol
                    ? 'bg-[#2a2e39] text-sky-400 font-bold border border-sky-500/30'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50'
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Timeframes */}
          <div className="hidden sm:flex items-center gap-1 text-[#787b86]">
            {['1m', '5m', '15m', '1h', 'D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  timeframe === tf ? 'text-white font-bold bg-[#2a2e39]' : 'hover:text-[#d1d4dc]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Live Ticker Price */}
        <div className="flex items-center gap-3 font-mono">
          <span className="text-[11px] text-[#787b86]">{activeTicker.name}</span>
          <span className="text-sm font-bold text-white tabular-nums">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {activeTicker.change}
          </span>
        </div>
      </div>

      {/* Main Grid: Chart Canvas (Left) + Order Entry Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Simulated Candlestick Chart */}
        <div className="lg:col-span-8 p-4 bg-[#131722] border-b lg:border-b-0 lg:border-r border-[#2a2e39] flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-[11px] text-[#787b86] font-mono mb-2">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold">{activeTicker.symbol}</span>
              <span>O: {(currentPrice * 0.998).toFixed(2)}</span>
              <span>H: {(currentPrice * 1.004).toFixed(2)}</span>
              <span>L: {(currentPrice * 0.995).toFixed(2)}</span>
              <span>C: {currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                MARKET OPEN
              </span>
            </div>
          </div>

          {/* SVG Candlestick visualization */}
          <div className="relative flex-1 w-full min-h-[260px] flex items-center justify-center">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
              <div className="border-b border-dashed border-[#787b86] w-full" />
              <div className="border-b border-dashed border-[#787b86] w-full" />
              <div className="border-b border-dashed border-[#787b86] w-full" />
              <div className="border-b border-dashed border-[#787b86] w-full" />
            </div>

            <svg className="w-full h-full min-h-[240px]" preserveAspectRatio="none" viewBox="0 0 600 240">
              {/* Reference price line */}
              <line x1="0" y1="110" x2="600" y2="110" stroke="#2a2e39" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Candlesticks mock */}
              {[
                { x: 30, o: 130, h: 140, l: 120, c: 124, green: false },
                { x: 65, o: 124, h: 135, l: 118, c: 132, green: true },
                { x: 100, o: 132, h: 145, l: 128, c: 142, green: true },
                { x: 135, o: 142, h: 148, l: 136, c: 138, green: false },
                { x: 170, o: 138, h: 155, l: 135, c: 150, green: true },
                { x: 205, o: 150, h: 162, l: 146, c: 158, green: true },
                { x: 240, o: 158, h: 164, l: 149, c: 152, green: false },
                { x: 275, o: 152, h: 159, l: 144, c: 146, green: false },
                { x: 310, o: 146, h: 158, l: 142, c: 154, green: true },
                { x: 345, o: 154, h: 168, l: 150, c: 165, green: true },
                { x: 380, o: 165, h: 172, l: 160, c: 162, green: false },
                { x: 415, o: 162, h: 175, l: 158, c: 170, green: true },
                { x: 450, o: 170, h: 182, l: 168, c: 178, green: true },
                { x: 485, o: 178, h: 185, l: 172, c: 174, green: false },
                { x: 520, o: 174, h: 188, l: 170, c: 184, green: true },
                { x: 555, o: 184, h: 195, l: 180, c: 190, green: true }
              ].map((c, i) => {
                const color = c.green ? '#089981' : '#f23645';
                const bodyY = 240 - Math.max(c.o, c.c);
                const bodyHeight = Math.max(4, Math.abs(c.o - c.c));
                const wickY1 = 240 - c.h;
                const wickY2 = 240 - c.l;
                return (
                  <g key={i}>
                    {/* Wick */}
                    <line x1={c.x} y1={wickY1} x2={c.x} y2={wickY2} stroke={color} strokeWidth="1.5" />
                    {/* Candle body */}
                    <rect
                      x={c.x - 8}
                      y={bodyY}
                      width="16"
                      height={bodyHeight}
                      fill={color}
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* Live price line */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="#00bcd4" strokeWidth="1" strokeDasharray="4 2" />
              <text x="540" y="46" fill="#00bcd4" fontSize="10" fontFamily="monospace" fontWeight="bold">
                {currentPrice.toFixed(2)}
              </text>
            </svg>
          </div>

          {/* Active Chart Footer */}
          <div className="flex items-center justify-between text-[11px] text-[#787b86] pt-2 border-t border-[#2a2e39]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>DOM Capture Listener: <code className="text-sky-400 font-mono">active (useCapture=true)</code></span>
            </div>
            <span>Target Match: <code className="text-slate-300 font-mono">https://*.tradingview.com/*</code></span>
          </div>

          {/* Last Executed Notification Overlay */}
          {lastExecutedOrder && (
            <div className="mt-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-lg text-xs flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  <strong>Broker Order Replayed:</strong> {lastExecutedOrder.side} {lastExecutedOrder.quantity} units of {lastExecutedOrder.symbol} @ ${lastExecutedOrder.price.toFixed(2)}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">PASSED GATEKEEPER</span>
            </div>
          )}
        </div>

        {/* Order Entry Panel (Right Column) */}
        <div className="lg:col-span-4 p-4 bg-[#1e222d] flex flex-col justify-between">
          <div>
            {/* Header / Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Place Order Ticket
              </span>
              <div className="flex items-center bg-[#131722] p-0.5 rounded border border-[#2a2e39] text-[11px]">
                {(['MARKET', 'LIMIT', 'STOP'] as const).map((ot) => (
                  <button
                    key={ot}
                    onClick={() => setOrderType(ot)}
                    className={`px-2 py-0.5 rounded transition-all font-mono ${
                      orderType === ot
                        ? 'bg-[#2a2e39] text-white font-bold'
                        : 'text-[#787b86] hover:text-[#d1d4dc]'
                    }`}
                  >
                    {ot}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Quantity */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-[11px] text-[#787b86] mb-1 font-mono">
                  <span>UNITS / QUANTITY</span>
                  <span>Total: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex items-center bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 focus-within:border-sky-500">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-transparent text-white font-mono text-xs outline-none"
                  />
                  <span className="text-[11px] text-[#787b86] font-mono">SHARES</span>
                </div>
              </div>

              {/* Stop Loss Input */}
              <div>
                <div className="flex justify-between text-[11px] text-[#787b86] mb-1 font-mono">
                  <span>STOP LOSS</span>
                  <span className="text-rose-400">-{((1 - stopLoss / currentPrice) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 focus-within:border-sky-500">
                  <input
                    type="number"
                    step="0.1"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-mono text-xs outline-none"
                  />
                  <span className="text-[11px] text-[#787b86] font-mono">USD</span>
                </div>
              </div>

              {/* Take Profit Input */}
              <div>
                <div className="flex justify-between text-[11px] text-[#787b86] mb-1 font-mono">
                  <span>TAKE PROFIT</span>
                  <span className="text-emerald-400">+{((takeProfit / currentPrice - 1) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 focus-within:border-sky-500">
                  <input
                    type="number"
                    step="0.1"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-mono text-xs outline-none"
                  />
                  <span className="text-[11px] text-[#787b86] font-mono">USD</span>
                </div>
              </div>
            </div>

            {/* Risk Box */}
            <div className="bg-[#131722]/80 border border-[#2a2e39] rounded-lg p-2.5 mb-4 text-[11px] font-mono space-y-1">
              <div className="flex justify-between text-[#787b86]">
                <span>Risk Amount:</span>
                <span className="text-white font-bold">${riskAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#787b86]">
                <span>Capital at Risk:</span>
                <span className={riskPercent > 1.0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {riskPercent.toFixed(2)}% {riskPercent > 1.0 ? '(> 1% Warning)' : '(Safe)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Order Buttons — Real DOM Targets */}
          <div className="space-y-2 pt-2 border-t border-[#2a2e39]">
            <p className="text-[10px] text-[#787b86] text-center mb-1">
              Clicking below triggers the TradeGuard DOM Click Interceptor:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-name="submit-order"
                onClick={(e) => handleOrderSubmit('BUY', e)}
                className="order-buy-button py-2.5 px-3 bg-[#089981] hover:bg-[#067a67] text-white font-bold rounded text-xs transition-all flex flex-col items-center justify-center shadow-md active:scale-95 cursor-pointer"
              >
                <span className="text-[10px] opacity-80">BUY MARKET</span>
                <span className="font-mono">${currentPrice.toFixed(2)}</span>
              </button>

              <button
                type="button"
                data-name="submit-order"
                onClick={(e) => handleOrderSubmit('SELL', e)}
                className="order-sell-button py-2.5 px-3 bg-[#f23645] hover:bg-[#c92534] text-white font-bold rounded text-xs transition-all flex flex-col items-center justify-center shadow-md active:scale-95 cursor-pointer"
              >
                <span className="text-[10px] opacity-80">SELL MARKET</span>
                <span className="font-mono">${currentPrice.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Bottom Panel: Open Positions */}
      <div className="border-t border-[#2a2e39] bg-[#171b26] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Open Positions (1)
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
              1 Active Long
            </span>
          </div>
          <span className="text-[11px] text-[#787b86]">
            Test position exit interception:
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-[#787b86] border-b border-[#2a2e39] text-left">
                <th className="py-1.5 px-2">SYMBOL</th>
                <th className="py-1.5 px-2">SIDE</th>
                <th className="py-1.5 px-2">QTY</th>
                <th className="py-1.5 px-2">ENTRY</th>
                <th className="py-1.5 px-2">LTP</th>
                <th className="py-1.5 px-2">P&L</th>
                <th className="py-1.5 px-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors">
                <td className="py-2 px-2 text-white font-bold">{activeTicker.symbol}</td>
                <td className="py-2 px-2 text-emerald-400 font-bold">LONG</td>
                <td className="py-2 px-2 text-white">50</td>
                <td className="py-2 px-2 text-slate-300">${(activeTicker.basePrice * 0.99).toFixed(2)}</td>
                <td className="py-2 px-2 text-white">${currentPrice.toFixed(2)}</td>
                <td className="py-2 px-2 text-emerald-400 font-bold">
                  +${((currentPrice - activeTicker.basePrice * 0.99) * 50).toFixed(2)}
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    type="button"
                    data-name="close-position"
                    onClick={(e) => handleClosePosition(e)}
                    className="button-close px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded text-xs font-semibold transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    title="Close position at market"
                  >
                    <span>Close Position (Sell)</span>
                    <span className="text-rose-400 font-bold">✕</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
