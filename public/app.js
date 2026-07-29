/*
 * '92 Subaru — application logic.
 *
 * Vanilla-JS app: routing (Home/About/Book), the Soundtrack deck (single
 * ordered track list — no Side A/B), the Web Audio "bootleg-tape" synth
 * (placeholder until the YouTube player, issue #12), and the booking form
 * (POSTs to /api/bookings, which emails the band).
 *
 * Content comes from /api/content with an embedded fallback.
 */
"use strict";

// ---- launch config ----------------------------------------------------------
// Gigs is hidden for launch (issue #26): false removes the panel from the DOM
// (it has no nav entry). Re-enabling is this one-line flip.
const SHOW_GIGS = false;

// ---- design knobs (via ?query) ---------------------------------------------
const params = new URLSearchParams(location.search);
const PROPS = {
  beatMs: Math.min(220, Math.max(100, Number(params.get("beat")) || 140)),
  sweep: params.get("sweep") !== "0",
};

// ---- fallback content (used if the API is unreachable) ---------------------
const FALLBACK = {
  tracks: [
    { n: "01", t: "Iris", a: "Goo Goo Dolls", y: 1998, d: 289, yt: "nzMBn6Q89zk", src: "/assets/audio/iris.mp4" },
    { n: "02", t: "Kiss Me", a: "Sixpence None the Richer", y: 1997, d: 208, yt: "8OhiOI-b4ms", src: "/assets/audio/kiss-me.mp4" },
    { n: "03", t: "Dreams", a: "The Cranberries", y: 1992, d: 269, yt: "q8UCkjbgn5s", src: "/assets/audio/dreams.mp4" },
  ],
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
  idx: 0,
  elapsed: 0,
  tf: "upcoming",
  form: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    type: "",
    location: "",
    budget: "",
    message: "",
  },
  sent: false,
  err: false,
};

// Required booking fields (FR-001) in form order, with the labels the
// inline "missing field" error uses.
const REQUIRED_FIELDS = [
  ["firstName", "first name"],
  ["lastName", "last name"],
  ["email", "email"],
  ["date", "event date"],
  ["location", "location"],
  ["message", "message"],
];

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmt(s) {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
const trackCount = () => DATA.tracks.length;

// ======================================================================
//  NATIVE HTML5 AUDIO ENGINE & TRANSPORT (Option 1)
// ======================================================================
let _audioEngine = null;
let _timer = null;

function getAudioEngine() {
  if (!_audioEngine) {
    _audioEngine = new Audio();
    _audioEngine.preload = "auto";
    _audioEngine.addEventListener("ended", () => {
      next();
    });
    _audioEngine.addEventListener("timeupdate", () => {
      if (state.playing && typeof _audioEngine.currentTime === "number" && _audioEngine.currentTime > 0) {
        state.elapsed = _audioEngine.currentTime;
        renderTime();
      }
    });
  }
  return _audioEngine;
}

function playTrack(autoplay = true) {
  const track = DATA.tracks[state.idx];
  if (!track) return;
  const audio = getAudioEngine();
  const src = track.src || `/assets/audio/${track.t.toLowerCase().replace(/[^a-z0-9]/g, "-")}.mp4`;
  
  if (audio.src !== window.location.origin + src && !audio.src.endsWith(src)) {
    audio.src = src;
    audio.currentTime = 0;
  }
  if (autoplay) {
    audio.play().catch(() => {
      startAudio();
    });
  }
}

function toggle() { state.playing ? pause() : play(); }

function play() {
  state.playing = true;
  playTrack(true);
  startTimer();
  renderTransport();
  renderSoundtrack();
}

function pause() {
  state.playing = false;
  stopTimer();
  if (_audioEngine) _audioEngine.pause();
  stopAudio();
  renderTransport();
  renderSoundtrack();
}

function stop() {
  state.playing = false;
  state.elapsed = 0;
  stopTimer();
  if (_audioEngine) {
    _audioEngine.pause();
    _audioEngine.currentTime = 0;
  }
  stopAudio();
  renderTransport();
  renderSoundtrack();
}

function prev() {
  state.idx = (state.idx + trackCount() - 1) % trackCount();
  state.elapsed = 0;
  playTrack(state.playing);
  if (state.playing) startTimer();
  renderSoundtrack();
  renderTransport();
}

function next() {
  state.idx = (state.idx + 1) % trackCount();
  state.elapsed = 0;
  playTrack(state.playing);
  if (state.playing) startTimer();
  renderSoundtrack();
  renderTransport();
}

function pick(i) {
  state.idx = i;
  state.elapsed = 0;
  state.playing = true;
  playTrack(true);
  startTimer();
  renderSoundtrack();
  renderTransport();
}

function setTour(tf) { state.tf = tf; renderGigs(); }

function startTimer() {
  stopTimer();
  _timer = setInterval(() => {
    const dur = DATA.tracks[state.idx] ? DATA.tracks[state.idx].d : 240;
    let e = state.elapsed + 0.25;
    if (_audioEngine && typeof _audioEngine.currentTime === "number" && _audioEngine.currentTime > 0) {
      e = _audioEngine.currentTime;
    }
    if (e >= dur) {
      state.idx = (state.idx + 1) % trackCount();
      state.elapsed = 0;
      playTrack(true);
      renderSoundtrack();
      renderTransport();
    } else {
      state.elapsed = e;
      renderTime();
    }
  }, 250);
}
function stopTimer() { if (_timer) { clearInterval(_timer); _timer = null; } }

// ======================================================================
//  AUDIO — rave four-on-the-floor through a worn-tape lowpass + hiss
//  (placeholder sound until the embedded YouTube player, issue #12)
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
//  ROUTING  (nav: HOME / ABOUT / BOOK — "contact" is the Book view id)
// ======================================================================
function setPage(p) {
  state.page = p;
  $("view-home").style.display = p === "home" ? "block" : "none";
  $("view-about").style.display = p === "about" ? "block" : "none";
  $("view-contact").style.display = p === "contact" ? "block" : "none";
  applyNav($("nav-home"), p === "home");
  applyNav($("nav-about"), p === "about");
  try { window.scrollTo(0, 0); } catch { /* */ }
}

// ======================================================================
//  STYLE HELPERS
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
  const dur = DATA.tracks[state.idx].d;
  const pct = Math.min(100, (state.elapsed / dur) * 100);
  $("deck-elapsed").textContent = fmt(state.elapsed);
  $("deck-progress").style.width = pct + "%";
}

function renderTransport() {
  const track = DATA.tracks[state.idx] || DATA.tracks[0];
  $("deck-title").textContent = track.t;
  $("deck-meta").textContent = `${track.n} · ${track.a} · ${track.y}`;
  $("deck-dur").textContent = fmt(track.d);
  renderTime();

  $("icon-pause").style.display = state.playing ? "" : "none";
  $("icon-play").style.display = state.playing ? "none" : "";

  // cassette motion (reels only — flip removed with Side A/B)
  const reelSpeed = (1.05 * PROPS.beatMs / 140).toFixed(2) + "s";
  const cass = $("cass").style;
  cass.setProperty("--reel-play", state.playing ? "running" : "paused");
  cass.setProperty("--reel-speed", reelSpeed);
}

const MINI_EQ =
  '<span style="display:inline-flex; align-items:flex-end; gap:2px; height:16px; width:22px;">' +
  '<span style="width:4px; height:100%; background:#17140f; transform-origin:bottom; animation:eqbar .6s ease-in-out infinite;"></span>' +
  '<span style="width:4px; height:100%; background:#17140f; transform-origin:bottom; animation:eqbar .6s ease-in-out infinite; animation-delay:.15s;"></span>' +
  '<span style="width:4px; height:100%; background:#17140f; transform-origin:bottom; animation:eqbar .6s ease-in-out infinite; animation-delay:.3s;"></span>' +
  "</span>";

function renderSoundtrack() {
  $("mix-list").innerHTML = DATA.tracks.map((t, i) => {
    const active = i === state.idx;
    const adorn = active
      ? '<div style="position:absolute; left:44px; right:70px; bottom:6px; height:6px; background:#d83a2b; opacity:.45; transform:rotate(-.5deg); border-radius:3px; pointer-events:none;"></div>' + MINI_EQ
      : "";
    const ytBtn = t.yt
      ? `<a href="https://youtu.be/${esc(t.yt)}" target="_blank" rel="noopener" style="background:#d83a2b; color:#efe8d6; font-family:'Anton',sans-serif; font-size:11px; letter-spacing:1px; padding:3px 8px; border-radius:2px; text-decoration:none; margin-left:8px; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation();">▶ YOUTUBE</a>`
      : "";
    return (
      `<div class="mix-row" data-pick="${i}" style="position:relative; display:flex; align-items:center; gap:16px; padding:11px 6px; cursor:pointer; border-bottom:1px dotted #17140f;">` +
      `<div style="font-family:'Courier Prime',monospace; font-weight:700; font-size:15px; width:30px;">${esc(t.n)}</div>` +
      `<div style="flex:1; min-width:0;"><span style="font-family:'Courier Prime',monospace; font-weight:700; font-size:17px;">${esc(t.t)}</span>` +
      `<span style="font-size:12px; opacity:.7;"> — ${esc(t.a)}, ${esc(t.y)}</span>${ytBtn}</div>` +
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
//  FORM  (validates client-side, then POSTs to /api/bookings → email)
// ======================================================================
function setField(k, v) { state.form[k] = v; state.err = false; $("form-err").style.display = "none"; }

async function submit() {
  const f = state.form;
  const missing = REQUIRED_FIELDS.filter(([k]) => !f[k].trim()).map(([, label]) => label);
  if (missing.length) {
    state.err = true;
    $("form-err").textContent = "⚠ Fill in: " + missing.join(", ") + ".";
    $("form-err").style.display = "block";
    return;
  }

  // reCAPTCHA v2 (FR-004): when the script loaded, the checkbox is required;
  // when it never loaded (null), fail open — the server still applies the
  // honeypot and rate limit.
  let recaptchaToken = null;
  if (window.grecaptcha && typeof grecaptcha.getResponse === "function") {
    try { recaptchaToken = grecaptcha.getResponse(); } catch { recaptchaToken = null; }
  }
  if (recaptchaToken === "") {
    state.err = true;
    $("form-err").textContent = "⚠ Please confirm you're not a robot.";
    $("form-err").style.display = "block";
    return;
  }

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.assign({}, f, {
        website: $("f-website").value,
        recaptchaToken: recaptchaToken || "",
      })),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      state.err = true;
      $("form-err").textContent = "⚠ " + (body.error || "Something went wrong — try again.");
      $("form-err").style.display = "block";
      resetRecaptcha(); // tokens are single-use
      return;
    }
  } catch {
    state.err = true;
    $("form-err").textContent = "⚠ Couldn't reach the server — check your connection.";
    $("form-err").style.display = "block";
    resetRecaptcha();
    return;
  }
  state.sent = true;
  $("form-body").style.display = "none";
  $("form-sent").style.display = "block";
  try { window.scrollTo(0, 0); } catch { /* */ }
}
function resetRecaptcha() {
  try { if (window.grecaptcha) grecaptcha.reset(); } catch { /* */ }
}

function resetForm() {
  state.sent = false; state.err = false;
  state.form = {
    firstName: "", lastName: "", email: "", phone: "",
    date: "", type: "", location: "", budget: "", message: "",
  };
  ["f-first", "f-last", "f-email", "f-phone", "f-date", "f-type", "f-location", "f-budget", "f-message", "f-website"].forEach((id) => { $(id).value = ""; });
  resetRecaptcha();
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
  $("btn-next").addEventListener("click", next);
  if (SHOW_GIGS) {
    $("tour-up").addEventListener("click", () => setTour("upcoming"));
    $("tour-past").addEventListener("click", () => setTour("past"));
  }
  // soundtrack rows (delegated — rows are re-rendered)
  $("mix-list").addEventListener("click", (e) => {
    const row = e.target.closest("[data-pick]");
    if (row) pick(Number(row.dataset.pick));
  });

  // artist repertoire logo vault filter buttons
  const filterBar = $("artist-filter-bar");
  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".art-filter-btn");
      if (!btn) return;
      const cat = btn.dataset.cat;
      filterBar.querySelectorAll(".art-filter-btn").forEach((b) => {
        const active = b === btn;
        b.style.background = active ? "#17140f" : "#fffdf5";
        b.style.color = active ? "#efe8d6" : "#17140f";
      });
      document.querySelectorAll("#artist-logo-grid .artist-badge").forEach((el) => {
        if (cat === "all" || el.dataset.cat === cat) {
          el.style.display = "inline-flex";
        } else {
          el.style.display = "none";
        }
      });
    });
  }
  // form (fields per FR-001)
  $("f-first").addEventListener("input", (e) => setField("firstName", e.target.value));
  $("f-last").addEventListener("input", (e) => setField("lastName", e.target.value));
  $("f-email").addEventListener("input", (e) => setField("email", e.target.value));
  $("f-phone").addEventListener("input", (e) => setField("phone", e.target.value));
  $("f-date").addEventListener("input", (e) => setField("date", e.target.value));
  $("f-type").addEventListener("change", (e) => setField("type", e.target.value));
  $("f-location").addEventListener("input", (e) => setField("location", e.target.value));
  $("f-budget").addEventListener("change", (e) => setField("budget", e.target.value));
  $("f-message").addEventListener("input", (e) => setField("message", e.target.value));
  $("submit").addEventListener("click", submit);
  $("reset").addEventListener("click", resetForm);

  // Event Date can't be in the past (FR-003) — set min to today, local time.
  const now = new Date();
  const today = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
  $("f-date").min = today;

  // design knobs
  if (!PROPS.sweep) $("hero-sweep").style.display = "none";
}

async function loadContent() {
  try {
    const res = await fetch("/api/content");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tracks) && data.tracks.length && data.tour) DATA = data;
    }
  } catch { /* keep FALLBACK */ }
}

async function main() {
  if (!SHOW_GIGS) $("gigs-section").remove();
  wire();
  await loadContent();
  setPage("home");
  renderSoundtrack();
  if (SHOW_GIGS) renderGigs();
  renderTransport();
  playTrack(false);
}

main();
