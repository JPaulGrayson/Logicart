# LogicArt Remote Mode - Vibe Coder's Guide

Connect LogicArt to any external app **without writing code yourself**. Just copy prompts and let your AI agent do the work!

**Important:** Use TWO separate prompts to avoid confusing your AI agent.

---

## Step 1: Build Your App First

Build your app with your AI agent as you normally would. **Do NOT mention LogicArt yet** - this prevents the agent from getting confused by LogicArt-related keywords.

Wait for your agent to finish building the app before moving to Step 2.

---

## Step 2: Add LogicArt Integration

**After** your app is working, use this separate prompt:

```
Add LogicArt flowchart visualization to this app.

1. Add this script tag to the HTML <head> BEFORE other scripts:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

2. Add a "View Flowchart" button to the header that runs this exact code when clicked:

async function viewFlowchart() {
  const scriptTag = document.querySelector('script[src*=".js"]:not([src*="logic.art"])');
  if (!scriptTag) { alert('No script found'); return; }
  
  try {
    const response = await fetch(scriptTag.src);
    const code = await response.text();
    
    if (window.LogicArt && window.LogicArt.visualize) {
      window.LogicArt.visualize(code, 'AppCode');
    } else {
      alert('LogicArt not loaded');
    }
  } catch (err) {
    alert('Failed to load code: ' + err.message);
  }
}

3. Test by clicking the button - LogicArt should open showing the app's actual code as a flowchart.
```

---

## Step 3: Click "View Flowchart" in Your App

Once your agent has added the integration:
1. Run your app
2. Click the **"View Flowchart"** button
3. LogicArt opens in a new tab with your app's flowchart!

---

## That's It!

No need to:
- Find specific files manually
- Understand code structure  
- Write any code yourself

Just copy, paste, and let your AI agent do the work!

---

## Optional: Add Live Tracking

Want to see your app execute in real-time? Ask your agent:

```
Add LogicArt checkpoints to track when things happen in my app.

Track button clicks, form submissions, and important actions.

Only add to frontend code, not server files.
```

Now when you use your app, you'll see the flowchart light up in real-time!

---

## Troubleshooting

**LogicArt doesn't open?**
- Ask your agent: "Check that the LogicArt script tag is in the HTML head"
- Check your browser console for any errors

**Flowchart shows too many nodes (framework code)?**
- Ask your agent: "Make sure you're using mode=push in the LogicArt script URL"
- The agent should pass only clean algorithm code, not bundled framework code

**Checkpoints not showing?**
- Make sure checkpoints are in **frontend** code only (not backend/server files)
- Interact with your app to trigger the code with checkpoints

**Need help?**
Click the help button (?) in LogicArt's header for more documentation.
