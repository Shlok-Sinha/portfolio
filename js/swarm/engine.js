/*
 * engine.js — orchestrates the swarm build.
 *
 * Phases:  scan -> build -> (tour scrolls the page section by section) -> idle roaming
 *
 * Per section: one agent draws the section frame (page goes grey), then layers are built.
 * Per layer:   travel -> draw (crosshair, wireframe + size chip + layer name)
 *              -> grey block -> [drag into place, smart guides] -> [type text with I-beam]
 *              -> boxes wait for their children, then an agent comes back to paint them (color swatch).
 *
 * Time is virtual (st.now, ms) and advances by real dt * speed, so pause/speed affect everything.
 */
(function () {
  window.SW = window.SW || {};
  const Lr = () => SW.layers;

  const PALETTE = ['#C6FF3D', '#3DE0FF', '#FF5CA8', '#FFB020', '#9B7BFF', '#4DFFB5'];
  const SCAN_MS = 1500;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const st = {
    phase: 'scan', now: 0, speed: 1, paused: false, follow: true,
    tour: true, tourPref: true, tourIdle: 0, scrollAnim: null, tourDone: false, tourHold: 0,
    agents: [], groups: [], all: [], timers: [], guides: [],
    chrome: 0,            // fade 0..1 for rulers + layout guides
    scanEnd: 0, last: 0,
    mouse: { x: -9999, y: -9999, t: -1e9 }
  };

  const E = SW.engine = { state: st };

  function after(ms, fn) { st.timers.push({ at: st.now + ms, fn }); }

  function runTimers() {
    if (!st.timers.length) return;
    const due = st.timers.filter(t => t.at <= st.now);
    if (!due.length) return;
    st.timers = st.timers.filter(t => t.at > st.now);
    due.forEach(t => t.fn());
  }

  /* ---------------- setup ---------------- */
  E.init = function (opts) {
    opts = opts || {};
    // reduced motion: full build + tour still play, but agents settle instead of roaming afterwards
    if (opts.calm) st.calm = true;
    SW.overlay.init();
    const { groups, all } = Lr().collect();
    st.groups = groups;
    st.all = all;

    const n = innerWidth < 700 ? 6 : 12;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.max(innerWidth, innerHeight) * (0.55 + Math.random() * 0.2);
      st.agents.push(new SW.Agent(i, PALETTE[i % PALETTE.length], cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }

    // Build sections as they scroll into view
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        const g = st.groups.find(x => x.el === en.target);
        if (!g) continue;
        g.visible = en.isIntersecting;
        if (en.isIntersecting && st.phase !== 'scan') activate(g);
      }
    }, { threshold: 0.08 });
    st.groups.forEach(g => io.observe(g.el));

    addEventListener('pointermove', e => { st.mouse.x = e.clientX; st.mouse.y = e.clientY; st.mouse.t = st.now; }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { st.mouse.x = -9999; st.mouse.t = -1e9; });

    // Manual scrolling only pauses the tour briefly; it picks up again on its own
    const stopTour = () => { st.scrollAnim = null; st.tourHold = st.now + 2500; st.tourIdle = 0; };
    addEventListener('wheel', stopTour, { passive: true });
    addEventListener('touchmove', stopTour, { passive: true });
    addEventListener('keydown', e => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) stopTour();
    });
    document.addEventListener('click', e => { if (e.target.closest('a[href^="#"]')) stopTour(); });

    SW.hud.init(E);
    startScan();
    st.last = performance.now();
    requestAnimationFrame(frame);
  };

  function startScan() {
    st.phase = 'scan';
    st.scanEnd = st.now + SCAN_MS;
    document.getElementById('boot').classList.remove('gone');
  }

  function startBuild() {
    st.phase = 'build';
    document.getElementById('boot').classList.add('gone');
    st.groups.forEach(g => { if (g.id === 'dock' || g.id === 'hero' || g.visible) activate(g); });
  }

  function activate(g) {
    if (g.state !== 'pending') return;
    g.state = 'building';
  }

  /* ---------------- main loop ---------------- */
  function frame(ts) {
    const rdt = Math.min(0.05, Math.max(0, (ts - st.last) / 1000));
    st.last = ts;
    const dt = st.paused || document.hidden ? 0 : rdt * st.speed;
    st.now += dt * 1000;

    runTimers();
    if (dt > 0) update(dt);
    const busy = st.phase === 'scan' || st.groups.some(g => g.state === 'building') || !!st.scrollAnim;
    st.chrome += ((busy ? 1 : 0) - st.chrome) * Math.min(1, rdt * 4);
    draw();
    SW.hud.update(st);
    requestAnimationFrame(frame);
  }

  function update(dt) {
    if (st.phase === 'scan') {
      const cx = innerWidth / 2, cy = innerHeight / 2;
      for (const a of st.agents) {
        a.orbit.a += a.orbit.w * dt;
        a.tx = cx + Math.cos(a.orbit.a) * a.orbit.r;
        a.ty = cy + Math.sin(a.orbit.a) * a.orbit.r * 0.75;
        a.steer(dt, 30, 9);
      }
      if (st.now >= st.scanEnd && (!document.fonts || document.fonts.status === 'loaded' || st.now > st.scanEnd + 1500)) startBuild();
      return;
    }

    const building = st.groups.some(g => g.state === 'building');
    for (const a of st.agents) {
      if (a.mode === 'roam') {
        if (building && st.now >= a.nextPick) {
          const L = pick(a);
          if (L) claim(a, L);
          else a.nextPick = st.now + 120;
        }
        if (a.mode === 'roam') { roam(a, dt); continue; }
      }
      work(a, dt);
    }
    st.guides = st.guides.filter(g => g.until > st.now);
    tour(dt);
  }

  /* ---------------- scheduling ---------------- */
  function parentReady(L) {
    return !L.parent || Lr().READY_FOR_CHILDREN.has(L.parent.state);
  }

  function onScreen(r) {
    return !(r.bottom < 30 || r.top > innerHeight - 30);
  }

  function pick(a) {
    for (const g of st.groups) {
      if (g.state !== 'building') continue;
      let best = null, bd = Infinity, seen = 0;
      for (const L of g.layers) {
        const paintJob = L.state === 'blocked' && L.paintReady && !L.paintQueued && L.kind !== 'frame';
        if (!paintJob && (L.state !== 'pending' || !parentReady(L))) continue;
        const r = L.el.getBoundingClientRect();
        if (!paintJob) {
          if (r.width < 1 || r.height < 1) { instantDone(L); continue; }               // hidden (filtered / mobile)
          if (r.left > innerWidth + 40 || r.right < -40) { instantDone(L); continue; } // off to the side (marquee)
        }
        if (!onScreen(r)) continue;                                                     // wait for scroll / tour
        let d = Math.hypot(r.left - a.x, r.top - a.y) + seen * 50;
        if (paintJob) d -= 400;                                                         // finish what's started first
        if (d < bd) { bd = d; best = L; }
        if (++seen >= 10) break;
      }
      if (best) return best;
    }
    return null;
  }

  function claim(a, L) {
    a.job = L;
    a.jobStart = st.now;
    if (L.state === 'blocked') {          // paint job
      L.paintQueued = true;
      a.mode = 'travel';
      a.task = 'paint';
      a.action = 'painting';
      return;
    }
    L.state = 'claimed';
    a.mode = 'travel';
    a.task = 'build';
    a.action = 'moving';
    if (L.drag) {
      // start the element somewhere off its slot; it gets dragged home after it's drawn
      const dx = (Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 90);
      const dy = (Math.random() - 0.3) * 70;
      L.off = { x: dx, y: dy };
      L.cur = { x: dx, y: dy };
      L.el.style.translate = dx + 'px ' + dy + 'px';
    }
  }

  function instantDone(L) {
    L.state = Lr().isText(L) ? 'done' : 'painted';
    if (L.off) { L.el.style.translate = ''; L.off = null; }
    Lr().setClass(L, 'bs-done');
    (L.chars || []).forEach(c => c.classList.add('on'));
    checkUp(L.parent);
    checkGroup(L.group);
  }

  /** Visible part of a rect (frames can be taller than the screen). */
  function clipToView(r) {
    const top = Math.max(r.top, SW.overlay.RULER + 6), bottom = Math.min(r.bottom, innerHeight - 6);
    return { left: r.left, right: r.right, width: r.width, top, bottom: Math.max(top, bottom), height: Math.max(0, bottom - top) };
  }

  function addGuides(r) {
    const until = st.now + 420;
    // short snap lines near the element only, and never more than a few on screen
    if (st.guides.length >= 4) return;
    st.guides.push({ axis: 'v', pos: r.left, from: r.top - 90, to: r.bottom + 90, until, marks: [[r.left, r.top], [r.left, r.bottom]] });
    st.guides.push({ axis: 'h', pos: r.top, from: r.left - 120, to: r.right + 120, until, marks: [[r.left, r.top], [r.right, r.top]] });
  }

  /* ---------------- per-agent work ---------------- */
  function work(a, dt) {
    const L = a.job;
    const raw = L.el.getBoundingClientRect();
    const r = L.kind === 'frame' ? clipToView(raw) : raw;

    switch (a.mode) {
      case 'travel': {
        if (a.task === 'paint') { a.tx = r.left + Math.min(r.width * 0.5, 60); a.ty = r.top + Math.min(r.height * 0.5, 24); }
        else { a.tx = r.left; a.ty = r.top; }
        a.steer(dt, 170, 22);
        if (Math.hypot(a.tx - a.x, a.ty - a.y) < 6 || st.now - a.jobStart > 1400) {
          a.snap(a.tx, a.ty);
          a.jobStart = st.now;
          if (a.task === 'paint') { a.mode = 'paint'; a.action = 'fill ' + (L.fill || ''); SW.audio.tick(); break; }
          a.mode = 'draw';
          a.action = 'drawing';
          L.state = 'wire';
          SW.audio.tick();
        }
        break;
      }
      case 'draw': {
        const base = L.kind === 'frame' ? 650 : 160 + (r.width + r.height) * 0.22;
        const dur = clamp(base, 200, L.kind === 'frame' ? 700 : 520);
        const p = easeInOut(Math.min(1, (st.now - a.jobStart) / dur));
        L.wire = p;
        a.snap(r.left + r.width * p, r.top + r.height * p);
        if (p >= 1) {
          L.wire = 1;
          L.chipUntil = st.now + 500;
          L.state = 'block';
          Lr().setClass(L, 'bs-block');
          if (L.kind === 'frame') L.group.el.classList.add('sec-building');
          if (L.kind !== 'frame' && !L.drag) addGuides(r);
          a.mode = 'hold';
          a.jobStart = st.now;
        }
        break;
      }
      case 'hold': {
        a.snap(r.right, r.bottom);
        if (st.now - a.jobStart > 110) {
          if (L.drag && L.off) {
            L.state = 'drag';
            a.mode = 'drag';
            a.action = 'placing';
            a.jobStart = st.now;
            a.grab = { x: Math.min(r.width * 0.5, 40), y: Math.min(r.height * 0.5, 16) };
          } else nextAfterBlock(a, L);
        }
        break;
      }
      case 'drag': {
        const dur = 520;
        const p = easeInOut(Math.min(1, (st.now - a.jobStart) / dur));
        const ox = L.off.x * (1 - p), oy = L.off.y * (1 - p);
        L.cur = { x: ox, y: oy };
        L.el.style.translate = ox.toFixed(1) + 'px ' + oy.toFixed(1) + 'px';
        a.snap(r.left + a.grab.x, r.top + a.grab.y);
        if (p >= 1) {
          L.el.style.translate = '';
          L.off = null;
          addGuides(L.el.getBoundingClientRect());
          SW.audio.tick();
          nextAfterBlock(a, L);
        }
        break;
      }
      case 'type': {
        const n = L.chars.length;
        const dur = clamp(n * 13, 160, 950);
        const p = Math.min(1, (st.now - a.jobStart) / dur);
        const k = Math.floor(p * n);
        if (k > L.revealed) {
          for (let i = L.revealed; i < k; i++) L.chars[i].classList.add('on');
          L.revealed = k;
          SW.audio.type();
        }
        const ch = L.chars[Math.max(0, L.revealed - 1)];
        const cr = ch.getBoundingClientRect();
        a.caretH = cr.height;
        a.snap(L.revealed ? cr.right + 2 : cr.left, cr.top + cr.height / 2);
        if (p >= 1) finishText(a, L);
        break;
      }
      case 'paint': {
        a.snap(r.left + Math.min(r.width * 0.5, 60), r.top + Math.min(r.height * 0.5, 24));
        if (st.now - a.jobStart > 300) {
          L.state = 'painted';
          Lr().setClass(L, 'bs-done');
          SW.audio.paint();
          a.release();
          checkUp(L.parent);
          checkGroup(L.group);
        }
        break;
      }
    }
  }

  function nextAfterBlock(a, L) {
    if (Lr().isText(L) && L.chars.length) {
      L.state = 'type';
      L.revealed = 0;
      Lr().setClass(L, 'bs-type');
      a.mode = 'type';
      a.action = 'typing';
      a.ibeam = true;
      a.jobStart = st.now;
    } else if (Lr().isText(L)) {
      finishText(a, L);
    } else {
      L.state = 'blocked';
      a.release();
      checkUp(L);
    }
  }

  function finishText(a, L) {
    (L.chars || []).forEach(c => c.classList.add('on'));
    L.revealed = (L.chars || []).length;
    L.state = 'done';
    Lr().setClass(L, 'bs-done');
    a.release();
    checkUp(L.parent);
    checkGroup(L.group);
  }

  /** Walk up: a blocked box whose children are all finished becomes a paint job. Frames paint themselves. */
  function checkUp(L) {
    for (let p = L; p; p = p.parent) {
      if (p.state !== 'blocked' || p.paintReady || !Lr().childrenDone(p)) continue;
      p.paintReady = true;
      if (p.kind === 'frame') {
        const target = p;
        after(250, () => {
          if (target.state !== 'blocked') return;
          target.state = 'painted';
          target.group.el.classList.remove('sec-building');
          target.group.el.classList.add('sec-done');
          checkGroup(target.group);
        });
      }
    }
    if (L) checkGroup(L.group);
  }

  function checkGroup(g) {
    if (g.state !== 'building') return;
    if (!g.layers.every(L => Lr().DONE.has(L.state))) return;
    g.state = 'done';
    g.el.classList.remove('sec-building');
    g.el.classList.add('sec-done');
    SW.audio.chord();
    if (g.id === 'hero') {
      document.body.classList.add('hero-painted');
      document.dispatchEvent(new Event('swarm:hero-done'));
    }
    if (st.groups.every(x => x.state === 'done')) {
      // Everything built: drop build styles so normal hover transitions apply.
      after(600, () => { if (st.groups.every(x => x.state === 'done')) document.documentElement.classList.remove('js-build'); });
    }
  }

  /* ---------------- tour: auto-scroll through the site ---------------- */
  function scrollTo(y) {
    const max = document.documentElement.scrollHeight - innerHeight;
    const to = clamp(y, 0, max);
    const from = window.scrollY;
    if (Math.abs(to - from) < 4) return false;
    st.scrollAnim = { from, to, start: st.now, dur: clamp(Math.abs(to - from) * 0.9, 500, 1500) };
    return true;
  }

  function tour(dt) {
    if (st.scrollAnim) {
      const s = st.scrollAnim;
      const p = Math.min(1, (st.now - s.start) / s.dur);
      window.scrollTo({ top: s.from + (s.to - s.from) * easeInOut(p), behavior: 'instant' });
      if (p >= 1) st.scrollAnim = null;
      return;
    }
    if (!st.tour || st.phase !== 'build' || st.tourDone || st.now < st.tourHold) return;
    // move on once most of the swarm has run out of on-screen work (don't wait for stragglers)
    const idle = st.agents.filter(a => a.mode === 'roam').length;
    if (idle < Math.ceil(st.agents.length * 0.6)) { st.tourIdle = 0; return; }
    st.tourIdle += dt * 1000;
    if (st.tourIdle < 300) return;
    st.tourIdle = 0;

    // 1) unfinished work in a section that's being built, but off screen
    for (const g of st.groups) {
      if (g.state !== 'building') continue;
      for (const L of g.layers) {
        const work = (L.state === 'pending' && parentReady(L)) || (L.state === 'blocked' && L.paintReady && L.kind !== 'frame');
        if (!work) continue;
        const r = L.el.getBoundingClientRect();
        if (onScreen(r)) continue;
        if (scrollTo(window.scrollY + r.top - innerHeight * 0.22)) return;
      }
    }
    // 2) next section that hasn't started, but only once nothing on screen is still waiting to start
    const waiting = st.groups.some(g => g.state === 'building' &&
      g.layers.some(L => L.state === 'pending' && onScreen(L.el.getBoundingClientRect())));
    if (waiting) return;
    const next = st.groups.find(g => g.state === 'pending');
    if (next) { scrollTo(window.scrollY + next.el.getBoundingClientRect().top - 40); return; }
    // 3) everything built: go back to the top and stop touring
    if (st.groups.every(g => g.state === 'done')) {
      st.tourDone = true;
      after(700, () => { if (st.tour) { scrollTo(0); st.tour = false; SW.hud.sync(st); } });
    }
  }

  /* ---------------- idle roaming ---------------- */
  function roam(a, dt) {
    const m = st.mouse;
    // build finished: the whole swarm trails the visitor's cursor in loose rings
    if (st.follow && m.x > -999 && st.groups.length && st.groups.every(g => g.state === 'done')) {
      const ring = 44 + (a.i % 5) * 16;
      a.followOffset.a += dt * (0.6 + (a.i % 4) * 0.25) * (a.i % 2 ? 1 : -1);
      a.tx = m.x + Math.cos(a.followOffset.a) * ring;
      a.ty = m.y + Math.sin(a.followOffset.a) * ring * 0.8;
      a.steer(dt, 9 + (a.i % 6) * 3, 5.5, 1800);
      return;
    }
    const mouseActive = st.follow && st.now - m.t < 2500 && m.x > -999;
    if (mouseActive && a.i < 4) {
      a.followOffset.a += dt * 1.2;
      a.tx = m.x + Math.cos(a.followOffset.a) * a.followOffset.r;
      a.ty = m.y + Math.sin(a.followOffset.a) * a.followOffset.r;
      a.steer(dt, 14, 6, 1400);
      return;
    }
    if (st.calm && !st.groups.some(g => g.state === 'building')) {
      a.tx = a.x; a.ty = a.y;
      a.steer(dt, 4, 6, 300);
      return;
    }
    if (st.now >= a.nextWander) {
      a.tx = 30 + Math.random() * (innerWidth - 60);
      a.ty = 70 + Math.random() * (innerHeight - 140);
      a.nextWander = st.now + 1400 + Math.random() * 2600;
    }
    if (m.x > -999) {
      const dx = a.x - m.x, dy = a.y - m.y, d = Math.hypot(dx, dy);
      if (d < 130 && d > 0.1) {
        a.tx = a.x + (dx / d) * 180;
        a.ty = a.y + (dy / d) * 180;
        a.nextWander = st.now + 600;
      }
    }
    a.steer(dt, 4, 3.2, 700);
  }

  /* ---------------- drawing ---------------- */
  function draw() {
    const O = SW.overlay;
    O.clear();

    // layout guides behind everything
    const maxw = Math.min(1240, innerWidth);
    const gut = innerWidth <= 640 ? 16 : 24;
    const left = (innerWidth - maxw) / 2 + gut, right = innerWidth - left;
    O.layoutGuides(st.chrome, left, right);

    const bands = [];
    for (const L of st.all) {
      const s = L.state;
      if (s !== 'wire' && s !== 'block' && s !== 'drag' && s !== 'blocked' && s !== 'type') continue;
      const raw = L.el.getBoundingClientRect();
      const fresh = s === 'wire' || st.now < L.chipUntil;
      if (L.kind === 'frame') {
        const r = s === 'wire' ? clipToView(raw) : raw;
        O.wire(r, s === 'wire' ? L.wire : 1, {
          alpha: fresh ? 0.95 : 0.35, thick: true, handles: fresh, chip: fresh, label: L.label
        });
        if (s === 'wire') bands.push({ axis: 'x', a: r.left, b: r.left + r.width * L.wire }, { axis: 'y', a: r.top, b: r.top + r.height * L.wire });
        continue;
      }
      const text = Lr().isText(L);
      if (s === 'drag' && L.off && L.cur) {
        // dashed target slot where the element will land
        const tx = raw.left - L.cur.x, ty = raw.top - L.cur.y;
        O.wire({ left: tx, top: ty, width: raw.width, height: raw.height, right: tx + raw.width, bottom: ty + raw.height }, 1, { alpha: 0.7, dashed: true, color: '#FF3D7F' });
      }
      // keep it readable: only big, non-text boxes get name tags / size chips
      const big = !text && raw.width >= 90 && raw.height >= 28;
      const hot = fresh || s === 'drag';
      O.wire(raw, s === 'wire' ? L.wire : 1, {
        alpha: hot ? (text ? 0.55 : 0.9) : (text ? 0.1 : 0.2),
        handles: hot && big,
        chip: hot && big,
        label: hot && big ? L.label : null
      });
      if (L.kind === 'image' && s !== 'wire') O.imageIcon(raw);
      if (s === 'wire') bands.push({ axis: 'x', a: raw.left, b: raw.left + raw.width * L.wire }, { axis: 'y', a: raw.top, b: raw.top + raw.height * L.wire });
    }

    for (const g of st.guides) O.smartGuide(g, Math.min(1, (g.until - st.now) / 200));
    O.rulers(st.chrome, bands);

    for (const a of st.agents) {
      // name tags on a few agents only, so the screen doesn't turn into a wall of labels
      const label = a.job && a.i % 3 === 0 ? a.name + ' · ' + a.action : null;
      if (a.ibeam) O.ibeam(a, a.caretH, label);
      else if (a.mode === 'draw' || a.mode === 'hold') O.crosshair(a, label);
      else if (a.mode === 'drag') O.moveCursor(a, label);
      else {
        O.cursor(a, label);
        if (a.mode === 'paint' && a.job && a.job.fill) O.swatch(a, a.job.fill);
      }
    }
  }

  /* ---------------- controls ---------------- */
  // test hook: advance the simulation by `dt` seconds without waiting for animation frames
  E.step = dt => { st.now += dt * 1000; runTimers(); update(dt); };
  E.togglePause = () => (st.paused = !st.paused);
  E.cycleSpeed = () => {
    const speeds = [1, 2, 4, 0.5];
    st.speed = speeds[(speeds.indexOf(st.speed) + 1) % speeds.length];
    return st.speed;
  };
  E.toggleFollow = () => (st.follow = !st.follow);
  E.toggleTour = () => {
    st.tour = !st.tour;
    st.tourPref = st.tour;
    st.tourDone = false;
    if (!st.tour) st.scrollAnim = null;
    return st.tour;
  };

  function clearDrag(L) { if (L.off || L.el.style.translate) { L.el.style.translate = ''; L.off = null; L.cur = null; } }

  E.skip = function () {
    st.timers = [];
    st.scrollAnim = null;
    st.tour = false;
    st.agents.forEach(a => a.release());
    for (const L of st.all) {
      clearDrag(L);
      L.state = Lr().isText(L) ? 'done' : 'painted';
      L.wire = 1;
      Lr().setClass(L, 'bs-done');
      (L.chars || []).forEach(c => c.classList.add('on'));
    }
    st.groups.forEach(g => { g.state = 'done'; g.el.classList.remove('sec-building'); g.el.classList.add('sec-done'); });
    st.phase = 'build';
    document.getElementById('boot').classList.add('gone');
    const heroWasDone = document.body.classList.contains('hero-painted');
    document.body.classList.add('hero-painted');
    document.documentElement.classList.remove('js-build');
    if (!heroWasDone) document.dispatchEvent(new Event('swarm:hero-done'));
    SW.hud.sync(st);
  };

  E.replay = function () {
    st.timers = [];
    st.guides = [];
    st.scrollAnim = null;
    document.dispatchEvent(new Event('swarm:replay'));
    document.documentElement.classList.add('js-build');
    document.body.classList.remove('hero-painted');
    for (const L of st.all) {
      clearDrag(L);
      L.state = 'pending'; L.wire = 0; L.revealed = 0; L.paintReady = false; L.paintQueued = false; L.chipUntil = 0;
      Lr().setClass(L, null);
      if (L.chars) L.chars = SW.typer.reset(L.el);
    }
    st.groups.forEach(g => { g.state = 'pending'; g.el.classList.remove('sec-building', 'sec-done'); });
    st.agents.forEach(a => a.release());
    st.paused = false;
    st.tour = st.tourPref;
    st.tourDone = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    SW.hud.sync(st);
    startScan();
  };
})();
