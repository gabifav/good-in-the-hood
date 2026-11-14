// Small DOM helpers for menus, toasts, dialogue and modals.
import { sfx } from '../audio';

export const ui = document.getElementById('ui') as HTMLElement;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, ...kids: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.setAttribute('style', v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, String(v));
  }
  for (const k of kids) if (k != null && k !== false) e.append(k as any);
  return e;
}

let toastBox: HTMLElement | null = null;
export function toast(text: string, kind: '' | 'good' | 'gold' | 'heart' | 'oops' = '') {
  if (!toastBox || !toastBox.isConnected) { toastBox = h('div', { class: 'toasts' }); ui.appendChild(toastBox); }
  const t = h('div', { class: 'toast ' + kind }, text);
  toastBox.appendChild(t);
  while (toastBox.children.length > 3) toastBox.firstElementChild!.remove();
  setTimeout(() => t.remove(), 3300);
}

export interface ModalOpts { title: string; body: Node; onClose?: () => void; wide?: boolean; noClose?: boolean; cls?: string }
let openModals = 0;
export function isModalOpen() { return openModals > 0 || !!document.querySelector('.dialogue'); }
export function modal(o: ModalOpts) {
  openModals++;
  const close = () => { if (!back.isConnected) return; back.remove(); openModals = Math.max(0, openModals - 1); o.onClose?.(); };
  const head = h('div', { class: 'panel-head' }, h('span', {}, o.title),
    o.noClose ? null : h('button', { class: 'close', 'aria-label': 'Close', onclick: () => { sfx('blip'); close(); } }, '✕'));
  const panel = h('div', { class: 'panel' + (o.wide ? ' wide' : '') + (o.cls ? ' ' + o.cls : '') }, head, h('div', { class: 'panel-body' }, o.body));
  const back = h('div', { class: 'modal' }, panel);
  back.addEventListener('pointerdown', e => { if (e.target === back && !o.noClose) close(); });
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !o.noClose) { close(); window.removeEventListener('keydown', esc); } };
  window.addEventListener('keydown', esc);
  ui.appendChild(back);
  return { close, panel, back };
}

export interface Line { who?: string; portrait?: string; text: string }
/** Shows lines one at a time. Space/Enter/click advances. */
export function dialogue(lines: Line[], done?: () => void, choices?: { label: string; fn: () => void }[]) {
  let i = 0;
  const box = h('div', { class: 'dialogue' });
  ui.appendChild(box);
  let typing: number | null = null;
  let full = '';
  const textEl = h('div', { class: 'dlg-text' });
  const render = () => {
    const l = lines[i];
    box.innerHTML = '';
    const port = l.portrait ? h('div', { class: 'portrait' }, h('img', { src: l.portrait, alt: '' })) : null;
    const body = h('div', { class: 'dlg-body' });
    if (l.who) body.appendChild(h('div', { class: 'nametag' }, l.who));
    textEl.className = 'dlg-text' + (l.who ? '' : ' narr');
    body.appendChild(textEl);
    box.append(...[port, body].filter(Boolean) as Node[]);
    full = l.text; textEl.textContent = '';
    let n = 0;
    if (typing) clearInterval(typing);
    typing = window.setInterval(() => {
      n += 2; textEl.textContent = full.slice(0, n);
      if (n % 6 === 0) sfx('talk');
      if (n >= full.length) { clearInterval(typing!); typing = null; finishLine(); }
    }, 22);
  };
  const finishLine = () => {
    textEl.textContent = full;
    if (i === lines.length - 1 && choices) {
      const c = h('div', { class: 'choices' }, ...choices.map(ch => h('button', { class: 'choice', onclick: (e: Event) => { e.stopPropagation(); sfx('blip'); cleanup(); ch.fn(); } }, ch.label)));
      box.querySelector('.dlg-body')!.appendChild(c);
    } else if (!box.querySelector('.dlg-next')) box.appendChild(h('div', { class: 'dlg-next' }, '▼'));
  };
  const advance = () => {
    if (typing) { clearInterval(typing); typing = null; finishLine(); return; }
    if (i === lines.length - 1 && choices) return;
    i++;
    if (i >= lines.length) { cleanup(); done?.(); } else render();
  };
  const key = (e: KeyboardEvent) => {
    if ([' ', 'enter', 'e', 'z'].includes(e.key.toLowerCase())) { e.preventDefault(); e.stopImmediatePropagation(); advance(); }
  };
  const cleanup = () => { box.remove(); window.removeEventListener('keydown', key, true); if (typing) clearInterval(typing); };
  box.addEventListener('pointerdown', e => { if ((e.target as HTMLElement).closest('.choice')) return; e.preventDefault(); advance(); });
  window.addEventListener('keydown', key, true);
  render();
  return { advance };
}

export function confetti(n = 60) {
  const cols = ['#8e7dff', '#4aa8ff', '#49c27d', '#f0b429', '#ef6b8f', '#ff8c42', '#9b59b6'];
  for (let i = 0; i < n; i++) {
    const p = h('div', { class: 'confetti' });
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = cols[(Math.random() * cols.length) | 0];
    p.style.animationDuration = 2 + Math.random() * 1.5 + 's';
    p.style.animationDelay = Math.random() * 0.3 + 's';
    ui.appendChild(p);
    setTimeout(() => p.remove(), 4200);
  }
}

export function fade(mid: () => void) {
  const f = h('div', { class: 'fader' });
  ui.appendChild(f);
  setTimeout(() => { mid(); f.classList.add('out'); setTimeout(() => f.remove(), 450); }, 380);
}
