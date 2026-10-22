/* parmenides.dev — change the repo and commands here only.
   (The HTML carries the same values as a no-JS fallback.) */
const SITE = {
  repo: "senavoh/parmenides",
  github: "https://github.com/senavoh/parmenides",
  cmd: { npx: "npx skills add senavoh/parmenides" },
};
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-cmd]").forEach((el) => { const v = SITE.cmd[el.dataset.cmd]; if (v) el.textContent = v; });
document.querySelectorAll("[data-gh]").forEach((el) => (el.href = SITE.github));
document.querySelectorAll("[data-gh-issues]").forEach((el) => (el.href = SITE.github + "/issues"));

/* ---------- tesserae ---------- */
const STONE = ["#ece2cf", "#e3d6bd", "#f2e9d8", "#ddcfb3"];
const TERRA = ["#b5452d", "#a83c25", "#bf5137", "#c95a3e"];
const VEIL = ["#6b5d4f", "#7a6a58", "#5f5244", "#857462", "#b5452d"];
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function tile(ctx, x, y, size, colour, r) {
  ctx.save(); ctx.translate(x + size / 2, y + size / 2); ctx.rotate((r() - 0.5) * 0.12);
  ctx.fillStyle = colour;
  const s = size - 3 + (r() - 0.5) * 1.4;
  ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
}

const canAnimate = () => !reduce && typeof anime === "function";

// Lay a heading in tiles: draw its lines in a thick classical face, sample them,
// then (motion allowing) set each tile down, rippling from the top-left corner.
function layHeading(el, animate) {
  const lines = el.dataset.lines.split("|");
  const m = document.createElement("canvas").getContext("2d"); m.font = '220px "Marcellus", serif';
  const track = Number(el.dataset.track || 0);
  const width = (t) => m.measureText(t).width + track * (t.length - 1);
  const W = Math.max(1300, Math.ceil(Math.max(...lines.map(width)) + 60));
  const lineH = 280, H = lineH * lines.length + 20, T = 16;
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const o = off.getContext("2d");
  o.fillStyle = o.strokeStyle = "#000"; o.lineWidth = 22; o.lineJoin = "round";
  o.font = '220px "Marcellus", serif'; o.textBaseline = "top";
  lines.forEach((t, n) => {
    let x = 12;
    for (const ch of track ? [...t] : [t]) { o.strokeText(ch, x, 24 + n * lineH); o.fillText(ch, x, 24 + n * lineH); x += o.measureText(ch).width + track; }
  });
  const d = o.getImageData(0, 0, W, H).data, r = rng(7 + lines.join("").length);
  const tiles = [];
  let maxX = 0;
  for (let y = 0; y < H; y += T) for (let x = 0; x < W; x += T) {
    if (y + T / 2 >= H || x + T / 2 >= W || !(d[((y + T / 2) * W + x + T / 2) * 4 + 3] >= 128)) continue;
    const second = y >= 24 + lineH - 10;
    const pal = second && el.dataset.alt ? TERRA : STONE;
    tiles.push({ x, y, c: pal[Math.floor(r() * pal.length)], rot: (r() - 0.5) * 0.12, s: T - 3 + (r() - 0.5) * 1.4, p: 1 });
    maxX = Math.max(maxX, x + T);
  }
  const out = document.createElement("canvas"); out.width = maxX + 8; out.height = H;
  out.setAttribute("aria-hidden", "true");
  const ctx = out.getContext("2d");
  const draw = () => {
    ctx.clearRect(0, 0, out.width, out.height);
    for (const t of tiles) {
      if (t.p <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.p);
      ctx.translate(t.x + T / 2, t.y + T / 2 - (1 - t.p) * 20);
      ctx.rotate(t.rot + (1 - t.p) * 0.7);
      ctx.fillStyle = t.c;
      const s = t.s * (0.55 + 0.45 * t.p);
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }
  };
  el.appendChild(out);
  el.classList.add("is-tiled");
  const run = () => {
    tiles.forEach((t) => (t.p = 0)); draw();
    const a = anime({ targets: tiles, p: [0, 1], duration: 560, easing: "easeOutBack", delay: (t) => (t.x + t.y * 0.9) * 0.62, update: draw, complete: draw });
    // never leave the floor half laid, even if animation frames stall
    setTimeout(() => { a.pause(); tiles.forEach((t) => (t.p = 1)); draw(); }, 2600);
  };
  if (!canAnimate() || !animate) { draw(); return; }
  if (animate === "now") run();
  else {
    tiles.forEach((t) => (t.p = 0)); draw();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.35 });
    io.observe(el);
  }
}

// The portrait is set down block by block, from the centre outward.
function layPortrait(fig) {
  const img = fig.querySelector("img");
  if (!img || !canAnimate()) return;
  const start = () => {
    const N = img.naturalWidth, B = N / 24, blocks = [];
    for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
      blocks.push({ i, j, p: 0, d: Math.hypot(i - 11.5, j - 11.5) });
    }
    const c = document.createElement("canvas"); c.width = N; c.height = N; c.className = "portrait__lay";
    c.style.width = img.offsetWidth + "px"; c.style.height = img.offsetHeight + "px";
    c.setAttribute("aria-hidden", "true");
    const ctx = c.getContext("2d");
    const draw = () => {
      ctx.clearRect(0, 0, N, N);
      for (const b of blocks) {
        if (b.p <= 0) continue;
        ctx.globalAlpha = Math.min(1, b.p);
        ctx.drawImage(img, b.i * B, b.j * B, B, B, b.i * B, b.j * B + (1 - b.p) * B * 0.5, B, B);
      }
      ctx.globalAlpha = 1;
    };
    fig.appendChild(c); fig.classList.add("is-laying"); draw();
    const finish = () => { fig.classList.remove("is-laying"); c.remove(); };
    const a = anime({ targets: blocks, p: [0, 1], duration: 480, easing: "easeOutQuad", delay: (b) => 150 + b.d * 70 + Math.random() * 80, update: draw, complete: finish });
    setTimeout(() => { a.pause(); finish(); }, 2600);
  };
  img.complete ? start() : img.addEventListener("load", start, { once: true });
}

// Hide each secret value under a strip of tiles; they shuffle once, then settle.
function redact(el) {
  const c = document.createElement("canvas"), T = 11, w = 220, h = 22;
  c.width = w; c.height = h; c.setAttribute("aria-hidden", "true");
  const ctx = c.getContext("2d"), seed = w + el.parentElement.textContent.length;
  const paint = (r) => { ctx.clearRect(0, 0, w, h); for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) tile(ctx, x, y, T, VEIL[Math.floor(r() * VEIL.length)], r); };
  paint(rng(seed));
  el.appendChild(c);
  el.setAttribute("aria-label", "value hidden");
  if (!canAnimate()) return;
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    const shuffle = { v: 0 };
    anime({ targets: shuffle, v: 1, duration: 900, easing: "steps(10)", delay: Math.random() * 200,
      update: () => paint(Math.random), complete: () => paint(rng(seed)) });
  }, { threshold: 0.6 });
  io.observe(el);
}

document.fonts.load('220px "Marcellus"').then(() => {
  document.querySelectorAll(".tiled[data-lines]").forEach((el) => layHeading(el, el.closest(".hero") ? "now" : el.classList.contains("foot__mark") ? false : "view"));
}).catch(() => {});
document.querySelectorAll(".portrait").forEach(layPortrait);
document.querySelectorAll("[data-redact]").forEach(redact);

/* ---------- copy ---------- */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch {}
    ta.remove(); return ok;
  }
}
function flash(btn, ok, idle) {
  btn.textContent = ok ? "Copied" : "Select and copy";
  btn.classList.toggle("is-done", ok);
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { btn.textContent = idle; btn.classList.remove("is-done"); }, 1600);
}
document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => flash(btn, await copyText(SITE.cmd[btn.dataset.copyFrom]), "Copy"));
});

/* ---------- the floors: staging and prod, the same mosaic twice ---------- */
const DRIFTS = [
  { name: "Stripe webhook secret", risk: "high", s: "present", pr: "missing", at: [4, 3], fix: "Add <code>STRIPE_WEBHOOK_SECRET</code> to the prod secret store, set to prod's own signing secret." },
  { name: "Node runtime", risk: "high", s: "node:20-alpine", pr: "node:18-alpine", at: [13, 3], fix: "Change <code>Dockerfile.production:1</code> to <code>FROM node:20-alpine</code>, or use one Dockerfile for both." },
  { name: "Postgres", risk: "high", s: "16.4", pr: "15.8", at: [9, 5], fix: "Pick one major version and pin it in both compose files." },
  { name: "Tests and migrations", risk: "high", s: "run", pr: "skipped", at: [3, 8], fix: "Run <code>npm test</code> and <code>npm run migrate</code> before the deploy step in <code>deploy-production.yml</code>." },
  { name: "CORS origins", risk: "high", s: "one origin", pr: '["*"]', at: [11, 8], fix: "Set <code>cors.origins</code> in <code>config/production.json</code> to the shop's own origin." },
  { name: "Redis image", risk: "med", s: "redis:7.4", pr: "redis:latest", at: [14, 6], fix: "Pin prod to <code>redis:7.4</code>." },
  { name: "New checkout flag", risk: "med", s: "true", pr: "false", at: [6, 6], fix: "Turn it on or off in both, or list it in <code>.parmenides.yml</code> if it's meant to differ." },
  { name: "Timeout and retries", risk: "med", s: "10s, 3 retries", pr: "3s, 0 retries", at: [8, 2], fix: "Use one timeout and one retry count in both, so staging tests what prod does." },
];
const FC = 18, FR = 12;
const DARK = ["#3a2a22", "#47342a", "#2f231c"], GOLD = ["#d6a13c", "#c9922f", "#dcae52"], SAND = ["#d9ccb2", "#cfc0a3", "#d4c6aa"];
const RISK = { high: "#cf5b40", med: "#d6a13c" };
function floorPal(i, j) {
  const e = Math.min(i, j, FC - 1 - i, FR - 1 - j);
  if (e === 0) return DARK;
  if (e === 1) return (i + j) % 2 ? SAND : DARK;
  if (e === 2) return DARK;
  const d = Math.abs(i - 8.5) / 3.4 + Math.abs(j - 5.5) / 2.2;
  if (d <= 0.3) return SAND;
  if (d <= 1 && d > 0.7) return DARK;
  return STONE;
}
const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const x = p(a), y = p(b);
  return "rgb(" + x.map((v, k) => Math.round(v + (y[k] - v) * t)).join(",") + ")";
};
function initFloors(sec) {
  const cs = [...sec.querySelectorAll("canvas[data-floor]")];
  if (!cs.length) return;
  const W = cs[0].width, T = W / FC;
  const r = rng(11), cells = [];
  for (let j = 0; j < FR; j++) for (let i = 0; i < FC; i++) {
    const pal = floorPal(i, j);
    cells.push({ i, j, c: pal[Math.floor(r() * pal.length)], rot: (r() - 0.5) * 0.1, s: T - 7 + (r() - 0.5) * 2 });
  }
  const byAt = new Map(DRIFTS.map((d, k) => [d.at + "", k]));
  DRIFTS.forEach((d, k) => { d.p = 0; d.dx = k % 2 ? 0.3 : -0.26; d.dy = -0.2 - (k % 3) * 0.06; d.dr = k % 2 ? 0.42 : -0.36; });
  let sel = 0;
  const scan = { x: -1 };
  const draw = () => cs.forEach((cv) => {
    const prod = cv.dataset.floor === "prod", ctx = cv.getContext("2d");
    ctx.fillStyle = "#2b241e"; ctx.fillRect(0, 0, cv.width, cv.height);
    const lifted = [];
    for (const t of cells) {
      const k = byAt.get([t.i, t.j] + "");
      if (prod && k !== undefined && DRIFTS[k].p > 0.001) { lifted.push([t, k]); continue; }
      ctx.save(); ctx.translate(t.i * T + T / 2, t.j * T + T / 2); ctx.rotate(t.rot);
      ctx.fillStyle = t.c; ctx.fillRect(-t.s / 2, -t.s / 2, t.s, t.s);
      if (!prod && k === sel) { ctx.strokeStyle = "#d6a13c"; ctx.lineWidth = 6; ctx.strokeRect(-t.s / 2 + 3, -t.s / 2 + 3, t.s - 6, t.s - 6); }
      ctx.restore();
    }
    for (const [t, k] of lifted) {
      const d = DRIFTS[k], p = d.p;
      ctx.fillStyle = "#1c1814"; ctx.globalAlpha = Math.min(1, p * 1.4);
      ctx.fillRect(t.i * T + 3, t.j * T + 3, T - 6, T - 6); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(t.i * T + T / 2 + d.dx * T * p, t.j * T + T / 2 + d.dy * T * p); ctx.rotate(t.rot + d.dr * p);
      ctx.fillStyle = mix(t.c.length === 7 ? t.c : "#ece2cf", RISK[d.risk], Math.min(1, p));
      const s = t.s * (1 + 0.08 * p); ctx.fillRect(-s / 2, -s / 2, s, s);
      if (k === sel) { ctx.strokeStyle = "#f2e9d8"; ctx.lineWidth = 6; ctx.strokeRect(-s / 2 + 3, -s / 2 + 3, s - 6, s - 6); }
      ctx.restore();
    }
    if (prod && scan.x >= 0 && scan.x <= FC) {
      ctx.fillStyle = "rgba(242,233,216,.5)"; ctx.fillRect(scan.x * T - 3, 0, 6, cv.height);
    }
  });
  // the detail bar and the list of picks
  const $ = (k) => sec.querySelector(`[data-d="${k}"]`);
  const picks = sec.querySelector(".picks"), detail = sec.querySelector(".detail");
  DRIFTS.forEach((d, k) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.textContent = d.name; if (d.risk === "med") b.classList.add("is-med");
    b.addEventListener("click", () => select(k));
    li.appendChild(b); picks.appendChild(li);
  });
  const select = (k) => {
    sel = (k + DRIFTS.length) % DRIFTS.length;
    const d = DRIFTS[sel], med = d.risk === "med";
    $("name").textContent = d.name; $("s").textContent = d.s; $("p").textContent = d.pr; $("fix").innerHTML = d.fix;
    $("risk").textContent = med ? "Medium" : "High"; $("risk").classList.toggle("is-med", med);
    $("tile").classList.toggle("is-med", med); $("n").textContent = `${sel + 1} of ${DRIFTS.length}`;
    picks.querySelectorAll("button").forEach((b, n) => b.setAttribute("aria-current", String(n === sel)));
    detail.classList.add("is-swap"); setTimeout(() => detail.classList.remove("is-swap"), 160);
    draw();
  };
  sec.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => select(sel + Number(b.dataset.step))));
  // tap the prod floor: pick the nearest tile out of place
  const prodC = cs.find((c) => c.dataset.floor === "prod");
  prodC.addEventListener("click", (e) => {
    const box = prodC.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width * FC, y = (e.clientY - box.top) / box.height * FR;
    let best = -1, bd = 2.2;
    DRIFTS.forEach((d, k) => { const dd = Math.hypot(d.at[0] + 0.5 + d.dx * d.p - x, d.at[1] + 0.5 + d.dy * d.p - y); if (dd < bd) { bd = dd; best = k; } });
    if (best >= 0) select(best);
  });
  // make them one, and back again
  const mend = sec.querySelector("[data-mend]"), count = sec.querySelector("[data-count]"), sub = sec.querySelector("[data-count-sub]");
  let one = false;
  const settle = (to) => {
    if (!canAnimate()) { DRIFTS.forEach((d) => (d.p = to)); draw(); return; }
    anime.remove(DRIFTS);
    anime({ targets: DRIFTS, p: to, duration: to ? 620 : 520, easing: to ? "easeOutBack" : "easeInOutQuad", delay: anime.stagger(70), update: draw, complete: draw });
  };
  mend.addEventListener("click", () => {
    one = !one;
    sec.classList.toggle("is-one", one);
    mend.setAttribute("aria-pressed", String(one));
    mend.textContent = one ? "Show the drift" : "Make them one";
    count.textContent = one ? "0 tiles out of place." : "8 tiles out of place in prod.";
    sub.textContent = one ? "What is, is one." : "5 high risk, 3 medium.";
    settle(one ? 0 : 1);
  });
  select(0);
  // when the floors come into view, a line passes over prod and lifts what drifted
  if (!canAnimate()) { DRIFTS.forEach((d) => (d.p = 1)); draw(); return; }
  draw();
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    const a = anime({ targets: scan, x: [0, FC + 0.5], duration: 1400, easing: "easeInOutSine", update: draw, complete: () => { scan.x = -1; draw(); } });
    const b = anime({ targets: DRIFTS, p: [0, 1], duration: 620, easing: "easeOutBack", delay: (d) => 80 + (d.at[0] / FC) * 1400, update: draw });
    setTimeout(() => { a.pause(); b.pause(); scan.x = -1; if (!one) DRIFTS.forEach((d) => (d.p = 1)); draw(); }, 2800);
  }, { threshold: 0.4 });
  io.observe(prodC);
}
document.querySelectorAll(".floors").forEach(initFloors);

/* ---------- cracks that run through every floor ---------- */
function crack(cv) {
  const ctx = cv.getContext("2d"), T = 40, cols = cv.width / T, rows = cv.height / T;
  const r = rng(Number(cv.dataset.crack) * 31 + 5), cells = [], seam = [];
  let s = 2 + Math.floor(r() * (rows - 3));
  for (let i = 0; i < cols; i++) { seam.push(s); if (r() < 0.6) s = Math.max(1, Math.min(rows - 1, s + (r() < 0.5 ? -1 : 1))); }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const below = j >= seam[i], edge = j === seam[i] || j === seam[i] - 1;
    cells.push({ i, j, c: STONE[Math.floor(r() * STONE.length)], rot: (r() - 0.5) * 0.1, tilt: below ? (r() - 0.5) * 0.16 : 0, dy: below ? 4 + r() * 3 : 0, gone: edge && r() < 0.18 });
  }
  const st = { p: 1 };
  const draw = () => {
    ctx.fillStyle = "#2b241e"; ctx.fillRect(0, 0, cv.width, cv.height);
    const upto = st.p * cols;
    for (const t of cells) {
      const on = t.i < upto;
      if (on && t.gone) continue;
      ctx.save(); ctx.translate(t.i * T + T / 2, t.j * T + T / 2 + (on ? t.dy : 0)); ctx.rotate(t.rot + (on ? t.tilt : 0));
      ctx.fillStyle = t.c; ctx.fillRect(-(T - 4) / 2, -(T - 4) / 2, T - 4, T - 4); ctx.restore();
    }
    ctx.strokeStyle = "#14110e"; ctx.lineWidth = 9; ctx.lineJoin = "miter"; ctx.beginPath();
    for (let i = 0; i < Math.min(cols, Math.ceil(upto)); i++) {
      const x0 = i * T, x1 = Math.min((i + 1) * T, upto * T), y = seam[i] * T + 2;
      i ? ctx.lineTo(x0, y) : ctx.moveTo(x0, y); ctx.lineTo(x1, y);
    }
    if (upto > 0) ctx.stroke();
  };
  draw();
  if (!canAnimate()) return;
  st.p = 0; draw();
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    anime({ targets: st, p: 1, duration: 1000, easing: "easeInQuad", delay: 150, update: draw, complete: draw });
    setTimeout(() => { st.p = 1; draw(); }, 2000);
  }, { threshold: 0.5 });
  io.observe(cv);
}
document.querySelectorAll("canvas[data-crack]").forEach(crack);

/* ---------- the open dialog ---------- */
const seg = [...document.querySelectorAll(".ask__seg [role=radio]")];
const q = document.getElementById("q");
seg.forEach((b) => b.addEventListener("click", () => {
  seg.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  q.value = b.dataset.q;
}));
const ask = document.querySelector(".ask");
ask?.addEventListener("submit", async (e) => {
  e.preventDefault();
  flash(ask.querySelector(".ask__go"), await copyText(SITE.cmd.npx), "Copy install command");
});

/* ---------- entrances below the hero ---------- */
if (!reduce) {
  const parts = document.querySelectorAll("main .h2, main .lede, .floor, .detail, .picks, .floors__foot, .vault__row, .crack, .faq details, .ask, .tiled--close");
  parts.forEach((el, i) => { el.classList.add("rise"); el.style.setProperty("--i", i % 5); });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px 10% 0px" });
  parts.forEach((el) => io.observe(el));
}

/* ---------- the ticker only runs while it can be seen ---------- */
const ticker = document.querySelector(".ticker");
if (ticker) new IntersectionObserver((es) => ticker.classList.toggle("is-off", !es[0].isIntersecting)).observe(ticker);

/* ---------- live star count, once the repo has any ---------- */
fetch(`https://api.github.com/repos/${SITE.repo}`, { headers: { Accept: "application/vnd.github+json" } })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    const n = d?.stargazers_count;
    if (!n) return;
    const txt = n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
    document.querySelectorAll("[data-stars]").forEach((el) => (el.textContent = "(" + txt + ")"));
  })
  .catch(() => {});
