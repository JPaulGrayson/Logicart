# LogicArt Remote Mode - Vibe Coder's Guide

Connect LogicArt to any external app **without writing code yourself**. Just two simple steps!

## Step 1: Add the Script Tag

Add this single line to your app's `index.html` file, inside the `<head>` section:

```html
<script src="YOUR_LOGICART_URL/remote.js?project=MyApp"></script>
```

Replace `YOUR_LOGIGO_URL` with your LogicArt app's URL (you can find this in the browser address bar when viewing LogicArt).

**Example:** Complete HTML file
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  
  <!-- Add LogicArt Remote Mode Script -->
  <script src="https://your-logicart-app.replit.dev/remote.js?project=MyApp"></script>
</head>
<body>
  <div id="app"></div>
  
  <!-- Your app's main script -->
  <script src="./main.js"></script>
</body>
</html>
```

When your app loads, you'll see a **"View in LogicArt"** badge in the bottom-right corner. Click it to open your flowchart!

---

## Step 2: Ask Your AI Agent to Add Checkpoints

Copy this prompt and paste it into your app's AI agent (like Replit Agent):

```
Add LogicArt checkpoint() calls to track execution in my FRONTEND code only. The checkpoint() function is globally available (no import needed).

IMPORTANT: Only add checkpoints to frontend/client-side JavaScript files (React components, client utilities, etc). Do NOT add to backend/server files - the checkpoint function only works in the browser.

After adding checkpoints, ALSO register the code for flowchart visualization. Add this call somewhere in the frontend code that runs on page load:

LogicArt.registerCode(`
// Paste the main function or component with checkpoints here
function myMainFunction() {
  checkpoint('start', {});
  // ... rest of the function with checkpoints ...
}
`);

Guidelines for checkpoints:
- Add checkpoint('step-name', { key: value }) at key points
- Track user interactions: checkpoint('button-clicked', { action })
- Track state changes: checkpoint('state-update', { before, after })
- Track API calls: checkpoint('api-call', { endpoint, data })

Example:
function handleUpload(file) {
  checkpoint('upload-start', { fileName: file.name });
  // ... upload logic ...
  checkpoint('upload-complete', { success: true });
}
```

Your AI agent will:
1. Add checkpoint calls to your frontend code
2. Register the code with LogicArt so you can see the flowchart

---

## Step 3: View Your Flowchart

1. Run your app
2. Click the **"View in LogicArt"** badge in the bottom-right corner
3. You'll see two tabs:
   - **Flowchart** - Visual representation of your code with nodes lighting up as checkpoints fire
   - **Trace** - List of checkpoints in order they were called

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
- Make sure LogicArt is running

**Only seeing Trace, no Flowchart tab?**
- The AI agent needs to call `LogicArt.registerCode()` with the code
- Ask your agent: "Register the instrumented code with LogicArt using LogicArt.registerCode()"

**Checkpoints not showing?**
- Make sure your AI agent added checkpoints to **frontend** code only (not backend/server files)
- Interact with your app to trigger the code that has checkpoints
- Check that you're viewing the correct session in LogicArt

**Agent added checkpoints to backend code?**
- Ask the agent to remove them from server files
- The `checkpoint()` function only works in the browser, not on the server

**Need help?**
Click the help button (?) in LogicArt's header for more documentation.
