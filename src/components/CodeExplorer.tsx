import React, { useState } from 'react';
import { Copy, Check, FileCode, Download, FolderArchive } from 'lucide-react';
import { EXTENSION_FILES } from '../data/extensionCode';
import { downloadExtensionZip } from '../utils/zipGenerator';

type FileKey = keyof typeof EXTENSION_FILES;

export const CodeExplorer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<FileKey>('manifest.json');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fileDescriptions: Record<FileKey, string> = {
    'manifest.json': 'Chrome Manifest V3 configuration registering permissions, host matches (TradingView, Dhan, Kite), and content scripts.',
    'content.js': 'Capture-phase click interceptor (useCapture=true), DOM context reader, isolated Shadow DOM modal, and safe replay mechanism.',
    'popup.html': 'Chrome extension toolbar popup HTML layout (320px dark theme) for managing pre-trade discipline rules.',
    'popup.js': 'Client-side persistence logic using chrome.storage.local for up to 5 custom trading rules and master on/off toggle.',
    'README.md': 'Full project documentation, Chrome installation guide (Developer mode load unpacked), and git commands.'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(EXTENSION_FILES[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadExtensionZip();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const codeContent = EXTENSION_FILES[activeFile];
  const lines = codeContent.split('\n');

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Extension Source Code (Copy-Paste Ready)</h2>
            <p className="text-xs text-slate-400">{fileDescriptions[activeFile]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : `Copy ${activeFile}`}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-950 font-semibold bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Packing...' : 'Download ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-2">
        {(Object.keys(EXTENSION_FILES) as FileKey[]).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFile(f)}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all ${
              activeFile === f
                ? 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{f}</span>
            <span className="text-[10px] text-slate-400">
              ({EXTENSION_FILES[f].split('\n').length}L)
            </span>
          </button>
        ))}
      </div>

      {/* Code Window */}
      <div className="bg-[#0b1019] border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
        <div className="bg-[#121824] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <span>path: /tradeguard-mvp1/{activeFile}</span>
          <span>UTF-8 &middot; {lines.length} lines</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="w-10 pr-4 text-right text-slate-600 select-none tabular-nums text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="text-slate-200 whitespace-pre font-mono leading-relaxed pl-2 border-l border-slate-800/60">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
