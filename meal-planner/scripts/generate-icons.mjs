// Generates the PWA icon PNGs from scratch (no external image libraries).
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'icons');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = chunk('IDAT', deflateSync(raw, { level: 9 }));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// --- Icon drawing -----------------------------------------------------

// Soft pastel palette to match the app's calm, rounded look: a blush-rose
// ground, a soft plum outline (not black), and pastel produce dots.
const BG = [246, 205, 214]; // soft rose
const WHITE = [255, 255, 255];
const INK = [74, 67, 88]; // soft plum-grey outline color used across the app
const PINK = [245, 201, 155]; // soft peach produce dot
const VIOLET = [191, 234, 216]; // soft mint produce dot

function bgColorAt() {
  return BG;
}

function mix(base, color, alpha) {
  return [
    Math.round(base[0] * (1 - alpha) + color[0] * alpha),
    Math.round(base[1] * (1 - alpha) + color[1] * alpha),
    Math.round(base[2] * (1 - alpha) + color[2] * alpha),
  ];
}

function inCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// u,v are 0..1 normalized coordinates. Returns [r,g,b,a] or null for "background only".
function basketPixel(u, v) {
  // Basket body: trapezoid, wider at top.
  const topY = 0.40;
  const bottomY = 0.80;
  if (v >= topY && v <= bottomY) {
    const t = (v - topY) / (bottomY - topY);
    const topHalf = 0.30;
    const bottomHalf = 0.19;
    const half = topHalf + (bottomHalf - topHalf) * t;
    const left = 0.5 - half;
    const right = 0.5 + half;
    if (u >= left && u <= right) {
      // weave texture lines
      const nearLine = Math.abs(v - 0.53) < 0.016 || Math.abs(v - 0.67) < 0.016;
      if (nearLine) return { color: INK, alpha: 1 };
      // thick comic-style outline near edges
      const edgeDist = Math.min(u - left, right - u, bottomY - v);
      if (edgeDist < 0.022) return { color: INK, alpha: 1 };
      return { color: WHITE, alpha: 1 };
    }
  }
  // Handle: half-ring arch above the basket, outlined in black on both edges.
  const handleCx = 0.5;
  const handleCy = 0.40;
  const outerR = 0.19;
  const innerR = 0.135;
  const dx = u - handleCx;
  const dy = v - handleCy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= outerR + 0.016 && dist >= innerR - 0.016 && v <= handleCy + 0.02) {
    if (dist <= outerR && dist >= innerR) return { color: WHITE, alpha: 1 };
    return { color: INK, alpha: 1 };
  }
  // Two "produce" circles peeking over the basket rim, each ringed in black.
  const dotRadius = 0.075;
  const dotRing = dotRadius + 0.016;
  if (inCircle(u, v, 0.40, 0.385, dotRing)) {
    return inCircle(u, v, 0.40, 0.385, dotRadius) ? { color: PINK, alpha: 1 } : { color: INK, alpha: 1 };
  }
  if (inCircle(u, v, 0.60, 0.385, dotRing)) {
    return inCircle(u, v, 0.60, 0.385, dotRadius) ? { color: VIOLET, alpha: 1 } : { color: INK, alpha: 1 };
  }
  return null;
}

function renderIcon({ size, rounded, fullBleed }) {
  const rgba = Buffer.alloc(size * size * 4);
  const cornerRadius = rounded ? size * 0.18 : 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let alpha = 1;

      if (rounded && !fullBleed) {
        // Rounded-square mask with transparent corners.
        const rx = Math.min(x, size - 1 - x);
        const ry = Math.min(y, size - 1 - y);
        if (rx < cornerRadius && ry < cornerRadius) {
          const dx = cornerRadius - rx;
          const dy = cornerRadius - ry;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > cornerRadius) alpha = 0;
        }
      }

      let color = bgColorAt(y / size);
      // Normalized coords; for full-bleed (maskable) icons keep the artwork
      // inside the ~80% safe zone so OS masks don't clip it.
      const scale = fullBleed ? 0.78 : 1;
      const offset = (1 - scale) / 2;
      const u = (x / size - offset) / scale;
      const v = (y / size - offset) / scale;

      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const px = basketPixel(u, v);
        if (px) color = mix(color, px.color, px.alpha);
      }

      rgba[idx] = color[0];
      rgba[idx + 1] = color[1];
      rgba[idx + 2] = color[2];
      rgba[idx + 3] = Math.round(255 * alpha);
    }
  }
  return rgba;
}

const targets = [
  { name: 'icon-192.png', size: 192, rounded: true, fullBleed: false },
  { name: 'icon-512.png', size: 512, rounded: true, fullBleed: false },
  { name: 'icon-512-maskable.png', size: 512, rounded: false, fullBleed: true },
  { name: 'apple-touch-icon.png', size: 180, rounded: false, fullBleed: true },
  { name: 'favicon.png', size: 64, rounded: true, fullBleed: false },
];

for (const t of targets) {
  const rgba = renderIcon(t);
  const png = encodePNG(t.size, t.size, rgba);
  writeFileSync(join(OUT_DIR, t.name), png);
  console.log(`wrote ${t.name} (${t.size}x${t.size}, ${png.length} bytes)`);
}
