// Derives favicon.ico (16+32+48 px), favicon.svg, and apple-touch-icon.png
// from public/icons/icon-512x512.png using the sharp library.
// Run with: node scripts/generate-favicons.mjs

import { readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';

const SRC = 'public/icons/icon-512x512.png';

// ── 1. apple-touch-icon.png (180×180) ─────────────────────────────────────
await sharp(SRC).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('✓ apple-touch-icon.png (180×180)');

// ── 2. favicon.ico (16 + 32 + 48 px, PNG data inside ICO container) ───────
const ICO_SIZES = [16, 32, 48];
const pngBuffers = await Promise.all(
  ICO_SIZES.map(s => sharp(SRC).resize(s, s).png().toBuffer())
);

const HEADER_SZ = 6;
const ENTRY_SZ  = 16;
const header = Buffer.alloc(HEADER_SZ);
header.writeUInt16LE(0, 0);             // reserved
header.writeUInt16LE(1, 2);             // type: 1 = ICO
header.writeUInt16LE(ICO_SIZES.length, 4);

let offset = HEADER_SZ + ENTRY_SZ * ICO_SIZES.length;
const entries = ICO_SIZES.map((sz, i) => {
  const e = Buffer.alloc(ENTRY_SZ);
  e[0] = sz;                            // width  (0 means 256)
  e[1] = sz;                            // height
  e[2] = 0;                             // colour count
  e[3] = 0;                             // reserved
  e.writeUInt16LE(1,  4);              // colour planes
  e.writeUInt16LE(32, 6);              // bits per pixel
  e.writeUInt32LE(pngBuffers[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngBuffers[i].length;
  return e;
});

writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...pngBuffers]));
console.log('✓ favicon.ico (16 + 32 + 48 px)');

// ── 3. favicon.svg (SVG wrapper around the 192×192 PNG as base64) ──────────
const png192 = readFileSync('public/icons/icon-192x192.png');
const b64    = png192.toString('base64');
const svg    = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 192 192">
  <image width="192" height="192" href="data:image/png;base64,${b64}"/>
</svg>
`;
writeFileSync('public/favicon.svg', svg);
console.log('✓ favicon.svg (192×192 embedded as base64)');
