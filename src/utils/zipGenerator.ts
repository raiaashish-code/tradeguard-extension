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

    // Background circle or rounded shield
    const pad = size * 0.08;
    const w = size - pad * 2;
    const h = size - pad * 2;

    // Outer shield path
    ctx.beginPath();
    ctx.moveTo(size / 2, pad);
    ctx.lineTo(size - pad, pad + h * 0.3);
    ctx.quadraticCurveTo(size - pad, pad + h * 0.75, size / 2, size - pad);
    ctx.quadraticCurveTo(pad, pad + h * 0.75, pad, pad + h * 0.3);
    ctx.closePath();

    // Dark sleek background
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, size * 0.07);
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

/**
 * Generates and triggers download of the complete ready-to-load Chrome Extension ZIP.
 */
export async function downloadExtensionZip(onProgress?: (msg: string) => void): Promise<void> {
  if (onProgress) onProgress('Packaging Manifest V3 files...');

  const zip = new JSZip();

  // Root extension files
  zip.file('manifest.json', EXTENSION_FILES['manifest.json']);
  zip.file('content.js', EXTENSION_FILES['content.js']);
  zip.file('popup.html', EXTENSION_FILES['popup.html']);
  zip.file('popup.js', EXTENSION_FILES['popup.js']);
  zip.file('README.md', EXTENSION_FILES['README.md']);

  // Icons folder
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

  // Trigger browser download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tradeguard-mvp1.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) onProgress('Download started!');
}
