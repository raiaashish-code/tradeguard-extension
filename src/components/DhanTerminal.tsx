import React, { useState } from 'react';
import { Zap, ShieldCheck, X } from 'lucide-react';
import { InterceptedOrderContext } from '../types';

interface DhanTerminalProps {
  onInterceptClick: (context: InterceptedOrderContext, targetEl: HTMLElement) => void;
  lastExecutedOrder: InterceptedOrderContext | null;
}

export const DhanTerminal: React.FC<DhanTerminalProps> = ({
  onInterceptClick,
  lastExecutedOrder
}) => {
  const [showOrderModal, setShowOrderModal] = useState(true);
  const [orderTab, setOrderTab] = useState<'Market' | 'Limit' | 'Super' | 'Trail'>('Limit');
  const [symbol] = useState('TATASTEEL 23 NOV 195 CALL');
  const [ltp] = useState(2.02);
  const [limitPrice, setLimitPrice] = useState(2.36);
  const [lots, setLots] = useState(1);
  const lotSize = 2750;
  const totalQty = lots * lotSize;

  const handleDhanInstantSell = (e: React.MouseEvent<HTMLButtonElement>) => {
    const context: InterceptedOrderContext = {
      side: 'SELL',
      symbol,
      price: limitPrice,
      quantity: totalQty,
      orderType: orderTab === 'Market' ? 'MARKET' : 'LIMIT',
      timestamp: Date.now(),
      broker: 'dhan'
    };
    onInterceptClick(context, e.currentTarget);
  };

  const handlePositionRowClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    const context: InterceptedOrderContext = {
      side: 'SELL',
      symbol,
      price: ltp,
      quantity: totalQty,
      orderType: 'MARKET',
      timestamp: Date.now(),
      broker: 'dhan'
    };
    onInterceptClick(context, e.currentTarget);
  };

  return (
    <div className="bg-[#121824] text-slate-200 rounded-xl border border-[#20293a] overflow-hidden shadow-2xl flex flex-col font-sans relative">
      {/* Dhan Header */}
      <div className="bg-[#0b1019] border-b border-[#20293a] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
            ध
          </div>
          <span className="font-bold text-white font-mono">web.dhan.co/index/positions</span>
          <span className="text-[11px] text-slate-400">Dhan Web Terminal</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">Nifty 50: <span className="text-emerald-400">25,272.90 (+0.07%)</span></span>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-2.5 py-1 bg-sky-600/30 text-sky-400 border border-sky-500/40 rounded hover:bg-sky-600/40 text-[11px] font-bold"
          >
            Open Order Modal
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Positions Table (from user's screenshot) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono uppercase">
                Today's Positions
              </span>
              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                Open: 1
              </span>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold">
              Total P&L: -₹440.00
            </span>
          </div>

          <div className="overflow-x-auto border border-[#20293a] rounded-lg">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-[#0b1019] text-slate-400 text-left border-b border-[#20293a]">
                  <th className="py-2 px-3">INSTRUMENT</th>
                  <th className="py-2 px-3">AVG PRICE</th>
                  <th className="py-2 px-3">LTP</th>
                  <th className="py-2 px-3">P&L</th>
                  <th className="py-2 px-3">% CHG</th>
                  <th className="py-2 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#20293a] hover:bg-[#1a2334] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{symbol}</div>
                    <div className="text-[10px] text-slate-500">NSE &middot; 2750 Qty</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">2.18</td>
                  <td className="py-2.5 px-3 text-white">2.02</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">-440.00</td>
                  <td className="py-2.5 px-3 text-rose-400">-7.34%</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      data-name="close-position"
                      onClick={handlePositionRowClose}
                      className="button-close px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-bold"
                      title="Close position"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Dhan Order Modal (Exact recreation of user's screenshot) */}
        {showOrderModal && (
          <div className="bg-[#ffffff] text-slate-900 rounded-xl p-5 shadow-2xl border border-slate-300 max-w-lg mx-auto relative animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                  {symbol}
                </div>
                <div className="text-xs text-rose-600 font-mono mt-0.5">
                  <span className="font-bold text-sm text-slate-900 mr-1.5">{ltp.toFixed(2)}</span>
                  -0.02 (-0.98%) &middot; Live
                </div>
              </div>

              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trading vs Normal Toggle */}
            <div className="flex items-center gap-2 my-3">
              <button className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md">
                Trading
              </button>
              <button className="px-3 py-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-md">
                Normal
              </button>
            </div>

            {/* Tabs: Market, Limit, Super, Trail */}
            <div className="flex items-center justify-between border-b border-slate-200 text-xs font-medium text-slate-600 mb-4">
              <div className="flex gap-4">
                {(['Market', 'Limit', 'Super', 'Trail'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderTab(t)}
                    className={`pb-2 border-b-2 font-semibold transition-all ${
                      orderTab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">VWAP</span>
            </div>

            {/* Inputs: Lot, Qty, Price */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Lot</span>
                  <span>Qty: {totalQty}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent font-bold text-slate-900 text-sm outline-none mt-1 font-mono"
                />
              </div>

              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50">
                <div className="text-[11px] text-slate-500">Price</div>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-bold text-slate-900 text-sm outline-none mt-1 font-mono"
                />
              </div>
            </div>

            {/* The Instant Sell Button matching screenshot */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleDhanInstantSell}
                className="instant-sell bg-[#ea5353] hover:bg-[#d64545] text-white font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>⚡</span>
                <span>Instant Sell</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-right mt-1.5">
              Exact replica of Dhan's <code className="text-rose-600 font-mono font-bold">⚡ Instant Sell</code> button
            </p>
          </div>
        )}

        {/* Execution toast */}
        {lastExecutedOrder && lastExecutedOrder.broker === 'dhan' && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2.5 rounded text-xs animate-in fade-in flex items-center justify-between">
            <span>
              <strong>Dhan Order Replayed:</strong> {lastExecutedOrder.side} {lastExecutedOrder.quantity}x {lastExecutedOrder.symbol} @ ₹{lastExecutedOrder.price}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">VERIFIED</span>
          </div>
        )}
      </div>
    </div>
  );
};
