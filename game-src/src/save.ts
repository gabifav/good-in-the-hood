// Saving lives in this browser (localStorage). Each device keeps its own save.
import type { Outfit, Looks } from './config/team';

export interface SaveData {
  v: 1;
  personId: string | null;
  custom: { name: string; looks: Looks } | null;
  outfits: Record<string, Outfit>; // per person, so everyone keeps their own wardrobe
  mode: 'work' | 'home';
  sound: boolean; music: boolean;
  work: {
    shift: number;            // which shift we're on (1-based)
    progress: Record<string, number>; // bags done per group this shift
    pickupWaiting: number;    // pick-up bags on the counter waiting for collection
    bagsAllTime: number;
    shiftsDone: number;
    tartBatches: number;
    tartsToday: number;       // 0..3 stage of today's tray
    visitorsHelped: number;
    metTeam: string[];
  };
  home: {
    day: number;
    herbStage: number; wateredToday: boolean;
    mealsCooked: number; cookedToday: boolean;
    recharge: number; // 0..100
    pats: number;
    restedToday: boolean;
  };
}

const KEY = 'good-in-the-hood-save-v1';

export function freshSave(): SaveData {
  return {
    v: 1, personId: null, custom: null, outfits: {}, mode: 'work', sound: true, music: true,
    work: { shift: 1, progress: {}, pickupWaiting: 0, bagsAllTime: 0, shiftsDone: 0, tartBatches: 0, tartsToday: 0, visitorsHelped: 0, metTeam: [] },
    home: { day: 1, herbStage: 0, wateredToday: false, mealsCooked: 0, cookedToday: false, recharge: 40, pats: 0, restedToday: false },
  };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const f = freshSave();
    return { ...f, ...d, work: { ...f.work, ...d.work }, home: { ...f.home, ...d.home } };
  } catch { return null; }
}

export function writeSave(d: SaveData) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* private mode etc. */ }
}

export function wipeSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
