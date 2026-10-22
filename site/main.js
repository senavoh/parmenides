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
  btn.textContent = ok ? "copied" : "select and copy";
  btn.classList.toggle("is-done", ok);
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { btn.textContent = idle; btn.classList.remove("is-done"); }, 1600);
}

/* hero copy button */
document.querySelectorAll("[data-copy-from]").forEach((btn) => {
  btn.addEventListener("click", async () => flash(btn, await copyText(SITE.cmd[btn.dataset.copyFrom]), "copy"));
});

/* the square plate: three tabs from the report */
const PANES = {
  truth: ["what is the same.", "His report opens with everything that already matches, so you know what was checked and is fine. In the demo: the same dependencies from one lockfile, the same env var keys except one, the same cookie and pool settings."],
  opinion: ["where they drifted.", "Then the drift, ranked. In the demo, prod is missing a Stripe webhook secret, runs Node 18 against staging's 20, talks to Postgres 15.8 against 16.4, skips tests and migrations, and allows any CORS origin."],
  verdict: ["no, they are not one.", "Five high, four medium. Then the fixes, in order, each naming the file and the change: add the secret, run migrations before deploy, move prod to Node 20, pin Postgres and Redis, lock CORS to one origin."],
};
const plateTabs = [...document.querySelectorAll(".plate__tabs [role=tab]")];
const pane = document.querySelector(".plate__pane");
plateTabs.forEach((t, i) => {
  t.tabIndex = i === 0 ? 0 : -1;
  t.addEventListener("click", () => {
    plateTabs.forEach((x) => { x.setAttribute("aria-selected", String(x === t)); x.tabIndex = x === t ? 0 : -1; });
    pane.classList.add("is-swapping");
    setTimeout(() => {
      const [title, text] = PANES[t.dataset.pane];
      pane.querySelector("[data-title]").textContent = title;
      pane.querySelector("[data-text]").textContent = text;
      pane.classList.remove("is-swapping");
    }, reduce ? 0 : 180);
  });
  t.addEventListener("keydown", (e) => {
    const j = { ArrowRight: (i + 1) % plateTabs.length, ArrowLeft: (i - 1 + plateTabs.length) % plateTabs.length }[e.key];
    if (j !== undefined) { e.preventDefault(); plateTabs[j].click(); plateTabs[j].focus(); }
  });
});

/* sentences with switches */
document.querySelectorAll(".band").forEach((band) => {
  const sw = band.querySelector(".toggle");
  sw.addEventListener("click", () => {
    const on = sw.getAttribute("aria-checked") !== "true";
    band.toggleAttribute("data-on", on);
    sw.setAttribute("aria-checked", String(on));
  });
});

/* the open dialog: choose files or branches, copy the install command */
const seg = [...document.querySelectorAll(".ask__seg [role=radio]")];
const q = document.getElementById("q");
seg.forEach((b) => b.addEventListener("click", () => {
  seg.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  q.value = b.dataset.q;
}));
const ask = document.querySelector(".ask");
ask?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const go = ask.querySelector(".ask__go");
  flash(go, await copyText(SITE.cmd.npx), "copy install command");
});

/* tesserae: build the footer mark from tiles */
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function layMark(el) {
  const text = el.dataset.lines, W = 2400, H = 330, T = 13;
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const o = off.getContext("2d");
  o.fillStyle = o.strokeStyle = "#000"; o.lineWidth = 10; o.lineJoin = "round";
  o.font = '700 300px "Pilcrow Rounded", "Nunito", sans-serif'; o.textBaseline = "top";
  const w = o.measureText(text).width;
  o.strokeText(text, 14, 18); o.fillText(text, 14, 18);
  const d = o.getImageData(0, 0, W, H).data, r = rng(91);
  const out = document.createElement("canvas"); out.width = Math.min(W, Math.ceil(w + 40)); out.height = H;
  const ctx = out.getContext("2d");
  const pal = ["#062b8a", "#0a318f", "#123a95", "#3a5aa8"];
  for (let y = 0; y + T <= H; y += T) for (let x = 0; x + T <= out.width; x += T) {
    if (!(d[((y + T / 2) * W + x + T / 2) * 4 + 3] >= 128)) continue;
    ctx.save(); ctx.translate(x + T / 2, y + T / 2); ctx.rotate((r() - 0.5) * 0.1);
    ctx.fillStyle = pal[Math.floor(r() * pal.length)];
    const s = T - 2.5 + (r() - 0.5) * 1.2; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
  }
  el.appendChild(out);
}
const mark = document.querySelector(".foot__mark");
if (mark) (document.fonts ? document.fonts.load('700 300px "Pilcrow Rounded"').catch(() => {}) : Promise.resolve()).then(() => layMark(mark));

/* one moving picture: the plate drifts as it passes */
const plateImg = document.querySelector(".plate__pic img");
if (plateImg && !reduce) {
  const drift = () => {
    const r = plateImg.parentElement.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, 1 - (r.top + r.height) / (innerHeight + r.height)));
    plateImg.style.transform = `scale(${1.08 - p * 0.08})`;
  };
  addEventListener("scroll", () => requestAnimationFrame(drift), { passive: true });
  drift();
}

/* entrances: heading, then text, then picture, per section */
if (!reduce) {
  const groups = document.querySelectorAll(".plate, .switches, .fields, .faq, .open, .foot");
  groups.forEach((g) => g.querySelectorAll(".h2, .plate__text, .plate__actions, .band__line, .card, .fields__clause, details, .open__copy, .ask, .foot__links").forEach((el, i) => {
    el.classList.add("rise"); el.style.setProperty("--i", Math.min(i, 6));
  }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px 10% 0px" });
  document.querySelectorAll(".rise").forEach((el) => io.observe(el));
}

/* live star count, once the repo has any */
fetch(`https://api.github.com/repos/${SITE.repo}`, { headers: { Accept: "application/vnd.github+json" } })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => { const n = d?.stargazers_count; if (n) document.querySelectorAll("[data-stars]").forEach((el) => (el.textContent = `(${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n})`)); })
  .catch(() => {});
