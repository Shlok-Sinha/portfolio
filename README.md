# Swarm Build Portfolio

A portfolio template that **builds itself in front of the visitor**: a swarm of colored cursor "agents"
scans the page, drags out wireframes with dimension labels, fills grey blocks, types the text in and
finally paints the real design. Sections further down build as you scroll to them.

Plain HTML / CSS / JS. No build step, no dependencies.

## Run it

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 5173
```

Then visit http://localhost:5173

## Deploy
Static site, no build step.
- **Vercel:** import the repo, Framework Preset `Other`, leave Build Command empty, Output Directory `.` (root).
- **Netlify:** import the repo, leave Build command empty, Publish directory `.`.

## Make it yours

| What | Where |
|------|-------|
| All text, projects, links, email | `content.js` (look for `[edit]`) |
| Accent color | `content.js` → `theme.accent` |
| Photo | put a file in `assets/` and set `hero.photo.src` |
| Fonts, base colors | `css/tokens.css` |
| Layout / section styles | `css/base.css` |
| New sections | add a render function in `js/render.js` |

### Build rules for new markup (in `render.js`)
- `data-section="id"` — a build group; built when it scrolls into view.
- `data-layer="box"` — container: wireframe → grey block → painted after its children finish. Never put bare text in a box; wrap it in a text layer.
- `data-layer="text"` — leaf text, typed char by char. No nested layers inside.
- `data-layer="image"` — `<img>`, shown as a grey block then revealed.
- `data-layer="headline"` — like text, for the giant outlined word.

## Controls (bottom pill)
Pause · speed (1× / 2× / 4× / 0.5×) · Touring (auto-scrolls through every section while it builds; pauses briefly if you scroll yourself, then carries on) · Follow (agents chase the mouse) · Sound (Web Audio blips, off by default) · Replay · Skip · × hide.

## What the agents do
1. Scan: swarm orbits the logo.
2. Each section: one agent draws the section frame, the page turns grey, rulers + column guides appear.
3. Each layer: crosshair drags out a wireframe with its layer name and `W × H` chip.
4. Cards/buttons get grabbed and dragged into their slot (dashed pink target), magenta snap guides flash.
5. Text is typed in with an I-beam.
6. When a box's contents are done, an agent comes back with a color swatch (real hex) and paints it.
7. Touring scrolls on to the next unfinished area; at the end it returns to the top.

## Turn the effect off
- Add `?nobuild` to the URL.
- Visitors with "reduce motion" enabled (e.g. Windows "Animation effects" off) still see the build,
  at normal speed; the agents just stop roaming once it finishes.
- Busier/calmer build: agent count is in `js/swarm/engine.js` (`innerWidth < 700 ? 6 : 12`).

## Files
```
index.html            shell, HUD, canvases
content.js            your content
css/                  tokens, page styles, build states
js/render.js          content -> DOM
js/aurora.js          background glow
js/hero-fx.js         rotating role line + stat count-up (after hero builds)
js/swarm/engine.js    scheduler + phases
js/swarm/agent.js     cursor physics
js/swarm/overlay.js   canvas drawing
js/swarm/layers.js    layer discovery
js/swarm/typer.js     char-by-char typing
js/swarm/hud.js       control pill
js/swarm/audio.js     synth sounds
```
