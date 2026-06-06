// Generates public/icons/icon-192x192.png and icon-512x512.png
// Uses only Node.js built-ins (zlib + fs) — no extra packages needed.

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

// ── CRC-32 (required by PNG spec) ──────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = (c >>> 8) ^ crcTable[(c ^ b) & 0xff];
  return ((c ^ 0xffffffff) >>> 0);
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(d.length, 0);
  const crcOut = Buffer.allocUnsafe(4);
  crcOut.writeUInt32BE(crc32(Buffer.concat([t, d])), 0);
  return Buffer.concat([len, t, d, crcOut]);
}

// ── Icon design ────────────────────────────────────────────────────────────
// Black background · gold ring · dark-red inner fill · gold "M" lettermark
function pixel(x, y, size) {
  const cx = size / 2, cy = size / 2;
  const r  = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (size / 2);

  // Background ring zones
  const inOuter = r < 0.88;
  const inRing  = r >= 0.62 && r < 0.88;
  const inInner = r < 0.62;

  if (!inOuter) return [0, 0, 0]; // outside — black

  // "M" lettermark (normalised coords 0-1)
  const nx = x / size, ny = y / size;
  const inBox = nx > 0.22 && nx < 0.78 && ny > 0.28 && ny < 0.74;
  if (inBox) {
    const lx = (nx - 0.22) / 0.56; // 0→1 within the letter box
    const ly = (ny - 0.28) / 0.46;

    const leftStem  = lx < 0.16;
    const rightStem = lx > 0.84;
    const leftDiag  = ly < 0.55 && Math.abs(lx - ly * 0.34) < 0.10;
    const rightDiag = ly < 0.55 && Math.abs((1 - lx) - ly * 0.34) < 0.10;

    if (leftStem || rightStem || leftDiag || rightDiag) {
      return [255, 215, 0]; // gold lettermark
    }
  }

  if (inRing)  return [255, 200, 0]; // gold ring
  if (inInner) return [120, 0, 0];   // dark red fill
  return [0, 0, 0];
}

function createPNG(size) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y, size);
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }

  const idat = deflateSync(Buffer.concat(rows), { level: 9 });
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192x192.png', createPNG(192));
writeFileSync('public/icons/icon-512x512.png', createPNG(512));
writeFileSync('public/apple-touch-icon.png',   createPNG(180));
console.log('Generated icon-192x192.png, icon-512x512.png, apple-touch-icon.png');
