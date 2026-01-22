# LogicArt Integration Guide

## How to use LogicArt in a Replit app

LogicArt is a tiny runtime visualizer that gives you:

* a floating **Overlay** toolbar (play / pause / step / speed)
* a **Speed Governor** – `await LogicArt.checkpoint(id)` lets you slow down execution
* a **Ghost‑Diff** engine that shows added / removed / changed code nodes

You can add it to any Replit web project – static HTML, Vite, Next.js, etc.

---

### 1️⃣ Install the library (local dev version)

```bash
# From the root of your Replit workspace
# If you already have the LogicArt repo cloned next to your app:
npm install ./LogicArt          # installs the local copy
# OR, once we publish to npm you could do:
# npm install logicart-core
```

---

### 2️⃣ Choose the integration style

#### A. Plain HTML (no bundler)

1. Copy `LogicArt/dist/logicart.min.js` into your Replit folder (e.g. `public/dist/`).
2. Add the script tag and initialise the overlay:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Replit App + LogicArt</title>
</head>
<body>
  <button id="runBtn">Run Demo</button>

  <!-- Load LogicArt -->
  <script src="./dist/logicart.min.js"></script>

  <!-- Initialise the overlay -->
  <script>
    const logicart = new LogicArtOverlay({
      speed: 1.0,
      debug: true,
      position: 'bottom-right'
    }).init();
  </script>

  <!-- Example code with checkpoints -->
  <script>
    async function demo() {
      const items = [1,2,3,4,5];
      let sum = 0;
      for (let i = 0; i < items.length; i++) {
        await LogicArt.checkpoint(`loop-${i}`);   // <-- pause here
        sum += items[i];
      }
      console.log('Result:', sum);
    }

    document.getElementById('runBtn').addEventListener('click', demo);
  </script>
</body>
</html>
```

Open the page (Replit “Run” → preview). The LogicArt toolbar appears in the bottom‑right. Use it to play, pause, step, or change speed.

---

#### B. Project that already uses a bundler (Vite, Webpack, etc.)

1. Install the package as shown in step 1.
2. Import the ES‑module build:

```js
// src/main.js (or wherever your entry point lives)
import LogicArtOverlay from 'logicart-core/dist/logogo.esm.js';   // default export
import ExecutionController from 'logicart-core/src/runtime.js';
import LogicArtParser from 'logicart-core/src/parser.js';
import LogicArtDiffer from 'logicart-core/src/differ.js';

// Initialise the overlay (you can also expose it globally if you like)
const overlay = new LogicArtOverlay({
  speed: 1.0,
  debug: false,
  position: 'bottom-right'
}).init();

window.LogicArt = overlay; // optional – lets you call LogicArt.checkpoint anywhere
```

3. Add checkpoints in any async function:

```js
async function fetchData() {
  await LogicArt.checkpoint('fetch-start');
  const resp = await fetch('/api/data');
  const data = await resp.json();
  await LogicArt.checkpoint('fetch-done');
  console.log(data);
}
```

4. Run the Replit (`npm run dev` or the default “Run” button). The toolbar will be injected automatically.

---

#### C. Quick local copy (no npm publish needed)

If you just want to experiment, you can **copy the `src/` folder** into your Replit project and import directly:

```js
import LogicArtOverlay from './src/overlay.js';
import ExecutionController from './src/runtime.js';
import LogicArtParser from './src/parser.js';
import LogicArtDiffer from './src/differ.js';
```

No extra build step is required – the files are plain ES‑modules.

---

### 3️⃣ Using the Ghost‑Diff engine (optional)

```js
const oldCode = `function add(a,b){return a+b;}`;
const newCode = `function add(a,b){return Number(a)+Number(b);}`;

const oldTree = LogicArtParser.parse(oldCode);
const newTree = LogicArtParser.parse(newCode);
const diff = LogicArtDiffer.diffTrees(oldTree, newTree);

console.log(diff.stats); // {added:0, removed:0, modified:1, unchanged:1}
console.log(diff.nodes); // each node has diffStatus & className for UI rendering
```

You can render `diff.nodes` however you like (list, flow‑chart, etc.). The demo `example/ghost_diff.html` already shows a simple visualisation – copy that markup into your own component if you want.

---

### 4️⃣ TL;DR Checklist (copy‑paste into a Replit comment)

```
1️⃣ npm install ./LogicArt   # or npm i logicart-core after publishing
2️⃣ Choose integration style:
   • Plain HTML → <script src="dist/logicart.min.js"></script>
   • Bundler → import LogicArtOverlay from 'logicart-core/dist/logogo.esm.js';
3️⃣ Initialise:
   const logicart = new LogicArtOverlay({speed:1, position:'bottom-right'}).init();
4️⃣ Add checkpoints:
   await LogicArt.checkpoint('my-node-id');
5️⃣ (Optional) Diff two code strings with LogicArtDiffer.
6️⃣ Run → use the toolbar to play/pause/step/speed.
```

---

## 📚 How this relates to the LogicArt Replit prototype you already have

| What you built in Replit (prototype) | What you have now (core library) | How they connect |
|--------------------------------------|----------------------------------|------------------|
| **Full UI** with React Flow, custom parser, UI panels, AI‑generated code editor. | **Three independent modules** (`overlay.js`, `runtime.js`, `differ.js`) that can be dropped into *any* web page. | The prototype used the same underlying concepts (overlay, checkpoints, diff). We extracted those concepts into a **stand‑alone library** that you can import instead of copying the whole prototype. |
| **Demo page** (`example/index.html`) that you ran inside the Replit preview. | **`example/complete_demo.html`** that shows the same three features together, but now built from the library. | The demo is a lightweight wrapper around the library – you can keep it as a reference or delete it once you embed LogicArt in your own app. |
| **Custom code** you wrote in the prototype’s React components. | **Your own app’s code** – you just add `await LogicArt.checkpoint(...)` wherever you want to visualise execution. | No need to keep the whole prototype; you only need the overlay + checkpoint calls. |
| **GitHub repo** where you pushed the prototype. | **GitHub repo** now contains the **core library** (`src/` + `dist/`) plus the demo files. | You can clone this repo into any Replit workspace, install it locally (`npm install ./LogicArt`), and use it as a dependency. |

In short:
- The original Replit project was a *showcase* of the idea.
- The current repository is the *engine* you can reuse anywhere, including in new Replit apps.
- You can keep the prototype as a reference, but for production or any new Replit project you only need to **install the library** and **add a few lines of code** (as shown above).

---

## 🙋‍♂️ Need help from Replit’s AI?

1. Paste the `LOGICART_INTEGRATION.md` content into a new file or a comment block.
2. Ask Replit’s AI:
   *“How do I import LogicArtOverlay in a Vite project?”*
   *“Why does `import LogicArtOverlay from 'logicart-core/dist/logogo.esm.js'` give me a ‘module not found’ error?”*
   *“Can you show me a minimal HTML page that uses LogicArt checkpoints?”*

The AI will read the markdown you just added and give you step‑by‑step answers, suggestions, or even auto‑generate the missing code for you.

---

### 🎉 You’re ready!

- **Copy** the markdown block into your Replit workspace.
- **Run** the `npm install` command.
- **Add** the overlay initialisation and a few `await LogicArt.checkpoint(...)` calls.
- **Open** the preview – you’ll see the LogicArt toolbar and can start playing with speed, pause, step, and diff.

If anything feels fuzzy (path issues, bundler config, etc.), just drop the exact error message here and I’ll walk you through the fix. Happy visualising!
