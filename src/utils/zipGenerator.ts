import JSZip from 'jszip';
import { EXTENSION_FILES } from '../data/extensionCode';

/**
 * Creates a canvas-rendered PNG icon for the extension at any specified dimension.
 */
function createExtensionIconBlob(size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(new Blob([], { type: 'image/png' }));
      return;
    }

    const pad = size * 0.1;
    const w = size - pad * 2;
    const h = size - pad * 2;

    // Outer shield path
    ctx.beginPath();
    ctx.moveTo(size / 2, pad);
    ctx.lineTo(size - pad, pad + h * 0.28);
    ctx.quadraticCurveTo(size - pad, pad + h * 0.75, size / 2, size - pad);
    ctx.quadraticCurveTo(pad, pad + h * 0.75, pad, pad + h * 0.28);
    ctx.closePath();

    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, size * 0.065);
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Inner checkmark
    ctx.beginPath();
    ctx.moveTo(pad + w * 0.3, pad + h * 0.5);
    ctx.lineTo(pad + w * 0.45, pad + h * 0.65);
    ctx.lineTo(pad + w * 0.72, pad + h * 0.36);
    ctx.lineWidth = Math.max(1.5, size * 0.08);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    canvas.toBlob((blob) => {
      resolve(blob || new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generates an exact 1280x800 JPEG (24-bit, zero alpha channel) showing the Gatekeeper modal over a trading terminal.
 */
function createGatekeeperScreenshotBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(new Blob([], { type: 'image/jpeg' }));

    // Solid opaque background (no alpha)
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, 1280, 800);

    // Subtle trading grid
    ctx.strokeStyle = '#11192c';
    ctx.lineWidth = 1;
    for (let x = 60; x < 1280; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, 760);
      ctx.stroke();
    }
    for (let y = 80; y < 760; y += 70) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Simulated candlestick chart backdrop
    const candles = [
      { x: 90, o: 540, c: 500, h: 485, l: 555, bull: true },
      { x: 145, o: 500, c: 525, h: 490, l: 540, bull: false },
      { x: 200, o: 525, c: 465, h: 450, l: 535, bull: true },
      { x: 255, o: 465, c: 430, h: 410, l: 480, bull: true },
      { x: 310, o: 430, c: 455, h: 420, l: 470, bull: false },
      { x: 365, o: 455, c: 390, h: 375, l: 465, bull: true },
      { x: 920, o: 360, c: 310, h: 295, l: 380, bull: true },
      { x: 975, o: 310, c: 335, h: 298, l: 350, bull: false },
      { x: 1030, o: 335, c: 265, h: 250, l: 345, bull: true },
      { x: 1085, o: 265, c: 230, h: 215, l: 280, bull: true },
      { x: 1140, o: 230, c: 248, h: 220, l: 268, bull: false },
      { x: 1195, o: 248, c: 195, h: 180, l: 255, bull: true }
    ];
    for (const c of candles) {
      ctx.strokeStyle = c.bull ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x, c.h);
      ctx.lineTo(c.x, c.l);
      ctx.stroke();
      ctx.fillStyle = c.bull ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      const top = Math.min(c.o, c.c);
      const height = Math.max(8, Math.abs(c.o - c.c));
      ctx.fillRect(c.x - 14, top, 28, height);
    }

    // Dimmed overlay backdrop
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(0, 0, 1280, 800);

    // Top headline banner
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TradeGuard — Pre-Trade Discipline Gatekeeper', 640, 74);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('Intercepts Buy, Sell & Square-Off clicks before broker dispatch • Zero Broker API Keys', 640, 108);

    // Center Gatekeeper Card
    const cardX = 350;
    const cardY = 148;
    const cardW = 580;
    const cardH = 560;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Card header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('TradeGuard Gatekeeper', cardX + 28, cardY + 46);
    drawRoundedRect(ctx, cardX + cardW - 98, cardY + 22, 70, 30, 6);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUY', cardX + cardW - 63, cardY + 42);

    // Divider
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(cardX + 24, cardY + 66);
    ctx.lineTo(cardX + cardW - 24, cardY + 66);
    ctx.stroke();

    // Live 1% Risk Box
    drawRoundedRect(ctx, cardX + 24, cardY + 84, cardW - 48, 92, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('NIFTY 24500 CE  ·  Qty: 75  ·  Price: ₹142.50', cardX + 42, cardY + 116);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('Stop-Loss Price:  ₹125.00', cardX + 42, cardY + 154);

    // Safe Risk Pill
    drawRoundedRect(ctx, cardX + 315, cardY + 132, 215, 32, 6);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('✓ ₹1,312 Risk (0.66%)', cardX + 330, cardY + 153);

    // Strategy Tags
    const tags = ['Breakout', 'Pullback', 'VWAP', 'Scalp', 'Calm'];
    let tx = cardX + 24;
    tags.forEach((tag, i) => {
      const tw = 96;
      drawRoundedRect(ctx, tx, cardY + 196, tw, 32, 16);
      ctx.fillStyle = i === 0 || i === 4 ? '#0284c7' : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = i === 0 || i === 4 ? '#38bdf8' : '#334155';
      ctx.stroke();
      ctx.fillStyle = i === 0 || i === 4 ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tag, tx + tw / 2, cardY + 217);
      tx += tw + 10;
    });

    // Checklist items
    const rules = [
      '1. Is my Stop-Loss strictly defined and entered?',
      '2. Am I risking less than 1% of total capital?',
      '3. Aligned with higher-timeframe trend (No FOMO)?'
    ];
    rules.forEach((rule, idx) => {
      const ry = cardY + 250 + idx * 62;
      drawRoundedRect(ctx, cardX + 24, ry, cardW - 48, 50, 8);
      ctx.fillStyle = idx < 2 ? 'rgba(2, 132, 199, 0.16)' : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = idx < 2 ? '#0284c7' : '#334155';
      ctx.stroke();

      drawRoundedRect(ctx, cardX + 40, ry + 13, 24, 24, 5);
      ctx.fillStyle = idx < 2 ? '#38bdf8' : '#334155';
      ctx.fill();
      ctx.fillStyle = idx < 2 ? '#0f172a' : '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idx < 2 ? '✓' : '3', cardX + 52, ry + 30);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '15px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.fillText(rule, cardX + 80, ry + 30);
    });

    // Action Footer Buttons
    drawRoundedRect(ctx, cardX + 24, cardY + 468, 175, 48, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Abort Order [Esc]', cardX + 111, cardY + 497);

    drawRoundedRect(ctx, cardX + 212, cardY + 468, cardW - 236, 48, 8);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('Confirm & Place Order [Enter]', cardX + 212 + (cardW - 236) / 2, cardY + 497);

    // Bottom badge
    ctx.fillStyle = '#64748b';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Active strictly on supported web trading & charting terminals — zero lag on general websites', 640, 760);

    canvas.toBlob((blob) => resolve(blob || new Blob([], { type: 'image/jpeg' })), 'image/jpeg', 0.95);
  });
}

/**
 * Generates a second 1280x800 JPEG showcasing Popup Rules, Anti-Revenge Cooldown, and CSV Journal.
 */
function createPopupFeaturesScreenshotBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(new Blob([], { type: 'image/jpeg' }));

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1280, 800);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('All-In-One Pre-Trade Risk Engine, Cooldown Breaker & Journal', 640, 78);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('100% Client-Side Privacy · Zero Broker APIs · 60 FPS Canvas Performance', 640, 112);

    const panels = [
      {
        title: '1. Custom Checklist Rules',
        badge: 'Up to 20 Rules',
        color: '#38bdf8',
        lines: [
          '✓ Stop-Loss defined before entry',
          '✓ Max 1% capital risk verified',
          '✓ Higher-timeframe trend aligned',
          '✓ Rapid 1-5 keyboard shortcuts',
          '✓ Enter to execute · Esc to abort'
        ]
      },
      {
        title: '2. Anti-Revenge Cooldown',
        badge: '1m / 3m / 5m',
        color: '#10b981',
        lines: [
          '🧘 Auto-starts after position exits',
          '• Visual breathing timer overlay',
          '• Blocks impulsive FOMO re-entries',
          '• Protects against overtrading chop',
          '• Configurable daily trade cap'
        ]
      },
      {
        title: '3. Local Trade Journal',
        badge: '1-Click CSV Export',
        color: '#a78bfa',
        lines: [
          'BUY 75x NIFTY @ ₹142.50 [Breakout]',
          'SELL 75x NIFTY @ ₹168.00 [Target]',
          '• Records SL, ₹ Risk & Setup Tag',
          '• Stored locally in Chrome only',
          '• Export CSV to Excel / Sheets'
        ]
      }
    ];

    panels.forEach((p, idx) => {
      const px = 80 + idx * 386;
      const py = 175;
      const pw = 348;
      const ph = 470;
      drawRoundedRect(ctx, px, py, pw, ph, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = p.color;
      ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.fillText(p.title, px + 26, py + 48);

      drawRoundedRect(ctx, px + 26, py + 68, 165, 28, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(p.badge, px + 38, py + 87);

      p.lines.forEach((line, lIdx) => {
        const ly = py + 140 + lIdx * 58;
        drawRoundedRect(ctx, px + 24, ly, pw - 48, 44, 8);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
        ctx.fillText(line, px + 38, ly + 27);
      });
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Active ONLY on supported web trading terminals — never runs on general websites', 640, 725);

    canvas.toBlob((blob) => resolve(blob || new Blob([], { type: 'image/jpeg' })), 'image/jpeg', 0.95);
  });
}

/**
 * Generates a 440x280 JPEG small promo tile (zero alpha channel).
 */
function createSmallPromoTileBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(new Blob([], { type: 'image/jpeg' }));

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 440, 280);

    drawRoundedRect(ctx, 18, 18, 404, 244, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('TradeGuard', 220, 108);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('Pre-Trade Discipline Gatekeeper', 220, 142);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    ctx.fillText('1% Risk Check · Revenge Cooldown · CSV Journal', 220, 178);

    drawRoundedRect(ctx, 115, 202, 210, 32, 16);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('Zero Broker API Keys', 220, 223);

    canvas.toBlob((blob) => resolve(blob || new Blob([], { type: 'image/jpeg' })), 'image/jpeg', 0.95);
  });
}

export const WEBSTORE_COPY_TEXT = {
  detailedDescription: `TradeGuard is a zero-API, 100% client-side behavioral checklist for active web traders. It pauses Buy, Sell, and Square-Off order clicks before they reach your broker so you avoid emotional or oversized trades.

KEY FEATURES:
• Pre-Trade Discipline Checklist: Configure up to 20 custom rules and verify them rapidly using keys 1–5 and Enter, or press Esc to abort with zero capital risked.
• Live 1% Stop-Loss Risk Calculator: Reads symbol, price, and quantity directly from your order window to display real-time Stop-Loss risk and percentage of capital.
• Revenge-Trade Cooldown Breaker: Automatically starts a guided breathing cooldown (1, 3, or 5 minutes) after position exits to help prevent impulsive re-entries.
• Setup Tags & Local CSV Journal: Tag trades by setup and mindset, and export your local log to a CSV file for Excel or Google Sheets.
• Lightweight & Terminal-Scoped: Activates only on supported web charting and trading order pages, with an instant canvas bypass to keep chart scrolling smooth.

PRIVACY FIRST:
Zero broker API keys, zero broker passwords, zero external servers, and zero tracking. All preferences and trade logs remain strictly inside local browser storage on your device.`,
  singlePurpose:
    'Enforces a client-side pre-trade discipline checklist, 1% Stop-Loss risk check, and anti-revenge cooling-off timer before order clicks execute on supported web trading terminals.',
  storageJustification:
    'Used strictly to store the user’s checklist rules, risk capital settings, cooling-off timer preference, and local CSV trade journal entries on-device via chrome.storage.local.',
  hostJustification:
    'Host access is strictly restricted to supported financial charting and broker web-terminal URLs so the DOM order-confirmation overlay only runs on active trading screens and never on general websites.',
  privacyNote:
    'Does NOT collect, transmit, or sell user data. Select "No, I am not collecting user data" and check all 3 data-use compliance certifications.'
};

/**
 * Generates and downloads a ZIP containing Chrome Web Store ready images and copy text.
 */
export async function downloadStoreAssetsZip(): Promise<void> {
  const zip = new JSZip();

  const [icon128, ssGatekeeper, ssPopup, promoTile] = await Promise.all([
    createExtensionIconBlob(128),
    createGatekeeperScreenshotBlob(),
    createPopupFeaturesScreenshotBlob(),
    createSmallPromoTileBlob()
  ]);

  zip.file('1-store-icon-128x128.png', icon128);
  zip.file('2-screenshot-gatekeeper-1280x800.jpg', ssGatekeeper);
  zip.file('3-screenshot-features-1280x800.jpg', ssPopup);
  zip.file('4-small-promo-tile-440x280.jpg', promoTile);
  zip.file(
    'WEBSTORE_FORM_ANSWERS.txt',
    `=== CHROME WEB STORE SUBMISSION COPY ===\n\n` +
      `CATEGORY: Productivity (or Tools)\nLANGUAGE: English\n\n` +
      `--- DETAILED DESCRIPTION ---\n${WEBSTORE_COPY_TEXT.detailedDescription}\n\n` +
      `--- PRIVACY TAB: SINGLE PURPOSE ---\n${WEBSTORE_COPY_TEXT.singlePurpose}\n\n` +
      `--- PRIVACY TAB: STORAGE JUSTIFICATION ---\n${WEBSTORE_COPY_TEXT.storageJustification}\n\n` +
      `--- PRIVACY TAB: HOST PERMISSIONS JUSTIFICATION ---\n${WEBSTORE_COPY_TEXT.hostJustification}\n\n` +
      `--- DATA USAGE ---\n${WEBSTORE_COPY_TEXT.privacyNote}\n`
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tradeguard-webstore-assets.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers download of the complete ready-to-load Chrome Extension ZIP.
 */
export async function downloadExtensionZip(onProgress?: (msg: string) => void): Promise<void> {
  if (onProgress) onProgress('Packaging Manifest V3 files...');

  const zip = new JSZip();

  zip.file('manifest.json', EXTENSION_FILES['manifest.json']);
  zip.file('content.js', EXTENSION_FILES['content.js']);
  zip.file('popup.html', EXTENSION_FILES['popup.html']);
  zip.file('popup.js', EXTENSION_FILES['popup.js']);
  zip.file('README.md', EXTENSION_FILES['README.md']);

  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    if (onProgress) onProgress('Generating crisp icon assets...');
    const [b16, b48, b128] = await Promise.all([
      createExtensionIconBlob(16),
      createExtensionIconBlob(48),
      createExtensionIconBlob(128)
    ]);
    iconsFolder.file('icon16.png', b16);
    iconsFolder.file('icon48.png', b48);
    iconsFolder.file('icon128.png', b128);
  }

  if (onProgress) onProgress('Compressing archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tradeguard-extension-v1.2.3.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) onProgress('Download started!');
}
