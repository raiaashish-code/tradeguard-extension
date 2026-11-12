import React, { useState } from 'react';
import { Activity, Trash2, Copy, Check, Filter } from 'lucide-react';
import { InterceptionLogEvent } from '../types';

interface EventInspectorProps {
  events: InterceptionLogEvent[];
  onClearEvents: () => void;
}

export const EventInspector: React.FC<EventInspectorProps> = ({ events, onClearEvents }) => {
  const [copied, setCopied] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const handleCopy = () => {
    const text = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredEvents = filterStage === 'ALL'
    ? events
    : events.filter((e) => e.stage === filterStage);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header and Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white">DOM Interceptor & Lifecycle Event Stream</h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {events.length} events logged
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none"
            >
              <option value="ALL">All Stages</option>
              <option value="CAPTURE_INTERCEPT">Capture Intercept</option>
              <option value="DOM_FREEZE">DOM Freeze</option>
              <option value="KEYBOARD_CHECK">Keyboard Check</option>
              <option value="PASS_THROUGH_REPLAY">Pass-Through Replay</option>
              <option value="ORDER_EXECUTED">Order Executed</option>
            </select>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            title="Copy all events as JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={onClearEvents}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            title="Clear all logged events"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Events Table / Log Feed */}
      <div className="bg-[#0b1019] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 text-[11px] font-mono text-slate-400 grid grid-cols-12 gap-2">
          <span className="col-span-2">TIMESTAMP</span>
          <span className="col-span-3">STAGE</span>
          <span className="col-span-7">EVENT MECHANISM & DIAGNOSTICS</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto font-mono text-xs">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No events recorded yet. Go to the Trading Sandbox and click any "Buy" or "Sell" button to trigger the DOM click interceptor.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const badgeColors: Record<string, string> = {
                CAPTURE_INTERCEPT: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
                DOM_FREEZE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                CONTEXT_SCRAPED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                MODAL_MOUNT: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                KEYBOARD_CHECK: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                PASS_THROUGH_REPLAY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                ORDER_EXECUTED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                ORDER_ABORTED: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              };

              return (
                <div
                  key={evt.id}
                  className="px-4 py-2.5 hover:bg-slate-900/40 transition-colors grid grid-cols-12 gap-2 items-start"
                >
                  <span className="col-span-2 text-[11px] text-slate-400 tabular-nums">
                    {evt.timestamp}
                  </span>

                  <span className="col-span-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        badgeColors[evt.stage] || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {evt.stage}
                    </span>
                  </span>

                  <div className="col-span-7">
                    <div className="text-slate-200 leading-snug">{evt.message}</div>
                    {evt.details && (
                      <pre className="mt-1 p-2 bg-[#06090f] border border-slate-800 rounded text-[11px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(evt.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
