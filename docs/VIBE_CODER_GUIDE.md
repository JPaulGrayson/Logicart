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
Add LogicArt code visualization to this project. This lets users see flowcharts of any component's logic.

STEP 1: Add script tag to client/index.html <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

STEP 2: Add a backend API to read source files. In your server routes file, add:

app.get('/api/source/*', (req, res) => {
  const filePath = req.params[0];
  const fullPath = path.join(process.cwd(), 'client', filePath);
  
  if (!fullPath.startsWith(path.join(process.cwd(), 'client'))) {
    return res.status(403).send('Forbidden');
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send('File not found');
  }
  
  res.type('text/plain').send(fs.readFileSync(fullPath, 'utf-8'));
});

Make sure to import: import fs from 'fs'; import path from 'path';

STEP 3: Scan my project. List all .tsx/.ts/.jsx/.js files in:
- client/src/pages/
- client/src/components/
- client/src/features/
Show me the file list before proceeding.

STEP 4: Create a FlowchartButton component with a dropdown of the files from step 3.
When user selects a component:
1. Fetch the source via: fetch('/api/source/' + component.path)
2. Call: (window.LogiGo || window.LogicArt).visualize(code, componentName)

STEP 5: Add the FlowchartButton to an EXISTING header/navbar component.
Do NOT create a floating button (gets hidden behind backgrounds).

STEP 6: Test - select a component, LogicArt should open showing its flowchart.
```

---

## Step 3: Click "View Flowchart" in Your App

Once your agent has added the integration:
1. Run your app (npm run dev)
2. Click the **"View Flowchart"** button
3. Select a component from the dropdown
4. LogicArt opens in a new tab with your component's flowchart!

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

**Flowchart shows sample code instead of your component?**
- The backend API might not be set up correctly
- Ask your agent: "Check that /api/source/ endpoint is working"
- Test: Visit http://your-app/api/source/src/pages/Home.tsx in browser

**API returns 404?**
- File path might be wrong (client/src/... vs src/...)
- Ask your agent to verify the file paths in the component list

**Flowchart shows too many nodes (framework code)?**
- Make sure you're using mode=push in the LogicArt script URL
- LogicArt automatically extracts algorithm logic from React hooks

**Need help?**
Click the help button (?) in LogicArt's header for more documentation.
