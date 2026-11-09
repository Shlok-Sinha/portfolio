/* typer.js — splits a text layer into per-character spans so it can be "typed". */
(function () {
  window.SW = window.SW || {};

  SW.typer = {
    /** Wrap every visible char of el's own text in <span class="ch">. Returns the span list. */
    wrap(el) {
      if (el._chars) return el._chars;
      if (el._orig == null) el._orig = el.innerHTML;
      const chars = [];
      const nodes = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        // skip text belonging to a nested layer (shouldn't happen, but be safe)
        if (n.parentElement.closest('[data-layer]') !== el) continue;
        nodes.push(n);
      }
      for (const node of nodes) {
        const txt = node.nodeValue;
        if (!txt.trim()) continue;
        const frag = document.createDocumentFragment();
        for (const c of txt) {
          if (/\s/.test(c)) {
            frag.appendChild(document.createTextNode(c));
          } else {
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            frag.appendChild(s);
            chars.push(s);
          }
        }
        node.parentNode.replaceChild(frag, node);
      }
      el._chars = chars;
      return chars;
    },

    /** Hide all chars again. If something rewrote the text (el._dirty), restore and re-wrap it. */
    reset(el) {
      if (el._dirty && el._orig != null) {
        el.innerHTML = el._orig;
        el._chars = null;
        el._dirty = false;
        return this.wrap(el);
      }
      (el._chars || []).forEach(s => s.classList.remove('on'));
      return el._chars;
    }
  };
})();
