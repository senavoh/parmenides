/* parmenides.dev — change the repo and commands here only.
   (The HTML carries the same values as a no-JS fallback.) */
const SITE = {
  repo: "senavoh/parmenides",
  github: "https://github.com/senavoh/parmenides",
  cmd: {
    npx: "npx skills add senavoh/parmenides",
    pluginAdd: "/plugin marketplace add senavoh/parmenides",
    pluginInstall: "/plugin install parmenides@parmenides",
    curl: "curl -fsSL https://raw.githubusercontent.com/senavoh/parmenides/main/install.sh | sh",
    clone: "git clone https://github.com/senavoh/parmenides",
    manualCopy: "cp -r parmenides/skills/parmenides ~/.claude/skills/",
  },
};

document.querySelectorAll("[data-cmd]").forEach((el) => { const v = SITE.cmd[el.dataset.cmd]; if (v) el.textContent = v; });
document.querySelectorAll("[data-gh]").forEach((el) => (el.href = SITE.github));
document.querySelectorAll("[data-gh-issues]").forEach((el) => (el.href = SITE.github + "/issues"));

/* ---------- tesserae ---------- */
const STONE = ["#ece2cf", "#e3d6bd", "#f2e9d8", "#ddcfb3"];
const TERRA = ["#b5452d", "#a83c25", "#bf5137", "#c95a3e"];
const DARK = ["#7a6a58", "#6b5d4f", "#857462", "#5f5244", "#b5452d"];
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
  c.setAttribute("aria-hidden", "true");
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
  // crop the canvas to the laid width so it scales with the text
  const out = document.createElement("canvas"); out.width = maxX + 8; out.height = H;
  out.getContext("2d").drawImage(c, 0, 0);
  out.setAttribute("aria-hidden", "true");
  el.appendChild(out);
  el.classList.add("is-tiled");
}

// Hide each secret value under a strip of dark tiles.
function redact(el) {
  const c = document.createElement("canvas"), T = 11, w = 220, h = 22;
  c.width = w; c.height = h; c.setAttribute("aria-hidden", "true");
  const ctx = c.getContext("2d"), r = rng(w + el.parentElement.textContent.length);
  for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) tile(ctx, x, y, T, DARK[Math.floor(r() * DARK.length)], r);
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
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy");
  if (!btn) return;
  const ok = await copyText(SITE.cmd[btn.dataset.copyFrom]);
  btn.textContent = ok ? "Copied" : "⌘C";
  btn.classList.toggle("is-done", ok);
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1600);
});

/* ---------- install tabs ---------- */
const tabs = [...document.querySelectorAll('[role="tab"]')];
const select = (tab, focus) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
  if (focus) tab.focus();
};
tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(t));
  t.addEventListener("keydown", (e) => {
    const j = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (j !== undefined) { e.preventDefault(); select(tabs[j], true); }
  });
});

/* ---------- live star count, once the repo has any ---------- */
fetch(`https://api.github.com/repos/${SITE.repo}`, { headers: { Accept: "application/vnd.github+json" } })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    const n = d?.stargazers_count;
    if (!n) return;
    const txt = n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
    document.querySelectorAll("[data-stars]").forEach((el) => (el.textContent = "★ " + txt));
  })
  .catch(() => {});
