// Keyboard + touch controls (joystick and action button on phones/tablets).
export const input = { x: 0, y: 0, action: false, actionPressed: false, cancel: false };
const keys = new Set<string>();
let joy = { x: 0, y: 0 };

export function initInput(onAnyInput: () => void) {
  window.addEventListener('keydown', e => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    onAnyInput();
    const k = e.key.toLowerCase();
    if (!keys.has(k) && (k === ' ' || k === 'enter' || k === 'e' || k === 'z')) input.actionPressed = true;
    if (k === 'escape') input.cancel = true;
    keys.add(k);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
}

export function pollInput() {
  let x = 0, y = 0;
  if (keys.has('arrowleft') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  if (joy.x || joy.y) { x = joy.x; y = joy.y; }
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  input.x = x; input.y = y;
}

export function consumeAction() { const a = input.actionPressed; input.actionPressed = false; return a; }

export function isTouch() { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; }

export function buildTouchControls(root: HTMLElement, onAction: () => void) {
  const wrap = document.createElement('div'); wrap.className = 'touch';
  const pad = document.createElement('div'); pad.className = 'joy';
  const knob = document.createElement('div'); knob.className = 'knob'; pad.appendChild(knob);
  const btn = document.createElement('button'); btn.className = 'abtn'; btn.textContent = 'A';
  wrap.append(pad, btn); root.appendChild(wrap);
  let id: number | null = null;
  const R = 46;
  const move = (e: PointerEvent) => {
    const r = pad.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy); if (m > R) { dx = dx / m * R; dy = dy / m * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy = { x: Math.abs(dx) > 8 ? dx / R : 0, y: Math.abs(dy) > 8 ? dy / R : 0 };
  };
  pad.addEventListener('pointerdown', e => { id = e.pointerId; pad.setPointerCapture(id); move(e); });
  pad.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  const end = (e: PointerEvent) => { if (e.pointerId !== id) return; id = null; joy = { x: 0, y: 0 }; knob.style.transform = ''; };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); input.actionPressed = true; onAction(); });
  return { wrap, btn };
}
