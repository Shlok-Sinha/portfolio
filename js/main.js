/* main.js — boot. Add ?nobuild to the URL to skip the swarm build. */
(function () {
  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The build always plays (it IS the site). Reduced-motion visitors get a 2x build and
  // agents that stop roaming afterwards. ?nobuild skips it entirely.
  const noBuild = params.has('nobuild');

  if (noBuild) document.documentElement.classList.remove('js-build');

  SW.render(window.CONTENT);
  SW.aurora.start();

  if (noBuild) {
    document.body.classList.add('hero-painted');
    document.getElementById('boot').remove();
    document.getElementById('hud').remove();
    document.getElementById('swarm-canvas').remove();
    document.dispatchEvent(new Event('swarm:hero-done'));
    return;
  }

  SW.engine.init({ calm: reduce });
})();
