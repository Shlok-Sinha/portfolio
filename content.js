/*
 * content.js — EDIT THIS FILE to make the site yours.
 * Everything on the page (text, projects, links, accent color) comes from here.
 * Things still to confirm or fill in are marked  [edit]
 */
window.CONTENT = {
  theme: {
    accent: "#C6FF3D",        // electric lime — change to recolor the whole site
    accentInk: "#0B0B0B"      // text color used on top of the accent
  },

  brand: {
    initials: "SS",
    short: "SHLOK."
  },

  nav: [
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Stack", href: "#stack" },
    { label: "Contact", href: "#contact" }
  ],
  navCta: { label: "Let's talk →", href: "#contact" },
  available: "Building JARVIS",   // status pill in the nav; "" hides it

  hero: {
    bigWord: "PORTFOLIO",
    greeting: "Hello, I'm",
    name: "SHLOK.",
    // first entry shows during the build; after it, the line types through the rest
    roles: ["AI & Automation Builder", "JEE Aspirant", "FPV Pilot", "CTF Designer", "Local-first AI Nerd", "Raspberry Pi Tinkerer"],
    blurb: "JEE by day. By night I build <strong>an AI that runs my computer</strong>, <strong>CTFs that wreck hackathon teams</strong> and <strong>drones people actually pay for</strong>.",
    ctaPrimary: { label: "See the builds →", href: "#projects" },
    ctaSecondary: { label: "Get in touch", href: "#contact" },
    stats: [                       // numbers count up after the build
      { value: "8", label: "Projects shipped" },
      { value: "15", label: "CTF challenges designed" },
      { value: "0", label: "Paid keys JARVIS needs" }
    ],
    photo: {
      src: "assets/shlok.webp",
      alt: "Shlok Sinha pointing at the camera, wearing a ./ascendant.sh T-shirt",
      caption: "● CURRENTLY: JARVIS PHASE 7",
      floatTop: "CLASS 12 · JEE",
      floatSide: "FPV ✈ PAID BUILD"
    },
    // right column of the hero: first one is the big featured card
    flagships: [
      { n: "01.", badge: "PHASE 7 · LIVE", title: "J.A.R.V.I.S.", desc: "Local-first AI assistant on my own GPU. Routes to 7+ AI providers, remembers, talks, and now drives a browser.", tags: ["Python", "Ollama", "Voice"] },
      { n: "02.", badge: "HOSTED", title: "Ascendant 2026", desc: "Ran a school hackathon + wrote its 15-challenge CTF." },
      { n: "03.", badge: "PAID BUILD", title: "Commercial FPV", desc: "Self-taught FPV, built a drone for video production." }
    ],
    marquee: ["Python", "JavaScript", "Ollama", "Claude", "Gemini", "ChromaDB", "Whisper", "React", "Tauri", "Textual", "Alpaca API", "Flask", "MySQL", "Node.js", "Raspberry Pi", "Apps Script", "WebGL", "FPV", "Betaflight Blackbox", "Obsidian", "Git"]
  },

  about: {
    eyebrow: "// About",
    title: "Student by day, builder by every other hour.",
    paragraphs: [
      "I'm Shlok Sinha — a Class 12 student preparing for JEE who spends every spare hour building. My favourite projects are the ones that run my own life: an AI assistant on my own GPU, a study brain that tracks every session and test, a trading bot that never touches real money.",
      "I learn by building: nobody taught me FPV, CTF design or local LLMs — I read, asked communities, broke things and fixed them. Along the way: 93% in Class X boards and a short course at IIT Hyderabad.",
      "I like rules that keep projects honest: JARVIS must work with zero paid API keys, every Paper Desk setting is logged with the reason it changed, and every CTF flag is hashed so nobody can read it from the page source.",
      "Right now I'm pushing JARVIS toward a Tony Stark-style assistant that can see the screen and drive a browser, flying (and crashing, and rebuilding) FPV quads, and tinkering with a Raspberry Pi. I've also written a 7-day Python course for beginners. Off-screen: guitar (Level 5) and chess."
    ],
    timeline: [                    // [edit] check the months
      { year: "Nov '26", title: "JARVIS Phase 7", desc: "Browser + screen control, with safety confirmations for anything risky." },
      { year: "Sep '26", title: "JARVIS v1", desc: "Local-first assistant with multi-provider routing, zero paid keys required." },
      { year: "Aug '26", title: "Paper Desk + Check-in Bot", desc: "Paper-trading bot with walk-forward backtests; a mood check-in chatbot for school." },
      { year: "Jul '26", title: "Ascendant 2026", desc: "Hosted a school hackathon: websites, a 3-level CTF, 2-day logistics, school + sponsor outreach." },
      { year: "'25", title: "Commercial FPV build", desc: "After Class 10: taught myself FPV, sourced parts, built a drone for video production — and got paid." },
      { year: "'19", title: "First code", desc: "Minecraft course, then summer coding challenges and an intro AI course." }
    ]
  },

  projects: {
    eyebrow: "// Projects",
    title: "Things I've built",
    subtitle: "Real projects, mostly built to solve my own problems.",
    filters: ["All", "AI", "Web", "Hardware", "Finance", "School"],
    items: [                       // [edit] add GitHub / live links in `link`
      {
        title: "J.A.R.V.I.S.", year: "2026", category: "AI",
        desc: "A local-first personal AI assistant for my Windows PC. A local Ollama model is the supervisor — it owns memory, persona and routing, and escalates research, code or vision work to Claude, Gemini, OpenAI, Groq and more only when it helps. Works with zero paid API keys. Self-learning memory, wake-word voice, PC and browser control with guardrails.",
        tags: ["Python", "Ollama", "ChromaDB", "Tauri + React", "Voice"], link: "#"
      },
      {
        title: "Hivemind", year: "2026", category: "AI",
        desc: "My JEE + CBSE second brain: an AI-maintained wiki of concepts, formula sheets and test analysis, plus a local HUD that logs every study session, todo and syllabus checklist. JARVIS reads it to know what I'm studying.",
        tags: ["Python", "Obsidian", "Claude", "HUD"], link: "#"
      },
      {
        title: "FPV Drone", year: "2026", category: "Hardware",
        desc: "Taught myself FPV after Class 10, researched and sourced every part through specialist builders and communities, and built a drone for photo/video production work — a paid build. Still tuning it with Betaflight blackbox logs.",
        tags: ["FPV", "Electronics", "Betaflight", "Sourcing"], link: "#"
      },
      {
        title: "Ascendant 2026", year: "2026", category: "Web",
        desc: "I ran the Ascendant 2026 school hackathon — 3-hour event, 2 days of logistics, school + sponsor outreach — and built its websites and a 3-level, 15-challenge, 2950-point story CTF retelling Daedalus & Icarus as a spy thriller — JWTs, stego, ciphers, IDOR, and a finale that leaves the site. Flags are hashed and re-checked server-side. Plus a repo tracker that flags commits made before the problem reveal.",
        tags: ["HTML/CSS/JS", "CTF", "Apps Script", "Event lead"],
        links: [{ label: "Play the CTF", href: "https://ascendantctf.vercel.app/" }, { label: "Event site", href: "https://www.ascendant2026.tech/" }]
      },
      {
        title: "Paper Desk", year: "2026", category: "Finance",
        desc: "Algorithmic paper-trading bot on Alpaca (no real money). ML, momentum and breakout strategies, news veto, walk-forward tests. Volatility-scaled ATR exits took the backtest portfolio from +4.2% to +13.9%.",
        tags: ["Python", "ML", "Alpaca", "Backtesting"], link: "#"
      },
      {
        title: "Mood Check-in Bot", year: "2026", category: "School",
        desc: "A self-reflection chatbot with a small dashboard: VADER sentiment, a 7-day risk gauge and a crisis-phrase override that always shows helplines. Replies are hand-written, not AI, so every answer can be reviewed.",
        tags: ["Python", "Flask", "MySQL", "VADER"], link: "#"
      },
      {
        title: "Blood Donor Finder", year: "2026", category: "School",
        desc: "School CS project: matches patients to compatible donors by blood group, enforces the gap between donations and screens donors with medical questions.",
        tags: ["Python", "Flask", "MySQL"], link: "#"
      },
      {
        title: "Claude Code Brain", year: "2026", category: "AI",
        desc: "An Obsidian vault built from every AI coding session I've run — exported, then backlinked by topic, tool and entity so past decisions are one search away.",
        tags: ["Python", "Obsidian", "Agents"], link: "#"
      }
    ]
  },

  stack: {
    eyebrow: "// Stack",
    title: "Tools I build with",
    groups: [
      { name: "Languages", items: ["Python", "JavaScript", "HTML / CSS", "SQL"] },
      { name: "AI & Data", items: ["Ollama", "Claude", "Gemini", "ChromaDB", "Whisper", "scikit-learn", "VADER"] },
      { name: "Web & Backend", items: ["Flask", "MySQL", "Node.js", "Tauri + React", "Apps Script", "WebGL"] },
      { name: "Hardware & Tools", items: ["FPV / Blackbox", "Raspberry Pi", "Git", "Obsidian", "Textual"] }
    ]
  },

  contact: {
    eyebrow: "// Contact",
    title: "Let's build something wild.",
    subtitle: "Got an idea, a hackathon or just want to talk AI and drones? My inbox is open.",
    email: "contactme.shlok@gmail.com",   // [edit] change if you want a different public address
    socials: [                     // [edit] add LinkedIn / Instagram here if you want them
      { label: "GitHub", href: "https://github.com/Shlok-Sinha" },
      { label: "Ascendant 2026", href: "https://www.ascendant2026.tech/" },
      { label: "Ascendant CTF", href: "https://ascendantctf.vercel.app/" }
    ]
  },

  footer: "© 2026 Shlok Sinha — built by a swarm of tiny agents."
};
