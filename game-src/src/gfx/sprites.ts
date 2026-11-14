// Procedural pixel-art characters. Every person is drawn from their looks + outfit,
// so outfits can be swapped freely. Cells are 18x26 (16x24 art + 1px outline margin).
import type { Looks, Outfit } from '../config/team';

export const CW = 18, CH = 26;
export type Dir = 'down' | 'left' | 'right' | 'up';
export const DIRS: Dir[] = ['down', 'left', 'right', 'up'];
const INK = '#3b2f45';

type Ctx = CanvasRenderingContext2D;

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function P(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
}

/** Adds a 1px dark outline around every opaque pixel. */
export function outline(cv: HTMLCanvasElement, col = INK) {
  const c = cv.getContext('2d')!;
  const { width: w, height: h } = cv;
  const d = c.getImageData(0, 0, w, h);
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d.data[(y * w + x) * 4 + 3];
  const add: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(x, y) > 0) continue;
    if (a(x - 1, y) > 100 || a(x + 1, y) > 100 || a(x, y - 1) > 100 || a(x, y + 1) > 100) add.push(x, y);
  }
  c.fillStyle = col;
  for (let i = 0; i < add.length; i += 2) c.fillRect(add[i], add[i + 1], 1, 1);
}

// ── Body parts (drawn for a 16x24 figure, origin top-left) ──────────────────

function drawLegs(c: Ctx, o: Outfit, l: Looks, dir: Dir, f: number) {
  const side = dir === 'left' || dir === 'right';
  const skin = l.skin, shoe = o.shoeColor, bc = o.bottomColor;
  const bareLegs = o.bottom === 'skirt' || o.bottom === 'shorts';
  const legCol = o.bottom === 'trousers' || o.bottom === 'leggings' ? bc : skin;
  if (!side) {
    // feet lift alternately
    const la = f === 1 ? -1 : 0, ra = f === 2 ? -1 : 0;
    P(c, 5, 18 + la, 3, 4, legCol); P(c, 8, 18 + ra, 3, 4, legCol);
    if (o.bottom === 'trousers') { P(c, 7, 18, 2, 1, shade(bc, -0.25)); }
    P(c, 5, 22 + la, 3, 2, shoe); P(c, 8, 22 + ra, 3, 2, shoe);
  } else {
    const a = f === 1 ? 2 : f === 2 ? -2 : 0;
    P(c, 6 - a / 2, 18, 3, 4, shade(legCol, -0.1)); P(c, 7 + a / 2, 18, 3, 4, legCol);
    P(c, 6 - a / 2, 22, 3, 2, shade(shoe, -0.1)); P(c, 7 + a / 2, 22, 4, 2, shoe);
  }
  // bottoms
  if (o.bottom === 'skirt') {
    if (!side) { P(c, 4, 17, 8, 2, bc); P(c, 3, 19, 10, 2, bc); P(c, 3, 20, 10, 1, shade(bc, -0.2)); }
    else { P(c, 5, 17, 7, 2, bc); P(c, 4, 19, 9, 2, bc); P(c, 4, 20, 9, 1, shade(bc, -0.2)); }
  } else if (o.bottom === 'shorts') {
    if (!side) { P(c, 4, 17, 8, 3, bc); P(c, 7, 19, 2, 1, shade(bc, -0.3)); }
    else { P(c, 5, 17, 6, 3, bc); }
  } else {
    if (!side) P(c, 4, 17, 8, 2, bc); else P(c, 5, 17, 6, 2, bc);
  }
  void bareLegs;
}

function drawTop(c: Ctx, o: Outfit, l: Looks, dir: Dir, f: number) {
  const side = dir === 'left' || dir === 'right';
  const tc = o.topColor, ac = o.accentColor, skin = l.skin;
  const longSleeve = o.top === 'stripeLong' || o.top === 'layeredTee' || o.top === 'hoodie' || o.top === 'jumper' || o.top === 'shirt' || o.top === 'floral';
  const sleeveCol = o.top === 'layeredTee' ? '#f4f1ea' : o.top === 'tieDye' ? '#f4f1ea' : tc;
  const sleeveLong = longSleeve || o.top === 'tieDye';
  if (!side) {
    P(c, 4, 11, 8, 7, tc);
    // arms swing
    const la = f === 1 ? 1 : 0, ra = f === 2 ? 1 : 0;
    P(c, 2, 12 + la, 2, 2, tc); P(c, 12, 12 + ra, 2, 2, tc);
    P(c, 2, 14 + la, 2, 3, sleeveLong ? sleeveCol : skin); P(c, 12, 14 + ra, 2, 3, sleeveLong ? sleeveCol : skin);
    P(c, 2, 17 + la, 2, 1, skin); P(c, 12, 17 + ra, 2, 1, skin);
    if (dir === 'up') {
      P(c, 5, 11, 6, 1, shade(tc, -0.15));
      if (o.top === 'stripeLong') for (const y of [12, 14, 16]) { P(c, 4, y, 8, 1, ac); }
      if (o.top === 'tieDye' || o.top === 'floral') { P(c, 5, 13, 2, 1, ac); P(c, 9, 15, 2, 1, ac); }
    } else if (o.top === 'stripeLong') {
      for (const y of [12, 14, 16]) { P(c, 4, y, 8, 1, ac); P(c, 2, y + (y > 12 ? la : la), 2, 1, ac); P(c, 12, y + ra, 2, 1, ac); }
    } else if (o.top === 'tieDye') {
      const spots = [[5, 12], [9, 12], [7, 14], [4, 15], [10, 15], [6, 17], [9, 16], [2, 12 + la], [13, 13 + ra]];
      for (const [x, y] of spots) P(c, x, y, 1, 1, ac);
      P(c, 6, 13, 2, 1, ac); P(c, 8, 15, 2, 1, ac);
    } else if (o.top === 'gith') {
      P(c, 6, 11, 4, 1, shade(tc, 0.15));
      P(c, 8, 12, 1, 1, '#ffffff'); P(c, 10, 12, 1, 1, '#ffffff'); P(c, 9, 13, 1, 1, '#ffffff'); P(c, 8, 14, 3, 1, ac);
    } else if (o.top === 'floral') {
      P(c, 5, 11, 6, 1, shade(tc, -0.15));
      for (const [x, y] of [[5, 12], [9, 13], [6, 15], [10, 16], [2, 13 + la], [13, 14 + ra]]) { P(c, x, y, 2, 1, ac); P(c, x, y + 1, 1, 1, '#9a5a35'); }
      P(c, 8, 16, 1, 1, '#f4f1ea'); P(c, 4, 14, 1, 1, '#8a4fb0'); P(c, 11, 12, 1, 1, '#8a4fb0');
      P(c, 2, 16 + la, 2, 1, shade(tc, -0.15)); P(c, 12, 16 + ra, 2, 1, shade(tc, -0.15));
    } else if (o.top === 'hoodie') {
      P(c, 5, 11, 6, 1, shade(tc, -0.2)); P(c, 7, 12, 1, 2, '#f4f1ea'); P(c, 8, 12, 1, 2, '#f4f1ea');
      P(c, 5, 15, 6, 2, shade(tc, -0.12));
    } else if (o.top === 'jumper') {
      P(c, 6, 11, 4, 1, shade(tc, -0.2)); P(c, 4, 17, 8, 1, shade(tc, -0.2));
      P(c, 6, 14, 1, 1, shade(tc, 0.25)); P(c, 9, 13, 1, 1, shade(tc, 0.25));
    } else if (o.top === 'shirt') {
      P(c, 5, 11, 2, 1, '#ffffff'); P(c, 9, 11, 2, 1, '#ffffff');
      for (const y of [12, 14, 16]) P(c, 8, y, 1, 1, shade(tc, 0.4));
    } else if (o.top === 'tee' || o.top === 'layeredTee') {
      P(c, 6, 11, 4, 1, shade(tc, -0.15));
      if (ac !== tc) { P(c, 6, 13, 4, 3, ac); P(c, 7, 14, 2, 1, shade(ac, 0.35)); }
    }
  } else {
    P(c, 5, 11, 6, 7, tc);
    const s = f === 1 ? 1 : f === 2 ? -1 : 0;
    P(c, 7 + s, 12, 2, 3, shade(tc, -0.1));
    P(c, 7 + s, 15, 2, 2, sleeveLong ? shade(sleeveCol, -0.1) : skin);
    P(c, 7 + s, 17, 2, 1, skin);
    if (o.top === 'stripeLong') for (const y of [12, 14, 16]) { P(c, 5, y, 6, 1, ac); }
    if (o.top === 'gith') { P(c, 8, 13, 2, 1, ac); }
    if (o.top === 'floral') { P(c, 6, 12, 2, 1, ac); P(c, 8, 15, 2, 1, ac); P(c, 6, 13, 1, 1, '#9a5a35'); }
    if (o.top === 'tieDye') { P(c, 6, 12, 1, 1, ac); P(c, 9, 14, 1, 1, ac); P(c, 6, 16, 2, 1, ac); }
    if (o.top === 'hoodie') P(c, 5, 11, 3, 2, shade(tc, -0.2));
  }
  // layers
  if (o.layer === 'apron' && dir === 'up') {
    P(c, 4, 15, 8, 1, o.layerColor); P(c, 7, 16, 2, 2, o.layerColor);
  } else if (o.layer === 'lanyard' && dir === 'up') {
    P(c, 5, 11, 6, 1, o.layerColor);
  } else if (o.layer === 'apron') {
    if (!side) { P(c, 5, 11, 1, 1, o.layerColor); P(c, 10, 11, 1, 1, o.layerColor); P(c, 5, 12, 6, 8, o.layerColor); P(c, 6, 15, 4, 2, shade(o.layerColor, -0.15)); }
    else if (dir === 'right') { P(c, 9, 12, 2, 8, o.layerColor); } else { P(c, 5, 12, 2, 8, o.layerColor); }
  } else if (o.layer === 'hivis') {
    const v = o.layerColor;
    if (!side) { P(c, 4, 11, 2, 7, v); P(c, 10, 11, 2, 7, v); P(c, 4, 15, 8, 1, '#d8dde3'); P(c, 6, 15, 4, 1, '#d8dde3'); }
    else { P(c, 5, 11, 6, 7, v); P(c, 5, 15, 6, 1, '#d8dde3'); P(c, 7, 12, 2, 3, v); }
  } else if (o.layer === 'cardigan') {
    const v = o.layerColor;
    if (!side) { P(c, 4, 11, 2, 7, v); P(c, 10, 11, 2, 7, v); P(c, 2, 12, 2, 5, v); P(c, 12, 12, 2, 5, v); }
    else { P(c, 5, 11, 6, 7, v); P(c, 7, 12, 2, 5, shade(v, -0.1)); }
  } else if (o.layer === 'vest') {
    const v = o.layerColor, vd = shade(v, -0.22);
    if (!side) { P(c, 4, 11, 2, 7, v); P(c, 10, 11, 2, 7, v); P(c, 4, 13, 2, 2, vd); P(c, 10, 13, 2, 2, vd); P(c, 4, 16, 2, 1, vd); P(c, 10, 16, 2, 1, vd); P(c, 5, 11, 1, 1, '#6b4a33'); P(c, 10, 11, 1, 1, '#6b4a33'); }
    else { P(c, 5, 11, 6, 7, v); P(c, 8, 13, 3, 2, vd); P(c, 8, 16, 3, 1, vd); }
  } else if (o.layer === 'lanyard') {
    const v = o.layerColor;
    if (!side) { P(c, 5, 11, 1, 3, v); P(c, 10, 11, 1, 3, v); P(c, 6, 14, 1, 1, v); P(c, 9, 14, 1, 1, v); P(c, 7, 15, 2, 2, '#f4f1ea'); P(c, 7, 15, 2, 1, v); }
    else P(c, dir === 'right' ? 9 : 6, 11, 1, 4, v);
  }
}

function drawHead(c: Ctx, l: Looks, o: Outfit, dir: Dir) {
  const skin = l.skin;
  const side = dir === 'left' || dir === 'right';
  if (!side) {
    P(c, 4, 3, 8, 8, skin); P(c, 3, 5, 1, 4, skin); P(c, 12, 5, 1, 4, skin); // ears/cheeks
    c.clearRect(4, 3, 1, 1); c.clearRect(11, 3, 1, 1);
    P(c, 5, 10, 6, 1, shade(skin, -0.08));
  } else {
    P(c, 5, 3, 7, 8, skin); P(c, 12, 6, 1, 3, skin);
    c.clearRect(11, 3, 1, 1);
  }
  if (dir === 'down') {
    P(c, 5, 7, 1, 2, INK); P(c, 10, 7, 1, 2, INK);
    P(c, 5, 7, 1, 1, '#5a4a66');
    P(c, 4, 9, 1, 1, '#f19aa9'); P(c, 11, 9, 1, 1, '#f19aa9');
    P(c, 7, 9, 2, 1, '#c45b6c');
    if (l.freckles) { P(c, 6, 9, 1, 1, shade(skin, -0.22)); P(c, 9, 9, 1, 1, shade(skin, -0.22)); }
    if (l.glasses) {
      const g = l.glasses;
      P(c, 4, 6, 3, 1, g); P(c, 9, 6, 3, 1, g); P(c, 4, 9, 3, 1, g); P(c, 9, 9, 3, 1, g);
      P(c, 4, 7, 1, 2, g); P(c, 6, 7, 1, 2, g); P(c, 9, 7, 1, 2, g); P(c, 11, 7, 1, 2, g);
      P(c, 7, 7, 2, 1, g);
      P(c, 5, 7, 1, 2, INK); P(c, 10, 7, 1, 2, INK);
      P(c, 4, 9, 1, 1, g); P(c, 11, 9, 1, 1, g);
    }
  } else if (side) {
    P(c, 10, 7, 1, 2, INK); P(c, 10, 9, 1, 1, '#f19aa9');
    if (l.freckles) P(c, 9, 9, 1, 1, shade(skin, -0.22));
    if (l.glasses) { P(c, 9, 6, 3, 1, l.glasses); P(c, 9, 7, 1, 2, l.glasses); P(c, 11, 7, 1, 2, l.glasses); P(c, 6, 7, 3, 1, l.glasses); P(c, 10, 7, 1, 2, INK); }
  }
  drawHair(c, l, dir);
  // hats
  if (o.hat === 'beanie') {
    if (!side) { P(c, 3, 1, 10, 4, o.hatColor); P(c, 3, 4, 10, 1, shade(o.hatColor, -0.2)); P(c, 7, 0, 2, 1, shade(o.hatColor, 0.3)); }
    else { P(c, 4, 1, 9, 4, o.hatColor); P(c, 4, 4, 9, 1, shade(o.hatColor, -0.2)); P(c, 7, 0, 2, 1, shade(o.hatColor, 0.3)); }
  } else if (o.hat === 'cap') {
    if (dir === 'down') { P(c, 3, 1, 10, 3, o.hatColor); P(c, 3, 4, 10, 1, shade(o.hatColor, -0.25)); }
    else if (dir === 'up') { P(c, 3, 1, 10, 4, o.hatColor); }
    else if (dir === 'right') { P(c, 4, 1, 8, 3, o.hatColor); P(c, 10, 4, 4, 1, shade(o.hatColor, -0.25)); }
    else { P(c, 4, 1, 8, 3, o.hatColor); P(c, 10, 4, 4, 1, shade(o.hatColor, -0.25)); }
  } else if (o.hat === 'cowboy') {
    const hc = o.hatColor, band = shade(hc, 0.25), sp = '#e8eef5';
    if (!side) {
      P(c, 4, 0, 8, 4, hc); P(c, 6, 0, 4, 1, shade(hc, 0.12)); P(c, 4, 3, 8, 1, band);
      P(c, 1, 4, 14, 1, hc); P(c, 0, 3, 1, 1, hc); P(c, 15, 3, 1, 1, hc);
      if (dir === 'down') for (let x = 1; x < 15; x += 2) P(c, x, 5, 1, 1, sp);
    } else {
      P(c, 5, 0, 7, 4, hc); P(c, 5, 3, 7, 1, band); P(c, 2, 4, 13, 1, hc); P(c, 15, 3, 1, 1, hc);
      for (let x = 3; x < 15; x += 2) P(c, x, 5, 1, 1, sp);
    }
  } else if (o.hat === 'hairclip') {
    if (dir === 'down') P(c, 10, 3, 2, 1, o.hatColor);
    else if (side) P(c, 5, 3, 2, 1, o.hatColor);
  }
}

function drawHair(c: Ctx, l: Looks, dir: Dir) {
  const h = l.hair, hl = shade(h, 0.22), hd = shade(h, -0.2);
  const s = l.hairStyle;
  const side = dir === 'left' || dir === 'right';
  const len = s === 'longWavy' ? 17 : s === 'shoulderSide' ? 14 : s === 'bobSide' ? 12 : s === 'fringeBob' ? 13 : s === 'curly' ? 11 : 0;

  if (s === 'bald') {
    if (dir === 'down') { P(c, 6, 3, 2, 1, shade(l.skin, 0.35)); P(c, 3, 5, 1, 2, h); P(c, 12, 5, 1, 2, h); }
    else if (dir === 'up') { P(c, 3, 7, 10, 3, h); P(c, 6, 3, 3, 1, shade(l.skin, 0.3)); }
    else { P(c, 4, 6, 2, 3, h); P(c, 7, 3, 2, 1, shade(l.skin, 0.35)); }
    return;
  }
  if (dir === 'up') {
    if (s === 'buzz') { P(c, 4, 2, 8, 6, h); return; }
    P(c, 4, 1, 8, 1, h); P(c, 3, 2, 10, 9, h); P(c, 5, 2, 4, 1, hl);
    if (len) { P(c, 3, 10, 10, len - 10, h); if (s === 'longWavy') { P(c, 3, len - 1, 1, 1, hd); P(c, 12, len - 1, 1, 1, hd); } }
    if (s === 'ponytail' || s === 'fringeBack') { P(c, 7, 10, 2, 5, h); P(c, 7, 6, 2, 1, hd); P(c, 7, 9, 2, 1, shade(h, -0.35)); }
    if (s === 'bun') { P(c, 6, 0, 4, 3, h); P(c, 7, 0, 2, 1, hl); }
    if (s === 'curly') { P(c, 2, 2, 12, 8, h); for (const x of [2, 5, 8, 11]) P(c, x, 9, 2, 2, h); }
    return;
  }

  if (side) {
    // drawn facing right; caller mirrors for left
    if (s === 'buzz') { P(c, 5, 2, 7, 2, h); P(c, 5, 4, 2, 3, h); return; }
    P(c, 5, 1, 6, 1, h); P(c, 4, 2, 8, 3, h); P(c, 4, 5, 3, 4, h); P(c, 6, 2, 4, 1, hl);
    if (s === 'shoulderSide' || s === 'bobSide') { P(c, 9, 4, 3, 1, h); }
    if (s === 'short') P(c, 10, 4, 2, 1, h);
    if (s === 'fringeBob') { P(c, 9, 4, 3, 2, h); }
    if (s === 'fringeBack') { P(c, 10, 4, 1, 2, h); P(c, 2, 6, 3, 2, h); P(c, 2, 8, 2, 3, h); }
    if (len) { P(c, 3, 5, 3, len - 5, h); P(c, 3, len - 1, 3, 1, hd); }
    if (s === 'ponytail') { P(c, 2, 6, 3, 2, h); P(c, 2, 8, 2, 5, h); P(c, 4, 6, 1, 1, shade(h, -0.35)); }
    if (s === 'bun') { P(c, 3, 1, 3, 3, h); }
    if (s === 'curly') { P(c, 3, 1, 9, 5, h); P(c, 3, 6, 4, 5, h); P(c, 11, 2, 2, 2, h); }
    return;
  }

  // facing down
  if (s === 'buzz') { P(c, 4, 2, 8, 2, h); P(c, 3, 4, 1, 2, h); P(c, 12, 4, 1, 2, h); return; }
  P(c, 5, 1, 6, 1, h); P(c, 4, 2, 8, 2, h); P(c, 3, 3, 10, 2, h);
  P(c, 6, 2, 3, 1, hl);
  switch (s) {
    case 'shoulderSide':
      P(c, 4, 5, 4, 1, h); P(c, 4, 6, 1, 1, h); P(c, 9, 4, 1, 1, hd); // part + sweep
      P(c, 3, 5, 1, len - 5, h); P(c, 12, 5, 1, len - 5, h);
      P(c, 2, 8, 1, len - 8, h); P(c, 13, 8, 1, len - 8, h);
      P(c, 3, 11, 1, 3, hd); P(c, 12, 11, 1, 3, hd);
      break;
    case 'longWavy':
      P(c, 7, 3, 2, 1, hd); P(c, 4, 5, 2, 1, h); P(c, 10, 5, 2, 1, h);
      P(c, 3, 5, 1, len - 5, h); P(c, 12, 5, 1, len - 5, h);
      P(c, 2, 7, 1, len - 7, h); P(c, 13, 7, 1, len - 7, h);
      P(c, 2, 12, 1, 1, hl); P(c, 13, 14, 1, 1, hl); P(c, 3, 15, 1, 2, hd); P(c, 12, 15, 1, 2, hd);
      P(c, 4, 11, 1, 3, h); P(c, 11, 11, 1, 3, h);
      break;
    case 'bobSide':
      P(c, 4, 5, 5, 1, h); P(c, 4, 6, 2, 1, h); P(c, 10, 4, 1, 1, hd);
      P(c, 3, 5, 1, len - 5, h); P(c, 12, 5, 1, len - 5, h);
      P(c, 2, 7, 1, len - 6, h); P(c, 13, 7, 1, len - 6, h);
      P(c, 2, len, 2, 1, hd); P(c, 12, len, 2, 1, hd);
      break;
    case 'ponytail':
      P(c, 7, 3, 2, 1, hd); P(c, 3, 5, 1, 2, h); P(c, 12, 5, 1, 2, h);
      P(c, 13, 6, 1, 4, h); // tail peeking out
      break;
    case 'short':
      P(c, 4, 5, 3, 1, h); P(c, 8, 5, 2, 1, h); P(c, 3, 5, 1, 3, h); P(c, 12, 5, 1, 3, h);
      break;
    case 'bun':
      P(c, 6, 0, 4, 2, h); P(c, 7, 0, 2, 1, hl); P(c, 3, 5, 1, 2, h); P(c, 12, 5, 1, 2, h);
      break;
    case 'fringeBob':
      P(c, 4, 5, 8, 2, h); P(c, 5, 6, 1, 1, hl); P(c, 9, 6, 1, 1, hd);
      P(c, 3, 5, 1, len - 5, h); P(c, 12, 5, 1, len - 5, h);
      P(c, 2, 7, 1, len - 7, h); P(c, 13, 7, 1, len - 7, h);
      P(c, 2, len - 1, 2, 1, hd); P(c, 12, len - 1, 2, 1, hd);
      break;
    case 'fringeBack':
      P(c, 4, 5, 1, 2, h); P(c, 6, 5, 1, 2, h); P(c, 8, 5, 1, 1, h); P(c, 10, 5, 1, 2, h); P(c, 11, 5, 1, 1, h);
      P(c, 3, 5, 1, 3, h); P(c, 12, 5, 1, 3, h); P(c, 2, 7, 1, 2, shade(h, 0.1));
      break;
    case 'curly':
      P(c, 2, 2, 12, 4, h); P(c, 4, 6, 2, 1, h); P(c, 10, 6, 2, 1, h);
      P(c, 2, 6, 2, 5, h); P(c, 12, 6, 2, 5, h); P(c, 3, 2, 1, 1, hl); P(c, 9, 2, 2, 1, hl); P(c, 12, 4, 1, 1, hl);
      break;
  }
}

/** Draw one 16x24 frame of a person into ctx at (ox, oy). */
export function drawPerson(c: Ctx, ox: number, oy: number, l: Looks, o: Outfit, dir: Dir, f: number) {
  const tmp = document.createElement('canvas'); tmp.width = 16; tmp.height = 24;
  const t = tmp.getContext('2d')!;
  const d: Dir = dir === 'left' ? 'right' : dir;
  // back hair is under the body when facing down (long styles)
  drawLegs(t, o, l, d, f);
  if (d === 'down' && (l.hairStyle === 'longWavy' || l.hairStyle === 'shoulderSide')) {
    // hair behind shoulders drawn first, body over it
  }
  drawTop(t, o, l, d, f);
  drawHead(t, l, o, d);
  c.save();
  if (dir === 'left') { c.translate(ox + 16, oy); c.scale(-1, 1); c.drawImage(tmp, 0, 0); }
  else c.drawImage(tmp, ox, oy);
  c.restore();
}

const sheetCache = new Map<string, HTMLCanvasElement>();

/** A sprite sheet: 3 frames (stand, stepA, stepB) x 4 rows (down, left, right, up). */
export function personSheet(l: Looks, o: Outfit): HTMLCanvasElement {
  const key = JSON.stringify([l, o]);
  const hit = sheetCache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas'); cv.width = CW * 3; cv.height = CH * 4;
  const c = cv.getContext('2d')!;
  DIRS.forEach((dir, r) => {
    for (let f = 0; f < 3; f++) {
      const cell = document.createElement('canvas'); cell.width = CW; cell.height = CH;
      drawPerson(cell.getContext('2d')!, 1, 1, l, o, dir, f);
      outline(cell);
      c.drawImage(cell, f * CW, r * CH);
    }
  });
  if (sheetCache.size > 60) sheetCache.clear();
  sheetCache.set(key, cv);
  return cv;
}

/** A big, crisp data-URL image of a person (for menus and dialogue portraits). */
export function personPortrait(l: Looks, o: Outfit, scale = 4, headOnly = false): string {
  const sheet = personSheet(l, o);
  const sh = headOnly ? 14 : CH;
  const cv = document.createElement('canvas'); cv.width = CW * scale; cv.height = sh * scale;
  const c = cv.getContext('2d')!; c.imageSmoothingEnabled = false;
  c.drawImage(sheet, 0, 0, CW, sh, 0, 0, CW * scale, sh * scale);
  return cv.toDataURL();
}

// ── Bowie the dog (fluffy white) ───────────────────────────────────────────
export const DW = 18, DH = 15;
let dogSheetCv: HTMLCanvasElement | null = null;
export function dogSheet(): HTMLCanvasElement {
  if (dogSheetCv) return dogSheetCv;
  const cv = document.createElement('canvas'); cv.width = DW * 2; cv.height = DH * 4;
  const c = cv.getContext('2d')!;
  const W = '#fbf8f1', S = '#e6dfd2', N = '#2d2530', T = '#f3b4a8';
  DIRS.forEach((dir, r) => {
    for (let f = 0; f < 2; f++) {
      const cell = document.createElement('canvas'); cell.width = DW; cell.height = DH;
      const t = cell.getContext('2d')!;
      const ox = 1, oy = 1;
      const leg = f === 1 ? 1 : 0;
      if (dir === 'down' || dir === 'up') {
        P(t, ox + 3, oy + 5, 10, 7, W); P(t, ox + 2, oy + 6, 12, 5, W);
        P(t, ox + 3, oy + 11, 2, 2 - leg, S); P(t, ox + 11, oy + 11, 2, 1 + leg, S);
        P(t, ox + 4, oy + 0, 8, 7, W); P(t, ox + 3, oy + 1, 10, 5, W);
        P(t, ox + 2, oy + 2, 2, 4, S); P(t, ox + 12, oy + 2, 2, 4, S); // floppy ears
        if (dir === 'down') {
          P(t, ox + 5, oy + 3, 1, 1, N); P(t, ox + 10, oy + 3, 1, 1, N);
          P(t, ox + 7, oy + 5, 2, 1, N); P(t, ox + 7, oy + 6, 2, 1, T);
          P(t, ox + 4, oy + 0, 2, 1, '#ffffff'); P(t, ox + 9, oy + 1, 2, 1, '#ffffff');
        } else {
          P(t, ox + 7, oy + 10, 2, 3, W); P(t, ox + 6, oy + 12, 4, 1, S); // tail
          P(t, ox + 5, oy + 1, 6, 1, S);
        }
      } else {
        // facing right (mirrored for left)
        P(t, ox + 2, oy + 5, 11, 6, W); P(t, ox + 1, oy + 6, 13, 4, W);
        P(t, ox + 2, oy + 10, 2, 2 + leg, S); P(t, ox + 5, oy + 10, 2, 2 - leg, W);
        P(t, ox + 9, oy + 10, 2, 2 - leg, S); P(t, ox + 12, oy + 10, 2, 2 + leg, W);
        P(t, ox + 0, oy + 3, 3, 3, W); P(t, ox + 0, oy + 2 + leg, 2, 2, W); // fluffy tail
        P(t, ox + 9, oy + 0, 7, 7, W); P(t, ox + 10, oy + 6, 5, 2, W);
        P(t, ox + 9, oy + 2, 2, 5, S); // ear
        P(t, ox + 13, oy + 3, 1, 1, N); P(t, ox + 15, oy + 5, 1, 1, N);
        P(t, ox + 12, oy + 0, 2, 1, '#ffffff');
      }
      if (dir === 'left') {
        const m = document.createElement('canvas'); m.width = DW; m.height = DH;
        const mc = m.getContext('2d')!; mc.translate(DW, 0); mc.scale(-1, 1); mc.drawImage(cell, 0, 0);
        t.clearRect(0, 0, DW, DH); t.drawImage(m, 0, 0);
      }
      outline(cell);
      c.drawImage(cell, f * DW, r * DH);
    }
  });
  dogSheetCv = cv;
  return cv;
}

export function dogPortrait(scale = 4): string {
  const s = dogSheet();
  const cv = document.createElement('canvas'); cv.width = DW * scale; cv.height = DH * scale;
  const c = cv.getContext('2d')!; c.imageSmoothingEnabled = false;
  c.drawImage(s, 0, 0, DW, DH, 0, 0, DW * scale, DH * scale);
  return cv.toDataURL();
}
