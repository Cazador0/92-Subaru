const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log("==================================================");
console.log("  92 SUBARU — LANDING OVERLAY PROVING SUITE       ");
console.log("==================================================");

const appJsPath = path.join(__dirname, '../public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failCount++;
  }
}

function createDOMContext(audioPlayMock) {
  const elements = {};

  const getOrCreateElement = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        style: {
          display: "none",
          setProperty: () => {},
          background: "",
          color: ""
        },
        dataset: {},
        innerHTML: "",
        textContent: "",
        min: "",
        addEventListener: () => {},
        removeEventListener: () => {},
        querySelector: (sel) => {
          const child = { textContent: "", style: { setProperty: () => {} } };
          return child;
        },
        querySelectorAll: () => [],
        closest: () => null,
        remove: () => {}
      };
    }
    return elements[id];
  };

  // Seed required IDs in index.html
  ["autoplay-overlay", "autoplay-list", "gigs-section", "hero-sweep", "f-first", "f-last", "f-email", "f-phone", "f-date", "f-type", "f-location", "f-budget", "f-message", "submit", "reset", "art-filter-bar"].forEach(getOrCreateElement);

  const listeners = {};

  const doc = {
    getElementById: (id) => getOrCreateElement(id),
    querySelectorAll: () => [],
    querySelector: () => ({ textContent: "", style: {} }),
    addEventListener: (event, fn, opts) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    removeEventListener: (event, fn) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(f => f !== fn);
      }
    },
    dispatchEvent: (event) => {
      const type = typeof event === "string" ? event : event.type;
      const fns = (listeners[type] || []).slice();
      fns.forEach(fn => fn(event));
    }
  };

  const win = {
    document: doc,
    location: { search: "", origin: "https://92subaruband.com" },
    URLSearchParams: class {
      get() { return null; }
    },
    Audio: class MockAudio {
      constructor() {
        this.src = "";
        this.currentTime = 0;
      }
      play() {
        return audioPlayMock();
      }
      pause() {}
      addEventListener() {}
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    setInterval: () => 123,
    clearInterval: () => {},
    fetch: () => Promise.resolve({ ok: false }),
    Date: Date,
    console: console
  };

  win.window = win;
  const sandbox = vm.createContext(win);
  return { sandbox, elements, doc, win };
}

// TEST 1: Page Arrival Landing Overlay Verification
console.log("\n[TEST 1] Page Arrival Landing Overlay Verification");
{
  const { sandbox, elements, doc, win } = createDOMContext(() => Promise.resolve());
  const instrumentedCode = appJsContent.replace("const state =", "window.state =");
  vm.runInContext(instrumentedCode, sandbox);

  setTimeout(() => {
    assert(elements["autoplay-overlay"].style.display === "flex", "Landing overlay displays flex on site arrival");
    assert(sandbox.state.idx === 0, "Default track is set to Track 01 ('Dreams')");
    assert(sandbox.state.playing === false, "State playing is FALSE until user interacts");
    runTest2(sandbox, elements, doc, win);
  }, 50);
}

// TEST 2: White-space dismissal closes the popup without playback
function runTest2(sandbox, elements, doc, win) {
  console.log("\n[TEST 2] White-Space Dismissal Without Playback");

  doc.dispatchEvent({ type: "click", target: null });

  setTimeout(() => {
    assert(elements["autoplay-overlay"].style.display === "none", "White-space click dismisses the landing overlay");
    assert(sandbox.state.playing === false, "White-space dismissal does NOT start audio playback");
    assert(sandbox.state.idx === 0, "Track selection remains unchanged after white-space dismissal");
    runTest3();
  }, 50);
}

// TEST 3: Clicking a track row inside the card still starts playback
function runTest3() {
  console.log("\n[TEST 3] Track Row Click Starts Playback");

  const { sandbox, elements, doc } = createDOMContext(() => Promise.resolve());
  const instrumentedCode = appJsContent.replace("const state =", "window.state =");
  vm.runInContext(instrumentedCode, sandbox);

  setTimeout(() => {
    // Simulate a click on the second track row inside the tape-deck card.
    const target = {
      closest: (sel) => {
        if (sel === ".autoplay-content") return {};
        if (sel === "[data-idx]") return { dataset: { idx: "1" } };
        return null;
      }
    };

    doc.dispatchEvent({ type: "click", target });

    setTimeout(() => {
      assert(sandbox.state.idx === 1, "Clicking a track row selects that track");
      assert(sandbox.state.playing === true, "Clicking a track row starts audio playback");

      console.log("\n==================================================");
      console.log(`  VERIFICATION RESULTS: ${passCount} Passed, ${failCount} Failed`);
      console.log("==================================================");

      if (failCount > 0) {
        process.exit(1);
      }
    }, 50);
  }, 50);
}
