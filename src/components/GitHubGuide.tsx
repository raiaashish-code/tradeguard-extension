import React, { useState } from 'react';
import { Github, Terminal, Copy, Check, ExternalLink, Download, ShieldCheck, GitBranch, Image, FileText } from 'lucide-react';
import { downloadExtensionZip, downloadStoreAssetsZip, WEBSTORE_COPY_TEXT } from '../utils/zipGenerator';

export const GitHubGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingExt, setDownloadingExt] = useState(false);
  const [downloadingAssets, setDownloadingAssets] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadExtension = async () => {
    try {
      setDownloadingExt(true);
      await downloadExtensionZip();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingExt(false);
    }
  };

  const handleDownloadStoreAssets = async () => {
    try {
      setDownloadingAssets(true);
      await downloadStoreAssetsZip();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingAssets(false);
    }
  };

  const cliScript = `# Sync your local TradeGuard repository with GitHub
git pull origin main`;

  const manualGitScript = `# First-time local clone
git clone https://github.com/raiaashish-code/tradeguard-extension.git
cd tradeguard-extension`;

  const copyItems = [
    {
      id: 'desc',
      label: 'Store Listing → Description (Detailed)',
      hint: 'Category: Productivity • Language: English',
      text: WEBSTORE_COPY_TEXT.detailedDescription
    },
    {
      id: 'purpose',
      label: 'Privacy Practices → Single Purpose Description',
      hint: 'Required on the Privacy tab',
      text: WEBSTORE_COPY_TEXT.singlePurpose
    },
    {
      id: 'storage',
      label: 'Privacy Practices → storage Permission Justification',
      hint: 'Why TradeGuard needs chrome.storage.local',
      text: WEBSTORE_COPY_TEXT.storageJustification
    },
    {
      id: 'host',
      label: 'Privacy Practices → Host Permissions Justification',
      hint: 'Why TradeGuard runs strictly on trading terminal URLs',
      text: WEBSTORE_COPY_TEXT.hostJustification
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Chrome Web Store Submission Kit */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0e1b2e] to-slate-900 border border-sky-500/40 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/35 flex items-center justify-center text-sky-400">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Chrome Web Store Launch Kit (1-Click Assets &amp; Copy)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Includes exact 128×128 Store Icon, two 1280×800 zero-alpha JPEG screenshots, 440×280 Promo Tile, and all form answers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadStoreAssets}
              disabled={downloadingAssets}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingAssets ? 'Generating Images...' : 'Download Web Store Assets (.zip)'}</span>
            </button>

            <button
              onClick={handleDownloadExtension}
              disabled={downloadingExt}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>{downloadingExt ? 'Packing...' : 'Extension ZIP (v1.2.3)'}</span>
            </button>
          </div>
        </div>

        {/* Graphic Assets Quick Map */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-sky-400 mb-0.5">1. Store icon * (128×128)</div>
            <p className="text-[11px] text-slate-400">
              Upload <code className="text-slate-200 font-mono">1-store-icon-128x128.png</code> from the Store Assets ZIP.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-emerald-400 mb-0.5">2. Screenshots * (1280×800)</div>
            <p className="text-[11px] text-slate-400">
              Upload <code className="text-slate-200 font-mono">2-screenshot-gatekeeper.jpg</code> &amp; <code className="text-slate-200 font-mono">3-screenshot-features.jpg</code> (zero alpha).
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-purple-400 mb-0.5">3. Promo Tile &amp; Video</div>
            <p className="text-[11px] text-slate-400">
              Promo video is optional (leave blank). Small promo tile: <code className="text-slate-200 font-mono">4-small-promo-tile-440x280.jpg</code>.
            </p>
          </div>
        </div>

        {/* Copy-Paste Form Answers */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Copy-Paste Form Answers for Store Listing &amp; Privacy Tabs</span>
          </div>

          {copyItems.map((item) => (
            <div key={item.id} className="bg-[#070b13] border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-sky-300">{item.label}</div>
                  <div className="text-[11px] text-slate-500">{item.hint}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.text, item.id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors shrink-0 cursor-pointer"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {item.text}
              </pre>
            </div>
          ))}

          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-200">
            <strong>Data Usage Checkboxes (Privacy Tab):</strong> Select{' '}
            <code className="font-mono text-emerald-300">No, I am not collecting user data</code> (TradeGuard uses zero analytics, zero remote servers, and stores everything locally in <code className="font-mono">chrome.storage.local</code>), then check the compliance boxes and save draft.
          </div>
        </div>
      </div>

      {/* GitHub Sync Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Connected GitHub Repository
            </h3>
          </div>
          <a
            href="https://github.com/raiaashish-code/tradeguard-extension"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
          >
            <span>raiaashish-code/tradeguard-extension</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-[#070b13] border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Pull Latest Changes
              </span>
              <button
                onClick={() => copyToClipboard(cliScript, 'cli')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'cli' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-sky-300 overflow-x-auto">{cliScript}</pre>
          </div>

          <div className="bg-[#070b13] border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                Clone Fresh Copy
              </span>
              <button
                onClick={() => copyToClipboard(manualGitScript, 'manual')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'manual' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'manual' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-300 overflow-x-auto">{manualGitScript}</pre>
          </div>
        </div>
      </div>

      {/* Manifest V3 Directory Structure */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Manifest V3 Package Structure (v1.2.3)</span>
        </h3>
        <pre className="p-3.5 bg-[#070b13] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 leading-relaxed">
{`extension/
├── manifest.json   # Manifest V3, 36 strict trading URLs, zero <all_urls>
├── content.js      # Capture-phase interceptor & Shadow DOM Gatekeeper modal
├── popup.html      # Toolbar UI (Rules, Risk, Journal CSV, Guide)
├── popup.js        # Local chrome.storage.local persistence (All features free)
├── README.md       # Feature documentation & keyboard shortcuts
└── icons/
    ├── icon16.png  # Toolbar icon
    ├── icon48.png  # Extensions manager icon
    └── icon128.png # Chrome Web Store install icon`}
        </pre>
      </div>
    </div>
  );
};
