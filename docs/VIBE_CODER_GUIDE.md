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

2. FIRST, scan my project and LIST the main .tsx/.ts/.js files you find in:
   - src/pages/
   - src/components/
   - src/features/
   Show me the list before proceeding.

3. Create a ComponentPicker with a dropdown containing those files as options.
   Use friendly names (e.g., "TourPage.tsx" → "Tour Page").

4. When user selects a component, fetch the SOURCE FILE and visualize:

async function visualizeComponent(filePath, displayName) {
  const response = await fetch(filePath);
  const code = await response.text();
  // Use LogiGo (the runtime API name)
  const api = window.LogiGo || window.LogicArt;
  if (api?.visualize) {
    api.visualize(code, displayName);
  }
}

// Example - replace with actual files from step 2:
const components = [
  { name: 'Home Page', path: '/src/pages/Home.tsx' },
  { name: 'Tour View', path: '/src/pages/TourPage.tsx' },
];

5. Add a "View Flowchart" button to an EXISTING navbar or header component.
   - Find your app's Header.tsx, Navbar.tsx, or similar shared nav component
   - Add the button there - do NOT create a floating button with position:fixed
   - Floating buttons often get hidden behind full-screen backgrounds
   When user selects from the picker, call visualizeComponent(selected.path, selected.name).

6. IMPORTANT: The fetch path must be the SOURCE file path (e.g., /src/pages/Home.tsx),
   NOT the bundled output path (e.g., /assets/index-abc123.js).

7. Test by selecting a component and verifying LogicArt opens with its flowchart.

NOTE: LogicArt automatically extracts logic from React hooks (useCallback, useMemo, 
useEffect) - just pass the whole component file.
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
- LogicArt automatically extracts algorithm logic from React hooks (useCallback, useMemo, useEffect)
- Avoid passing entire bundled builds - pass specific component/function code

**Checkpoints not showing?**
- Make sure checkpoints are in **frontend** code only (not backend/server files)
- Interact with your app to trigger the code with checkpoints

**Need help?**
Click the help button (?) in LogicArt's header for more documentation.
