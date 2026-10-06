// Run with: node scripts/test-mobile-audio.js
// Model mobile browsers that only unlock Web Audio during the play gesture.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../public/app.js"), "utf8")
  .replace(/main\(\);\s*$/, "");

function setup({ webAudio = true } = {}) {
  const bars = Array.from({ length: 9 }, () => ({ style: {} }));
  const elements = new Map();
  const frames = new Map();
  let gesture = false;
  let context;
  let sourceCount = 0;
  let frameId = 0;
  let resolvePlay;
  let rejectPlay;
  let level = 80;

  const sandbox = vm.createContext({
    console,
    location: { search: "", origin: "https://example.test" },
    URLSearchParams,
    document: {
      querySelectorAll: () => bars,
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, {
          style: { setProperty() {} }, querySelector: () => null,
        });
        return elements.get(id);
      },
      addEventListener() {}, removeEventListener() {},
    },
    localStorage: { setItem() {} },
    Audio: class {
      constructor() { this.src = ""; this.currentTime = 0; }
      addEventListener() {}
      pause() {}
      play() {
        assert.ok(gesture, "native playback starts during the tap");
        if (webAudio) assert.equal(context.state, "running", "Web Audio unlocks before audio.play()");
        return new Promise((resolve, reject) => { resolvePlay = resolve; rejectPlay = reject; });
      }
    },
    AudioContext: class {
      constructor() {
        if (!webAudio) throw new Error("Web Audio unavailable");
        assert.ok(gesture, "audio context is created during the tap");
        this.state = "suspended";
        context = this;
      }
      resume() {
        assert.ok(gesture, "audio context resumes during the tap");
        this.state = "running";
        return Promise.resolve();
      }
      createMediaElementSource() { sourceCount++; return { connect() {} }; }
      createAnalyser() {
        return { frequencyBinCount: 256, connect() {}, getByteFrequencyData(data) { data.fill(level); } };
      }
    },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setInterval() { return 1; }, clearInterval() {},
  });
  sandbox.window = sandbox;
  const run = (code) => vm.runInContext(code, sandbox);
  const tap = () => { gesture = true; try { run("play()"); } finally { gesture = false; } };
  const settle = async (success = true) => {
    if (success) resolvePlay(); else rejectPlay(new Error("playback rejected"));
    await new Promise(setImmediate);
  };
  return { bars, frames, run, tap, settle, context: () => context, sourceCount: () => sourceCount,
    frame() {
      const [id, draw] = frames.entries().next().value;
      frames.delete(id);
      level = 180;
      draw();
    },
    load() { vm.runInContext(source, sandbox); },
  };
}

(async () => {
  const app = setup();
  app.load();
  app.tap();
  assert.equal(app.frames.size, 0, "EQ waits for successful native playback");
  await app.settle();
  const first = app.bars.map(bar => bar.style.transform);
  app.frame();
  assert.notDeepEqual(app.bars.map(bar => bar.style.transform), first, "EQ responds to changing audio levels");
  app.run("pause()");
  assert.equal(app.frames.size, 0, "pause cancels the EQ frame");
  assert.ok(app.bars.every(bar => bar.style.transform === "scaleY(0.12)"), "pause resets the bars");

  for (const state of ["suspended", "interrupted"]) {
    app.context().state = state;
    app.tap();
    await app.settle();
    assert.equal(app.context().state, "running", `play recovers a ${state} context`);
    assert.equal(app.sourceCount(), 1, "replay reuses the media source");
    app.run("stop()");
    assert.equal(app.frames.size, 0, "stop cancels the EQ frame");
  }

  app.tap();
  await app.settle();
  app.tap();
  await app.settle(false);
  assert.equal(app.frames.size, 0, "failed playback stops an existing EQ loop");
  assert.equal(app.run("state.playing"), false);

  const fallback = setup({ webAudio: false });
  fallback.load();
  fallback.tap();
  await fallback.settle();
  assert.equal(fallback.run("state.playing"), true, "native audio still plays without Web Audio");
  console.log("Mobile audio checks passed: gesture activation, live EQ, pause/stop, replay, interruption, failure, fallback.");
})().catch(error => { console.error(error); process.exitCode = 1; });
