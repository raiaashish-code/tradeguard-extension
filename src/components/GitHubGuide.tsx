import React, { useState } from 'react';
import { Github, Terminal, Copy, Check, ExternalLink, Download, ShieldCheck, GitBranch } from 'lucide-react';
import { downloadExtensionZip } from '../utils/zipGenerator';

export const GitHubGuide: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
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

  const cliScript = `# 1. Extract your downloaded tradeguard-mvp1 folder (or use local extension/ directory)
cd tradeguard-mvp1

# 2. Initialize git repository
git init -b main

# 3. Stage and commit all extension files
git add .
git commit -m "feat: initial commit for TradeGuard MVP1 Chrome Extension"

# 4. Create and push repository to your GitHub account using GitHub CLI
gh repo create tradeguard-extension --public --source=. --push`;

  const manualGitScript = `# In your terminal:
cd tradeguard-mvp1
git init -b main
git add .
git commit -m "feat: TradeGuard Pre-Trade Checklist Extension"
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/tradeguard-extension.git
git push -u origin main`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0e1626] to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Create & Connect GitHub Repository
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Publish TradeGuard MVP1 to your personal or organization GitHub account in 60 seconds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Packing...' : 'Download Repo Bundle (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Method 1: GitHub CLI */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Method 1: Fast One-Command Push via GitHub CLI (<code className="text-sky-300 font-mono">gh</code>)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(cliScript, 'cli')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            {copiedScript === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript === 'cli' ? 'Copied' : 'Copy Commands'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          If you have GitHub CLI installed (<code className="text-slate-300 font-mono">gh auth login</code>), this command creates the public or private repository on your GitHub profile and pushes the code immediately:
        </p>

        <pre className="p-3 bg-[#070b13] border border-slate-800/90 rounded-lg text-xs font-mono text-sky-300 overflow-x-auto leading-relaxed">
          {cliScript}
        </pre>
      </div>

      {/* Method 2: Manual Git Remote */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Method 2: Create Repo on GitHub.com and Push
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(manualGitScript, 'manual')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            {copiedScript === 'manual' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript === 'manual' ? 'Copied' : 'Copy Commands'}</span>
          </button>
        </div>

        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
          <li>
            Open{' '}
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              github.com/new <ExternalLink className="w-3 h-3" />
            </a>
            , set repository name to <code className="text-slate-200 font-mono">tradeguard-extension</code>.
          </li>
          <li>Do not initialize with README (the package includes a complete README).</li>
          <li>Run the commands below in your terminal:</li>
        </ol>

        <pre className="p-3 bg-[#070b13] border border-slate-800/90 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {manualGitScript}
        </pre>
      </div>

      {/* Chrome Web Store & Automated GitHub Actions CI/CD */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 border border-sky-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Automated Chrome Web Store Releases via GitHub Actions
              </h3>
              <p className="text-[11px] text-slate-400">
                Push a Git tag to automatically package, upload, and update your Chrome Extension!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
            CI/CD Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <div className="font-bold text-white mb-1">1. Developer Account</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Register on the <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">Chrome Web Store Developer Console</a> ($5 one-time Google fee).
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <div className="font-bold text-white mb-1">2. First-Time Upload</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Upload the downloaded <code className="text-sky-300">tradeguard-extension.zip</code> manually once to register your unique 32-character Extension ID.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <div className="font-bold text-white mb-1">3. Automated Git Tags</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Push a git tag (<code className="text-emerald-400 font-mono">git tag v1.1.0 && git push --tags</code>); GitHub Actions auto-publishes to the store!
            </p>
          </div>
        </div>

        <div className="bg-[#070b13] border border-slate-800/90 rounded-lg p-3 text-xs font-mono text-slate-300">
          <div className="text-[11px] text-slate-500 mb-1.5 font-sans font-semibold">Workflow file active in repository:</div>
          <div className="text-sky-300">.github/workflows/publish-extension.yml</div>
          <div className="text-slate-500 text-[11px] mt-1 font-sans">
            Detailed step-by-step credentials guide available in <code className="text-slate-300 font-mono">CHROME_STORE_PUBLISH_GUIDE.md</code>.
          </div>
        </div>
      </div>

      {/* Manifest V3 Directory Structure */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Repository Directory Structure</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          The downloaded ZIP and local files follow Chrome Manifest V3 standards:
        </p>

        <pre className="p-3.5 bg-[#070b13] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 leading-relaxed">
{`tradeguard-mvp1/
├── .github/workflows/
│   └── publish-extension.yml  # Automated Chrome Web Store CI/CD workflow
├── CHROME_STORE_PUBLISH_GUIDE.md # Web Store developer setup instructions
├── manifest.json              # Manifest V3 permissions & script registrations
├── content.js                 # Capture-phase click interceptor & Shadow DOM modal
├── popup.html                 # Toolbar UI for pre-trade discipline rules
├── popup.js                   # chrome.storage.local persistence logic
├── README.md                  # Documentation & instructions
└── icons/
    ├── icon16.png             # Toolbar icon
    ├── icon48.png             # Extensions manager icon
    └── icon128.png            # Chrome Web Store install icon`}
        </pre>
      </div>
    </div>
  );
};
