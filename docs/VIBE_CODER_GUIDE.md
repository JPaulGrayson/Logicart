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
Add LogicArt code visualization to this project. This lets users see flowcharts of any component's logic AND view the full project architecture.

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

STEP 4: Create a FlowchartButton component with:
- "View Full Architecture" option at the top (calls LogicArt.openArchitecture)
- Dropdown of individual files from step 3 (calls LogicArt.visualize)

When user clicks "View Full Architecture":
  Call: (window.LogiGo || window.LogicArt).openArchitecture(
    window.location.origin + '/api/source',
    [/* array of all file paths from step 3 */]
  )

When user selects a single component:
1. Fetch the source via: fetch('/api/source/' + component.path)
2. Call: (window.LogiGo || window.LogicArt).visualize(code, componentName)

STEP 5: Add the FlowchartButton to an EXISTING header/navbar component.
Do NOT create a floating button (gets hidden behind backgrounds).

STEP 6: Test - click "View Full Architecture" to see component dependency graph,
or select a single component to see its flowchart.
```

---

## Step 3: Use the Features

Once your agent has added the integration:

### View Full Project Architecture
1. Run your app (npm run dev)
2. Click **"Flowchart"** button in your app's header
3. Click **"View Full Architecture"** at the top
4. LogicArt opens showing how all your components connect to each other!
5. Click any component node to drill down into its flowchart

### View Single Component Flowchart
1. Click **"Flowchart"** button
2. Select a specific component from the list
3. LogicArt opens showing that component's control flow (if/else, loops, etc.)

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

**Architecture view shows 0 components?**
- Make sure the ALL_FILES array contains valid file paths
- Check that /api/source endpoint can access all listed files

**Flowchart shows too many nodes (framework code)?**
- Make sure you're using mode=push in the LogicArt script URL
- LogicArt automatically extracts algorithm logic from React hooks

**Need help?**
Click the help button (?) in LogicArt's header for more documentation.
