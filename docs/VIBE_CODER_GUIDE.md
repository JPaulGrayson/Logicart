# LogiGo Remote Mode - Vibe Coder's Guide

Connect LogiGo to any external app **without writing code yourself**. Just two simple steps!

## Step 1: Add the Script Tag

Add this single line to your app's `index.html` file, inside the `<head>` section:

```html
<script src="YOUR_LOGIGO_URL/remote.js?project=MyApp"></script>
```

Replace `YOUR_LOGIGO_URL` with your LogiGo app's URL (you can find this in the browser address bar when viewing LogiGo).

**Example:**
```html
<head>
  <meta charset="UTF-8" />
  <!-- other head content -->
  <script src="https://your-logigo-app.replit.dev/remote.js?project=MyApp"></script>
</head>
```

When your app loads, you'll see a **"View in LogiGo"** badge in the bottom-right corner. Click it to open your flowchart!

---

## Step 2: Ask Your AI Agent to Add Checkpoints

Copy this prompt and paste it into your app's AI agent (like Replit Agent):

```
Add LogiGo checkpoint() calls to track execution in my FRONTEND code only. The checkpoint() function is globally available (no import needed).

IMPORTANT: Only add checkpoints to frontend/client-side JavaScript files (React components, client utilities, etc). Do NOT add to backend/server files - the checkpoint function only works in the browser.

Guidelines:
- Add checkpoint('step-name', { key: value }) at key points
- Track user interactions: checkpoint('button-clicked', { action })
- Track state changes: checkpoint('state-update', { before, after })
- Track API calls: checkpoint('api-call', { endpoint, data })

Example:
function handleSubmit(data) {
  checkpoint('form-submit', { fields: Object.keys(data) });
  // ... existing code ...
}
```

Your AI agent will automatically add the checkpoint calls to your frontend code!

---

## Step 3: View Your Flowchart

1. Run your app
2. Click the **"View in LogiGo"** badge in the bottom-right corner
3. Watch the checkpoints appear in real-time as you interact with your app!

---

## That's It!

No need to:
- Find specific files manually
- Understand code structure
- Write any code yourself

Just copy, paste, and let your AI agent do the work!

---

## Troubleshooting

**Badge doesn't appear?**
- Make sure the script tag is in the `<head>` section
- Check your browser console for any errors
- Make sure LogiGo is running

**Checkpoints not showing?**
- Make sure your AI agent added checkpoints to **frontend** code only (not backend/server files)
- Interact with your app to trigger the code that has checkpoints
- Check that you're viewing the correct session in LogiGo

**Agent added checkpoints to backend code?**
- Ask the agent to remove them from server files
- The `checkpoint()` function only works in the browser, not on the server

**Need help?**
Click the help button (?) in LogiGo's header for more documentation.
