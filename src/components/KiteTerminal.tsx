import React, { useState } from 'react';
import { InterceptedOrderContext } from '../types';

interface KiteTerminalProps {
  onInterceptClick: (context: InterceptedOrderContext, targetEl: HTMLElement) => void;
  lastExecutedOrder: InterceptedOrderContext | null;
}

const KITE_WATCHLIST = [
  { symbol: 'RELIANCE', exchange: 'NSE', price: 2984.5, change: '+1.2%' },
  { symbol: 'INFY', exchange: 'NSE', price: 1612.0, change: '-0.45%' },
  { symbol: 'TCS', exchange: 'NSE', price: 3950.2, change: '+0.80%' },
  { symbol: 'HDFCBANK', exchange: 'NSE', price: 1445.8, change: '+0.15%' }
];

export const KiteTerminal: React.FC<KiteTerminalProps> = ({
  onInterceptClick,
  lastExecutedOrder
}) => {
  const [selectedStock, setSelectedStock] = useState(KITE_WATCHLIST[0]);
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [productType, setProductType] = useState<'MIS' | 'CNC'>('MIS');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [qty, setQty] = useState(25);

  const handleKiteSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    const context: InterceptedOrderContext = {
      side: orderSide,
      symbol: `${selectedStock.symbol} (${selectedStock.exchange})`,
      price: selectedStock.price,
      quantity: qty,
      orderType: orderType === 'MARKET' ? 'MARKET' : 'LIMIT',
      timestamp: Date.now(),
      broker: 'kite'
    };
    onInterceptClick(context, e.currentTarget);
  };

  return (
    <div className="bg-[#191919] text-[#e0e0e0] rounded-xl border border-[#2e2e2e] overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* Kite Navigation Header */}
      <div className="bg-[#121212] border-b border-[#2e2e2e] px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-orange-500 font-bold tracking-wider font-mono text-sm">
            ZERODHA KITE
          </span>
          <span className="text-[11px] text-neutral-400">Web Terminal Simulation</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-neutral-400">NIFTY 50: <span className="text-emerald-400 font-semibold">22,450.25 (+0.68%)</span></span>
          <span className="text-neutral-400">SENSEX: <span className="text-emerald-400 font-semibold">73,872.10 (+0.52%)</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
        {/* Watchlist Column */}
        <div className="md:col-span-5 border-r border-[#2e2e2e] bg-[#161616] p-3">
          <div className="text-[11px] font-bold text-neutral-400 mb-2 uppercase tracking-wider flex justify-between">
            <span>Market Watch</span>
            <span>4 / 50</span>
          </div>

          <div className="space-y-1">
            {KITE_WATCHLIST.map((item) => (
              <div
                key={item.symbol}
                onClick={() => setSelectedStock(item)}
                className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-all ${
                  selectedStock.symbol === item.symbol
                    ? 'bg-[#262626] border-l-2 border-sky-400'
                    : 'hover:bg-[#1f1f1f]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">{item.symbol}</div>
                  <div className="text-[10px] text-neutral-500">{item.exchange}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-semibold text-white">₹{item.price.toFixed(2)}</div>
                  <div className={`text-[10px] ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Last Executed Notification */}
          {lastExecutedOrder && lastExecutedOrder.broker === 'kite' && (
            <div className="mt-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2.5 rounded text-xs animate-in fade-in">
              <div className="font-bold text-emerald-400">Order Completed (Safe Replay)</div>
              <div className="text-[11px] text-neutral-300 font-mono mt-0.5">
                {lastExecutedOrder.side} {lastExecutedOrder.quantity}x {lastExecutedOrder.symbol} @ ₹{lastExecutedOrder.price}
              </div>
            </div>
          )}
        </div>

        {/* Order Window (Right Column) */}
        <div className="md:col-span-7 p-4 bg-[#1e1e1e] flex flex-col justify-between">
          <div>
            {/* Stock Title */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e] mb-3">
              <div>
                <span className="text-base font-bold text-white font-mono">{selectedStock.symbol}</span>
                <span className="text-xs text-neutral-400 ml-2">₹{selectedStock.price.toFixed(2)}</span>
              </div>

              {/* Buy / Sell Tab Switch */}
              <div className="flex rounded overflow-hidden border border-[#3a3a3a]">
                <button
                  onClick={() => setOrderSide('BUY')}
                  className={`px-3 py-1 text-xs font-bold transition-all ${
                    orderSide === 'BUY'
                      ? 'bg-[#4184f3] text-white'
                      : 'bg-[#2a2a2a] text-neutral-400 hover:text-white'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderSide('SELL')}
                  className={`px-3 py-1 text-xs font-bold transition-all ${
                    orderSide === 'SELL'
                      ? 'bg-[#ff5722] text-white'
                      : 'bg-[#2a2a2a] text-neutral-400 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Product Type (MIS vs CNC) */}
            <div className="flex items-center gap-4 mb-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="productType"
                  checked={productType === 'MIS'}
                  onChange={() => setProductType('MIS')}
                  className="accent-[#4184f3]"
                />
                <span className="font-semibold text-white">Intraday (MIS)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="productType"
                  checked={productType === 'CNC'}
                  onChange={() => setProductType('CNC')}
                  className="accent-[#4184f3]"
                />
                <span className="text-neutral-300">Longterm (CNC)</span>
              </label>
            </div>

            {/* Inputs: Qty & Price */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1 font-mono">QTY</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#121212] border border-[#3a3a3a] rounded px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-[#4184f3]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1 font-mono">PRICE</label>
                <input
                  type="number"
                  disabled={orderType === 'MARKET'}
                  value={selectedStock.price}
                  readOnly
                  className="w-full bg-[#121212] border border-[#3a3a3a] rounded px-3 py-1.5 text-xs text-neutral-400 font-mono outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Order Variety (Market vs Limit) */}
            <div className="flex items-center gap-4 text-xs mb-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === 'MARKET'}
                  onChange={() => setOrderType('MARKET')}
                  className="accent-[#4184f3]"
                />
                <span className="text-white">Market</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === 'LIMIT'}
                  onChange={() => setOrderType('LIMIT')}
                  className="accent-[#4184f3]"
                />
                <span className="text-neutral-400">Limit</span>
              </label>
            </div>

            {/* Margin Required */}
            <div className="bg-[#161616] p-2.5 rounded border border-[#2e2e2e] text-[11px] text-neutral-400 font-mono flex justify-between">
              <span>Margin Required: ₹{((selectedStock.price * qty) / 5).toFixed(2)} (5x MIS)</span>
              <span>Charges: ₹20.00</span>
            </div>
          </div>

          {/* Real DOM Target Submit Button */}
          <div className="pt-3 border-t border-[#2e2e2e]">
            <button
              type="button"
              data-name="submit-order"
              onClick={handleKiteSubmit}
              className={`w-full py-2.5 px-4 font-bold rounded text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                orderSide === 'BUY'
                  ? 'btn-blue bg-[#4184f3] hover:bg-[#3367d6] text-white'
                  : 'btn-orange bg-[#ff5722] hover:bg-[#e64a19] text-white'
              }`}
            >
              {orderSide === 'BUY' ? 'Buy' : 'Sell'} {qty} Qty @ Market
            </button>
            <p className="text-[10px] text-neutral-500 text-center mt-1.5">
              Matches Zerodha Kite <code className="text-sky-400 font-mono">.btn-blue</code> / <code className="text-orange-400 font-mono">.btn-orange</code> selector
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
