# LogicArt Remote Mode - Vibe Coder's Guide

Connect LogicArt to any external app **without writing code yourself**. Just copy prompts and let your AI agent do the work!

**Important:** Use TWO separate prompts to avoid confusing your AI agent.

---

## Step 1: Build Your App First

Ask your AI agent to build your app. **Do NOT mention LogicArt yet.**

Example prompt:
```
Build a simple Task Manager app with:
- An input field to add new tasks
- A button to add the task to a list  
- Each task has a checkbox to mark complete
- A delete button to remove tasks
- A counter showing total and completed tasks
```

Wait for your agent to finish building the app before moving to Step 2.

---

## Step 2: Add LogicArt Integration

**After** your app is working, use this separate prompt:

```
Add a "View Flowchart" button to this app that opens LogicArt.

Use the LogicArt remote script from https://logic.art/remote.js

When clicked, it should show a flowchart of the app's main logic.

Test it works by clicking the button.
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
