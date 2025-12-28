# LogiGo: See Your Code as a Flowchart

**LogiGo** turns your JavaScript into visual flowcharts so you can *see* how your code works instead of just reading it.

---

## How to Use LogiGo

### Option 1: Paste and Go (Easiest)

1. Open LogiGo Studio
2. Paste your JavaScript function into the code editor
3. See your flowchart instantly

**That's it.** No installation, no setup.

---

### Option 2: Connect Your App (One Script Tag)

Add one line to your app's HTML to connect it to LogiGo:

```html
<script src="https://YOUR-LOGIGO-URL/remote.js?project=MyApp"></script>
```

Then tell your AI agent:

> "Add checkpoint() calls to track my frontend code. The checkpoint function is globally available - no import needed."

Your AI agent handles everything else. See the full [Vibe Coder's Guide](./docs/VIBE_CODER_GUIDE.md) for details.

---

### Option 3: Full Integration (Advanced)

For developers who want the Vite plugin and full control:

```bash
npm install logigo-embed
npm install logigo-vite-plugin --save-dev
```

See [LOGIGO_INTEGRATION.md](./LOGIGO_INTEGRATION.md) for detailed setup.

---

## What You'll See

- **Flowchart** - Boxes and arrows showing your code's logic
- **Variable Tracking** - See what values your variables hold at each step
- **Time Travel** - Step backwards through your code to see what happened

---

## Safety Features

- **Won't crash your browser** - Automatically pauses if your code runs too fast
- **Loads fast** - Heavy parts only load when needed

---

## Packages

| Package | What It Does |
|---------|--------------|
| `logigo-embed` | The visual panel for your app |
| `logigo-vite-plugin` | Analyzes code during build |
| `logigo-core` | Tracks code execution |

---

## Troubleshooting

**Flowchart looks wrong after editing code?**
- LogiGo auto-refreshes. If not, click the Refresh button.

**"Queue Overflow" warning?**
- Your code is running very fast (like an infinite loop). LogiGo paused to protect your browser.

---

**Made for Vibe Coders who learn by seeing**
