import React, { useState } from 'react';
import { Shield, Download, Terminal, Settings, Code, Activity, Github, Check } from 'lucide-react';
import { downloadExtensionZip } from '../utils/zipGenerator';

interface HeaderProps {
  activeTab: 'sandbox' | 'popup' | 'events' | 'code' | 'github';
  setActiveTab: (tab: 'sandbox' | 'popup' | 'events' | 'code' | 'github') => void;
  isGuardEnabled: boolean;
  eventCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isGuardEnabled,
  eventCount
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadExtensionZip();
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch (err) {
      console.error('Failed to download zip:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark with shield icon */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                TradeGuard
              </span>
              <span className="text-[11px] font-mono text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded bg-sky-950/40">
                v1.2
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Pre-Trade Discipline Gatekeeper
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line controls) */}
        <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-900/80 border border-slate-800/80 rounded-lg">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'sandbox'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Trading Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('popup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'popup'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Extension Popup</span>
            {!isGuardEnabled && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">
                Paused
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'events'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>DOM Events</span>
            {eventCount > 0 && (
              <span className="text-[10px] bg-slate-800 text-sky-400 font-mono px-1 rounded">
                {eventCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'code'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Source Code</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'github'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Web Store &amp; GitHub</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-all shadow-sm font-mono whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Download full unpacked extension package (.zip) for Chrome"
          >
            {downloadDone ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>Downloaded!</span>
              </>
            ) : downloading ? (
              <span>Packing ZIP...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="font-sans font-semibold">Download Extension (.zip)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
