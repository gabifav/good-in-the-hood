// Menus and mini-games (DOM based).
import { TEAM, GROUPS, DOG, CUSTOM_SKINS, CUSTOM_HAIRS, HAIR_STYLES, CLOTHES_COLOURS, DEFAULT_CUSTOM,
  type Outfit, type Person, type TopStyle, type BottomStyle, type LayerStyle, type HatStyle, type HairStyle } from '../config/team';
import { personPortrait, personSheet, dogPortrait, CW, CH } from '../gfx/sprites';
import { ui, h, modal, toast, confetti, dialogue } from './dom';
import { sfx, unlockAudio, audio } from '../audio';
import * as G from '../main';

const TOPS: [TopStyle, string][] = [['tee', 'T-shirt'], ['gith', 'Good in the Hood tee'], ['stripeLong', 'Striped top'], ['tieDye', 'Tie-dye'], ['floral', 'Floral jumper'], ['layeredTee', 'Layered tee'], ['hoodie', 'Hoodie'], ['jumper', 'Jumper'], ['shirt', 'Polo / shirt']];
const BOTTOMS: [BottomStyle, string][] = [['trousers', 'Trousers'], ['skirt', 'Skirt'], ['shorts', 'Shorts'], ['leggings', 'Leggings']];
const LAYERS: [LayerStyle, string][] = [['none', 'None'], ['apron', 'Apron'], ['hivis', 'Hi-vis vest'], ['vest', 'Utility vest'], ['cardigan', 'Cardi / fleece'], ['lanyard', 'Lanyard']];
const HATS: [HatStyle, string][] = [['none', 'None'], ['beanie', 'Beanie'], ['cap', 'Cap'], ['cowboy', 'Sparkly cowboy hat'], ['hairclip', 'Hair clip']];
const HAIR_NAMES: Record<HairStyle, string> = { shoulderSide: 'Shoulder, side part', longWavy: 'Long & wavy', bobSide: 'Wavy bob', ponytail: 'Ponytail', short: 'Short', bun: 'Bun', curly: 'Curly', buzz: 'Buzz cut', fringeBob: 'Bob with fringe', fringeBack: 'Pulled back + fringe', bald: 'Bald' };

function screen(cls: string, ...kids: Node[]) {
  const s = h('div', { class: 'screen ' + cls }, ...kids);
  ui.appendChild(s);
  return s;
}

// ── Title ───────────────────────────────────────────────────────────────
export function showTitle() {
  const floaties = h('div', { class: 'floaties' });
  TEAM.forEach((p, i) => {
    const img = h('img', { class: 'floaty', src: personPortrait(p.looks, p.outfit, 3), alt: '' });
    img.style.left = (4 + (i * 97) % 90) + '%'; img.style.top = (i % 2 ? 66 : 8) + (i * 7) % 18 + '%';
    img.style.animationDelay = (i * 0.4) + 's';
    floaties.appendChild(img);
  });
  const dogImg = h('img', { class: 'floaty dog', src: dogPortrait(4), alt: '' });
  dogImg.style.left = '46%'; dogImg.style.top = '80%';
  floaties.appendChild(dogImg);
  const has = G.hasSave();
  const s = screen('title', floaties, h('div', { class: 'inner' },
    h('div', { class: 'logo-heart' }, '♥'),
    h('h1', {}, 'Good in the Hood'),
    h('div', { class: 'tag' }, 'A cosy little food relief game'),
    h('div', { class: 'ded' }, 'Made with love by Gabi, for the crew ♡'),
    has ? h('button', { class: 'btn big', onclick: () => { go(); chooseMode(); } }, '▶ Continue') : null,
    h('button', { class: 'btn big ' + (has ? 'lav' : ''), onclick: () => { go(); if (has) { dialogue([{ text: 'Start a new game? Your current progress will be cleared.' }], undefined, [{ label: 'Yes, start fresh', fn: () => { G.resetSave(); pickCharacter(); } }, { label: 'Keep my game', fn: showTitle }]); } else pickCharacter(); } }, has ? 'New game' : '▶ Start'),
    h('div', { class: 'hint' }, 'Arrow keys / WASD to move · Space to interact'),
  ));
  function go() { unlockAudio(); sfx('open'); s.remove(); }
}

// ── Character select ───────────────────────────────────────────────────
export function pickCharacter(fromMenu = false) {
  const grid = h('div', { class: 'cgrid' });
  TEAM.forEach(p => {
    grid.appendChild(h('button', { class: 'cslot', onclick: () => choose(p.id) },
      h('img', { src: personPortrait(p.looks, G.outfitOf(p), 4), alt: '' }), h('span', {}, p.name)));
  });
  grid.appendChild(h('button', { class: 'cslot new', onclick: () => { sfx('open'); s.remove(); customCreator(fromMenu); } },
    h('div', { class: 'plus' }, '+'), h('span', {}, 'New volunteer')));
  const s = screen('picker', h('div', { class: 'panel wide' },
    h('div', { class: 'panel-head' }, h('span', {}, 'Who are you today?'), fromMenu ? h('button', { class: 'close', onclick: () => { s.remove(); } }, '✕') : null),
    h('div', { class: 'panel-body' }, h('p', { class: 'sub' }, 'Pick your avatar from the Good in the Hood crew. You can change outfits any time.'), grid)));
  function choose(id: string) {
    sfx('pick'); G.save.personId = id; G.persist(); s.remove();
    if (fromMenu) { G.stopGame(); G.startGame(G.save.mode); toast(`You're now playing as ${G.playerPerson().name}!`, 'good'); }
    else wardrobe(true);
  }
}

function customCreator(fromMenu: boolean) {
  const c = G.save.custom || { name: '', looks: { ...DEFAULT_CUSTOM.looks } };
  const looks = { ...c.looks };
  let name = c.name;
  const prev = h('img', { alt: '' });
  const refresh = () => { prev.src = personPortrait(looks, G.save.outfits.custom || DEFAULT_CUSTOM.outfit, 5); };
  const sw = (cols: string[], get: () => string, set: (v: string) => void) => {
    const row = h('div', { class: 'swatches' });
    const draw = () => { row.innerHTML = ''; cols.forEach(col => row.appendChild(h('button', { class: 'swatch' + (get() === col ? ' sel' : ''), style: `background:${col}`, 'aria-label': col, onclick: () => { set(col); sfx('blip'); draw(); refresh(); } }))); };
    draw(); return row;
  };
  const opts = <T extends string>(list: [T, string][], get: () => T, set: (v: T) => void) => {
    const row = h('div', { class: 'opts' });
    const draw = () => { row.innerHTML = ''; list.forEach(([v, l]) => row.appendChild(h('button', { class: 'opt' + (get() === v ? ' sel' : ''), onclick: () => { set(v); sfx('blip'); draw(); refresh(); } }, l))); };
    draw(); return row;
  };
  const input = h('input', { type: 'text', maxlength: '14', placeholder: 'Your name', value: name }) as HTMLInputElement;
  input.addEventListener('input', () => name = input.value);
  const m = modal({ title: 'New volunteer', wide: true, body: h('div', { class: 'creator' },
    h('div', { class: 'preview' }, prev),
    h('div', { class: 'opts-col' },
      h('h5', {}, 'Name'), input,
      h('h5', {}, 'Skin'), sw(CUSTOM_SKINS, () => looks.skin, v => looks.skin = v),
      h('h5', {}, 'Hair colour'), sw(CUSTOM_HAIRS, () => looks.hair, v => looks.hair = v),
      h('h5', {}, 'Hairstyle'), opts(HAIR_STYLES.map(s => [s, HAIR_NAMES[s]] as [HairStyle, string]), () => looks.hairStyle, v => looks.hairStyle = v),
      h('h5', {}, 'Extras'), opts([['no', 'No freckles'], ['yes', 'Freckles']], () => looks.freckles ? 'yes' : 'no', v => looks.freckles = v === 'yes'),
      opts([['none', 'No glasses'], ['#3b2f45', 'Dark glasses'], ['#e8798c', 'Pink glasses'], ['#b9a3e3', 'Lilac glasses'], ['#c9935f', 'Tortoiseshell']], () => (looks.glasses || 'none') as string, v => looks.glasses = v === 'none' ? null : v),
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: done }, 'Next: get dressed →')),
    )), onClose: () => { if (!G.save.personId) pickCharacter(fromMenu); } });
  refresh();
  function done() {
    G.save.custom = { name: (name || 'Volunteer').trim().slice(0, 14), looks };
    G.save.personId = 'custom'; G.persist();
    m.back.remove();
    if (fromMenu) { G.stopGame(); G.startGame(G.save.mode); } else wardrobe(true);
  }
}

// ── Wardrobe ────────────────────────────────────────────────────────────
export function wardrobe(firstTime: boolean) {
  const me = G.playerPerson();
  const o: Outfit = { ...G.outfitOf(me) };
  let dirRow = 0;
  const prev = h('canvas', { class: 'pcanvas', width: String(CW * 5), height: String(CH * 5) }) as HTMLCanvasElement;
  const draw = () => {
    const c = prev.getContext('2d')!; c.imageSmoothingEnabled = false; c.clearRect(0, 0, prev.width, prev.height);
    c.drawImage(personSheet(me.looks, o), 0, dirRow * CH, CW, CH, 0, 0, CW * 5, CH * 5);
  };
  const turn = h('button', { class: 'opt', onclick: () => { dirRow = (dirRow + 1) % 4; draw(); } }, '↻ Turn');
  const sections: HTMLElement[] = [];
  const sw = (label: string, key: keyof Outfit) => {
    const row = h('div', { class: 'swatches' });
    const paint = () => { row.innerHTML = ''; CLOTHES_COLOURS.forEach(col => row.appendChild(h('button', { class: 'swatch' + (o[key] === col ? ' sel' : ''), style: `background:${col}`, 'aria-label': col, onclick: () => { (o as any)[key] = col; sfx('blip'); paint(); draw(); } }))); };
    paint(); sections.push(h('h5', {}, label), row);
  };
  const opts = <T extends string>(label: string, key: keyof Outfit, list: [T, string][]) => {
    const row = h('div', { class: 'opts' });
    const paint = () => { row.innerHTML = ''; list.forEach(([v, l]) => row.appendChild(h('button', { class: 'opt' + (o[key] === v ? ' sel' : ''), onclick: () => { (o as any)[key] = v; sfx('blip'); paint(); draw(); } }, l))); };
    paint(); sections.push(h('h5', {}, label), row);
  };
  opts('Top', 'top', TOPS); sw('Top colour', 'topColor'); sw('Print / stripe / sleeve colour', 'accentColor');
  opts('Bottoms', 'bottom', BOTTOMS); sw('Bottoms colour', 'bottomColor');
  opts('Layer', 'layer', LAYERS); sw('Layer colour', 'layerColor');
  opts('Hat', 'hat', HATS); sw('Hat colour', 'hatColor');
  sw('Shoes', 'shoeColor');
  const presets = h('div', { class: 'opts' },
    h('button', { class: 'opt', onclick: () => { Object.assign(o, me.outfit); sfx('blip'); m.back.remove(); G.save.outfits[me.id] = { ...me.outfit }; G.persist(); wardrobe(firstTime); } }, `↺ ${me.name}'s usual look`),
    h('button', { class: 'opt', onclick: () => { Object.assign(o, { top: 'gith', topColor: '#1c1b21', accentColor: '#ef6b8f', layer: 'apron', layerColor: '#7cc48b' }); sfx('blip'); draw(); } }, '🧡 Work uniform'),
    h('button', { class: 'opt', onclick: () => { Object.assign(o, { top: 'hoodie', topColor: '#b9a3e3', bottom: 'leggings', bottomColor: '#3c4a6b', layer: 'none', hat: 'none' }); sfx('blip'); draw(); } }, '🛋️ Cosy home fit'),
    h('button', { class: 'opt', onclick: () => { Object.assign(o, { layer: 'hivis', layerColor: '#d9ff3c' }); sfx('blip'); draw(); } }, '🦺 Delivery hi-vis'),
  );
  const m = modal({ title: firstTime ? `Get dressed, ${me.name}!` : 'Wardrobe', wide: true, onClose: () => { if (firstTime) chooseMode(); },
    body: h('div', { class: 'creator' },
      h('div', { class: 'preview tall' }, prev, turn),
      h('div', { class: 'opts-col' }, h('h5', {}, 'Quick looks'), presets, ...sections,
        h('div', { class: 'row end sticky' }, h('button', { class: 'btn', onclick: () => {
          G.save.outfits[me.id] = { ...o }; G.persist(); sfx('pick'); m.close(); if (!firstTime) { toast('Looking great! ✨', 'heart'); G.renderHud(); }
        } }, firstTime ? 'Looking good → Choose a mode' : 'Done ✨'))),
    ) });
  draw();
}

// ── Mode choice ─────────────────────────────────────────────────────────
export function chooseMode() {
  G.stopGame();
  const me = G.playerPerson();
  const card = (mode: 'work' | 'home', icon: string, title: string, text: string) => h('button', { class: 'modecard ' + mode, onclick: () => { sfx('pick'); s.remove(); G.startGame(mode); } },
    h('div', { class: 'micon' }, icon), h('h3', {}, title), h('p', {}, text));
  const s = screen('modes', h('div', { class: 'inner' },
    h('img', { class: 'me', src: personPortrait(me.looks, G.outfitOf(me), 5), alt: '' }),
    h('h2', {}, `Where to, ${me.name}?`),
    h('div', { class: 'modecards' },
      card('work', '🧡', 'Work mode', 'Pack food relief bags for every group, run the pick-up counter, bake pumpkin tarts and send off the van.'),
      card('home', '🏠', 'Home mode', 'Kick back after a shift: cook-ups with rescued food, grow herbs, pat Bowie and pick new outfits.')),
    h('button', { class: 'linkbtn', onclick: () => { s.remove(); pickCharacter(); } }, 'Change character'),
  ));
}

// ── Tracker board (styled after Gabi's real packing tracker) ───────────────
export function trackerBoard(pick: boolean) {
  const list = h('div', { class: 'tracker' });
  for (const g of GROUPS) {
    const done = G.save.work.progress[g.id] || 0, full = done >= g.bags;
    const pct = Math.round(Math.min(1, done / g.bags) * 100);
    const can = pick && !full;
    list.appendChild(h(can ? 'button' : 'div', { class: `tcard g${g.id.toLowerCase()}${full ? ' done' : ''}${can ? ' pickable' : ''}`, onclick: can ? () => { m.close(); G.startBag(g.id); } : undefined },
      h('div', { class: 'top-row' }, h('div', { class: 'title' }, g.label), h('div', { class: 'status' + (full ? ' done' : '') }, full ? 'DONE ✅' : 'In Progress')),
      h('div', { class: 'progress-row' }, h('div', { class: 'fraction' }, `${Math.min(done, g.bags)} / ${g.bags}`), can ? h('span', { class: 'pickme' }, 'Pack a bag →') : null),
      h('div', { class: 'bar-bg' }, h('div', { class: 'bar-fill', style: `width:${pct}%` })),
    ));
  }
  const all = G.allDone();
  const m = modal({ title: pick ? '📦 Pick a group to pack for' : '📋 Tracker board', wide: true, cls: 'trackerpanel', body: h('div', {},
    h('p', { class: 'sub' }, all ? 'Every group is packed! Head out to the van in the yard and send the deliveries off. 🚐' : pick ? 'Tap a group to grab a bag and an order card.' : 'Tap +1 when a bag is finished… or in this case, pop it in the crate and listen for the ding!'),
    list) });
}

// ── Pumpkin tart workshop ────────────────────────────────────────────────
export function tartWorkshop() {
  const N = 12;
  const cells: number[] = Array(N).fill(0); // 0 empty, 1 pastry, 2 pumpkin, 3 greens
  const tools = [{ n: 1, label: '🥟 Pastry', hint: 'Press pastry into each tin' }, { n: 2, label: '🎃 Pumpkin', hint: 'A spoonful of roast pumpkin' }, { n: 3, label: '🥬 Spinach & feta', hint: 'Top with greens' }];
  let tool = 1;
  const tray = h('div', { class: 'tray' });
  const toolRow = h('div', { class: 'opts' });
  const status = h('p', { class: 'sub' });
  const bakeBtn = h('button', { class: 'btn butter', disabled: 'true', onclick: () => bake() }, '🔥 Into the oven!') as HTMLButtonElement;
  const paintTools = () => { toolRow.innerHTML = ''; tools.forEach(t => toolRow.appendChild(h('button', { class: 'opt' + (tool === t.n ? ' sel' : ''), onclick: () => { tool = t.n; sfx('blip'); paintTools(); } }, t.label))); status.textContent = tools[tool - 1].hint + '. Tap each tin, in order: pastry → pumpkin → greens.'; };
  const paintTray = () => {
    tray.innerHTML = '';
    cells.forEach((v, i) => tray.appendChild(h('button', { class: 'tin s' + v, 'aria-label': 'tin ' + (i + 1), onclick: (e: Event) => {
      if (cells[i] === tool - 1) { cells[i] = tool; sfx('pick'); if (cells.every(c => c === tool) && tool < 3) { tool++; paintTools(); } }
      else { sfx('oops'); (e.currentTarget as HTMLElement).classList.add('shake'); setTimeout(() => (e.currentTarget as HTMLElement)?.classList.remove('shake'), 300); }
      paintTray(); bakeBtn.disabled = !cells.every(c => c === 3);
    } })));
  };
  paintTools(); paintTray();
  const body = h('div', { class: 'workshop' }, h('p', {}, 'Cooking workshop: pumpkin, spinach & feta tarts for the team and visitors. 🥧'), toolRow, tray, status, h('div', { class: 'row end' }, bakeBtn));
  const m = modal({ title: '🥧 Cooking workshop', wide: true, body });
  function bake() {
    body.innerHTML = '';
    const bar = h('div', { class: 'ovenbar' }, h('div', { class: 'zone' }), h('div', { class: 'marker' }));
    const msg = h('p', {}, 'Watch the oven! Take them out when the marker is in the golden zone.');
    const btn = h('button', { class: 'btn big' }, '🧤 Take them out!');
    body.append(h('div', { class: 'oven' }, '🔥'), msg, bar, h('div', { class: 'row end' }, btn));
    const marker = bar.querySelector('.marker') as HTMLElement;
    let t = 0, raf = 0; const start = performance.now();
    const tick = () => { t = ((performance.now() - start) / 1000) * 0.45; const p = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2; marker.style.left = (p * 100) + '%'; (marker as any)._p = p; raf = requestAnimationFrame(tick); };
    tick();
    btn.onclick = () => {
      cancelAnimationFrame(raf);
      const p = (marker as any)._p as number;
      const golden = p > 0.62 && p < 0.82, ok = p > 0.45 && p < 0.92;
      G.save.work.tartsToday = 3; G.save.work.tartBatches++; G.persist();
      sfx(golden ? 'big' : 'ding'); if (golden) confetti(50);
      body.innerHTML = '';
      body.append(h('div', { class: 'oven' }, '🥧'), h('h3', {}, golden ? 'Perfectly golden!' : ok ? 'Lovely and toasty!' : p <= 0.45 ? 'A little pale, but still delicious!' : 'Extra crispy edges… rustic!'),
        h('p', {}, 'The tray goes on the workshop bench for everyone to share. Batches baked: ' + G.save.work.tartBatches),
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => m.close() }, 'Yum! ✨')));
      toast('🥧 Fresh pumpkin tarts on the bench!', 'gold');
    };
  }
}

// ── Leftover cook-up (home) ──────────────────────────────────────────────
export function cookUp() {
  const ings = ['🥕 Rescued veg', '🍚 Rice', '🍝 Pasta', '🥚 Eggs', '🍞 Bread', '🥫 Tinned tomatoes', '🧀 Cheese', '🎃 Pumpkin'];
  if (G.save.home.herbStage >= 2) ings.push('🌿 Fresh herbs');
  const chosen = new Set<string>();
  const row = h('div', { class: 'ings' });
  const out = h('p', { class: 'sub' }, 'Pick 3 ingredients from the fridge and pantry.');
  const btn = h('button', { class: 'btn butter', disabled: 'true', onclick: () => cook() }, '🍳 Cook!') as HTMLButtonElement;
  const paint = () => { row.innerHTML = ''; ings.forEach(i => row.appendChild(h('button', { class: 'opt' + (chosen.has(i) ? ' sel' : ''), onclick: () => { if (chosen.has(i)) chosen.delete(i); else if (chosen.size < 3) chosen.add(i); sfx('blip'); paint(); btn.disabled = chosen.size !== 3; } }, i))); };
  paint();
  const body = h('div', {}, h('p', {}, 'Nothing goes to waste in this kitchen. What are we making tonight?'), row, out, h('div', { class: 'row end' }, btn));
  const m = modal({ title: '🍳 Leftover cook-up', wide: true, body });
  function cook() {
    const has = (k: string) => [...chosen].some(c => c.includes(k));
    let dish = 'Mystery bake (surprisingly great)';
    if (has('Rice') && has('Eggs')) dish = 'Egg fried rice';
    else if (has('Pasta') && has('Tinned')) dish = 'Big bowl of pasta pomodoro';
    else if (has('Pasta') && has('Cheese')) dish = 'Cheesy pasta bake';
    else if (has('Bread') && has('Cheese')) dish = 'Toasties for days';
    else if (has('Bread') && has('Eggs')) dish = 'French toast';
    else if (has('Pumpkin') && has('veg')) dish = 'Roast pumpkin & veg tray bake';
    else if (has('Pumpkin')) dish = 'Pumpkin soup';
    else if (has('veg') && has('Tinned')) dish = 'Hearty veggie stew';
    else if (has('Rice') && has('veg')) dish = 'Veggie risotto';
    else if (has('Eggs') && has('veg')) dish = 'Veggie frittata';
    if (has('herbs')) dish += ' with fresh herbs';
    sfx('cook'); setTimeout(() => sfx('ding'), 500);
    G.save.home.mealsCooked++;
    const first = !G.save.home.cookedToday; G.save.home.cookedToday = true; G.persist();
    if (first) G.recharge(20);
    body.innerHTML = '';
    body.append(h('div', { class: 'oven' }, '🍲'), h('h3', {}, dish + '!'), h('p', {}, `Meals cooked at home: ${G.save.home.mealsCooked}. ${DOG.name} is watching hopefully.${first ? ' +20 recharge' : ''}`),
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => m.close() }, 'Delicious ✨')));
  }
}

// ── Team photo ───────────────────────────────────────────────────────────
export function teamPhoto() {
  const grid = h('div', { class: 'cgrid photo' }, ...TEAM.map(p => h('div', { class: 'cslot still' }, h('img', { src: personPortrait(p.looks, G.outfitOf(p), 4), alt: '' }), h('span', {}, p.name))),
    h('div', { class: 'cslot still' }, h('img', { src: dogPortrait(4), alt: '', class: 'dogimg' }), h('span', {}, DOG.name + ' 🐾')));
  modal({ title: '📸 The Good in the Hood crew', wide: true, body: h('div', {}, h('p', { class: 'sub' }, 'Your favourite photo. Everyone squished in, someone blinking, Bowie front and centre.'), grid) });
}

// ── Shift summary ────────────────────────────────────────────────────────
export function shiftSummary(s: { shift: number; bags: number; visitors: number; tarts: boolean }) {
  confetti(90);
  const m = modal({ title: `🎉 Shift ${s.shift} complete!`, noClose: true, body: h('div', { class: 'summary' },
    h('p', {}, 'The van is off on its rounds and every group has their bags. What a team.'),
    h('div', { class: 'statgrid' },
      h('div', { class: 'stat' }, h('b', {}, String(s.bags)), h('span', {}, 'bags packed')),
      h('div', { class: 'stat' }, h('b', {}, String(G.save.work.bagsAllTime)), h('span', {}, 'bags all-time')),
      h('div', { class: 'stat' }, h('b', {}, String(s.visitors)), h('span', {}, 'pick-up visitors helped')),
      h('div', { class: 'stat' }, h('b', {}, s.tarts ? '🥧' : '–'), h('span', {}, s.tarts ? 'tarts baked' : 'no tarts this time'))),
    h('div', { class: 'row end' },
      h('button', { class: 'btn lav', onclick: () => { m.close(); G.goTo('home'); } }, '🏠 Head home'),
      h('button', { class: 'btn', onclick: () => { m.close(); toast(`Shift ${G.save.work.shift} · Grab a bag at the bag station!`, 'gold'); } }, '🧡 Next shift')),
  ) });
}

// ── Menu & help ──────────────────────────────────────────────────────────
export function gameMenu() {
  const isWork = G.currentMode() === 'work';
  const tog = (label: string, get: () => boolean, set: (v: boolean) => void) => {
    const b = h('button', { class: 'btn ' + (get() ? '' : 'lav'), onclick: () => { set(!get()); b.textContent = `${label}: ${get() ? 'on' : 'off'}`; b.className = 'btn ' + (get() ? '' : 'lav'); } }, `${label}: ${get() ? 'on' : 'off'}`);
    return b;
  };
  const m = modal({ title: '☰ Menu', body: h('div', { class: 'menu' },
    h('button', { class: 'btn', onclick: () => { m.close(); G.goTo(isWork ? 'home' : 'work'); } }, isWork ? '🏠 Switch to Home mode' : '🧡 Switch to Work mode'),
    h('button', { class: 'btn', onclick: () => { m.close(); wardrobe(false); } }, '👕 Wardrobe'),
    h('button', { class: 'btn', onclick: () => { m.close(); pickCharacter(true); } }, '🧑‍🤝‍🧑 Change character'),
    h('button', { class: 'btn', onclick: () => { m.close(); howToPlay(isWork ? 'work' : 'home'); } }, '❓ How to play'),
    tog('🔊 Sound', () => audio.sound, v => G.setSound(v)),
    tog('🎵 Music', () => G.save.music, v => G.setMusicOn(v)),
    h('p', { class: 'sub' }, 'Your game saves automatically in this browser.'),
  ) });
}

export function howToPlay(mode: 'work' | 'home') {
  const work = [
    ['🛍️', 'Grab a bag at the bag station and pick a group to pack for.'],
    ['🥫', 'Walk to the shelves and press Space (or A) to take each item on the order card.'],
    ['📦', 'Drop the finished bag in that group\'s crate. Listen for the ding! Pick-up bags go on the front counter.'],
    ['🥧', 'Bake pumpkin tarts at the cooking workshop bench in the kitchen.'],
    ['🏷️', 'Help Gabi, Robert & Marc at the admin desk: check meals and reprint wrong labels.'],
    ['🚐', 'When every group is packed, send off the van in the yard.'],
    ['💬', 'Chat with the crew, and pat Bowie. He follows you everywhere.'],
  ];
  const home = [
    ['🍳', 'Use the fridge or stove for a leftover cook-up.'],
    ['🌿', 'Water your herbs each day. They grow overnight.'],
    ['🛋️', 'Put your feet up on the couch, watch TV, read a book.'],
    ['👕', 'Change your outfit at the wardrobe.'],
    ['😴', 'Sleep to start a new day. The front door takes you to work.'],
    ['🐶', `Pat ${DOG.name}!`],
  ];
  const list = mode === 'work' ? work : home;
  modal({ title: mode === 'work' ? '🧡 Work mode' : '🏠 Home mode', body: h('div', { class: 'howto' },
    ...list.map(([i, t]) => h('div', { class: 'card row' }, h('span', { class: 'big' }, i), h('span', {}, t))),
    h('p', { class: 'sub' }, 'Move: arrow keys / WASD or the joystick. Interact: Space / Enter or the A button.')) });
}

void ({} as Person);

// ── Admin desk: labels & meal checks (Gabi, Robert & Marc's corner) ─────────
export function adminDesk() {
  const DISHES = [['🍛', 'Veggie curry'], ['🥣', 'Pumpkin soup'], ['🍝', 'Spag bol'], ['🍗', 'Chicken & rice'], ['🍲', 'Lentil stew'], ['🧀', 'Pasta bake'], ['🍚', 'Fried rice'], ['🥧', "Shepherd's pie"]];
  const day = (off: number) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); };
  const crew = TEAM.filter(p => ['gabi', 'robert', 'marc'].includes(p.id) && p.id !== G.save.personId);
  const meals = [...DISHES].sort(() => Math.random() - 0.5).slice(0, 6).map(([emoji, name]) => {
    const roll = Math.random();
    const problem = roll < 0.18 ? 'name' : roll < 0.34 ? 'expired' : roll < 0.48 ? 'nodate' : null;
    const other = DISHES.filter(d => d[1] !== name)[(Math.random() * 7) | 0][1];
    return { emoji, name, problem, label: { name: problem === 'name' ? other : name, date: problem === 'expired' ? day(-1 - ((Math.random() * 3) | 0)) : problem === 'nodate' ? '' : day(2 + ((Math.random() * 3) | 0)) } };
  });
  if (!meals.some(m => m.problem)) { meals[0].problem = 'nodate'; meals[0].label.date = ''; }
  let done = 0, fixed = 0, right = 0;
  const list = h('div', { class: 'meals' });
  const foot = h('p', { class: 'sub' }, `Today is ${day(0)}. Check each meal: does the label match what's inside, and is the use-by date there and still good?`);
  const why = (m: typeof meals[0]) => m.problem === 'name' ? `The label says ${m.label.name}, but it's ${m.name}!` : m.problem === 'expired' ? `That use-by date has already passed.` : m.problem === 'nodate' ? 'There\'s no use-by date on it.' : 'Label is spot on.';
  meals.forEach(m => {
    const lab = h('div', { class: 'label' }, h('b', {}, m.label.name), h('span', {}, m.label.date ? `Use by ${m.label.date}` : 'Use by ____'), h('small', {}, 'Good in the Hood ♥'));
    const res = h('div', { class: 'res' });
    const btns = h('div', { class: 'row' });
    const card = h('div', { class: 'meal' }, h('div', { class: 'tub' }, h('span', { class: 'big' }, m.emoji), h('small', {}, m.name)), lab, h('div', { class: 'mc' }, btns, res));
    const answer = (fix: boolean) => {
      const correct = fix === !!m.problem;
      if (correct) right++;
      if (fix && m.problem) { fixed++; lab.classList.add('reprint'); lab.innerHTML = ''; lab.append(h('b', {}, m.name), h('span', {}, `Use by ${day(3)}`), h('small', {}, 'Good in the Hood ♥')); }
      sfx(correct ? (fix ? 'pick' : 'ding') : 'oops');
      card.classList.add(correct ? 'ok' : 'nope');
      const helper = crew.length ? crew[(Math.random() * crew.length) | 0].name : 'The team';
      res.textContent = correct ? (fix ? `Reprinted! ${why(m)}` : 'Good to go ✅') : `${helper} double-checks: ${why(m)}${m.problem ? ' New label printed.' : ''}`;
      if (!correct && m.problem) { fixed++; lab.classList.add('reprint'); lab.innerHTML = ''; lab.append(h('b', {}, m.name), h('span', {}, `Use by ${day(3)}`), h('small', {}, 'Good in the Hood ♥')); }
      btns.remove();
      done++;
      if (done === meals.length) finish();
    };
    btns.append(h('button', { class: 'btn', onclick: () => answer(false) }, '✅ Good to go'), h('button', { class: 'btn pink', onclick: () => answer(true) }, '🏷️ Reprint label'));
    list.appendChild(card);
  });
  const team = h('div', { class: 'admincrew' }, ...crew.map(p => h('div', {}, h('img', { src: personPortrait(p.looks, G.outfitOf(p), 3, true), alt: '' }), h('span', {}, p.name))));
  const body = h('div', {}, team, foot, list);
  const m = modal({ title: '🏷️ Admin desk · labels & meal checks', wide: true, body });
  function finish() {
    G.save.work.mealsChecked += meals.length; G.save.work.labelsFixed += fixed; G.persist();
    const perfect = right === meals.length;
    if (perfect) confetti(40);
    sfx(perfect ? 'big' : 'ding');
    const lead = crew.find(p => p.id === 'gabi') || crew[0];
    body.appendChild(h('div', { class: 'card done' },
      h('b', {}, perfect ? 'Perfect check! ' : 'All checked! '), `${meals.length} meals checked, ${fixed} label${fixed === 1 ? '' : 's'} reprinted. All-time: ${G.save.work.mealsChecked} meals checked.`,
      lead ? h('div', { class: 'sub' }, `${lead.name}: "${perfect ? 'Admin team, we did it! Not one sneaky label got past us.' : 'Nice one! Every meal leaves with the right label.'}"`) : null));
    body.appendChild(h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => m.close() }, 'Done ✨')));
    m.panel.querySelector('.panel-body')!.scrollTop = 99999;
  }
}
