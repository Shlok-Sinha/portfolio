/* agent.js — one swarm cursor. Positions are in viewport (CSS pixel) coordinates. */
(function () {
  window.SW = window.SW || {};

  SW.Agent = class Agent {
    constructor(i, color, x, y) {
      this.i = i;
      this.color = color;
      this.name = 'agent-' + String(i + 1).padStart(2, '0');
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.tx = x; this.ty = y;
      this.mode = 'roam';        // roam | travel | draw | hold | type
      this.job = null;           // layer being built
      this.jobStart = 0;
      this.nextWander = 0;
      this.nextPick = 0;
      this.ibeam = false;
      this.orbit = {
        r: 50 + Math.random() * 190,
        a: Math.random() * Math.PI * 2,
        w: (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 1.6)
      };
      this.followOffset = { a: Math.random() * Math.PI * 2, r: 30 + Math.random() * 40 };
    }

    /** Damped spring toward (tx, ty). k = stiffness, c = damping. dt in seconds. */
    steer(dt, k, c, maxSpeed) {
      const ax = (this.tx - this.x) * k - this.vx * c;
      const ay = (this.ty - this.y) * k - this.vy * c;
      this.vx += ax * dt;
      this.vy += ay * dt;
      const sp = Math.hypot(this.vx, this.vy);
      const max = maxSpeed || 2600;
      if (sp > max) { this.vx *= max / sp; this.vy *= max / sp; }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    snap(x, y) { this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.tx = x; this.ty = y; }

    release() {
      this.mode = 'roam';
      this.job = null;
      this.ibeam = false;
      this.nextWander = 0;
      this.task = null;
      this.action = '';
    }
  };
})();
