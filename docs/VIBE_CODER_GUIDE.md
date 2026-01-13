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

2. Scan my project and create a component picker. Find the main components/pages/features 
   and build a simple modal or dropdown that lets me choose which one to visualize.
   
   For example, if my app has these files:
   - src/pages/HomePage.tsx
   - src/features/checkout/Cart.tsx
   - src/components/SearchFilter.tsx
   
   Create a picker with friendly names like:
   - "Home Page"
   - "Shopping Cart" 
   - "Search Filter"

3. When I select a component from the picker, fetch that SOURCE FILE (not the bundled output)
   and call window.LogicArt.visualize(code, componentName).

4. Here's the pattern to follow:

// Component picker data - populate this by scanning my project
const components = {
  'Home Page': '/src/pages/HomePage.tsx',
  'Shopping Cart': '/src/features/checkout/Cart.tsx',
  'Search Filter': '/src/components/SearchFilter.tsx'
};

// Show picker modal, then visualize selected component
async function viewFlowchart(componentName) {
  const filePath = components[componentName];
  const response = await fetch(filePath);
  const code = await response.text();
  
  if (window.LogicArt?.visualize) {
    window.LogicArt.visualize(code, componentName);
  }
}

5. Add a "View Flowchart" button to the header that opens the component picker.

6. Test by clicking the button, selecting a component, and verifying LogicArt opens 
   with that component's flowchart.

NOTE: LogicArt automatically extracts algorithm logic from React hooks (useCallback, 
useMemo, useEffect) - just pass the whole component file and it will find the logic.
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
