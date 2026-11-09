/* aurora.js — soft moving color blobs behind the page. Drawn at low resolution; CSS blur smooths it. */
(function () {
  window.SW = window.SW || {};

  SW.aurora = {
    start() {
      const c = document.getElementById('aurora-canvas');
      const x = c.getContext('2d');
      const SCALE = 0.125;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#C6FF3D';
      const blobs = [
        { c: accent, a: 0.35, r: 0.42, sx: 0.00011, sy: 0.00007, ox: 0.25, oy: 0.2 },
        { c: '#1FA2FF', a: 0.18, r: 0.38, sx: 0.00008, sy: 0.00012, ox: 0.8, oy: 0.35 },
        { c: '#4DFFB5', a: 0.14, r: 0.34, sx: 0.00013, sy: 0.00009, ox: 0.55, oy: 0.85 },
        { c: '#9B7BFF', a: 0.12, r: 0.3, sx: 0.00006, sy: 0.0001, ox: 0.1, oy: 0.75 }
      ];

      function resize() {
        c.width = Math.max(32, Math.round(innerWidth * SCALE));
        c.height = Math.max(32, Math.round(innerHeight * SCALE));
      }
      resize();
      addEventListener('resize', resize);

      function hexA(hex, a) {
        const h = hex.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
      }

      function frame(t) {
        if (!document.hidden) {
          const w = c.width, h = c.height;
          x.clearRect(0, 0, w, h);
          for (const b of blobs) {
            const px = (b.ox + Math.sin(t * b.sx) * 0.18) * w;
            const py = (b.oy + Math.cos(t * b.sy) * 0.15) * h;
            const r = b.r * Math.max(w, h);
            const g = x.createRadialGradient(px, py, 0, px, py, r);
            g.addColorStop(0, hexA(b.c, b.a));
            g.addColorStop(1, hexA(b.c, 0));
            x.fillStyle = g;
            x.fillRect(0, 0, w, h);
          }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  };
})();
