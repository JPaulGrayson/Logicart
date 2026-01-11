# LogicArt Remote Mode - Vibe Coder's Guide

Connect LogicArt to any external app **without writing code yourself**. Just copy a prompt and let your AI agent do the work!

## Step 1: Ask Your AI Agent to Add LogicArt

Copy this prompt and paste it into your app's AI agent (Replit Agent, Cursor, Windsurf, etc.):

```
Add LogicArt code visualization to this project.

Add this script tag to the HTML <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

Then create a "Visualize" button that sends code to LogicArt:
- Use window.LogicArt.visualize(code, name) to open the flowchart
- Connect it to whatever code the user is viewing or editing

Test it works by clicking the button and verifying LogicArt opens with a flowchart.
```

Your AI agent will:
1. Add the script tag to your HTML
2. Create a button that opens LogicArt with your code
3. Test the integration

---

## Step 2: Click "Visualize" in Your App

Once your agent has added the integration:
1. Run your app
2. Click the **"Visualize"** button your agent created
3. LogicArt opens in a new tab with your code's flowchart!

---

## That's It!

No need to:
- Find specific files manually
- Understand code structure  
- Write any code yourself

Just copy, paste, and let your AI agent do the work!

---

## Optional: Add Live Checkpoints

Want to see your code execute in real-time? Ask your agent:

```
Add LogicArt checkpoint() calls to track execution in my FRONTEND code.

The checkpoint() function is globally available (no import needed).

Add checkpoint('step-name', { key: value }) at key points:
- User interactions: checkpoint('button-clicked', { action })
- State changes: checkpoint('state-update', { before, after })
- API calls: checkpoint('api-call', { endpoint })

Only add to frontend/client-side JavaScript (not server files).
```

Now when you interact with your app, you'll see nodes light up in real-time on the LogicArt flowchart!

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
