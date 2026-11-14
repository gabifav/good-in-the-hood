// The two places you can be: the Good in the Hood hub (Work) and your flat (Home).

export interface Obj {
  id: string;
  kind: string;
  x: number; y: number; w: number; h: number; // footprint in tiles
  solid: boolean;
  data?: Record<string, any>;
  under?: boolean; // drawn under everything (rugs)
  label?: string;
}

export interface MapDef {
  id: 'work' | 'home';
  w: number; h: number;
  tiles: string[][];
  objs: Obj[];
  spots: Record<string, [number, number]>;
  start: [number, number];
}

function grid(w: number, h: number, ch: string) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function rect(t: string[][], x: number, y: number, w: number, h: number, ch: string) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (t[j] && t[j][i] !== undefined) t[j][i] = ch;
}

export function workMap(): MapDef {
  const W = 32, H = 22;
  const t = grid(W, H, 'g');
  rect(t, 0, 0, 23, 20, '#');
  rect(t, 1, 1, 21, 1, 'w');
  for (const x of [3, 6, 15]) t[1][x] = 'W';
  rect(t, 1, 2, 21, 17, '.');
  rect(t, 1, 2, 8, 7, 'k');
  // front door + yard paths
  t[10][22] = 'd'; t[11][22] = 'd';
  rect(t, 23, 10, 9, 2, 'p');
  rect(t, 27, 12, 2, 8, 'p');

  const objs: Obj[] = [];
  const add = (o: Obj) => objs.push(o);
  // kitchen
  add({ id: 'stove', kind: 'stove', x: 1, y: 2, w: 1, h: 1, solid: true, label: 'Oven' });
  add({ id: 'bench1', kind: 'bench', x: 2, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'bench2', kind: 'bench', x: 3, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'sink', kind: 'sink', x: 4, y: 2, w: 1, h: 1, solid: true, label: 'Sink' });
  add({ id: 'bench3', kind: 'bench', x: 5, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'fridge', kind: 'fridge', x: 7, y: 2, w: 1, h: 1, solid: true, label: 'Fridge' });
  add({ id: 'island', kind: 'island', x: 2, y: 6, w: 4, h: 1, solid: true, label: 'Cooking workshop' });
  // shelves
  const top = ['tins', 'pasta', 'rice', 'cereal', 'bread'];
  const mid = ['fruit', 'veg', 'milk', 'soap', 'tea'];
  top.forEach((it, i) => add({ id: 'shelf-' + it, kind: 'shelf', x: 10 + i * 2, y: 2, w: 2, h: 1, solid: true, data: { item: it } }));
  mid.forEach((it, i) => add({ id: 'shelf-' + it, kind: 'shelf', x: 10 + i * 2, y: 8, w: 2, h: 1, solid: true, data: { item: it } }));
  add({ id: 'board', kind: 'board', x: 20, y: 1, w: 2, h: 1, solid: false, label: 'Tracker board' });
  add({ id: 'pot1', kind: 'pot', x: 9, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'pot2', kind: 'pot', x: 21, y: 18, w: 1, h: 1, solid: true });
  // packing
  add({ id: 'bags', kind: 'bagStation', x: 10, y: 12, w: 2, h: 1, solid: true, label: 'Bag station' });
  add({ id: 'packtable', kind: 'table', x: 12, y: 12, w: 4, h: 1, solid: true });
  ['1', '2', '3', '4', '5', '6A', '6B'].forEach((g, i) => add({ id: 'crate-' + g, kind: 'crate', x: 2 + i * 2, y: 17, w: 1, h: 1, solid: true, data: { group: g } }));
  add({ id: 'counter', kind: 'counter', x: 19, y: 14, w: 2, h: 1, solid: true, data: { group: 'pickup' }, label: 'Pick-up counter' });
  // yard
  add({ id: 'sign', kind: 'sign', x: 24, y: 4, w: 3, h: 1, solid: true, label: 'Good in the Hood' });
  add({ id: 'van', kind: 'van', x: 25, y: 7, w: 4, h: 2, solid: true, label: 'Delivery van' });
  add({ id: 'tree1', kind: 'tree', x: 30, y: 2, w: 1, h: 1, solid: true, data: { v: 1 } });
  add({ id: 'tree2', kind: 'tree', x: 23, y: 16, w: 1, h: 1, solid: true, data: { v: 0 } });
  add({ id: 'tree3', kind: 'tree', x: 30, y: 15, w: 1, h: 1, solid: true, data: { v: 1 } });
  add({ id: 'bowl', kind: 'bowl', x: 23, y: 12, w: 1, h: 1, solid: false, label: "Bowie's water bowl" });
  add({ id: 'bus', kind: 'busStop', x: 27, y: 19, w: 2, h: 1, solid: true, label: 'Bus stop (home)' });

  return {
    id: 'work', w: W, h: H, tiles: t, objs,
    start: [20, 11],
    spots: {
      kitchen: [6, 6], kitchen2: [1, 6], shelves: [13, 5], aisle: [17, 10], crates: [9, 15], bags: [9, 12],
      board: [20, 3], counter: [19.5, 13], yard: [24, 13], van: [29.5, 9.5], door: [21, 8],
    },
  };
}

export function homeMap(): MapDef {
  const W = 20, H = 14;
  const t = grid(W, H, '#');
  rect(t, 1, 1, 18, 1, 'H');
  for (const x of [3, 10, 11, 17]) t[1][x] = 'V';
  rect(t, 1, 2, 6, 11, 'o');
  rect(t, 8, 2, 6, 11, 'o');
  rect(t, 15, 2, 4, 11, 'k');
  rect(t, 7, 6, 1, 2, 'o'); rect(t, 14, 6, 1, 2, 'o');

  const objs: Obj[] = [];
  const add = (o: Obj) => objs.push(o);
  add({ id: 'bed', kind: 'bed', x: 1, y: 2, w: 2, h: 2, solid: true, label: 'Bed' });
  add({ id: 'night', kind: 'nightstand', x: 3, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'wardrobe', kind: 'wardrobe', x: 5, y: 2, w: 2, h: 1, solid: true, label: 'Wardrobe' });
  add({ id: 'desk', kind: 'desk', x: 1, y: 11, w: 2, h: 1, solid: true, label: 'Team photo' });
  add({ id: 'books', kind: 'bookshelf', x: 6, y: 11, w: 1, h: 1, solid: true, label: 'Bookshelf' });
  add({ id: 'rug', kind: 'rug', x: 9, y: 5, w: 4, h: 3, solid: false, under: true });
  add({ id: 'tv', kind: 'tv', x: 10, y: 2, w: 2, h: 1, solid: true, label: 'TV' });
  add({ id: 'hpot1', kind: 'pot', x: 8, y: 2, w: 1, h: 1, solid: true, data: { v: 1 } });
  add({ id: 'hpot2', kind: 'pot', x: 13, y: 2, w: 1, h: 1, solid: true, data: { v: 1 } });
  add({ id: 'couch', kind: 'couch', x: 9, y: 9, w: 4, h: 1, solid: true, label: 'Couch' });
  add({ id: 'hfridge', kind: 'fridge', x: 15, y: 2, w: 1, h: 1, solid: true, label: 'Fridge' });
  add({ id: 'hstove', kind: 'stove', x: 16, y: 2, w: 1, h: 1, solid: true, label: 'Stove' });
  add({ id: 'hbench', kind: 'bench', x: 17, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'hsink', kind: 'sink', x: 18, y: 2, w: 1, h: 1, solid: true });
  add({ id: 'dining', kind: 'dining', x: 16, y: 6, w: 2, h: 1, solid: true });
  add({ id: 'herbs', kind: 'herbs', x: 16, y: 11, w: 2, h: 1, solid: true, label: 'Herb garden' });
  add({ id: 'hbowl', kind: 'bowl', x: 13, y: 11, w: 1, h: 1, solid: false, label: "Bowie's bowl" });
  add({ id: 'door', kind: 'door', x: 11, y: 13, w: 1, h: 1, solid: true, label: 'Front door (work)' });
  return { id: 'home', w: W, h: H, tiles: t, objs, start: [11, 11], spots: {} };
}
