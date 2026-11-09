/*
 * overlay.js — everything the swarm draws on one fixed canvas:
 * rulers, layout guides, smart guides, wireframes + handles + size chips + layer names,
 * image placeholders, color swatches, and the agent cursors (arrow / crosshair / I-beam / move).
 */
(function () {
  window.SW = window.SW || {};

  const WIRE = '#3B8CFF';
  const GUIDE = '#FF3D7F';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const RULER = 18;

  SW.overlay = {
    RULER,

    init() {
      this.c = document.getElementById('swarm-canvas');
      this.ctx = this.c.getContext('2d');
      this.resize();
      addEventListener('resize', () => this.resize());
    },

    resize() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = d;
      this.w = innerWidth; this.h = innerHeight;
      this.c.width = Math.round(this.w * d);
      this.c.height = Math.round(this.h * d);
      this.c.style.width = this.w + 'px';
      this.c.style.height = this.h + 'px';
    },

    clear() {
      const x = this.ctx;
      x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      x.clearRect(0, 0, this.w, this.h);
    },

    visible(r) {
      return r.bottom > -20 && r.top < this.h + 20 && r.right > -20 && r.left < this.w + 20;
    },

    /* ---------------- page furniture ---------------- */

    /** Figma-style rulers along the top and left edge. bands = [{a,b,axis}] highlighted ranges. */
    rulers(alpha, bands) {
      if (alpha <= 0.01) return;
      const x = this.ctx, W = this.w, H = this.h, sy = window.scrollY;
      x.save();
      x.globalAlpha = alpha;
      x.fillStyle = 'rgba(12,12,15,.94)';
      x.fillRect(0, 0, W, RULER);
      x.fillRect(0, 0, RULER, H);

      // highlighted ranges of the selection being drawn
      x.fillStyle = 'rgba(59,140,255,.28)';
      for (const b of bands) {
        if (b.axis === 'x') x.fillRect(b.a, 0, b.b - b.a, RULER);
        else x.fillRect(0, b.a, RULER, b.b - b.a);
      }

      x.strokeStyle = 'rgba(255,255,255,.22)';
      x.fillStyle = 'rgba(255,255,255,.45)';
      x.lineWidth = 1;
      x.font = '500 8px ' + MONO;
      x.textBaseline = 'top';
      x.beginPath();
      for (let px = 0; px < W; px += 10) {
        const len = px % 100 === 0 ? RULER : px % 50 === 0 ? 8 : 4;
        x.moveTo(px + 0.5, RULER - len); x.lineTo(px + 0.5, RULER);
      }
      const start = Math.floor(sy / 10) * 10;
      for (let py = start; py < sy + H; py += 10) {
        const vy = py - sy;
        const len = py % 100 === 0 ? RULER : py % 50 === 0 ? 8 : 4;
        x.moveTo(RULER - len, vy + 0.5); x.lineTo(RULER, vy + 0.5);
      }
      x.stroke();
      for (let px = 100; px < W; px += 100) x.fillText(String(px), px + 3, 2);
      x.save();
      for (let py = Math.ceil(sy / 100) * 100; py < sy + H; py += 100) {
        const vy = py - sy;
        if (vy < RULER + 4) continue;
        x.save();
        x.translate(2, vy + 3);
        x.rotate(Math.PI / 2);
        x.fillText(String(py), 0, -9);
        x.restore();
      }
      x.restore();
      x.strokeStyle = 'rgba(255,255,255,.12)';
      x.beginPath();
      x.moveTo(0, RULER + 0.5); x.lineTo(W, RULER + 0.5);
      x.moveTo(RULER + 0.5, 0); x.lineTo(RULER + 0.5, H);
      x.stroke();
      x.fillStyle = 'rgba(12,12,15,1)';
      x.fillRect(0, 0, RULER, RULER);
      x.restore();
    },

    /** Column guides: content edges (red) and center (dashed blue). */
    layoutGuides(alpha, left, right) {
      if (alpha <= 0.01) return;
      const x = this.ctx;
      x.save();
      x.globalAlpha = alpha * 0.55;
      x.lineWidth = 1;
      x.strokeStyle = 'rgba(255,61,127,.55)';
      x.beginPath();
      x.moveTo(Math.round(left) + 0.5, RULER); x.lineTo(Math.round(left) + 0.5, this.h);
      x.moveTo(Math.round(right) + 0.5, RULER); x.lineTo(Math.round(right) + 0.5, this.h);
      x.stroke();
      x.strokeStyle = 'rgba(59,140,255,.6)';
      x.setLineDash([4, 6]);
      x.beginPath();
      const cx = Math.round(this.w / 2) + 0.5;
      x.moveTo(cx, RULER); x.lineTo(cx, this.h);
      x.stroke();
      x.restore();
    },

    /** Magenta snapping lines that flash when something is placed. */
    smartGuide(g, alpha) {
      const x = this.ctx;
      x.save();
      x.globalAlpha = alpha;
      x.strokeStyle = GUIDE;
      x.lineWidth = 1;
      x.beginPath();
      const a0 = g.from != null ? g.from : RULER, a1 = g.to != null ? g.to : (g.axis === 'v' ? this.h : this.w);
      if (g.axis === 'v') { x.moveTo(Math.round(g.pos) + 0.5, Math.max(RULER, a0)); x.lineTo(Math.round(g.pos) + 0.5, a1); }
      else { x.moveTo(Math.max(RULER, a0), Math.round(g.pos) + 0.5); x.lineTo(a1, Math.round(g.pos) + 0.5); }
      x.stroke();
      // little x markers where the line touches the element
      if (g.marks) {
        x.lineWidth = 1.2;
        for (const [mx, my] of g.marks) {
          x.beginPath();
          x.moveTo(mx - 3, my - 3); x.lineTo(mx + 3, my + 3);
          x.moveTo(mx + 3, my - 3); x.lineTo(mx - 3, my + 3);
          x.stroke();
        }
      }
      x.restore();
    },

    /* ---------------- layers ---------------- */

    /** Wireframe rect dragged out to progress p (0..1). */
    wire(r, p, opts) {
      if (!this.visible(r)) return;
      const x = this.ctx;
      const w = r.width * p, h = r.height * p;
      const alpha = opts.alpha;
      x.save();
      x.globalAlpha = alpha;
      x.strokeStyle = opts.color || WIRE;
      x.lineWidth = opts.thick ? 1.5 : 1;
      if (opts.dashed) x.setLineDash([5, 4]);
      x.strokeRect(Math.round(r.left) + 0.5, Math.round(r.top) + 0.5, Math.round(w), Math.round(h));
      x.setLineDash([]);
      if (opts.handles) {
        const pts = [[r.left, r.top], [r.left + w, r.top], [r.left, r.top + h], [r.left + w, r.top + h]];
        if (w > 60) pts.push([r.left + w / 2, r.top], [r.left + w / 2, r.top + h]);
        if (h > 60) pts.push([r.left, r.top + h / 2], [r.left + w, r.top + h / 2]);
        x.fillStyle = '#fff';
        for (const [px, py] of pts) {
          x.fillRect(Math.round(px) - 2.5, Math.round(py) - 2.5, 5, 5);
          x.strokeRect(Math.round(px) - 2.5, Math.round(py) - 2.5, 5, 5);
        }
      }
      if (opts.label) {
        x.font = '600 9px ' + MONO;
        x.fillStyle = opts.color || WIRE;
        x.textBaseline = 'bottom';
        const ly = Math.max(RULER + 12, r.top - 3);
        x.fillText(opts.label, Math.max(RULER + 4, r.left), ly);
      }
      if (opts.chip) {
        const label = Math.round(w) + ' × ' + Math.round(h);
        x.font = '600 9px ' + MONO;
        const tw = x.measureText(label).width + 10;
        const cx = r.left + w / 2 - tw / 2;
        const cy = Math.min(r.top + h + 6, this.h - 40);
        x.fillStyle = opts.color || WIRE;
        this.roundRect(cx, cy, tw, 15, 3);
        x.fill();
        x.fillStyle = '#fff';
        x.textBaseline = 'middle';
        x.fillText(label, cx + 5, cy + 8);
      }
      x.restore();
    },

    /** Mountain + sun icon in an empty image box. */
    imageIcon(r) {
      if (!this.visible(r)) return;
      const x = this.ctx;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      x.save();
      x.globalAlpha = 0.5;
      x.strokeStyle = '#9a9aa5';
      x.lineWidth = 1.5;
      x.strokeRect(cx - 16, cy - 12, 32, 24);
      x.beginPath();
      x.moveTo(cx - 14, cy + 10); x.lineTo(cx - 4, cy); x.lineTo(cx + 3, cy + 6); x.lineTo(cx + 8, cy + 2); x.lineTo(cx + 14, cy + 10);
      x.stroke();
      x.beginPath(); x.arc(cx + 7, cy - 5, 3, 0, Math.PI * 2); x.stroke();
      x.restore();
    },

    /** Little color-picker popup next to an agent: swatch + hex. */
    swatch(a, hex) {
      const x = this.ctx;
      x.save();
      x.translate(a.x + 14, a.y - 30);
      x.font = '600 9px ' + MONO;
      const tw = x.measureText(hex).width;
      x.fillStyle = 'rgba(14,14,17,.95)';
      x.strokeStyle = 'rgba(255,255,255,.15)';
      this.roundRect(0, 0, tw + 30, 20, 5);
      x.fill(); x.stroke();
      x.fillStyle = hex;
      this.roundRect(5, 5, 10, 10, 2);
      x.fill();
      x.strokeStyle = 'rgba(255,255,255,.4)';
      x.stroke();
      x.fillStyle = '#e8e8ec';
      x.textBaseline = 'middle';
      x.fillText(hex, 20, 10.5);
      x.restore();
    },

    /* ---------------- cursors ---------------- */

    /** Soft drop shadow used under every cursor shape. */
    shadow(on) {
      const x = this.ctx;
      x.shadowColor = on ? 'rgba(0,0,0,.45)' : 'transparent';
      x.shadowBlur = on ? 6 : 0;
      x.shadowOffsetY = on ? 2 : 0;
    },

    /** Figma-style pointer: colored body, white rim, soft shadow, leans into its motion. */
    cursor(a, label) {
      const x = this.ctx;
      x.save();
      x.translate(a.x, a.y);
      const lean = Math.max(-0.22, Math.min(0.22, (a.vx || 0) / 2600));
      x.save();
      x.rotate(lean);
      if (!this.arrow) {
        this.arrow = new Path2D('M1.5 1.2 C1.5 0.4 2.4 0 3 .5 L17.6 12.6 C18.3 13.2 17.9 14.3 17 14.3 L10.4 14.4 L14 21.6 C14.3 22.2 14 22.9 13.4 23.1 L11.5 23.9 C10.9 24.2 10.2 23.9 9.9 23.3 L6.5 16.1 L2.9 19.6 C2.3 20.2 1.5 19.8 1.5 19 Z');
      }
      this.shadow(true);
      x.fillStyle = a.color;
      x.fill(this.arrow);
      this.shadow(false);
      x.lineJoin = 'round';
      x.strokeStyle = '#fff';
      x.lineWidth = 1.6;
      x.stroke(this.arrow);
      // inner sheen so the colour reads on any background
      x.globalAlpha = 0.25;
      x.fillStyle = '#fff';
      x.beginPath(); x.moveTo(3, 3.5); x.lineTo(3, 12); x.lineTo(9, 8.5); x.closePath(); x.fill();
      x.restore();
      if (label) this.tag(a, label, 16, 22);
      x.restore();
    },

    crosshair(a, label) {
      const x = this.ctx;
      x.save();
      x.translate(a.x, a.y);
      const seg = () => {
        x.beginPath();
        x.moveTo(-10, 0); x.lineTo(-3, 0); x.moveTo(3, 0); x.lineTo(10, 0);
        x.moveTo(0, -10); x.lineTo(0, -3); x.moveTo(0, 3); x.lineTo(0, 10);
        x.stroke();
      };
      x.lineCap = 'round';
      this.shadow(true);
      x.strokeStyle = '#fff'; x.lineWidth = 4; seg();
      this.shadow(false);
      x.strokeStyle = a.color; x.lineWidth = 2; seg();
      x.fillStyle = a.color;
      x.beginPath(); x.arc(0, 0, 1.6, 0, Math.PI * 2); x.fill();
      if (label) this.tag(a, label, 12, 12);
      x.restore();
    },

    moveCursor(a, label) {
      const x = this.ctx;
      x.save();
      x.translate(a.x, a.y);
      const arrows = () => {
        x.beginPath();
        x.moveTo(-10, 0); x.lineTo(10, 0); x.moveTo(0, -10); x.lineTo(0, 10);
        x.moveTo(-10, 0); x.lineTo(-6.5, -3.5); x.moveTo(-10, 0); x.lineTo(-6.5, 3.5);
        x.moveTo(10, 0); x.lineTo(6.5, -3.5); x.moveTo(10, 0); x.lineTo(6.5, 3.5);
        x.moveTo(0, -10); x.lineTo(-3.5, -6.5); x.moveTo(0, -10); x.lineTo(3.5, -6.5);
        x.moveTo(0, 10); x.lineTo(-3.5, 6.5); x.moveTo(0, 10); x.lineTo(3.5, 6.5);
        x.stroke();
      };
      x.lineCap = 'round'; x.lineJoin = 'round';
      this.shadow(true);
      x.strokeStyle = '#fff'; x.lineWidth = 4.5; arrows();
      this.shadow(false);
      x.strokeStyle = a.color; x.lineWidth = 2; arrows();
      if (label) this.tag(a, label, 13, 13);
      x.restore();
    },

    ibeam(a, h, label) {
      const x = this.ctx;
      const hh = Math.max(12, Math.min(h || 18, 60));
      x.save();
      x.translate(a.x, a.y);
      x.lineCap = 'round';
      this.shadow(true);
      x.strokeStyle = '#fff';
      x.lineWidth = 4;
      this.ibeamPath(hh); x.stroke();
      this.shadow(false);
      x.strokeStyle = a.color;
      x.lineWidth = 2;
      this.ibeamPath(hh); x.stroke();
      if (label) this.tag(a, label, 8, hh / 2 + 4);
      x.restore();
    },

    ibeamPath(hh) {
      const x = this.ctx, half = hh / 2;
      x.beginPath();
      x.moveTo(-3.5, -half); x.quadraticCurveTo(0, -half + 1, 0, -half + 3);
      x.quadraticCurveTo(0, -half + 1, 3.5, -half);
      x.moveTo(0, -half + 3); x.lineTo(0, half - 3);
      x.moveTo(-3.5, half); x.quadraticCurveTo(0, half - 1, 0, half - 3);
      x.quadraticCurveTo(0, half - 1, 3.5, half);
    },

    /** Name pill next to a cursor, multiplayer-style. */
    tag(a, text, ox, oy) {
      const x = this.ctx;
      x.font = '600 10px Inter, system-ui, sans-serif';
      const tw = x.measureText(text).width + 14;
      this.shadow(true);
      x.fillStyle = a.color;
      this.roundRect(ox, oy, tw, 18, 9);
      x.fill();
      this.shadow(false);
      x.fillStyle = '#0B0B0B';
      x.textBaseline = 'middle';
      x.fillText(text, ox + 7, oy + 9.5);
    },

    roundRect(x0, y0, w, h, r) {
      const x = this.ctx;
      x.beginPath();
      x.moveTo(x0 + r, y0);
      x.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
      x.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
      x.arcTo(x0, y0 + h, x0, y0, r);
      x.arcTo(x0, y0, x0 + w, y0, r);
      x.closePath();
    }
  };
})();
