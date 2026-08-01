const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("==================================================");
console.log("  92 SUBARU — AUTOPLAY & UI SYNC PROVING SUITE    ");
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
      const fns = listeners[event] || [];
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

// TEST 1: Permissive Environment
console.log("\n[TEST 1] Permissive Environment — Direct Autoplay Allowed");
{
  const { sandbox, elements } = createDOMContext(() => Promise.resolve());
  const instrumentedCode = appJsContent.replace("const state =", "window.state =");
  vm.runInContext(instrumentedCode, sandbox);

  setTimeout(() => {
    assert(sandbox.state.playing === true, "State playing is true when audio.play() resolves");
    assert(elements["autoplay-overlay"].style.display === "none", "Autoplay overlay remains hidden when direct play succeeds");
    runTest2();
  }, 50);
}

// TEST 2: Restricted Environment (New Tab Autoplay Policy Rejection)
function runTest2() {
  console.log("\n[TEST 2] Restricted Environment — New Tab Autoplay Policy Rejection");
  const { sandbox, elements, doc, win } = createDOMContext(() => {
    const err = new Error("play() failed because the user didn't interact with the document first.");
    err.name = "NotAllowedError";
    return Promise.reject(err);
  });

  const instrumentedCode = appJsContent.replace("const state =", "window.state =");
  vm.runInContext(instrumentedCode, sandbox);

  setTimeout(() => {
    assert(sandbox.state.playing === false, "State playing is FALSE when audio.play() is rejected by browser policy (NO fake playing!)");
    assert(elements["autoplay-overlay"].style.display === "flex", "Autoplay retro overlay displays flex when autoplay is blocked");
    
    runTest3(sandbox, elements, doc, win);
  }, 50);
}

// TEST 3: User Gesture Capture
function runTest3(sandbox, elements, doc, win) {
  console.log("\n[TEST 3] User Gesture Capture — Tap Anywhere to Start Tape");
  
  // Override mock audio play to resolve upon user gesture
  win.Audio.prototype.play = () => Promise.resolve();
  if (sandbox._audioEngine) {
    sandbox._audioEngine.play = () => Promise.resolve();
  }

  // Dispatch user gesture click
  doc.dispatchEvent("click");

  setTimeout(() => {
    assert(elements["autoplay-overlay"].style.display === "none", "Autoplay overlay is dismissed upon user tap");
    assert(sandbox.state.playing === true, "State playing transitions to TRUE on user gesture");
    
    console.log("\n==================================================");
    console.log(`  VERIFICATION RESULTS: ${passCount} Passed, ${failCount} Failed`);
    console.log("==================================================");

    if (failCount > 0) {
      process.exit(1);
    }
  }, 50);
}
