/*
 * hero-fx.js — effects that start once the hero has been built:
 *   - role line types through content.hero.roles
 *   - stat numbers count up
 * The swarm engine fires `swarm:hero-done` and `swarm:replay` on document.
 * Elements changed here are flagged `_dirty` so typer.reset() restores them on replay.
 */
(function () {
  window.SW = window.SW || {};

  let timers = [];
  let gen = 0;   // bumps on every stop so in-flight animation frames bail out
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const stopAll = () => { timers.forEach(clearTimeout); timers = []; gen++; };

  function rotateRoles() {
    const el = document.querySelector('.role-text[data-roles]');
    if (!el) return;
    const roles = JSON.parse(el.dataset.roles).map(r => r.toUpperCase());
    if (roles.length < 2) return;
    el._dirty = true;
    el.classList.add('typing-caret');
    let i = 0;
    let text = el.textContent;

    const erase = () => {
      if (text.length) {
        text = text.slice(0, -1);
        el.textContent = text;
        later(erase, 28);
      } else {
        i = (i + 1) % roles.length;
        later(type, 180);
      }
    };
    const type = () => {
      const target = roles[i];
      if (text.length < target.length) {
        text = target.slice(0, text.length + 1);
        el.textContent = text;
        later(type, 55);
      } else {
        later(erase, 2200);
      }
    };
    later(erase, 2400);
  }

  function countUp() {
    document.querySelectorAll('.stat-v[data-count]').forEach(el => {
      const m = /^(\d+)(.*)$/.exec(el.dataset.count);
      if (!m) return;
      const end = parseInt(m[1], 10), suffix = m[2];
      if (end === 0) return;
      el._dirty = true;
      const t0 = performance.now(), dur = 1100, myGen = gen;
      const step = (t) => {
        if (myGen !== gen) return;
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = '0' + suffix;
      requestAnimationFrame(step);
    });
  }

  document.addEventListener('swarm:hero-done', () => {
    stopAll();
    countUp();
    rotateRoles();
  });

  document.addEventListener('swarm:replay', () => {
    stopAll();
    const el = document.querySelector('.role-text');
    if (el) el.classList.remove('typing-caret');
  });
})();
