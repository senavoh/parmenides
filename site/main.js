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
  const W = Math.max(1300, Math.ceil(Math.max(...lines.map((t) => m.measureText(t).width)) + 60));
  const lineH = 280, H = lineH * lines.length + 20, T = 16;
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const o = off.getContext("2d");
  o.fillStyle = o.strokeStyle = "#000"; o.lineWidth = 22; o.lineJoin = "round";
  o.font = '220px "Marcellus", serif'; o.textBaseline = "top";
  lines.forEach((t, n) => { o.strokeText(t, 12, 24 + n * lineH); o.fillText(t, 12, 24 + n * lineH); });
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

/* ---------- switches ---------- */
document.querySelectorAll(".band").forEach((band) => {
  const sw = band.querySelector(".switch");
  sw.addEventListener("click", () => {
    const on = sw.getAttribute("aria-checked") !== "true";
    band.toggleAttribute("data-on", on);
    sw.setAttribute("aria-checked", String(on));
  });
});

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
  const parts = document.querySelectorAll("main .h2, main .lede, .band, .road, .step .card, .step__line, .vault__row, .faq details, .ask, .tiled--close");
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
