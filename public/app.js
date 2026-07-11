/*
 * '92 Subaru — application logic.
 *
 * A faithful vanilla-JS port of the Xerox-Rave prototype's `class Component`
 * (routing, tape transport, the Web Audio "bootleg-tape rave" synth, and the
 * booking form). The design tool's React runtime (support.js) is intentionally
 * NOT used — this is the shippable recreation the handoff asked for.
 *
 * Data (mixtape tracks + gig dates) is fetched from the Deno server's
 * /api/content endpoint; the booking form POSTs to /api/bookings.
 */
"use strict";

// ---- design knobs (the prototype's tweakable props, via ?query) ------------
const params = new URLSearchParams(location.search);
const PROPS = {
  beatMs: Math.min(220, Math.max(100, Number(params.get("beat")) || 140)),
  sweep: params.get("sweep") !== "0",
};

// ---- fallback content (used if the API is unreachable) ---------------------
const FALLBACK = {
  tracks: {
    A: [
      { n: "A1", t: "Smells Like Teen Spirit", a: "Nirvana", y: 1991, d: 301 },
      { n: "A2", t: "Creep", a: "Radiohead", y: 1992, d: 236 },
      { n: "A3", t: "Wonderwall", a: "Oasis", y: 1995, d: 258 },
      { n: "A4", t: "Losing My Religion", a: "R.E.M.", y: 1991, d: 268 },
      { n: "A5", t: "Bittersweet Symphony", a: "The Verve", y: 1997, d: 358 },
    ],
    B: [
      { n: "B1", t: "I Want It That Way", a: "Backstreet Boys", y: 1999, d: 213 },
      { n: "B2", t: "...Baby One More Time", a: "Britney Spears", y: 1998, d: 211 },
      { n: "B3", t: "Waterfalls", a: "TLC", y: 1995, d: 279 },
      { n: "B4", t: "Wannabe", a: "Spice Girls", y: 1996, d: 173 },
      { n: "B5", t: "Gangsta's Paradise", a: "Coolio", y: 1995, d: 240 },
    ],
  },
  tour: {
    upcoming: [
      { date: "AUG 14", venue: "Trees", city: "Deep Ellum, Dallas", status: "SOLD OUT" },
      { date: "AUG 22", venue: "Tulips FTW", city: "Fort Worth", status: "GET TICKETS" },
      { date: "SEP 05", venue: "The Factory", city: "Deep Ellum, Dallas", status: "GET TICKETS" },
      { date: "SEP 19", venue: "Dan's Silverleaf", city: "Denton", status: "SOLD OUT" },
      { date: "OCT 03", venue: "Texas Live!", city: "Arlington", status: "GET TICKETS" },
    ],
    past: [
      { date: "MAY 10", venue: "Granada Theater", city: "Greenville Ave, Dallas", status: "PLAYED" },
      { date: "APR 18", venue: "Ridglea Theater", city: "Fort Worth", status: "PLAYED" },
      { date: "MAR 21", venue: "Gas Monkey Live", city: "Dallas", status: "PLAYED" },
      { date: "FEB 07", venue: "The Rustic", city: "Uptown, Dallas", status: "PLAYED" },
    ],
  },
};

// ---- state -----------------------------------------------------------------
let DATA = FALLBACK;
const state = {
  page: "home",
  playing: false,
  side: "A",
  idx: 0,
  elapsed: 0,
  flip: 0,
  tf: "upcoming",
  form: { date: "", type: "", location: "", budget: "", message: "" },
  sent: false,
  err: false,
};

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmt(s) {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// ======================================================================
//  TRANSPORT
// ======================================================================
let _timer = null;

function toggle() { state.playing ? pause() : play(); }
function play() { state.playing = true; startTimer(); startAudio(); renderTransport(); }
function pause() { state.playing = false; stopTimer(); stopAudio(); renderTransport(); }
function stop() { state.playing = false; state.elapsed = 0; stopTimer(); stopAudio(); renderTransport(); }

function prev() {
  state.idx = (state.idx + 4) % 5; state.elapsed = 0;
  if (state.playing) restartAudio();
  renderMixtape(); renderTransport();
}
function next() {
  state.idx = (state.idx + 1) % 5; state.elapsed = 0;
  if (state.playing) restartAudio();
  renderMixtape(); renderTransport();
}
function pick(i) {
  state.idx = i; state.elapsed = 0; state.playing = true;
  startTimer(); startAudio();
  renderMixtape(); renderTransport();
}
function setSide(side) {
  if (state.side === side) return;
  state.side = side; state.idx = 0; state.elapsed = 0; state.flip += 360;
  if (state.playing) restartAudio();
  renderMixtape(); renderTransport();
}
function setTour(tf) { state.tf = tf; renderGigs(); }

function startTimer() {
  stopTimer();
  _timer = setInterval(() => {
    const dur = DATA.tracks[state.side][state.idx].d;
    const e = state.elapsed + 0.25;
    if (e >= dur) {
      state.idx = (state.idx + 1) % 5; state.elapsed = 0;
      restartAudio();
      renderMixtape(); renderTransport();
    } else {
      state.elapsed = e;
      renderTime();
    }
  }, 250);
}
function stopTimer() { if (_timer) { clearInterval(_timer); _timer = null; } }

// ======================================================================
//  AUDIO — rave four-on-the-floor through a worn-tape lowpass + hiss
// ======================================================================
let _ac = null, _nb = null, _audio = null;

function ctx() {
  if (!_ac) { const AC = window.AudioContext || window.webkitAudioContext; _ac = new AC(); }
  if (_ac.state === "suspended") _ac.resume();
  return _ac;
}
function noise() {
  const ac = ctx();
  if (!_nb) {
    const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    _nb = b;
  }
  return _nb;
}
function blip(ac, master, freq, type, dur, g, opts) {
  opts = opts || {};
  const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(g, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (opts.lowpass) {
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = opts.lowpass;
    o.connect(lp); lp.connect(env);
  } else o.connect(env);
  env.connect(master);
  if (opts.wobble) {
    const lfo = ac.createOscillator(); lfo.frequency.value = 5.5;
    const lg = ac.createGain(); lg.gain.value = 16;
    lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  o.start(t); o.stop(t + dur + 0.05);
}
function kick(ac, master) {
  const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.24);
}
function hat(ac, master) {
  const t = ac.currentTime;
  const s = ac.createBufferSource(); s.buffer = noise();
  const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6800;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.06);
}
function raveStep(ac, master, step) {
  if (step % 4 === 0) kick(ac, master);
  if (step % 2 === 1) hat(ac, master);
  const bass = [0, 0, 7, 5];
  if (step % 2 === 0) blip(ac, master, 98 * Math.pow(2, bass[Math.floor(step / 2) % 4] / 12), "sawtooth", 0.16, 0.12, { lowpass: 440, wobble: true });
  const lead = [12, 7, 12, 15, 12, 7, 10, 7];
  if (step % 4 !== 2) blip(ac, master, 220 * Math.pow(2, lead[step % lead.length] / 12), "sawtooth", 0.11, 0.055, { lowpass: 2400 });
}
function startAudio() {
  stopAudio();
  let ac;
  try { ac = ctx(); } catch { return; }
  const master = ac.createGain(); master.gain.value = 0;
  const tapeLp = ac.createBiquadFilter(); tapeLp.type = "lowpass"; tapeLp.frequency.value = 5200; tapeLp.Q.value = 0.4;
  master.connect(tapeLp); tapeLp.connect(ac.destination);
  master.gain.setTargetAtTime(0.5, ac.currentTime, 0.05);
  const store = { master, timers: [], nodes: [] };
  const hiss = ac.createBufferSource(); hiss.buffer = noise(); hiss.loop = true;
  const hf = ac.createBiquadFilter(); hf.type = "highpass"; hf.frequency.value = 4600;
  const hg = ac.createGain(); hg.gain.value = 0.03;
  hiss.connect(hf); hf.connect(hg); hg.connect(master); hiss.start();
  store.nodes.push(hiss);
  let step = 0;
  const tick = () => { try { raveStep(ac, master, step); step++; } catch { /* ignore */ } };
  tick(); store.timers.push(setInterval(tick, PROPS.beatMs));
  _audio = store;
}
function stopAudio() {
  const s = _audio;
  if (!s) return;
  try {
    s.timers.forEach((t) => clearInterval(t));
    const ac = _ac;
    s.master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03);
    setTimeout(() => {
      try { s.nodes.forEach((n) => { try { n.stop && n.stop(); } catch { /* */ } }); s.master.disconnect(); } catch { /* */ }
    }, 140);
  } catch { /* */ }
  _audio = null;
}
function restartAudio() { if (state.playing) startAudio(); }

// ======================================================================
//  ROUTING
// ======================================================================
function setPage(p) {
  state.page = p;
  $("view-home").style.display = p === "home" ? "block" : "none";
  $("view-about").style.display = p === "about" ? "block" : "none";
  $("view-contact").style.display = p === "contact" ? "block" : "none";
  applyNav($("nav-home"), p === "home");
  applyNav($("nav-about"), p === "about");
  applyNav($("nav-contact"), p === "contact");
  try { window.scrollTo(0, 0); } catch { /* */ }
}

// ======================================================================
//  STYLE HELPERS (ported from the prototype's seg/nav/badge)
// ======================================================================
function applySeg(el, active, activeBg, activeInk, idleInk, pad) {
  el.style.padding = pad;
  el.style.cursor = "pointer";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.background = active ? activeBg : "transparent";
  el.style.color = active ? activeInk : idleInk;
}
function applyNav(el, active) {
  el.style.cursor = "pointer";
  el.style.color = "#efe8d6";
  el.style.paddingBottom = "2px";
  el.style.borderBottom = active ? "3px solid #d83a2b" : "";
  el.style.opacity = active ? "1" : "0.55";
}
function badgeStyle(st) {
  const base = "font-family:'Anton',sans-serif; font-size:13px; padding:3px 10px; display:inline-block; letter-spacing:.5px; white-space:nowrap;";
  if (st === "SOLD OUT") return base + "border:2px solid #d83a2b; color:#d83a2b; transform:rotate(-3deg);";
  if (st === "GET TICKETS") return base + "background:#efe8d6; color:#17140f;";
  return base + "color:#8a856f; border:1px dashed #55503f;";
}

// ======================================================================
//  RENDER
// ======================================================================
function renderTime() {
  const dur = DATA.tracks[state.side][state.idx].d;
  const pct = Math.min(100, (state.elapsed / dur) * 100);
  $("deck-elapsed").textContent = fmt(state.elapsed);
  $("deck-progress").style.width = pct + "%";
}

function renderTransport() {
  const track = DATA.tracks[state.side][state.idx] || DATA.tracks[state.side][0];
  $("deck-side").textContent = state.side;
  $("cass-side").textContent = state.side;
  $("deck-title").textContent = track.t;
  $("deck-meta").textContent = `${track.n} · ${track.a} · ${track.y}`;
  $("deck-dur").textContent = fmt(track.d);
  renderTime();

  $("icon-pause").style.display = state.playing ? "" : "none";
  $("icon-play").style.display = state.playing ? "none" : "";

  applySeg($("tab-a"), state.side === "A", "#efe8d6", "#17140f", "#efe8d6", "6px 13px");
  applySeg($("tab-b"), state.side === "B", "#efe8d6", "#17140f", "#efe8d6", "6px 13px");
  applySeg($("mix-a"), state.side === "A", "#17140f", "#efe8d6", "#17140f", "7px 15px");
  applySeg($("mix-b"), state.side === "B", "#17140f", "#efe8d6", "#17140f", "7px 15px");

  // cassette motion
  const reelSpeed = (1.05 * PROPS.beatMs / 140).toFixed(2) + "s";
  const cass = $("cass").style;
  cass.setProperty("--reel-play", state.playing ? "running" : "paused");
  cass.setProperty("--reel-speed", reelSpeed);
  cass.setProperty("--cass-flip", state.flip + "deg");
}

const MINI_EQ =
  '<span style="display:inline-flex; align-items:flex-end; gap:2px; height:16px; width:22px;">' +
  '<span style="width:4px; height:100%; background:#17140f; transform-origin:bottom; animation:eqbar .6s ease-in-out infinite;"></span>' +
  '<span style="width:4px; height:100%; background:#17140f; transform-origin:bottom; animation:eqbar .6s ease-in-out infinite; animation-delay:.15s;"></span>' +
  '<span style="width:4px; height:100%; background:#17140f; transform-origin:bottom; animation:eqbar .6s ease-in-out infinite; animation-delay:.3s;"></span>' +
  "</span>";

function renderMixtape() {
  const rows = DATA.tracks[state.side];
  $("mix-list").innerHTML = rows.map((t, i) => {
    const active = i === state.idx;
    const adorn = active
      ? '<div style="position:absolute; left:44px; right:70px; bottom:6px; height:6px; background:#d83a2b; opacity:.45; transform:rotate(-.5deg); border-radius:3px; pointer-events:none;"></div>' + MINI_EQ
      : "";
    return (
      `<div class="mix-row" data-pick="${i}" style="position:relative; display:flex; align-items:center; gap:16px; padding:11px 6px; cursor:pointer; border-bottom:1px dotted #17140f;">` +
      `<div style="font-family:'Courier Prime',monospace; font-weight:700; font-size:15px; width:30px;">${esc(t.n)}</div>` +
      `<div style="flex:1; min-width:0;"><span style="font-family:'Courier Prime',monospace; font-weight:700; font-size:17px;">${esc(t.t)}</span>` +
      `<span style="font-size:12px; opacity:.7;"> — ${esc(t.a)}, ${esc(t.y)}</span></div>` +
      `<div style="font-family:'Courier Prime',monospace; font-size:14px;">${fmt(t.d)}</div>` +
      adorn +
      `</div>`
    );
  }).join("");
}

function renderGigs() {
  const rows = state.tf === "past" ? DATA.tour.past : DATA.tour.upcoming;
  $("gig-list").innerHTML = rows.map((g) =>
    `<div style="display:grid; grid-template-columns:120px 1fr 130px; gap:16px; align-items:center; padding:14px 0; border-bottom:1px dashed #55503f;">` +
    `<div style="font-family:'Anton',sans-serif; font-size:20px; color:#d83a2b;">${esc(g.date)}</div>` +
    `<div><span style="font-family:'Courier Prime',monospace; font-weight:700; font-size:16px;">${esc(g.venue)}</span>` +
    `<span style="font-size:12px; opacity:.65;"> / ${esc(g.city)}</span></div>` +
    `<div style="justify-self:end;"><span style="${badgeStyle(g.status)}">${esc(g.status)}</span></div>` +
    `</div>`
  ).join("");
  applySeg($("tour-up"), state.tf !== "past", "#d83a2b", "#efe8d6", "#efe8d6", "6px 14px");
  applySeg($("tour-past"), state.tf === "past", "#d83a2b", "#efe8d6", "#efe8d6", "6px 14px");
}

// ======================================================================
//  FORM  (validates client-side, then POSTs to /api/bookings)
// ======================================================================
function setField(k, v) { state.form[k] = v; state.err = false; $("form-err").style.display = "none"; }

async function submit() {
  const f = state.form;
  if (!f.date || !f.location || !f.message) {
    state.err = true; $("form-err").style.display = "block"; return;
  }
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      state.err = true;
      $("form-err").textContent = "⚠ " + (body.error || "Something went wrong — try again.");
      $("form-err").style.display = "block";
      return;
    }
  } catch {
    state.err = true;
    $("form-err").textContent = "⚠ Couldn't reach the server — check your connection.";
    $("form-err").style.display = "block";
    return;
  }
  state.sent = true;
  $("form-body").style.display = "none";
  $("form-sent").style.display = "block";
  try { window.scrollTo(0, 0); } catch { /* */ }
}
function resetForm() {
  state.sent = false; state.err = false;
  state.form = { date: "", type: "", location: "", budget: "", message: "" };
  ["f-date", "f-type", "f-location", "f-budget", "f-message"].forEach((id) => { $(id).value = ""; });
  $("form-err").style.display = "none";
  $("form-body").style.display = "block";
  $("form-sent").style.display = "none";
}

// ======================================================================
//  WIRE-UP
// ======================================================================
function wire() {
  // nav / CTAs (any element with data-go)
  document.querySelectorAll("[data-go]").forEach((el) =>
    el.addEventListener("click", () => setPage(el.dataset.go))
  );
  // transport
  $("btn-prev").addEventListener("click", prev);
  $("btn-play").addEventListener("click", toggle);
  $("btn-stop").addEventListener("click", stop);
  $("btn-next").addEventListener("click", next);
  $("tab-a").addEventListener("click", () => setSide("A"));
  $("tab-b").addEventListener("click", () => setSide("B"));
  $("mix-a").addEventListener("click", () => setSide("A"));
  $("mix-b").addEventListener("click", () => setSide("B"));
  $("tour-up").addEventListener("click", () => setTour("upcoming"));
  $("tour-past").addEventListener("click", () => setTour("past"));
  // mixtape rows (delegated — rows are re-rendered)
  $("mix-list").addEventListener("click", (e) => {
    const row = e.target.closest("[data-pick]");
    if (row) pick(Number(row.dataset.pick));
  });
  // form
  $("f-date").addEventListener("input", (e) => setField("date", e.target.value));
  $("f-type").addEventListener("change", (e) => setField("type", e.target.value));
  $("f-location").addEventListener("input", (e) => setField("location", e.target.value));
  $("f-budget").addEventListener("change", (e) => setField("budget", e.target.value));
  $("f-message").addEventListener("input", (e) => setField("message", e.target.value));
  $("submit").addEventListener("click", submit);
  $("reset").addEventListener("click", resetForm);

  // design knobs
  if (!PROPS.sweep) $("hero-sweep").style.display = "none";
}

async function loadContent() {
  try {
    const res = await fetch("/api/content");
    if (res.ok) {
      const data = await res.json();
      if (data && data.tracks && data.tour) DATA = data;
    }
  } catch { /* keep FALLBACK */ }
}

async function main() {
  wire();
  await loadContent();
  setPage("home");
  renderMixtape();
  renderGigs();
  renderTransport();
}

main();
