/* hud.js — bottom control pill: status, progress, pause / speed / follow / sound / replay / skip. */
(function () {
  window.SW = window.SW || {};
  const $ = id => document.getElementById(id);

  SW.hud = {
    init(engine) {
      this.text = $('hud-text');
      this.fill = $('hud-bar-fill');
      this.lastText = '';
      this.nextUpdate = 0;
      $('hud-speed').textContent = engine.state.speed + '×';
      $('hud-follow').setAttribute('aria-pressed', String(engine.state.follow));
      this.sync(engine.state);
      $('hud-tour').addEventListener('click', () => { engine.toggleTour(); this.sync(engine.state); });

      $('hud-pause').addEventListener('click', e => {
        const paused = engine.togglePause();
        e.currentTarget.textContent = paused ? 'Play' : 'Pause';
        e.currentTarget.setAttribute('aria-label', paused ? 'Resume build' : 'Pause build');
      });
      $('hud-speed').addEventListener('click', e => {
        e.currentTarget.textContent = engine.cycleSpeed() + '×';
      });
      $('hud-follow').addEventListener('click', e => {
        e.currentTarget.setAttribute('aria-pressed', String(engine.toggleFollow()));
      });
      $('hud-sound').addEventListener('click', e => {
        const on = SW.audio.toggle();
        e.currentTarget.textContent = on ? 'Sound on' : 'Sound off';
        e.currentTarget.setAttribute('aria-pressed', String(on));
        if (on) SW.audio.tick();
      });
      $('hud-replay').addEventListener('click', () => {
        engine.replay();
        const p = $('hud-pause'); p.textContent = 'Pause';
      });
      $('hud-skip').addEventListener('click', () => engine.skip());
      $('hud-close').addEventListener('click', () => {
        $('hud').classList.add('hidden');
        $('hud-reopen').classList.add('show');
      });
      $('hud-reopen').addEventListener('click', () => {
        $('hud').classList.remove('hidden');
        $('hud-reopen').classList.remove('show');
      });
    },

    /** Reflect engine toggles (tour can switch itself off when the visitor scrolls). */
    sync(st) {
      const b = $('hud-tour');
      if (b) b.setAttribute('aria-pressed', String(!!st.tour));
    },

    update(st) {
      const t = performance.now();
      if (t < this.nextUpdate) return;
      this.nextUpdate = t + 100;

      const total = st.all.length;
      let done = 0;
      for (const L of st.all) if (SW.layers.isComplete(L)) done++;

      let status;
      if (st.phase === 'scan') status = 'Scanning page…';
      else if (st.paused) status = 'paused';
      else if (st.groups.every(g => g.state === 'done')) status = 'build complete ✓';
      else if (st.scrollAnim) status = 'touring…';
      else if (st.groups.some(g => g.state === 'building')) status = 'building…';
      else status = 'scroll to keep building';

      const msg = st.phase === 'scan'
        ? status
        : `${st.agents.length} agents · ${done} / ${total} layers · ${status}`;
      if (msg !== this.lastText) { this.text.textContent = msg; this.lastText = msg; }
      this.fill.style.width = (total ? (done / total) * 100 : 0) + '%';
    }
  };
})();
