import React, { useState } from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { InterceptedOrderContext } from '../types';

interface DhanTerminalProps {
  onInterceptClick: (context: InterceptedOrderContext, targetEl: HTMLElement) => void;
  lastExecutedOrder: InterceptedOrderContext | null;
}

export const DhanTerminal: React.FC<DhanTerminalProps> = ({
  onInterceptClick,
  lastExecutedOrder
}) => {
  const [symbol] = useState('BANKNIFTY 47800 CE');
  const [price] = useState(342.6);
  const [lotSize] = useState(15);
  const [lots, setLots] = useState(2);

  const totalQty = lots * lotSize;

  const handleDhanSubmit = (side: 'BUY' | 'SELL', e: React.MouseEvent<HTMLButtonElement>) => {
    const context: InterceptedOrderContext = {
      side,
      symbol,
      price,
      quantity: totalQty,
      orderType: 'MARKET',
      timestamp: Date.now(),
      broker: 'dhan'
    };
    onInterceptClick(context, e.currentTarget);
  };

  return (
    <div className="bg-[#121824] text-slate-200 rounded-xl border border-[#20293a] overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* Dhan Header */}
      <div className="bg-[#0b1019] border-b border-[#20293a] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
            D
          </div>
          <span className="font-bold text-white font-mono">DHAN WEB</span>
          <span className="text-[11px] text-slate-400">Fast Execution Terminal</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Zap className="w-3.5 h-3.5" />
          <span>Instant Scalper Mode Active</span>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between min-h-[380px]">
        <div>
          {/* Active Contract Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#20293a] mb-4">
            <div>
              <div className="text-base font-bold text-white font-mono">{symbol}</div>
              <div className="text-xs text-slate-400">Options Weekly Expiry &middot; Strike: 47,800</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xl font-bold text-emerald-400">₹{price.toFixed(2)}</div>
              <div className="text-[11px] text-slate-400">LTP &middot; +8.4% today</div>
            </div>
          </div>

          {/* Quick Lot Selectors */}
          <div className="space-y-3 mb-6">
            <div className="text-xs text-slate-400 flex justify-between font-mono">
              <span>LOTS SELECTION (1 Lot = {lotSize} Qty)</span>
              <span className="text-white font-bold">Total: {totalQty} Qty (₹{(price * totalQty).toFixed(2)})</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 8].map((l) => (
                <button
                  key={l}
                  onClick={() => setLots(l)}
                  className={`py-2 rounded font-mono text-xs font-semibold transition-all ${
                    lots === l
                      ? 'bg-sky-500 text-slate-950 font-bold border border-sky-400'
                      : 'bg-[#1b2333] text-slate-300 hover:bg-[#232d42] border border-[#20293a]'
                  }`}
                >
                  {l} {l === 1 ? 'Lot' : 'Lots'} ({l * lotSize})
                </button>
              ))}
            </div>
          </div>

          {/* Scalper Protection Notice */}
          <div className="p-3 bg-sky-950/20 border border-sky-500/30 rounded-lg text-xs text-sky-200 mb-6 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-300">Fast-Execution Safeguard:</span> Dhan instant scalping buttons are high-frequency targets for emotional revenge trading. TradeGuard catches the click before the websocket sends the payload.
            </div>
          </div>

          {/* Last Executed Notification */}
          {lastExecutedOrder && lastExecutedOrder.broker === 'dhan' && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2.5 rounded text-xs animate-in fade-in">
              <span className="font-bold text-emerald-400">Dhan Order Dispatched:</span>{' '}
              {lastExecutedOrder.side} {lastExecutedOrder.quantity} units of {lastExecutedOrder.symbol} @ ₹{lastExecutedOrder.price}
            </div>
          )}
        </div>

        {/* Real DOM Target Instant Order Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#20293a]">
          <button
            type="button"
            data-name="submit-order"
            onClick={(e) => handleDhanSubmit('BUY', e)}
            className="order-buy-button py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg active:scale-95 cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="text-[11px] uppercase tracking-wider">INSTANT BUY MARKET</span>
            <span className="font-mono text-sm">₹{price.toFixed(2)}</span>
          </button>

          <button
            type="button"
            data-name="submit-order"
            onClick={(e) => handleDhanSubmit('SELL', e)}
            className="order-sell-button py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg active:scale-95 cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="text-[11px] uppercase tracking-wider">INSTANT SELL MARKET</span>
            <span className="font-mono text-sm">₹{price.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
