const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("==================================================");
console.log("  92 SUBARU — TAP-TO-PLAY LANDING PROVING SUITE    ");
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
  ["autoplay-overlay", "gigs-section", "hero-sweep", "f-first", "f-last", "f-email", "f-phone", "f-date", "f-type", "f-location", "f-budget", "f-message", "submit", "reset", "art-filter-bar"].forEach(getOrCreateElement);

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
      const fns = (listeners[event] || []).slice();
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
    assert(elements["autoplay-overlay"].style.display === "flex", "Tap-to-Play retro overlay displays flex on site arrival");
    assert(sandbox.state.idx === 0, "Default track is set to Track 01 ('Dreams')");
    assert(sandbox.state.playing === false, "State playing is FALSE until user interacts (NO fake playing or browser blocks)");
    runTest2(sandbox, elements, doc, win);
  }, 50);
}

// TEST 2: User Gesture Click Anywhere Execution
function runTest2(sandbox, elements, doc, win) {
  console.log("\n[TEST 2] User Gesture Click Anywhere Execution");

  // Dispatch user gesture click anywhere on document
  doc.dispatchEvent("click");

  setTimeout(() => {
    assert(elements["autoplay-overlay"].style.display === "none", "Tap-to-play overlay dismisses smoothly on user click");
    assert(sandbox.state.playing === true, "Audio playback starts and state playing becomes TRUE");
    
    console.log("\n==================================================");
    console.log(`  VERIFICATION RESULTS: ${passCount} Passed, ${failCount} Failed`);
    console.log("==================================================");

    if (failCount > 0) {
      process.exit(1);
    }
  }, 50);
}
