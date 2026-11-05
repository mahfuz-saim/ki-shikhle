/**
 * Generates the placeholder images the app references but that were never
 * committed to `public/`.
 *
 * Every avatar and every fallback note image was a broken `<img>` — the files
 * simply did not exist. Rather than ship broken images, this script writes small
 * deterministic PNGs (a soft gradient plus a simple geometric motif) so the UI
 * renders correctly.
 *
 * Run with:  node scripts/generate-placeholder-assets.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Encode raw RGBA pixels as a PNG. */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * A vertical gradient from `from` to `to`, with a lighter circle in the middle.
 */
function makeImage(width, height, from, to) {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const rgba = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height * 0.42;
  const radius = Math.min(width, height) * 0.26;

  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let r = Math.round(r1 + (r2 - r1) * t);
      let g = Math.round(g1 + (g2 - g1) * t);
      let b = Math.round(b1 + (b2 - b1) * t);

      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < radius * radius) {
        // Soft highlight circle.
        r = Math.min(255, r + 60);
        g = Math.min(255, g + 60);
        b = Math.min(255, b + 60);
      }

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }

  return encodePng(width, height, rgba);
}

const ASSETS = [
  // Avatars — the demo children's profile pictures.
  { path: 'avatars/boy-1.png', w: 256, h: 256, from: '#6366f1', to: '#4338ca' },
  { path: 'avatars/boy-2.png', w: 256, h: 256, from: '#0ea5e9', to: '#0369a1' },
  { path: 'avatars/girl-1.png', w: 256, h: 256, from: '#ec4899', to: '#be185d' },

  // Fallback note images.
  { path: 'notes/physics-sample.png', w: 480, h: 320, from: '#6366f1', to: '#312e81' },
  { path: 'notes/math-sample.png', w: 480, h: 320, from: '#f59e0b', to: '#92400e' },
  { path: 'notes/chem-sample.png', w: 480, h: 320, from: '#10b981', to: '#065f46' },
  { path: 'notes/math-tasnim.png', w: 480, h: 320, from: '#f59e0b', to: '#b45309' },
  { path: 'notes/science-tasnim.png', w: 480, h: 320, from: '#10b981', to: '#047857' },
  { path: 'notes/english-tasnim.png', w: 480, h: 320, from: '#8b5cf6', to: '#5b21b6' },

  // Fallback upload images.
  { path: 'uploads/sample-math.png', w: 480, h: 320, from: '#f59e0b', to: '#78350f' },
  { path: 'uploads/sample-physics.png', w: 480, h: 320, from: '#6366f1', to: '#1e1b4b' },
];

for (const asset of ASSETS) {
  const target = path.join(PUBLIC_DIR, asset.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, makeImage(asset.w, asset.h, asset.from, asset.to));
  console.log('wrote', asset.path);
}

console.log(`\n${ASSETS.length} placeholder assets generated.`);
