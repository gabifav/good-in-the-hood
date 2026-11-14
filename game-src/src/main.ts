import './style.css';
import { TEAM, GROUPS, DOG, DEFAULT_CUSTOM, type Person, type Outfit, type Looks } from './config/team';
import { personSheet, personPortrait, dogSheet, dogPortrait, CW, CH, DW, DH, type Dir } from './gfx/sprites';
import * as A from './gfx/art';
import { workMap, homeMap, type MapDef, type Obj } from './world/maps';
import { loadSave, writeSave, freshSave, type SaveData } from './save';
import { audio, unlockAudio, sfx, setMusic, setMusicMode } from './audio';
import { initInput, pollInput, input, consumeAction, isTouch, buildTouchControls } from './input';
import { ui, h, toast, modal, dialogue, isModalOpen, confetti, fade } from './ui/dom';
import { showTitle, chooseMode, wardrobe, trackerBoard, tartWorkshop, cookUp, teamPhoto, shiftSummary, gameMenu, howToPlay, adminDesk } from './ui/screens';

const T = 16;
const canvas = document.createElement('canvas');
document.getElementById('game')!.appendChild(canvas);
const ctx = canvas.getContext('2d')!;

// ── State ────────────────────────────────────────────────────────────────
export let save: SaveData = loadSave() || freshSave();
export const hasSave = () => !!loadSave()?.personId;
export function persist() { writeSave(save); }
audio.sound = save.sound; audio.music = save.music;

export function playerPerson(): Person {
  if (save.personId === 'custom' && save.custom) return { ...DEFAULT_CUSTOM, name: save.custom.name, looks: save.custom.looks };
  return TEAM.find(p => p.id === save.personId) || TEAM[0];
}
export function outfitOf(p: Person): Outfit { return save.outfits[p.id] || p.outfit; }

interface Actor {
  x: number; y: number; dir: Dir; f: number; at: number; moving: boolean;
  kind: 'player' | 'npc' | 'visitor' | 'dog';
  person?: Person; looks?: Looks; outfit?: Outfit;
  bubble?: { text: string; t: number };
  path?: [number, number][]; speed: number; wait?: number; state?: string;
  homeX?: number; homeY?: number;
  glow?: number;
}

let map: MapDef = workMap();
let solid: boolean[][] = [];
let bg: HTMLCanvasElement | null = null;
let player: Actor = { x: 0, y: 0, dir: 'down', f: 0, at: 0, moving: false, kind: 'player', speed: 70 };
let dog: Actor = { x: 0, y: 0, dir: 'down', f: 0, at: 0, moving: false, kind: 'dog', speed: 75 };
let npcs: Actor[] = [];
let visitors: Actor[] = [];
let trail: [number, number][] = [];
let particles: { x: number; y: number; vx: number; vy: number; life: number; kind: 'heart' | 'spark' | 'note' }[] = [];
let running = false;
let clockMin = 9 * 60;
let vanAnim = 0; // >0 while the van drives away
let visitorTimer = 4;
let entranceT = -1;

export interface Bag { group: string; need: Record<string, number>; have: Record<string, number>; note: string }
export let bag: Bag | null = null;

// ── Map loading ─────────────────────────────────────────────────────────
const SOLID_TILES = new Set(['#', 'w', 'W', 'H', 'V']);
function buildMap(m: MapDef) {
  map = m;
  solid = m.tiles.map(r => r.map(c => SOLID_TILES.has(c)));
  for (const o of m.objs) if (o.solid) for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) if (solid[j]) solid[j][i] = true;
  bg = document.createElement('canvas'); bg.width = m.w * T; bg.height = m.h * T;
  const b = bg.getContext('2d')!;
  m.tiles.forEach((row, y) => row.forEach((ch, x) => A.drawTile(b, ch, x * T, y * T, x * 31 + y * 17)));
  player.x = (m.start[0] + 0.5) * T; player.y = (m.start[1] + 0.5) * T; player.dir = 'down';
  dog.x = player.x - 14; dog.y = player.y + 6; trail = [];
  visitors = [];
  npcs = [];
  if (m.id === 'work') {
    for (const p of TEAM) {
      if (p.id === save.personId) continue;
      const s = m.spots[p.workSpot]; if (!s) continue;
      npcs.push({ x: (s[0] + 0.5) * T, y: (s[1] + 0.5) * T, dir: 'down', f: 0, at: Math.random() * 5, moving: false, kind: 'npc', person: p, speed: 0, homeX: (s[0] + 0.5) * T, homeY: (s[1] + 0.5) * T });
    }
  }
  entranceT = m.id === 'work' ? 0.9 : -1;
  if (m.id === 'work') {
    const sian = npcs.find(n => n.person?.id === 'sian');
    if (sian) { // Siân arrives through the front door
      sian.x = 22.5 * T; sian.y = 10.6 * T; sian.dir = 'left';
      sian.path = [[21.5 * T, 10.6 * T], [8.5 * T, 10.6 * T], [8.5 * T, 6.5 * T], [6.5 * T, 6.5 * T]];
    }
  }
  setMusicMode(m.id);
}

export function goTo(mode: 'work' | 'home') {
  save.mode = mode; persist();
  fade(() => {
    buildMap(mode === 'work' ? workMap() : homeMap());
    renderHud();
    if (mode === 'work') toast(`Shift ${save.work.shift} · Grab a bag at the bag station!`, 'gold');
    else toast(`Home sweet home · Day ${save.home.day}`, 'heart');
  });
}

// ── Collision & movement ────────────────────────────────────────────────
function blocked(px: number, py: number) {
  const pts = [[px - 5, py - 3], [px + 5, py - 3], [px - 5, py + 2], [px + 5, py + 2]];
  return pts.some(([x, y]) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return ty < 0 || tx < 0 || ty >= map.h || tx >= map.w || solid[ty][tx]; });
}
function moveActor(a: Actor, dx: number, dy: number, collide = true) {
  if (dx) { const nx = a.x + dx; if (!collide || !blocked(nx, a.y)) a.x = nx; }
  if (dy) { const ny = a.y + dy; if (!collide || !blocked(a.x, ny)) a.y = ny; }
}
function faceTo(a: Actor, dx: number, dy: number) {
  if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else if (dy) a.dir = dy > 0 ? 'down' : 'up';
}
function animate(a: Actor, dt: number, moving: boolean) {
  a.moving = moving;
  if (moving) { a.at += dt * 7; a.f = [1, 0, 2, 0][Math.floor(a.at) % 4]; } else { a.f = 0; }
}

// ── Interaction targets ──────────────────────────────────────────────────
const INTERACTIVE = new Set(['adminDesk', 'stove', 'sink', 'fridge', 'island', 'shelf', 'board', 'bagStation', 'crate', 'counter', 'sign', 'van', 'bowl', 'busStop',
  'bed', 'wardrobe', 'desk', 'bookshelf', 'tv', 'couch', 'herbs', 'door', 'dining', 'pot']);
type Target = { type: 'obj'; obj: Obj; d: number } | { type: 'npc'; a: Actor; d: number } | { type: 'dog'; d: number };
let target: Target | null = null;

function findTarget(): Target | null {
  const fx = player.dir === 'left' ? -6 : player.dir === 'right' ? 6 : 0;
  const fy = player.dir === 'up' ? -6 : player.dir === 'down' ? 6 : 0;
  const px = player.x + fx, py = player.y + fy;
  let best: Target | null = null;
  for (const o of map.objs) {
    if (!INTERACTIVE.has(o.kind)) continue;
    const rx = Math.max(o.x * T, Math.min(px, (o.x + o.w) * T));
    const ry = Math.max(o.y * T, Math.min(py, (o.y + o.h) * T));
    const d = Math.hypot(px - rx, py - ry);
    if (d < 16 && (!best || d < best.d)) best = { type: 'obj', obj: o, d };
  }
  for (const n of npcs) { const d = Math.hypot(px - n.x, py - n.y); if (d < 18 && (!best || d - 4 < best.d)) best = { type: 'npc', a: n, d: d - 4 }; }
  { const d = Math.hypot(px - dog.x, py - dog.y); if (d < 15 && (!best || d - 2 < best.d)) best = { type: 'dog', d: d - 2 }; }
  return best;
}

function verbFor(t: Target): string {
  if (t.type === 'npc') return `Chat with ${t.a.person!.name}`;
  if (t.type === 'dog') return `Pat ${DOG.name}`;
  const o = t.obj;
  switch (o.kind) {
    case 'shelf': return `Take ${A.ITEMS[o.data!.item].name.toLowerCase()}`;
    case 'crate': return `Group ${o.data!.group} crate`;
    case 'bagStation': return bag ? 'Check order card' : 'Grab a bag';
    case 'adminDesk': return 'Check meals & labels';
    case 'counter': return 'Pick-up counter';
    case 'island': return 'Cooking workshop';
    case 'board': return 'Tracker board';
    case 'van': return 'Delivery van';
    case 'busStop': return 'Head home';
    case 'door': return map.id === 'home' ? 'Head to work' : 'Door';
    case 'wardrobe': return 'Change outfit';
    case 'bed': return 'Sleep';
    case 'couch': return 'Put your feet up';
    case 'herbs': return 'Herb garden';
    case 'fridge': case 'stove': return map.id === 'home' ? 'Leftover cook-up' : (o.label || 'Look');
    default: return o.label || 'Look';
  }
}

// ── Work: bags & orders ─────────────────────────────────────────────────
const NOTES = ['Family of four', 'Cooking for one', 'Little ones at home', 'Loves a cuppa', 'Big family dinner', 'New to the area', 'Two flatmates', 'Grandparents + grandkids'];
export function groupDone(id: string) { return (save.work.progress[id] || 0) >= GROUPS.find(g => g.id === id)!.bags; }
export function allDone() { return GROUPS.every(g => groupDone(g.id)); }

export function startBag(group: string) {
  const keys = Object.keys(A.ITEMS);
  const n = 4 + (Math.random() < 0.5 ? 1 : 0);
  const pick = keys.sort(() => Math.random() - 0.5).slice(0, n);
  const need: Record<string, number> = {};
  pick.forEach(k => need[k] = 1);
  if (Math.random() < 0.6) need[pick[0]] = 2;
  bag = { group, need, have: {}, note: NOTES[(Math.random() * NOTES.length) | 0] };
  sfx('open');
  toast(`New bag for ${GROUPS.find(g => g.id === group)!.label}! Check the order card.`, 'good');
  renderHud();
}
function bagComplete(b: Bag) { return Object.entries(b.need).every(([k, q]) => (b.have[k] || 0) >= q); }
function missing(b: Bag) { return Object.entries(b.need).filter(([k, q]) => (b.have[k] || 0) < q).map(([k, q]) => `${A.ITEMS[k].emoji} ${A.ITEMS[k].name}${q - (b.have[k] || 0) > 1 ? ' ×' + (q - (b.have[k] || 0)) : ''}`); }

function takeItem(item: string) {
  if (!bag) { sfx('oops'); toast('Grab a bag from the bag station first!', 'oops'); return; }
  const need = bag.need[item] || 0, have = bag.have[item] || 0;
  if (!need) { sfx('oops'); toast(`${A.ITEMS[item].emoji} Not on this order card!`, 'oops'); return; }
  if (have >= need) { sfx('oops'); toast(`Already got enough ${A.ITEMS[item].name.toLowerCase()}.`, 'oops'); return; }
  bag.have[item] = have + 1;
  sfx('pick');
  spawn(player.x, player.y - 26, 'spark', 5);
  if (bagComplete(bag)) {
    const g = bag.group;
    toast(g === 'pickup' ? 'Bag packed! Take it to the pick-up counter.' : `Bag packed! Take it to the Group ${g} crate.`, 'gold');
  } else toast(`${A.ITEMS[item].emoji} +1 ${A.ITEMS[item].name}`);
  renderHud();
}

function deposit(group: string) {
  if (!bag) { toast(group === 'pickup' ? 'Pick-up bags waiting for collection: ' + save.work.pickupWaiting : `Group ${group}: ${save.work.progress[group] || 0}/${GROUPS.find(g => g.id === group)!.bags} bags`); sfx('blip'); return; }
  if (bag.group !== group) { sfx('oops'); toast(bag.group === 'pickup' ? 'This bag is for the pick-up counter!' : `This bag is for Group ${bag.group}!`, 'oops'); return; }
  if (!bagComplete(bag)) { sfx('oops'); toast('Still missing: ' + missing(bag).join(', '), 'oops'); return; }
  save.work.progress[group] = (save.work.progress[group] || 0) + 1;
  save.work.bagsAllTime++;
  if (group === 'pickup') save.work.pickupWaiting++;
  bag = null;
  sfx('ding');
  spawn(player.x, player.y - 20, 'heart', 6);
  if (groupDone(group)) {
    setTimeout(() => sfx('big'), 250);
    confetti(70);
    toast(`${GROUPS.find(g => g.id === group)!.label} DONE ✅`, 'good');
    if (allDone()) setTimeout(() => toast('Every group is packed! Send off the van in the yard 🚐', 'gold'), 1200);
  } else toast('Bag in! Ding!', 'good');
  persist(); renderHud();
}

function sendVan() {
  if (!allDone()) {
    const left = GROUPS.reduce((n, g) => n + Math.max(0, g.bags - (save.work.progress[g.id] || 0)), 0);
    say(npcs.find(n => n.person?.workSpot === 'van'), 'The van leaves once every group is packed. ' + left + ' bags to go!');
    if (!npcs.find(n => n.person?.workSpot === 'van')) toast(`The van leaves once every group is packed. ${left} bags to go!`);
    return;
  }
  dialogue([{ text: 'All the bags are loaded. Ready to send the deliveries out?' }], undefined, [
    { label: '🚐 Send the van!', fn: () => { vanAnim = 0.001; sfx('big'); } },
    { label: 'Not yet', fn: () => {} },
  ]);
}

export function finishShift() {
  save.work.shiftsDone++;
  const stats = { shift: save.work.shift, bags: GROUPS.reduce((n, g) => n + g.bags, 0), visitors: save.work.visitorsHelped, tarts: save.work.tartsToday >= 3 };
  save.work.shift++;
  save.work.progress = {};
  save.work.tartsToday = 0;
  save.work.pickupWaiting = 0;
  bag = null;
  clockMin = 9 * 60;
  persist(); renderHud();
  shiftSummary(stats);
}

// ── Talking ─────────────────────────────────────────────────────────────
function say(a: Actor | undefined, text: string) { if (a) a.bubble = { text, t: 3.5 }; }
const lineIdx: Record<string, number> = {};
function talkTo(n: Actor) {
  const p = n.person!;
  n.dir = player.x < n.x - 6 ? 'left' : player.x > n.x + 6 ? 'right' : player.y < n.y ? 'up' : 'down';
  const first = !save.work.metTeam.includes(p.id);
  const pool = p.lines.filter(l => l !== p.greeting);
  const i = lineIdx[p.id] = ((lineIdx[p.id] ?? -1) + 1) % pool.length;
  const port = personPortrait(p.looks, outfitOf(p), 4, true);
  const hello = p.greeting || (first ? `Hey ${playerPerson().name}! Good to see you.` : null);
  const lines = [...(hello ? [{ who: p.name, portrait: port, text: hello }] : []), { who: p.name, portrait: port, text: pool[i] }];
  if (first) { save.work.metTeam.push(p.id); persist(); }
  // context tips
  if (p.workSpot === 'kitchen' && save.work.tartsToday < 3) lines.push({ who: p.name, portrait: port, text: 'The cooking workshop bench is right here when you\'re ready for tarts!' });
  dialogue(lines);
}

// ── Object interactions ──────────────────────────────────────────────────
function interact(t: Target) {
  if (t.type === 'npc') { talkTo(t.a); return; }
  if (t.type === 'dog') { patDog(); return; }
  const o = t.obj;
  switch (o.kind) {
    case 'shelf': takeItem(o.data!.item); break;
    case 'bagStation':
      if (bag) { sfx('blip'); orderCard(); }
      else { sfx('open'); trackerBoard(true); }
      break;
    case 'crate': deposit(o.data!.group); break;
    case 'counter': deposit('pickup'); break;
    case 'adminDesk': sfx('open'); adminDesk(); break;
    case 'board': sfx('open'); trackerBoard(false); break;
    case 'island':
      if (save.work.tartsToday >= 3) { toast('A whole tray of pumpkin tarts! 🥧 They smell amazing.', 'gold'); sfx('blip'); }
      else { sfx('open'); tartWorkshop(); }
      break;
    case 'van': sendVan(); break;
    case 'sign': dialogue([{ text: 'GOOD IN THE HOOD. A big heart painted on the corner. ♥' }]); break;
    case 'bowl':
      sfx('woof'); spawn(dog.x, dog.y - 14, 'heart', 3);
      toast(`You topped up ${DOG.name}'s water. ${DOG.name} is delighted.`, 'heart'); break;
    case 'busStop':
      dialogue([{ text: 'The bus home is coming. Head home for the day?' }], undefined, [
        { label: '🏠 Head home', fn: () => goTo('home') }, { label: 'Stay a bit longer', fn: () => {} }]);
      break;
    case 'door':
      if (map.id === 'home') dialogue([{ text: 'Ready to head to Good in the Hood?' }], undefined, [
        { label: '🧡 Go to work', fn: () => goTo('work') }, { label: 'Stay home', fn: () => {} }]);
      break;
    case 'stove': case 'fridge':
      if (map.id === 'home') { sfx('open'); cookUp(); }
      else dialogue([{ text: o.kind === 'stove' ? 'The workshop oven. Perfect for pumpkin tarts.' : 'The fridge is full of donated veg and dairy, all labelled and sorted.' }]);
      break;
    case 'sink': dialogue([{ text: 'Clean hands, happy kitchen. You give them a good scrub. ✨' }]); recharge(0); break;
    case 'wardrobe': sfx('open'); wardrobe(false); break;
    case 'bed':
      dialogue([{ text: 'Snuggle in and sleep until tomorrow?' }], undefined, [{ label: '😴 Sleep', fn: sleep }, { label: 'Not tired yet', fn: () => {} }]);
      break;
    case 'couch':
      if (!save.home.restedToday) { save.home.restedToday = true; recharge(15); toast('You put your feet up. Ahhh. +15 recharge', 'heart'); }
      else { recharge(2); toast('Still comfy.', 'heart'); }
      spawn(player.x, player.y - 24, 'note', 4); break;
    case 'tv': {
      const shows = ['A cooking show: "Today we turn leftover rice into fried rice magic!"', 'A nature doco about very small, very fluffy dogs.', 'The weather: sunny with a 100% chance of good vibes.', 'A baking contest. Someone\'s pumpkin tart looks suspiciously like yours.'];
      dialogue([{ text: shows[(Math.random() * shows.length) | 0] }]); recharge(4); break;
    }
    case 'herbs':
      if (save.home.wateredToday) toast(save.home.herbStage >= 3 ? 'Your herbs are flourishing! 🌿' : 'Already watered today. They\'ll grow overnight.', 'good');
      else { save.home.wateredToday = true; recharge(5); sfx('pick'); spawn(player.x, player.y - 20, 'spark', 6); toast(['Tiny seeds, big dreams. Watered! 💧', 'Little sprouts! Watered! 💧', 'Leafy and happy. Watered! 💧', 'In full bloom! Watered! 💧'][save.home.herbStage], 'good'); persist(); }
      break;
    case 'desk': sfx('open'); teamPhoto(); break;
    case 'bookshelf': {
      const b = ['"One Pot Wonders"', '"The Art of the Cuppa"', '"How to Pat a Dog: A Complete Guide" (very well read)', '"Community Gardens for Beginners"', '"Pumpkin: A Love Story"'];
      dialogue([{ text: 'You pick up ' + b[(Math.random() * b.length) | 0] + '.' }]); recharge(2); break;
    }
    case 'dining': dialogue([{ text: 'A cosy little table for two. Fresh flowers too.' }]); break;
    case 'pot': toast('A happy plant. 🌱'); break;
  }
}

export function recharge(n: number) { save.home.recharge = Math.min(100, save.home.recharge + n); persist(); renderHud(); }

function patDog() {
  sfx('woof');
  spawn(dog.x, dog.y - 14, 'heart', 5);
  save.home.pats++;
  dog.dir = 'down';
  const lines = [`${DOG.name} wiggles happily.`, `${DOG.name} gives you the fluffiest lean.`, `${DOG.name} rolls over for belly rubs.`, `${DOG.name}: "Woof!" (translation: you're the best)`];
  toast(lines[save.home.pats % lines.length], 'heart');
  if (map.id === 'home') recharge(3);
  persist();
}

function sleep() {
  fade(() => {
    save.home.day++;
    if (save.home.wateredToday && save.home.herbStage < 3) save.home.herbStage++;
    save.home.wateredToday = false; save.home.cookedToday = false; save.home.restedToday = false;
    save.home.recharge = Math.min(100, save.home.recharge + 30);
    persist(); renderHud();
    player.x = 3.5 * T; player.y = 4.6 * T; player.dir = 'down';
    toast(`☀️ Good morning! Day ${save.home.day}`, 'gold');
  });
}

// ── Visitors at the pick-up counter ──────────────────────────────────────
const VSKIN = ['#fbe0cf', '#f2cbb0', '#e8b48f', '#c98d64', '#a86d47', '#7c4d32'];
const VHAIR = ['#1f1814', '#3a2720', '#8a6143', '#d9b075', '#9a9aa6', '#b8462d'];
const VSTYLE = ['short', 'bun', 'curly', 'longWavy', 'buzz', 'ponytail', 'bald'] as const;
const VCOL = ['#ef8a5b', '#6f8fc0', '#7cc48b', '#e98fb0', '#f4d35e', '#b9a3e3', '#3c4a6b'];
const r = <T,>(a: readonly T[]) => a[(Math.random() * a.length) | 0];
function spawnVisitor() {
  const looks: Looks = { skin: r(VSKIN), hair: r(VHAIR), hairStyle: r(VSTYLE), glasses: Math.random() < 0.25 ? '#3b2f45' : null };
  const outfit: Outfit = { top: r(['tee', 'hoodie', 'jumper', 'shirt'] as const), topColor: r(VCOL), accentColor: r(VCOL), bottom: r(['trousers', 'skirt', 'shorts'] as const), bottomColor: r(['#3c4a6b', '#1f1c22', '#8a6143', '#cfd3c8']), shoeColor: '#f4f1ea', layer: 'none', layerColor: '#fff', hat: Math.random() < 0.2 ? 'beanie' : 'none', hatColor: r(VCOL) };
  const path: [number, number][] = [[31.5, 10.6], [22.5, 10.6], [21.5, 11.5], [21.5, 15.6], [20, 15.6]];
  visitors.push({ x: path[0][0] * T, y: path[0][1] * T, dir: 'left', f: 0, at: 0, moving: true, kind: 'visitor', looks, outfit, path: path.slice(1).map(([x, y]) => [x * T, y * T]), speed: 45, state: 'in' });
}
function updateVisitors(dt: number) {
  if (map.id !== 'work') return;
  visitorTimer -= dt;
  if (visitorTimer <= 0 && save.work.pickupWaiting > 0 && visitors.length === 0) { spawnVisitor(); visitorTimer = 6; }
  for (const v of visitors) {
    if (v.wait && v.wait > 0) {
      v.wait -= dt;
      if (v.wait <= 0) {
        if (v.state === 'at') {
          save.work.pickupWaiting = Math.max(0, save.work.pickupWaiting - 1); save.work.visitorsHelped++; persist();
          say(v, r(['Thank you so much! ♥', 'You lot are the best!', 'This really helps. Thank you!', 'See you next week! ♥']));
          spawn(v.x, v.y - 26, 'heart', 4); sfx('ding');
          v.state = 'out';
          v.path = [[21.5 * T, 15.6 * T], [21.5 * T, 11.5 * T], [22.5 * T, 10.6 * T], [32.5 * T, 10.6 * T]];
        }
      }
      animate(v, dt, false); continue;
    }
    const tgt = v.path?.[0];
    if (!tgt) {
      if (v.state === 'in') { v.state = 'at'; v.wait = 1.6; v.dir = 'left'; say(v, 'Hi! Here for my pick-up bag.'); }
      else if (v.state === 'out') v.state = 'gone';
      continue;
    }
    const dx = tgt[0] - v.x, dy = tgt[1] - v.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { v.path!.shift(); continue; }
    const s = Math.min(d, v.speed * dt);
    moveActor(v, dx / d * s, dy / d * s, false); faceTo(v, dx, dy); animate(v, dt, true);
  }
  visitors = visitors.filter(v => v.state !== 'gone');
}

// ── Particles ───────────────────────────────────────────────────────────
function spawn(x: number, y: number, kind: 'heart' | 'spark' | 'note', n: number) {
  for (let i = 0; i < n; i++) particles.push({ x: x + (Math.random() - 0.5) * 12, y, vx: (Math.random() - 0.5) * 24, vy: -20 - Math.random() * 25, life: 1 + Math.random() * 0.5, kind });
}

// ── Everyone lights up when Siân walks in ─────────────────────────────────
const CHEERS = ['SIÂN!! ♥', 'Heyyy Siân!', "Yay, Siân's here!", 'Morning Siân! ♥', 'Siân!!', 'The vibes just went up ✨'];
function lightUp(src: Actor) {
  src.bubble = { text: 'Heyyyy guys!', t: 3.5 };
  src.glow = 4;
  spawn(src.x, src.y - 24, 'spark', 10);
  const others = npcs.filter(n => n !== src);
  others.forEach((n, i) => {
    setTimeout(() => {
      faceTo(n, src.x - n.x, src.y - n.y);
      n.bubble = { text: CHEERS[i % CHEERS.length], t: 3 };
      n.glow = 3.5;
      spawn(n.x, n.y - 24, 'heart', 3);
    }, 350 + i * 140);
  });
  setTimeout(() => { sfx('woof'); spawn(dog.x, dog.y - 14, 'heart', 4); }, 600);
  sfx('big');
}

// ── Update ──────────────────────────────────────────────────────────────
let stepT = 0;
function update(dt: number) {
  pollInput();
  const busy = isModalOpen();
  let mx = 0, my = 0;
  if (!busy) { mx = input.x; my = input.y; }
  const moving = Math.hypot(mx, my) > 0.1;
  if (moving) {
    moveActor(player, mx * player.speed * dt, my * player.speed * dt);
    faceTo(player, mx, my);
    stepT += dt; if (stepT > 0.32) { stepT = 0; sfx('step'); }
  }
  animate(player, dt, moving);
  // dog follows a trail of where you've been
  if (moving) trail.push([player.x, player.y]);
  if (trail.length > 14) {
    const [tx, ty] = trail[0];
    const dx = tx - dog.x, dy = ty - dog.y, d = Math.hypot(dx, dy);
    if (d > 10) { const s = Math.min(d, 90 * dt); moveActor(dog, dx / d * s, dy / d * s, false); faceTo(dog, dx, dy); dog.moving = true; dog.at += dt * 8; }
    else { trail.shift(); dog.moving = false; }
    while (trail.length > 30) trail.shift();
  } else dog.moving = false;
  // npcs idle
  if (entranceT > 0) {
    entranceT -= dt;
    if (entranceT <= 0) {
      const sian = npcs.find(n => n.person?.id === 'sian');
      if (sian) lightUp(sian);
      else if (save.personId === 'sian') { lightUp(player); }
    }
  }
  if (player.glow) player.glow = Math.max(0, player.glow - dt);
  if (player.bubble) { player.bubble.t -= dt; if (player.bubble.t <= 0) player.bubble = undefined; }
  for (const n of npcs) {
    if (n.glow) n.glow = Math.max(0, n.glow - dt);
    if (n.path && n.path.length) {
      const [tx, ty] = n.path[0]; const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { n.path.shift(); if (!n.path.length) { n.path = undefined; n.dir = 'down'; animate(n, dt, false); } }
      else { const st = Math.min(d, 55 * dt); n.x += dx / d * st; n.y += dy / d * st; faceTo(n, dx, dy); n.at += dt * 7; n.f = [1, 0, 2, 0][Math.floor(n.at) % 4]; }
      if (n.bubble) { n.bubble.t -= dt; if (n.bubble.t <= 0) n.bubble = undefined; }
      continue;
    }
    n.f = 0;
    n.at += dt;
    if (n.at > 4 + Math.random() * 3) { n.at = 0; if (!n.bubble && !n.glow) n.dir = r(['down', 'left', 'right', 'down'] as Dir[]); }
    if (n.bubble) { n.bubble.t -= dt; if (n.bubble.t <= 0) n.bubble = undefined; }
  }
  for (const v of visitors) if (v.bubble) { v.bubble.t -= dt; if (v.bubble.t <= 0) v.bubble = undefined; }
  updateVisitors(dt);
  // ambient chatter
  if (map.id === 'work' && Math.random() < dt * 0.04 && npcs.length) { const n = r(npcs); if (!n.bubble && Math.hypot(n.x - player.x, n.y - player.y) < 120) say(n, r(n.person!.lines)); }
  // particles
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 10 * dt; p.life -= dt; }
  particles = particles.filter(p => p.life > 0);
  // clock
  if (map.id === 'work') { clockMin += dt / 1.5; }
  // van
  if (vanAnim > 0) { vanAnim += dt; if (vanAnim > 3.2) { vanAnim = 0; finishShift(); } }
  // interaction
  target = busy ? null : findTarget();
  if (consumeAction() && !busy && target) interact(target);
  updatePrompt();
  hudTick();
}

// ── Render ──────────────────────────────────────────────────────────────
let scale = 3, camX = 0, camY = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  const portrait = canvas.height > canvas.width;
  scale = Math.max(1, Math.floor(Math.min(canvas.width / ((portrait ? 12 : 20) * T), canvas.height / ((portrait ? 18 : 13) * T))));
}
window.addEventListener('resize', resize);

function objSprite(o: Obj): HTMLCanvasElement | null {
  switch (o.kind) {
    case 'shelf': return A.shelfArt(o.data!.item);
    case 'crate': { const g = GROUPS.find(g => g.id === o.data!.group)!; return A.crateArt(g.id, save.work.progress[g.id] || 0, g.bags); }
    case 'bagStation': return A.bagStationArt();
    case 'table': return A.tableArt(o.w);
    case 'counter': return A.counterArt(save.work.pickupWaiting);
    case 'adminDesk': return A.adminDeskArt();
    case 'board': return A.boardArt(GROUPS.map(g => Math.min(1, (save.work.progress[g.id] || 0) / g.bags)));
    case 'stove': return A.stoveArt();
    case 'bench': return A.benchArt(false);
    case 'sink': return A.benchArt(true);
    case 'fridge': return A.fridgeArt();
    case 'island': return A.islandArt(save.work.tartsToday);
    case 'van': return A.vanArt();
    case 'sign': return A.signArt();
    case 'tree': return A.treeArt(o.data?.v || 0);
    case 'pot': return A.potPlantArt(o.data?.v || 0);
    case 'busStop': return A.busStopArt();
    case 'bowl': return A.dogBowlArt();
    case 'bed': return A.bedArt();
    case 'wardrobe': return A.wardrobeArt();
    case 'nightstand': return A.nightstandArt();
    case 'tv': return A.tvArt();
    case 'couch': return A.couchArt();
    case 'rug': return A.rugArt();
    case 'dining': return A.diningArt();
    case 'herbs': return A.herbArt(save.home.herbStage, save.home.wateredToday);
    case 'desk': return A.deskArt();
    case 'door': return A.doorArt();
    case 'bookshelf': return A.bookshelfArt();
  }
  return null;
}
const SHELF_LABEL: Record<string, string> = { tins: 'TINS', pasta: 'PASTA', rice: 'RICE', cereal: 'CEREAL', bread: 'BREAD', fruit: 'FRUIT', veg: 'VEG', milk: 'MILK', soap: 'SOAP', tea: 'TEA' };

function render() {
  const vw = canvas.width / scale, vh = canvas.height / scale;
  const mw = map.w * T, mh = map.h * T;
  const tx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, player.x - vw / 2));
  const ty = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, player.y - vh / 2));
  camX += (tx - camX) * 0.2; camY += (ty - camY) * 0.2;
  if (Math.abs(tx - camX) > 200 || Math.abs(ty - camY) > 200) { camX = tx; camY = ty; }
  const cx = Math.round(camX), cy = Math.round(camY);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = map.id === 'work' ? '#9fd17c' : '#4a3a50';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, -cx * scale, -cy * scale);
  if (bg) ctx.drawImage(bg, 0, 0);

  // draw list
  type D = { y: number; draw: () => void };
  const list: D[] = [];
  for (const o of map.objs) {
    const s = objSprite(o); if (!s) continue;
    let ox = o.x * T + (o.w * T - s.width) / 2, oy = (o.y + o.h) * T - s.height;
    if (o.under) { ctx.drawImage(s, o.x * T, o.y * T); continue; }
    if (o.kind === 'van' && vanAnim > 0) ox += Math.pow(vanAnim, 2.2) * 30;
    if (o.kind === 'board') oy = (o.y + o.h) * T - s.height + 2;
    list.push({ y: o.kind === 'board' ? 0 : (o.y + o.h) * T - 1, draw: () => {
      ctx.drawImage(s, Math.round(ox), Math.round(oy));
      if (o.kind === 'shelf') { const l = A.labelArt(SHELF_LABEL[o.data!.item]); ctx.drawImage(l, Math.round(o.x * T + (o.w * T - l.width) / 2), Math.round(oy - 3)); }
      if (target && target.type === 'obj' && target.obj === o) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 150); ctx.fillStyle = '#fff6c9'; ctx.fillRect(o.x * T, o.y * T, o.w * T, o.h * T); ctx.globalAlpha = 1; }
    } });
  }
  const drawActor = (a: Actor) => {
    if (a.kind === 'dog') {
      const s = dogSheet(); const row = ['down', 'left', 'right', 'up'].indexOf(a.dir);
      const f = a.moving ? Math.floor(a.at) % 2 : 0;
      ctx.drawImage(s, f * DW, row * DH, DW, DH, Math.round(a.x - DW / 2), Math.round(a.y - DH + 3), DW, DH);
      return;
    }
    const p = a.person; const looks = a.looks || p!.looks; const outfit = a.outfit || outfitOf(p!);
    const s = personSheet(looks, outfit); const row = ['down', 'left', 'right', 'up'].indexOf(a.dir);
    if (a.glow && a.glow > 0) {
      const g = ctx.createRadialGradient(a.x, a.y - 10, 2, a.x, a.y - 10, 20);
      g.addColorStop(0, `rgba(255,236,150,${Math.min(1, a.glow) * 0.7})`); g.addColorStop(1, 'rgba(255,236,150,0)');
      ctx.fillStyle = g; ctx.fillRect(a.x - 20, a.y - 30, 40, 40);
    }
    // shadow
    ctx.fillStyle = 'rgba(59,47,69,0.18)'; ctx.fillRect(Math.round(a.x - 6), Math.round(a.y + 1), 12, 3);
    ctx.drawImage(s, a.f * CW, row * CH, CW, CH, Math.round(a.x - CW / 2), Math.round(a.y - CH + 3), CW, CH);
  };
  const pActor = { ...player, person: playerPerson() };
  (pActor as Actor).glow = player.glow;
  list.push({ y: player.y, draw: () => drawActor(pActor) });
  list.push({ y: dog.y, draw: () => drawActor(dog) });
  for (const n of npcs) list.push({ y: n.y, draw: () => drawActor(n) });
  for (const v of visitors) list.push({ y: v.y, draw: () => drawActor(v) });
  list.sort((a, b) => a.y - b.y).forEach(d => d.draw());

  // name tags for nearby teammates + speech bubbles
  ctx.textAlign = 'center';
  for (const a of [...npcs, ...visitors, player]) {
    if (a.kind === 'npc' && target?.type === 'npc' && target.a === a) {
      drawTag(a.person!.name, a.x, a.y - 27, '#f7b8cf');
    }
    if (a.bubble) drawBubble(a.bubble.text, a.x, a.y - 30);
  }
  if (target?.type === 'dog') drawTag(DOG.name, dog.x, dog.y - 16, '#fff6e6');
  // particles
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life);
    if (p.kind === 'heart') { ctx.fillStyle = '#ef6b8f'; ctx.fillRect(p.x - 2, p.y - 1, 2, 2); ctx.fillRect(p.x + 1, p.y - 1, 2, 2); ctx.fillRect(p.x - 2, p.y + 1, 5, 1); ctx.fillRect(p.x - 1, p.y + 2, 3, 1); ctx.fillRect(p.x, p.y + 3, 1, 1); }
    else if (p.kind === 'spark') { ctx.fillStyle = '#ffd34f'; ctx.fillRect(p.x, p.y - 1, 1, 3); ctx.fillRect(p.x - 1, p.y, 3, 1); }
    else { ctx.fillStyle = '#9b7fd6'; ctx.fillRect(p.x, p.y, 2, 2); ctx.fillRect(p.x + 1, p.y - 4, 1, 4); ctx.fillRect(p.x + 2, p.y - 4, 2, 1); }
  }
  ctx.globalAlpha = 1;
}
function drawTag(text: string, x: number, y: number, bgc: string) {
  ctx.font = '600 7px "Pixelify Sans", monospace';
  const w = Math.ceil(ctx.measureText(text).width) + 6;
  ctx.fillStyle = '#3b2f45'; ctx.fillRect(Math.round(x - w / 2) - 1, y - 7, w + 2, 10);
  ctx.fillStyle = bgc; ctx.fillRect(Math.round(x - w / 2), y - 6, w, 8);
  ctx.fillStyle = '#3b2f45'; ctx.fillText(text, x, y);
}
function drawBubble(text: string, x: number, y: number) {
  ctx.font = '7px "Pixelify Sans", monospace';
  const words = text.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > 90 && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  const w = Math.ceil(Math.max(...lines.map(l => ctx.measureText(l).width))) + 8, hgt = lines.length * 8 + 4;
  const bx = Math.round(x - w / 2), by = Math.round(y - hgt - 4);
  ctx.fillStyle = '#3b2f45'; ctx.fillRect(bx - 1, by - 1, w + 2, hgt + 2); ctx.fillRect(x - 2, by + hgt, 4, 3);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, w, hgt); ctx.fillRect(x - 1, by + hgt, 2, 2);
  ctx.fillStyle = '#3b2f45'; lines.forEach((l, i) => ctx.fillText(l, x, by + 8 + i * 8));
}

// ── HUD ─────────────────────────────────────────────────────────────────
let hud: HTMLElement, promptEl: HTMLElement, orderEl: HTMLElement, clockEl: HTMLElement | null = null, touchBtn: HTMLElement | null = null;
export function renderHud() {
  hud?.remove();
  const isWork = map.id === 'work';
  const me = playerPerson();
  const left = h('div', { class: 'hud-left' },
    h('div', { class: 'pill place' }, h('img', { src: personPortrait(me.looks, outfitOf(me), 2, true), alt: '' }), `${me.name} · ${isWork ? 'Work' : 'Home'}`),
    isWork
      ? h('div', { class: 'stats' }, clockEl = h('div', { class: 'pill' }, '9:00'), h('div', { class: 'pill' }, `Shift ${save.work.shift}`),
        h('div', { class: 'pill' }, `📦 ${GROUPS.reduce((n, g) => n + Math.min(g.bags, save.work.progress[g.id] || 0), 0)}/${GROUPS.reduce((n, g) => n + g.bags, 0)}`))
      : h('div', { class: 'stats' }, h('div', { class: 'pill' }, `☀️ Day ${save.home.day}`),
        h('div', { class: 'pill' }, 'Recharge', h('div', { class: 'meter' }, h('div', { style: `width:${save.home.recharge}%` })))),
  );
  if (!isWork) clockEl = null;
  const right = h('div', { class: 'hud-right' },
    isWork ? h('button', { class: 'iconbtn', title: 'Tracker board', onclick: () => { sfx('open'); trackerBoard(false); } }, '📋') : null,
    h('button', { class: 'iconbtn', title: 'Wardrobe', onclick: () => { sfx('open'); wardrobe(false); } }, '👕'),
    h('button', { class: 'iconbtn', title: isWork ? 'Head home' : 'Go to work', onclick: () => { sfx('blip'); goTo(isWork ? 'home' : 'work'); } }, isWork ? '🏠' : '🧡'),
    h('button', { class: 'iconbtn', title: 'Menu', onclick: () => { sfx('open'); gameMenu(); } }, '☰'),
  );
  orderEl = h('div', { class: 'ordercard' + (bag && isWork ? '' : ' hidden'), onclick: () => orderCard() });
  if (bag && isWork && innerWidth < 560) {
    const g = GROUPS.find(g => g.id === bag!.group)!;
    const got = Object.entries(bag.need).reduce((n, [k, q]) => n + Math.min(q, bag!.have[k] || 0), 0), tot = Object.values(bag.need).reduce((a, b) => a + b, 0);
    const next = Object.entries(bag.need).find(([k, q]) => (bag!.have[k] || 0) < q);
    orderEl.append(h('b', {}, `🛍️ ${g.label} · ${got}/${tot}`), h('div', { class: next ? '' : 'go' }, next ? `Next: ${A.ITEMS[next[0]].emoji} ${A.ITEMS[next[0]].name}` : (g.id === 'pickup' ? '→ Pick-up counter' : `→ Group ${g.id} crate`)), h('div', { class: 'note' }, 'Tap for the full card'));
  } else if (bag && isWork) {
    const g = GROUPS.find(g => g.id === bag!.group)!;
    orderEl.append(h('b', {}, `🛍️ ${g.label}`), h('div', { class: 'note' }, bag.note),
      ...Object.entries(bag.need).map(([k, q]) => { const have = bag!.have[k] || 0; return h('div', { class: 'oi' + (have >= q ? ' ok' : '') }, `${A.ITEMS[k].emoji} ${A.ITEMS[k].name}${q > 1 ? ` ${have}/${q}` : ''}`); }),
      bagComplete(bag) ? h('div', { class: 'go' }, g.id === 'pickup' ? '→ Pick-up counter' : `→ Group ${g.id} crate`) : '');
  }
  hud = h('div', { class: 'hud' }, left, h('div', { class: 'hud-mid' }, orderEl), right);
  ui.prepend(hud);
}
function hudTick() {
  if (clockEl) { const m = Math.floor(clockMin) % (24 * 60); const hh = Math.floor(m / 60), mm = m % 60; clockEl.textContent = `🕘 ${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}${hh < 12 ? 'am' : 'pm'}`; }
}
function updatePrompt() {
  const txt = target ? verbFor(target) : '';
  if (!promptEl) { promptEl = h('div', { class: 'prompt hidden' }); ui.appendChild(promptEl); }
  if (txt) { promptEl.textContent = (isTouch() ? 'A: ' : 'Space: ') + txt; promptEl.classList.remove('hidden'); }
  else promptEl.classList.add('hidden');
  touchBtn?.classList.toggle('ready', !!txt);
}
export function orderCard() {
  if (!bag) return;
  const g = GROUPS.find(g => g.id === bag!.group)!;
  modal({ title: `Order card · ${g.label}`, body: h('div', {},
    h('p', { class: 'sub' }, bag.note + '. Visit the shelves and collect:'),
    ...Object.entries(bag.need).map(([k, q]) => { const have = bag!.have[k] || 0; return h('div', { class: 'card row' + (have >= q ? ' done' : '') }, h('span', { class: 'big' }, A.ITEMS[k].emoji), h('span', {}, `${A.ITEMS[k].name}`), h('b', { style: 'margin-left:auto' }, `${have}/${q}`)); }),
    h('p', { class: 'sub' }, bagComplete(bag) ? (g.id === 'pickup' ? 'All packed! Take it to the pick-up counter by the front door.' : `All packed! Take it to the Group ${g.id} crate along the bottom wall.`) : 'Tip: shelf labels are on top of each shelf.'),
  ) });
}

// ── Boot ────────────────────────────────────────────────────────────────
let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) { update(dt); render(); }
  requestAnimationFrame(loop);
}

export function startGame(mode: 'work' | 'home') {
  save.mode = mode; persist();
  buildMap(mode === 'work' ? workMap() : homeMap());
  running = true;
  renderHud();
  if (isTouch() && !touchBtn) touchBtn = buildTouchControls(ui, () => {}).btn;
  if (mode === 'work') {
    if (save.work.shiftsDone === 0 && !save.work.metTeam.length) setTimeout(() => howToPlay('work'), 400);
    else toast(`Shift ${save.work.shift} · Grab a bag at the bag station!`, 'gold');
  } else {
    if (save.home.day === 1 && !save.home.pats) setTimeout(() => howToPlay('home'), 400);
    else toast(`Home sweet home · Day ${save.home.day}`, 'heart');
  }
}
export function stopGame() { running = false; hud?.remove(); promptEl?.classList.add('hidden'); }
export function setSound(on: boolean) { save.sound = audio.sound = on; persist(); }
export function setMusicOn(on: boolean) { save.music = on; setMusic(on); persist(); }
export function resetSave() { save = freshSave(); persist(); }
export function currentMode() { return map.id; }
export { chooseMode };

resize();
initInput(() => unlockAudio());
window.addEventListener('pointerdown', () => unlockAudio());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });
requestAnimationFrame(loop);
showTitle();
// debug hook for automated tests
(window as any).__gith = { get save() { return save; }, get player() { return player; }, get bag() { return bag; }, startBag, goTo };
void h; void dogPortrait;
