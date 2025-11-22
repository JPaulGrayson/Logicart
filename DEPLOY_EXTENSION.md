# Deploying Cartographer as a Replit Extension

## Quick Start Guide

### 1. Create Extension Repl
- Visit: https://replit.com/new/extension?template=656d6107-3a39-4802-b8d9-59479cc5e358
- A new Extension Repl will be created with Extension Devtools enabled

### 2. Upload Extension Files

**Option A: Upload Zip File**
1. Download `cartographer-extension.zip` from this Repl
2. In the new Extension Repl, upload the zip file
3. Extract it to create a `cartographer/` folder

**Option B: Manual Upload**
1. In the new Extension Repl, create a folder: `cartographer`
2. Upload all files from `dist/extension/` to `cartographer/`:
   - `extension.html`
   - `extension.json`
   - `favicon.png`
   - `assets/` folder (contains CSS and JS bundles)

### 3. Configure Extension Devtools

1. Click **"Extension Devtools"** button (top-right of workspace)
2. The Devtools panel opens
3. In the configuration:
   - **Build Command**: `npx vite build --config vite.extension.config.ts`
   - **Output Directory**: `cartographer`
4. Click **"Load Locally"**

### 4. Test the Extension

1. Create or open a JavaScript file in your Extension Repl (e.g., `test.js`)
2. Add sample code:
   ```javascript
   function factorial(n) {
     if (n <= 1) {
       return 1;
     }
     let sub = factorial(n - 1);
     return n * sub;
   }
   ```
3. In Extension Devtools, find "Cartographer" tool
4. Click **"Preview"** next to it
5. A new tab opens showing your code as a flowchart!

### 5. Test Features

**Real-time Sync:**
- Edit the JavaScript file in Replit's editor
- Watch the flowchart update automatically (500ms debounce)

**Bi-directional Editing:**
- Double-click any flowchart node (except Start/End)
- Edit the code in the dialog
- Click Save → source file updates

**Step Execution:**
- Click Play (▶) to auto-step through code
- Use Step Forward (→) for manual stepping
- Watch variables update in the Variables panel
- Adjust speed with the dropdown (0.5x - 5x)
- Enable Loop for continuous replay

**Fixed Minimap:**
- Zoom the main flowchart with mouse wheel or +/- controls
- Minimap stays at fixed overview scale
- Click/drag minimap to navigate

**File Switching:**
- Switch to different JavaScript files in Replit
- Cartographer automatically updates to show the new file

## Troubleshooting

**Extension not loading?**
- Check that `extension.json` is in the output directory
- Verify the handler in `extension.json` points to `extension.html`
- Look at browser console for errors (right-click → Inspect)

**Flowchart not updating?**
- Save the file in Replit's editor
- Check that the file is a `.js` file
- Verify Cartographer preview tab is active

**Can't edit nodes?**
- Only nodes with source code can be edited (not Start/End)
- Make sure you're double-clicking, not single-clicking
- Check that the extension has `write-exec` scope

## Next Steps

Once working:
- Test with different JavaScript files
- Try complex functions with loops and conditionals
- Publish to Replit Extensions Store (via Extension Devtools)
- Add support for TypeScript, Python, etc.

## Files Structure

```
cartographer/
├── extension.html       # Entry point
├── extension.json       # Manifest (name, tools, scopes)
├── favicon.png          # Icon
└── assets/
    ├── main-*.css       # Bundled styles
    └── main-*.js        # Bundled JavaScript
```

## Extension Manifest (extension.json)

```json
{
  "name": "Cartographer",
  "description": "Visual code-to-flowchart tool",
  "tools": [{
    "id": "cartographer",
    "name": "Cartographer",
    "handler": "extension.html"
  }],
  "scopes": ["read", "write-exec"]
}
```

The extension is now ready to use in any Repl workspace!
