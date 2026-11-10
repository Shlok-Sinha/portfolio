/*
 * render.js — turns window.CONTENT into DOM.
 *
 * Build rules the swarm relies on:
 *  - data-layer="box"      container drawn as a wireframe, then grey block, then painted.
 *                           A box must NOT hold bare text — wrap text in a text layer.
 *  - data-layer="text"     leaf text; typed in char by char. Must not contain other layers.
 *  - data-layer="headline" like text, for the giant outlined word.
 *  - data-layer="image"    an <img>; grey block, then revealed.
 *  - data-section="id"     a build group; built when scrolled into view.
 */
(function () {
  window.SW = window.SW || {};

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'L') el.dataset.layer = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return el;
  }
  // text layer helper
  const T = (tag, cls, text, extra) => h(tag, Object.assign({ class: cls, L: 'text' }, extra), text);
  const TH = (tag, cls, html) => h(tag, { class: cls, L: 'text', html });

  // "// 02.00 SEC_PROJECTS ———— INDEX [02 / 04]" strip at the top of each section
  function strip(n, id) {
    const nn = String(n).padStart(2, '0');
    return h('div', { class: 'sec-strip', 'aria-hidden': 'true' },
      T('span', 'strip-l', '// ' + nn + '.00 SEC_' + id.toUpperCase()),
      h('i', { class: 'strip-line' }),
      T('span', 'strip-r', 'INDEX [' + nn + ' / 04]')
    );
  }

  function sectionHead(s, n, id) {
    return h('div', { class: 'sec-head' },
      n ? strip(n, id) : null,
      T('p', 'eyebrow', s.eyebrow),
      T('h2', 'sec-title', s.title),
      s.subtitle ? T('p', 'sec-sub', s.subtitle) : null
    );
  }

  function renderDock(C) {
    const wrap = document.getElementById('dock-wrap');
    wrap.appendChild(
      h('nav', { class: 'dock', L: 'box', 'aria-label': 'Main' },
        h('a', { class: 'dock-logo', href: '#hero', L: 'box', 'aria-label': 'Home' }, T('span', '', C.brand.initials)),
        h('ul', { class: 'dock-links' },
          C.nav.map(n => h('li', null, h('a', { href: n.href, L: 'text' }, n.label)))
        ),
        C.available ? h('span', { class: 'dock-avail', L: 'box' }, h('i', { class: 'pulse' }), T('span', '', C.available)) : null,
        h('a', { class: 'dock-cta', href: C.navCta.href, L: 'text' }, C.navCta.label)
      )
    );
  }

  function renderHero(C) {
    const H = C.hero;
    const flag = (f, i) => h('article', { class: 'feat' + (i === 0 ? ' feat-main' : ''), L: 'box' },
      h('div', { class: 'feat-head' },
        T('span', 'feat-n', f.n),
        h('span', { class: 'badge' + (i === 0 ? ' badge-live' : ''), L: 'box' }, i === 0 ? h('i', { class: 'pulse' }) : null, T('span', '', f.badge))
      ),
      T('h3', 'feat-title', f.title),
      T('p', 'feat-desc', f.desc),
      f.tags ? h('div', { class: 'chips' }, f.tags.map(t => h('span', { class: 'chip', L: 'box' }, T('span', '', t)))) : null
    );
    // marquee: items twice so the loop is seamless; second copy hidden from screen readers
    const mq = (hidden) => h('div', { class: 'marquee-set', 'aria-hidden': hidden ? 'true' : null },
      H.marquee.map(t => h('span', { class: 'mq-item', L: 'box' }, h('i', { class: 'mq-dot' }), T('span', '', t))));

    return h('section', { id: 'hero', class: 'hero', 'data-section': 'hero' },
      h('div', { class: 'hero-bigword', L: 'headline', 'aria-hidden': 'true' }, H.bigWord),
      h('div', { class: 'hero-grid' },
        h('div', { class: 'hero-left' },
          T('p', 'hero-hello', H.greeting),
          h('h1', { class: 'hero-name', L: 'box' }, T('span', '', H.name)),
          h('p', { class: 'role-tag', L: 'box' }, h('i', { class: 'dot' }),
            h('span', { class: 'role-text', L: 'text', 'data-roles': JSON.stringify(H.roles) }, H.roles[0].toUpperCase())),
          TH('p', 'hero-blurb', H.blurb),
          h('div', { class: 'hero-ctas' },
            h('a', { class: 'btn btn-ghost', href: H.ctaPrimary.href, L: 'box' }, T('span', '', H.ctaPrimary.label)),
            h('a', { class: 'btn btn-solid', href: H.ctaSecondary.href, L: 'box' }, T('span', '', H.ctaSecondary.label))
          ),
          h('div', { class: 'hero-stats' },
            H.stats.map((s, i) => h('div', { class: 'stat' + (i === 0 ? ' stat-hot' : ''), L: 'box' },
              T('span', 'stat-v', s.value, { 'data-count': s.value }), T('span', 'stat-l', s.label)))
          )
        ),
        h('div', { class: 'hero-center' },
          h('figure', { class: 'hero-photo', L: 'box' },
            h('i', { class: 'ph-corner tl' }), h('i', { class: 'ph-corner tr' }),
            h('i', { class: 'ph-corner bl' }), h('i', { class: 'ph-corner br' }),
            h('div', { class: 'ph-frame' },
              h('img', { src: H.photo.src, alt: H.photo.alt, L: 'image', width: '480', height: '600' })
            ),
            h('figcaption', { class: 'photo-chip', L: 'box' }, T('span', '', H.photo.caption))
          ),
          h('span', { class: 'float-chip float-top', L: 'box' }, T('span', '', H.photo.floatTop)),
          h('span', { class: 'float-chip float-side', L: 'box' }, T('span', '', H.photo.floatSide))
        ),
        h('div', { class: 'hero-right' },
          T('p', 'hero-right-label', '// Flagship builds'),
          H.flagships.map(flag)
        )
      ),
      h('div', { class: 'marquee', 'aria-label': 'Skills' },
        h('div', { class: 'marquee-track' }, mq(false), mq(true))
      )
    );
  }

  function renderAbout(C) {
    const A = C.about;
    return h('section', { id: 'about', class: 'section', 'data-section': 'about' },
      sectionHead(A, 1, 'about'),
      h('div', { class: 'about-grid' },
        h('div', { class: 'about-text' }, A.paragraphs.map(p => T('p', 'about-p', p))),
        h('ol', { class: 'timeline' },
          A.timeline.map(t => h('li', { class: 'tl-item', L: 'box' },
            T('span', 'tl-year', t.year),
            h('div', null, T('h3', 'tl-title', t.title), T('p', 'tl-desc', t.desc))
          ))
        )
      )
    );
  }

  function renderProjects(C) {
    const P = C.projects;
    const grid = h('div', { class: 'proj-grid' },
      P.items.map((p, i) => h('article', { class: 'proj' + (i === 0 || p.wide ? ' proj-wide' : ''), 'data-cat': p.category, L: 'box' },
        h('div', { class: 'proj-top' },
          T('span', 'proj-n', String(i + 1).padStart(2, '0') + ' / ' + p.category.toUpperCase()),
          T('span', 'proj-year', p.year)
        ),
        T('h3', 'proj-title', p.title),
        T('p', 'proj-desc', p.desc),
        h('div', { class: 'chips' }, p.tags.map(t => h('span', { class: 'chip', L: 'box' }, T('span', '', t)))),
        p.links
          ? h('div', { class: 'proj-links' }, p.links.map(l =>
              h('a', { class: 'proj-link', href: l.href, target: '_blank', rel: 'noopener', L: 'text' }, l.label + ' ↗')))
          : p.link && p.link !== '#'
            ? h('a', { class: 'proj-link', href: p.link, target: '_blank', rel: 'noopener', L: 'text' }, 'Open project ↗')
            : T('span', 'proj-link proj-nolink', 'Source on request')
      ))
    );
    const filters = h('div', { class: 'filters', role: 'toolbar', 'aria-label': 'Filter projects' },
      P.filters.map((f, i) => h('button', {
        type: 'button', class: 'filter' + (i === 0 ? ' active' : ''), L: 'box', 'aria-pressed': i === 0 ? 'true' : 'false',
        onclick: (e) => {
          filters.querySelectorAll('.filter').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
          e.currentTarget.classList.add('active'); e.currentTarget.setAttribute('aria-pressed', 'true');
          grid.querySelectorAll('.proj').forEach(card => {
            card.hidden = !(f === 'All' || card.dataset.cat === f);
          });
        }
      }, T('span', '', f)))
    );
    return h('section', { id: 'projects', class: 'section', 'data-section': 'projects' }, sectionHead(P, 2, 'projects'), filters, grid);
  }

  function renderStack(C) {
    const S = C.stack;
    return h('section', { id: 'stack', class: 'section', 'data-section': 'stack' },
      sectionHead(S, 3, 'stack'),
      h('div', { class: 'stack-grid' },
        S.groups.map((g, i) => h('div', { class: 'stack-card', L: 'box' },
          T('span', 'stack-n', String(i + 1).padStart(2, '0')),
          T('h3', 'stack-name', g.name),
          h('div', { class: 'chips' }, g.items.map(t => h('span', { class: 'chip', L: 'box' }, T('span', '', t))))
        ))
      )
    );
  }

  function renderContact(C) {
    const K = C.contact;
    return h('section', { id: 'contact', class: 'section contact', 'data-section': 'contact' },
      strip(4, 'contact'),
      T('p', 'eyebrow', K.eyebrow),
      T('h2', 'contact-title', K.title),
      T('p', 'sec-sub', K.subtitle),
      h('button', { type: 'button', class: 'email-btn', L: 'box', onclick: () => copyEmail(K.email) },
        T('span', '', K.email + '  ⧉')),
      h('div', { class: 'socials' },
        K.socials.map(s => h('a', { class: 'social', href: s.href, target: '_blank', rel: 'noopener', L: 'box' }, T('span', '', s.label + ' ↗')))
      ),
      T('p', 'footer', C.footer)
    );
  }

  function copyEmail(email) {
    const done = () => SW.toast('✓ Email copied: ' + email);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(done, () => { location.href = 'mailto:' + email; });
    } else {
      const ta = document.createElement('textarea');
      ta.value = email; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { location.href = 'mailto:' + email; }
      ta.remove();
    }
  }

  SW.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(SW.toast._t);
    SW.toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  };

  SW.render = function (C) {
    const root = document.documentElement;
    root.style.setProperty('--accent', C.theme.accent);
    root.style.setProperty('--accent-ink', C.theme.accentInk);
    document.getElementById('boot-logo').textContent = C.brand.initials;

    renderDock(C);
    const app = document.getElementById('app');
    app.append(renderHero(C), renderAbout(C), renderProjects(C), renderStack(C), renderContact(C));
  };
})();
