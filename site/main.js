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

// Lay a heading in tiles: draw its lines in a thick classical face, then sample them.
function layHeading(el) {
  const lines = el.dataset.lines.split("|");
  const W = 1300, lineH = 280, H = lineH * lines.length + 20, T = 16;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const o = off.getContext("2d");
  o.fillStyle = o.strokeStyle = "#000"; o.lineWidth = 22; o.lineJoin = "round";
  o.font = '220px "Marcellus", serif'; o.textBaseline = "top";
  lines.forEach((t, n) => { o.strokeText(t, 12, 24 + n * lineH); o.fillText(t, 12, 24 + n * lineH); });
  const d = o.getImageData(0, 0, W, H).data, ctx = c.getContext("2d"), r = rng(7 + lines.join("").length);
  let maxX = 0;
  for (let y = 0; y < H; y += T) for (let x = 0; x < W; x += T) {
    if (y + T / 2 >= H || x + T / 2 >= W || !(d[((y + T / 2) * W + x + T / 2) * 4 + 3] >= 128)) continue;
    const second = y >= 24 + lineH - 10;
    const pal = second && el.dataset.alt ? TERRA : STONE;
    tile(ctx, x, y, T, pal[Math.floor(r() * pal.length)], r);
    maxX = Math.max(maxX, x + T);
  }
  const out = document.createElement("canvas"); out.width = maxX + 8; out.height = H;
  out.getContext("2d").drawImage(c, 0, 0);
  out.setAttribute("aria-hidden", "true");
  el.appendChild(out);
  el.classList.add("is-tiled");
}

// Hide each secret value under a strip of tiles.
function redact(el) {
  const c = document.createElement("canvas"), T = 11, w = 220, h = 22;
  c.width = w; c.height = h; c.setAttribute("aria-hidden", "true");
  const ctx = c.getContext("2d"), r = rng(w + el.parentElement.textContent.length);
  for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) tile(ctx, x, y, T, VEIL[Math.floor(r() * VEIL.length)], r);
  el.appendChild(c);
  el.setAttribute("aria-label", "value hidden");
}

document.fonts.load('220px "Marcellus"').then(() => {
  document.querySelectorAll(".tiled[data-lines]").forEach(layHeading);
}).catch(() => {});
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
