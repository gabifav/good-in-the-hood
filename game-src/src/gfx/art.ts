// Procedural pixel art for tiles and furniture. Nothing is loaded from files.
import { outline, shade } from './sprites';

export const T = 16;
type Ctx = CanvasRenderingContext2D;
function P(c: Ctx, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function rnd(seed: number) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

export const ITEMS: Record<string, { name: string; emoji: string; cols: string[] }> = {
  tins: { name: 'Tinned tomatoes', emoji: '🥫', cols: ['#d8453f', '#c9c3b8', '#e9b44c'] },
  pasta: { name: 'Pasta', emoji: '🍝', cols: ['#f1d27a', '#3f6fb5', '#f6e4a6'] },
  rice: { name: 'Rice', emoji: '🍚', cols: ['#f5f2e8', '#7ab37a', '#e7e1cf'] },
  cereal: { name: 'Cereal', emoji: '🥣', cols: ['#f0a53b', '#e2574c', '#f6d36b'] },
  bread: { name: 'Bread', emoji: '🍞', cols: ['#d39a55', '#f0c98a', '#b8783b'] },
  fruit: { name: 'Apples', emoji: '🍎', cols: ['#d8363c', '#7bbf4a', '#e86a3a'] },
  veg: { name: 'Carrots & spuds', emoji: '🥕', cols: ['#ee8a2a', '#c49a62', '#6aa84f'] },
  milk: { name: 'Long-life milk', emoji: '🥛', cols: ['#f7f7f2', '#5b9bd5', '#e9eef3'] },
  soap: { name: 'Soap & toothpaste', emoji: '🧼', cols: ['#9fd8e8', '#f4a3c2', '#ffffff'] },
  tea: { name: 'Tea & coffee', emoji: '☕', cols: ['#7b4a2e', '#c9353c', '#2f6b4f'] },
};

// ── Tiles ──────────────────────────────────────────────────────────────────
export function drawTile(c: Ctx, ch: string, x: number, y: number, seed: number) {
  const r = rnd(seed);
  switch (ch) {
    case '#': // top of wall / roof edge
      P(c, x, y, T, T, '#5d4a63'); P(c, x, y + 13, T, 3, '#4a3a50');
      if (r() < 0.3) P(c, x + 3 + (r() * 9 | 0), y + 4 + (r() * 6 | 0), 2, 1, '#6c5873');
      break;
    case 'w': case 'W': case 'H': case 'V': { // wall face
      const home = ch === 'H' || ch === 'V';
      P(c, x, y, T, T, home ? '#f2dccb' : '#e9e2c9');
      P(c, x, y, T, 2, home ? '#e0c3b0' : '#d6cfb2');
      P(c, x, y + 12, T, 4, home ? '#b98d77' : '#9fb59a'); P(c, x, y + 12, T, 1, home ? '#a77c67' : '#8aa385');
      if (home && (x / T) % 2 === 0) P(c, x + 7, y + 3, 1, 8, '#ead0be');
      if (ch === 'W' || ch === 'V') { // window
        P(c, x + 2, y + 2, 12, 9, '#6b5a4f'); P(c, x + 3, y + 3, 10, 7, '#bfe6f5'); P(c, x + 3, y + 3, 10, 2, '#e3f6fc');
        P(c, x + 7, y + 3, 1, 7, '#6b5a4f'); P(c, x + 4, y + 6, 2, 1, '#ffffff');
        P(c, x + 1, y + 11, 14, 1, '#8b7566');
      }
      break;
    }
    case '.': { // lino
      P(c, x, y, T, T, '#d9dccd'); P(c, x, y, T, 1, '#cfd3c2'); P(c, x, y, 1, T, '#cfd3c2');
      if (r() < 0.25) P(c, x + (r() * 14 | 0), y + (r() * 14 | 0), 1, 1, '#c6cab8');
      break;
    }
    case 'k': { // kitchen tiles
      const alt = ((x / T) + (y / T)) % 2 === 0;
      P(c, x, y, T, T, alt ? '#f4f1ea' : '#cfe3e8'); P(c, x, y, T, 1, '#dfe4e2'); P(c, x, y, 1, T, '#dfe4e2');
      break;
    }
    case 'o': { // wood floor
      P(c, x, y, T, T, '#d9a878');
      for (let i = 0; i < 4; i++) P(c, x, y + i * 4 + 3, T, 1, '#c79466');
      P(c, x + ((seed * 5) % 12) + 2, y, 1, 3, '#c79466'); P(c, x + ((seed * 7) % 12) + 2, y + 8, 1, 3, '#c79466');
      break;
    }
    case 'g': {
      P(c, x, y, T, T, '#9fd17c');
      for (let i = 0; i < 4; i++) { const gx = x + (r() * 14 | 0), gy = y + (r() * 13 | 0); P(c, gx, gy, 1, 2, '#86bd66'); P(c, gx + 1, gy + 1, 1, 1, '#86bd66'); }
      if (r() < 0.12) { const fx = x + 3 + (r() * 9 | 0), fy = y + 3 + (r() * 9 | 0); P(c, fx, fy, 2, 2, r() < 0.5 ? '#ffffff' : '#ffd36e'); }
      break;
    }
    case 'p': {
      P(c, x, y, T, T, '#e3cfa8');
      if (r() < 0.5) P(c, x + (r() * 13 | 0), y + (r() * 13 | 0), 2, 1, '#cfb98f');
      break;
    }
    case 'd': { // doormat
      P(c, x, y, T, T, '#d9dccd'); P(c, x + 1, y + 2, 14, 12, '#a0694a'); P(c, x + 2, y + 3, 12, 10, '#b97c58');
      break;
    }
    default:
      P(c, x, y, T, T, '#000');
  }
}

// ── Furniture & objects ─────────────────────────────────────────────────────
function cv(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const e = document.createElement('canvas'); e.width = w; e.height = h; return [e, e.getContext('2d')!];
}
const cache = new Map<string, HTMLCanvasElement>();
function cached(key: string, make: () => HTMLCanvasElement) {
  let v = cache.get(key); if (!v) { v = make(); cache.set(key, v); } return v;
}

export function shelfArt(item: string): HTMLCanvasElement {
  return cached('shelf:' + item, () => {
    const [e, c] = cv(32, 34); const cols = ITEMS[item].cols;
    P(c, 1, 2, 30, 31, '#8a5a3c'); P(c, 3, 4, 26, 27, '#5e3d2b');
    const r = rnd(item.length * 13);
    for (let row = 0; row < 3; row++) {
      const by = 5 + row * 9;
      P(c, 2, by + 7, 28, 2, '#a8754f');
      let xx = 4;
      while (xx < 27) {
        const w = item === 'bread' ? 6 : item === 'fruit' || item === 'veg' ? 3 : item === 'milk' ? 4 : 3;
        const h = item === 'cereal' ? 7 : item === 'milk' ? 6 : item === 'bread' ? 4 : item === 'fruit' || item === 'veg' ? 3 : 5;
        const col = cols[(r() * cols.length) | 0];
        P(c, xx, by + 7 - h, Math.min(w, 28 - xx), h, col);
        if (item === 'tins') P(c, xx, by + 7 - h + 1, w, 1, '#ffffff');
        if (item === 'cereal' || item === 'pasta') P(c, xx, by + 7 - h, w, 1, shade(col, 0.3));
        xx += w + (item === 'fruit' || item === 'veg' ? 0 : 1);
      }
    }
    // label
    P(c, 10, 0, 12, 6, '#fff8e7'); c.font = '5px monospace';
    outline(e); return e;
  });
}

export function labelArt(text: string, bg = '#fff8e7', fg = '#3b2f45'): HTMLCanvasElement {
  return cached('label:' + text + bg, () => {
    const w = Math.max(10, text.length * 4 + 4);
    const [e, c] = cv(w + 2, 9);
    P(c, 1, 1, w, 7, bg);
    drawTinyText(c, text, 3, 2, fg);
    outline(e); return e;
  });
}

// 3x5 pixel font for crate labels etc.
const FONT: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '011', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'], 'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
  'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'], 'E': ['111', '100', '110', '100', '111'],
  'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'], 'I': ['111', '010', '010', '010', '111'],
  'K': ['101', '110', '100', '110', '101'], 'L': ['100', '100', '100', '100', '111'], 'N': ['110', '101', '101', '101', '101'],
  'O': ['111', '101', '101', '101', '111'], 'P': ['110', '101', '110', '100', '100'], 'R': ['110', '101', '110', '101', '101'],
  'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'], 'U': ['101', '101', '101', '101', '111'],
  'V': ['101', '101', '101', '101', '010'], 'W': ['101', '101', '111', '111', '101'], 'Y': ['101', '101', '010', '010', '010'],
  'F': ['111', '100', '110', '100', '100'], 'M': ['101', '111', '111', '101', '101'], ' ': ['000', '000', '000', '000', '000'],
  '♥': ['000', '101', '111', '010', '000'],
};
export function drawTinyText(c: Ctx, text: string, x: number, y: number, col: string) {
  c.fillStyle = col;
  [...text.toUpperCase()].forEach((ch, i) => {
    const g = FONT[ch]; if (!g) return;
    g.forEach((row, ry) => [...row].forEach((b, rx) => { if (b === '1') c.fillRect(x + i * 4 + rx, y + ry, 1, 1); }));
  });
}

export function crateArt(label: string, filled: number, total: number): HTMLCanvasElement {
  return cached(`crate:${label}:${filled}:${total}`, () => {
    const [e, c] = cv(20, 22);
    // bags poking out
    const shown = Math.min(filled, 3);
    for (let i = 0; i < shown; i++) { const bx = 3 + i * 5; P(c, bx, 4 - (i % 2), 5, 8, ['#7cc48b', '#f4d35e', '#ef8a5b'][i]); P(c, bx + 1, 2 - (i % 2), 3, 2, shade(['#7cc48b', '#f4d35e', '#ef8a5b'][i], -0.2)); }
    const full = filled >= total;
    const col = full ? '#5fb37a' : '#4f86c6';
    P(c, 1, 8, 18, 13, col); P(c, 1, 8, 18, 2, shade(col, 0.25));
    for (let i = 0; i < 4; i++) P(c, 3 + i * 4, 11, 2, 3, shade(col, -0.25));
    P(c, 3, 15, 14, 5, '#fff8e7');
    drawTinyText(c, label, 10 - label.length * 2, 15, '#3b2f45');
    outline(e); return e;
  });
}

export function bagStationArt(): HTMLCanvasElement {
  return cached('bagstation', () => {
    const [e, c] = cv(32, 22);
    P(c, 1, 8, 30, 6, '#c9935f'); P(c, 1, 8, 30, 1, '#ddb07c'); P(c, 3, 14, 2, 8, '#8a5a3c'); P(c, 27, 14, 2, 8, '#8a5a3c');
    for (let i = 0; i < 4; i++) { P(c, 3 + i * 2, 2 + i, 10, 6, ['#7cc48b', '#f4d35e', '#ef8a5b', '#9fd8e8'][i]); }
    P(c, 17, 3, 12, 5, '#e9e2c9'); P(c, 18, 4, 10, 1, '#b9b2a0'); P(c, 18, 6, 7, 1, '#b9b2a0'); // order cards
    outline(e); return e;
  });
}

export function tableArt(wTiles: number, hasStuff = true): HTMLCanvasElement {
  return cached('table' + wTiles + hasStuff, () => {
    const W = wTiles * 16;
    const [e, c] = cv(W, 22);
    P(c, 1, 6, W - 2, 8, '#c9935f'); P(c, 1, 6, W - 2, 1, '#ddb07c'); P(c, 3, 14, 2, 8, '#8a5a3c'); P(c, W - 5, 14, 2, 8, '#8a5a3c');
    if (hasStuff) { P(c, 6, 2, 8, 5, '#e3c48f'); P(c, W - 16, 3, 6, 4, '#7cc48b'); }
    outline(e); return e;
  });
}

export function counterArt(bags: number): HTMLCanvasElement {
  return cached('counter' + bags, () => {
    const [e, c] = cv(32, 24);
    for (let i = 0; i < Math.min(bags, 4); i++) { P(c, 3 + i * 7, 2, 6, 7, ['#7cc48b', '#f4d35e', '#ef8a5b', '#9fd8e8'][i]); P(c, 4 + i * 7, 0, 4, 2, '#5d4a63'); }
    P(c, 1, 8, 30, 15, '#7d9fc9'); P(c, 1, 8, 30, 3, '#f4f1ea'); P(c, 4, 13, 24, 7, shade('#7d9fc9', -0.15));
    drawTinyText(c, 'PICK UP', 2, 14, '#ffffff');
    outline(e); return e;
  });
}

export function boardArt(progress: number[]): HTMLCanvasElement {
  return cached('board' + progress.join(','), () => {
    const [e, c] = cv(36, 22);
    P(c, 1, 1, 34, 20, '#9aa0a8'); P(c, 2, 2, 32, 18, '#ffffff');
    progress.forEach((p, i) => { P(c, 4, 3 + i * 2, 28, 1, '#ececf3'); P(c, 4, 3 + i * 2, Math.round(28 * p), 1, p >= 1 ? '#49c27d' : ['#8e7dff', '#4aa8ff', '#f0b429', '#ef6b8f', '#ff8c42', '#9b59b6', '#49c27d', '#4aa8ff'][i % 8]); });
    outline(e); return e;
  });
}

export function stoveArt(): HTMLCanvasElement {
  return cached('stove', () => {
    const [e, c] = cv(16, 28);
    P(c, 1, 6, 14, 21, '#e9eef3'); P(c, 1, 6, 14, 5, '#3b3740');
    P(c, 3, 7, 4, 3, '#55505c'); P(c, 9, 7, 4, 3, '#55505c');
    P(c, 3, 14, 10, 8, '#3b3740'); P(c, 4, 15, 8, 6, '#6d5f72'); P(c, 3, 12, 10, 1, '#b9c2cc');
    P(c, 2, 0, 12, 6, '#c9d3dc'); P(c, 3, 1, 10, 1, '#e9eef3'); // rangehood
    outline(e); return e;
  });
}
export function benchArt(sink = false): HTMLCanvasElement {
  return cached('bench' + sink, () => {
    const [e, c] = cv(16, 24);
    P(c, 1, 6, 14, 17, '#f4f1ea'); P(c, 0, 5, 16, 3, '#b8c4cc'); P(c, 3, 10, 10, 11, '#e1ddd2'); P(c, 7, 14, 2, 1, '#9aa0a8');
    if (sink) { P(c, 3, 5, 10, 2, '#8fa1ad'); P(c, 7, 1, 2, 4, '#b9c2cc'); P(c, 7, 1, 4, 1, '#b9c2cc'); }
    else { P(c, 3, 2, 4, 3, '#e98f5b'); P(c, 9, 3, 4, 2, '#9fd17c'); }
    outline(e); return e;
  });
}
export function fridgeArt(): HTMLCanvasElement {
  return cached('fridge', () => {
    const [e, c] = cv(16, 32);
    P(c, 1, 1, 14, 30, '#e9f1f5'); P(c, 1, 12, 14, 1, '#b9c7cf'); P(c, 12, 4, 1, 5, '#9aa9b2'); P(c, 12, 15, 1, 8, '#9aa9b2');
    P(c, 3, 3, 3, 3, '#f4a3c2'); P(c, 7, 16, 3, 4, '#f4d35e'); P(c, 4, 18, 2, 2, '#7cc48b'); // magnets & drawings
    outline(e); return e;
  });
}
export function islandArt(tarts: number): HTMLCanvasElement {
  return cached('island' + tarts, () => {
    const [e, c] = cv(64, 22);
    P(c, 1, 6, 62, 15, '#f4f1ea'); P(c, 0, 5, 64, 3, '#c9935f'); P(c, 4, 10, 56, 9, '#e1ddd2');
    P(c, 6, 1, 20, 5, '#2b2833'); // tray
    for (let i = 0; i < 8; i++) {
      const tx = 7 + (i % 4) * 5, ty = 1 + ((i / 4) | 0) * 2;
      if (tarts > 0) { P(c, tx, ty, 4, 2, '#f1d9a8'); if (tarts > 1) P(c, tx + 1, ty, 2, 1, '#ef8a2a'); if (tarts > 2) P(c, tx + 2, ty, 1, 1, '#4f8a3c'); }
    }
    P(c, 36, 2, 10, 4, '#ef8a2a'); P(c, 40, 0, 2, 2, '#4f8a3c'); // pumpkin
    P(c, 50, 3, 9, 3, '#d8c3a0'); P(c, 51, 2, 7, 1, '#e8d6b6'); // rolling pin / pastry
    outline(e); return e;
  });
}
export function vanArt(): HTMLCanvasElement {
  return cached('van', () => {
    const [e, c] = cv(64, 40);
    P(c, 2, 6, 44, 28, '#f7f7f2'); P(c, 46, 14, 16, 20, '#f7f7f2'); P(c, 46, 14, 12, 1, '#e1e1da');
    P(c, 48, 16, 10, 8, '#9fd0e6'); P(c, 49, 17, 4, 2, '#d6eef8');
    P(c, 2, 26, 60, 4, '#7cc48b'); P(c, 2, 30, 60, 3, '#d8dde3');
    // heart logo
    P(c, 16, 12, 4, 3, '#ef6b8f'); P(c, 22, 12, 4, 3, '#ef6b8f'); P(c, 16, 15, 10, 3, '#ef6b8f'); P(c, 18, 18, 6, 2, '#ef6b8f'); P(c, 20, 20, 2, 1, '#ef6b8f');
    drawTinyText(c, 'GOOD IN', 6, 6 + 16, '#3b2f45');
    for (const wx of [10, 50]) { P(c, wx, 31, 9, 9, '#2b2833'); P(c, wx + 3, 34, 3, 3, '#9aa0a8'); }
    outline(e); return e;
  });
}
export function signArt(): HTMLCanvasElement {
  return cached('sign', () => {
    const [e, c] = cv(48, 30);
    P(c, 6, 14, 2, 16, '#8a5a3c'); P(c, 40, 14, 2, 16, '#8a5a3c');
    P(c, 1, 1, 46, 15, '#7cc48b'); P(c, 3, 3, 42, 11, '#fff8e7');
    drawTinyText(c, 'GOOD IN', 9, 3, '#3b2f45'); drawTinyText(c, 'THE HOOD', 7, 9, '#2f6b4f');
    P(c, 38, 4, 2, 2, '#ef6b8f'); P(c, 41, 4, 2, 2, '#ef6b8f'); P(c, 38, 6, 5, 2, '#ef6b8f'); P(c, 39, 8, 3, 1, '#ef6b8f');
    outline(e); return e;
  });
}
export function treeArt(v = 0): HTMLCanvasElement {
  return cached('tree' + v, () => {
    const [e, c] = cv(32, 44);
    P(c, 13, 28, 6, 15, '#8a5a3c'); P(c, 14, 28, 2, 15, '#a26e4c');
    const g = v ? '#7fbf6a' : '#6aae5c';
    P(c, 4, 6, 24, 22, g); P(c, 8, 2, 16, 4, g); P(c, 2, 12, 28, 12, g);
    P(c, 8, 6, 8, 4, shade(g, 0.25)); P(c, 6, 10, 4, 3, shade(g, 0.25)); P(c, 18, 22, 8, 4, shade(g, -0.15));
    if (v) { P(c, 10, 14, 2, 2, '#ef6b8f'); P(c, 20, 10, 2, 2, '#ef6b8f'); P(c, 15, 20, 2, 2, '#ef6b8f'); }
    outline(e); return e;
  });
}
export function potPlantArt(v = 0): HTMLCanvasElement {
  return cached('pot' + v, () => {
    const [e, c] = cv(16, 24);
    P(c, 4, 16, 8, 7, v ? '#c46b4a' : '#d9a878'); P(c, 3, 15, 10, 2, shade(v ? '#c46b4a' : '#d9a878', 0.15));
    const g = '#5fa35a';
    P(c, 7, 4, 2, 11, g); P(c, 3, 6, 4, 3, g); P(c, 9, 3, 4, 3, g); P(c, 2, 11, 5, 3, g); P(c, 9, 9, 5, 3, g); P(c, 6, 1, 3, 3, shade(g, 0.2));
    outline(e); return e;
  });
}
export function busStopArt(): HTMLCanvasElement {
  return cached('bus', () => {
    const [e, c] = cv(32, 34);
    P(c, 2, 4, 2, 30, '#6b6f78'); P(c, 28, 4, 2, 30, '#6b6f78'); P(c, 0, 2, 32, 4, '#4f86c6');
    P(c, 5, 8, 22, 14, '#cfe8f2'); P(c, 6, 9, 6, 3, '#ffffff');
    P(c, 4, 24, 24, 3, '#c9935f'); P(c, 6, 27, 2, 6, '#8a5a3c'); P(c, 24, 27, 2, 6, '#8a5a3c');
    drawTinyText(c, 'HOME', 9, 15, '#2f3550');
    outline(e); return e;
  });
}

// Home furniture
export function bedArt(): HTMLCanvasElement {
  return cached('bed', () => {
    const [e, c] = cv(32, 36);
    P(c, 1, 0, 30, 10, '#8a5a3c'); P(c, 3, 2, 26, 6, '#a26e4c');
    P(c, 2, 8, 28, 26, '#f4f1ea'); P(c, 4, 9, 10, 6, '#ffffff'); P(c, 18, 9, 10, 6, '#ffffff');
    P(c, 2, 17, 28, 17, '#b9a3e3'); P(c, 2, 17, 28, 2, '#cdbcf0');
    for (let i = 0; i < 4; i++) P(c, 6 + i * 6, 22 + (i % 2) * 5, 3, 3, '#f4d35e');
    P(c, 2, 33, 28, 3, '#8a5a3c');
    outline(e); return e;
  });
}
export function wardrobeArt(): HTMLCanvasElement {
  return cached('wardrobe', () => {
    const [e, c] = cv(32, 38);
    P(c, 1, 1, 30, 36, '#c9935f'); P(c, 3, 3, 12, 31, '#d9a878'); P(c, 17, 3, 12, 31, '#d9a878');
    P(c, 13, 16, 1, 5, '#6b4a33'); P(c, 18, 16, 1, 5, '#6b4a33');
    P(c, 1, 0, 30, 2, '#a26e4c');
    // a scarf hanging out
    P(c, 15, 22, 2, 8, '#ef6b8f');
    outline(e); return e;
  });
}
export function nightstandArt(): HTMLCanvasElement {
  return cached('night', () => {
    const [e, c] = cv(16, 26);
    P(c, 2, 12, 12, 13, '#c9935f'); P(c, 3, 15, 10, 1, '#a26e4c'); P(c, 7, 18, 2, 1, '#6b4a33');
    P(c, 6, 7, 4, 5, '#f4f1ea'); P(c, 4, 1, 8, 6, '#f4d35e'); P(c, 5, 2, 6, 1, '#ffe9a3');
    outline(e); return e;
  });
}
export function tvArt(): HTMLCanvasElement {
  return cached('tv', () => {
    const [e, c] = cv(32, 28);
    P(c, 2, 16, 28, 11, '#a26e4c'); P(c, 4, 19, 10, 6, '#8a5a3c'); P(c, 18, 19, 10, 6, '#8a5a3c');
    P(c, 4, 1, 24, 15, '#2b2833'); P(c, 6, 3, 20, 11, '#7ec4cf'); P(c, 8, 9, 6, 3, '#f4d35e'); P(c, 16, 5, 6, 5, '#ef8a5b');
    outline(e); return e;
  });
}
export function couchArt(): HTMLCanvasElement {
  return cached('couch', () => {
    const [e, c] = cv(64, 24);
    const col = '#8fb8a6';
    P(c, 2, 4, 60, 12, shade(col, -0.1)); P(c, 0, 8, 6, 14, col); P(c, 58, 8, 6, 14, col);
    P(c, 6, 12, 52, 10, col); P(c, 6, 12, 52, 2, shade(col, 0.2)); P(c, 32, 12, 1, 10, shade(col, -0.2));
    P(c, 10, 6, 8, 7, '#f4d35e'); P(c, 46, 6, 8, 7, '#ef8a5b');
    outline(e); return e;
  });
}
export function rugArt(): HTMLCanvasElement {
  return cached('rug', () => {
    const [e, c] = cv(64, 48);
    P(c, 2, 2, 60, 44, '#e9a3b8'); P(c, 6, 6, 52, 36, '#f4c4d2'); P(c, 12, 12, 40, 24, '#e9a3b8'); P(c, 18, 18, 28, 12, '#fbe1e8');
    for (let i = 0; i < 15; i++) { P(c, 2 + i * 4, 0, 1, 2, '#e9a3b8'); P(c, 2 + i * 4, 46, 1, 2, '#e9a3b8'); }
    return e;
  });
}
export function diningArt(): HTMLCanvasElement {
  return cached('dining', () => {
    const [e, c] = cv(32, 26);
    P(c, 1, 6, 30, 8, '#c9935f'); P(c, 1, 6, 30, 2, '#ddb07c'); P(c, 3, 14, 2, 10, '#8a5a3c'); P(c, 27, 14, 2, 10, '#8a5a3c');
    P(c, 12, 2, 8, 5, '#f4f1ea'); P(c, 13, 0, 2, 3, '#ef6b8f'); P(c, 17, 1, 2, 2, '#f4d35e');
    outline(e); return e;
  });
}
export function herbArt(stage: number, watered: boolean): HTMLCanvasElement {
  return cached('herb' + stage + watered, () => {
    const [e, c] = cv(32, 22);
    P(c, 1, 12, 30, 9, '#a26e4c'); P(c, 1, 12, 30, 2, '#c9935f'); P(c, 3, 14, 26, 2, watered ? '#5e3d2b' : '#7d553d');
    const g = '#5fa35a';
    for (let i = 0; i < 3; i++) {
      const x = 5 + i * 9;
      if (stage === 0) { P(c, x + 2, 11, 1, 2, g); }
      if (stage >= 1) { P(c, x + 2, 8, 1, 5, g); P(c, x, 9, 2, 2, g); P(c, x + 3, 8, 2, 2, g); }
      if (stage >= 2) { P(c, x - 1, 5, 3, 3, g); P(c, x + 3, 4, 3, 3, g); P(c, x + 1, 2, 3, 3, shade(g, 0.2)); }
      if (stage >= 3) { P(c, x + 1, 1, 2, 2, '#ffffff'); P(c, x + 4, 5, 2, 2, ['#ef6b8f', '#f4d35e', '#b9a3e3'][i]); }
    }
    outline(e); return e;
  });
}
export function deskArt(): HTMLCanvasElement {
  return cached('desk', () => {
    const [e, c] = cv(32, 26);
    P(c, 1, 8, 30, 6, '#c9935f'); P(c, 1, 8, 30, 1, '#ddb07c'); P(c, 3, 14, 2, 11, '#8a5a3c'); P(c, 27, 14, 2, 11, '#8a5a3c');
    P(c, 4, 0, 12, 9, '#8a5a3c'); P(c, 5, 1, 10, 7, '#cfe8f2'); // photo frame
    for (let i = 0; i < 5; i++) P(c, 6 + i * 2, 4, 1, 3, ['#ef6b8f', '#7cc48b', '#f4d35e', '#b9a3e3', '#ef8a5b'][i]);
    P(c, 20, 3, 8, 6, '#7cc48b'); P(c, 21, 2, 6, 1, '#f4f1ea'); // mug of pens
    outline(e); return e;
  });
}
export function doorArt(): HTMLCanvasElement {
  return cached('door', () => {
    const [e, c] = cv(16, 24);
    P(c, 1, 0, 14, 24, '#8a5a3c'); P(c, 3, 2, 10, 20, '#a26e4c'); P(c, 11, 12, 2, 2, '#f4d35e');
    outline(e); return e;
  });
}
export function bookshelfArt(): HTMLCanvasElement {
  return cached('books', () => {
    const [e, c] = cv(16, 32);
    P(c, 1, 1, 14, 30, '#8a5a3c'); P(c, 2, 2, 12, 28, '#5e3d2b');
    const cols = ['#ef6b8f', '#7cc48b', '#f4d35e', '#4f86c6', '#b9a3e3', '#ef8a5b'];
    for (let r = 0; r < 3; r++) { for (let i = 0; i < 5; i++) P(c, 3 + i * 2, 4 + r * 9, 2, 6, cols[(i + r) % cols.length]); P(c, 2, 10 + r * 9, 12, 1, '#a26e4c'); }
    outline(e); return e;
  });
}
export function dogBowlArt(): HTMLCanvasElement {
  return cached('bowl', () => {
    const [e, c] = cv(14, 8);
    P(c, 1, 2, 12, 5, '#ef6b8f'); P(c, 2, 1, 10, 2, '#c45b7d'); P(c, 3, 1, 8, 1, '#a0694a');
    outline(e); return e;
  });
}
