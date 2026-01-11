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
Add a "Visualize in LogicArt" button to this app.

Add this script tag to the HTML <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

Create a button that calls:
window.LogicArt.visualize(code, name)

where "code" is the main function's source code and "name" is the function name.

Test it works by clicking the button.
```

---

## Step 3: Click "Visualize" in Your App

Once your agent has added the integration:
1. Run your app
2. Click the **"Visualize in LogicArt"** button
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
