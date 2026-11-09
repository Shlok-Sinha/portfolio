/*
 * layers.js — collects build groups ([data-section]) and their layers ([data-layer]).
 * Every section (except the dock) also gets a synthetic "frame" layer: an agent draws the whole
 * section's frame first, and every top-level layer in it waits for that frame.
 */
(function () {
  window.SW = window.SW || {};

  const DONE = new Set(['done', 'painted']);
  const READY_FOR_CHILDREN = new Set(['block', 'drag', 'blocked', 'type', 'done', 'painted']);
  // boxes that get grabbed and dragged into place after they're drawn
  const DRAG_SEL = '.feat, .stat, .hero-photo, .float-chip, .proj, .stack-card, .tl-item, .email-btn, .hero-name, .btn';

  function hex(c) {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return null;
    const p = m[1].split(',').map(s => parseFloat(s));
    if (p.length === 4 && p[3] < 0.05) return null;
    return '#' + p.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function labelFor(el, kind) {
    const cls = typeof el.className === 'string' ? el.className.split(' ').filter(c => c && !c.startsWith('bs-') && !c.startsWith('sec-'))[0] : '';
    if (kind === 'text' || kind === 'headline') return 'T  ' + (cls || el.tagName.toLowerCase());
    if (kind === 'image') return '▣ ' + (cls || 'image');
    return '#  ' + el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  }

  function makeLayer(el, kind, g) {
    return {
      el, kind, group: g,
      state: 'pending',   // pending | claimed | wire | block | drag | blocked | type | done | painted
      wire: 0, chipUntil: 0, revealed: 0,
      paintReady: false, paintQueued: false,
      parent: null, children: [], chars: null,
      label: kind === 'frame' ? 'Section · ' + g.id : labelFor(el, kind),
      fill: null, drag: false, off: null
    };
  }

  SW.layers = {
    DONE, READY_FOR_CHILDREN,

    collect() {
      const groups = [...document.querySelectorAll('[data-section]')].map((el, i) => ({
        id: el.dataset.section, el, index: i, layers: [], state: 'pending', visible: false, frame: null
      }));
      const map = new Map();

      for (const g of groups) {
        if (g.id !== 'dock') {
          g.frame = makeLayer(g.el, 'frame', g);
          g.layers.push(g.frame);
        }
        g.el.querySelectorAll('[data-layer]').forEach(el => {
          const L = makeLayer(el, el.dataset.layer, g);
          // read final colors now, before any build state hides them
          const cs = getComputedStyle(el);
          L.fill = hex(cs.backgroundColor) || hex(cs.borderTopColor) || hex(cs.color);
          L.drag = L.kind === 'box' && el.matches(DRAG_SEL);
          map.set(el, L);
          g.layers.push(L);
        });
      }

      map.forEach(L => {
        const p = L.el.parentElement && L.el.parentElement.closest('[data-layer]');
        if (p && map.has(p) && map.get(p).group === L.group) {
          L.parent = map.get(p);
        } else if (L.group.frame) {
          L.parent = L.group.frame;
        }
        if (L.parent) L.parent.children.push(L);
        if (L.kind === 'text' || L.kind === 'headline') L.chars = SW.typer.wrap(L.el);
      });

      return { groups, all: groups.flatMap(g => g.layers) };
    },

    isText(L) { return L.kind === 'text' || L.kind === 'headline'; },

    isComplete(L) { return L.state === 'blocked' || DONE.has(L.state); },

    childrenDone(L) { return L.children.every(c => DONE.has(c.state)); },

    setClass(L, cls) {
      if (L.kind === 'frame') return;
      L.el.classList.remove('bs-block', 'bs-type', 'bs-done');
      if (cls) L.el.classList.add(cls);
    }
  };
})();
