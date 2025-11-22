# Testing Cartographer as a Replit Extension

This guide walks through testing Cartographer in Replit's Extension environment.

## Prerequisites

✅ Extension is already built in `dist/extension/`  
✅ Example JavaScript files available in `examples/` folder

## Step-by-Step Testing Guide

### 1. Open Extension Devtools

1. Look for the **"Devtools"** button in the top-right corner of your Replit workspace
2. Click it to open the Extension Devtools panel

### 2. Load Cartographer Extension

1. In Extension Devtools, click **"Load Locally"**
2. Configure the extension:
   - **Output Directory**: `dist/extension`
   - The devtools will read the `extension.json` manifest automatically
3. You should see "Cartographer" appear in the tools list

### 3. Open a Test File

Open one of the example files:
- `examples/factorial.js` - Recursive factorial (good for testing recursion visualization)
- `examples/fibonacci.js` - Fibonacci with multiple conditionals
- `examples/max-finder.js` - Array maximum finder with loops

Or create your own JavaScript function to visualize!

### 4. Launch Cartographer

1. With a JavaScript file open in Replit's editor, look for the **Cartographer tool** in Extension Devtools
2. Click **"Preview"** next to the Cartographer tool
3. A new tab will open showing your code as a flowchart

### 5. Test Key Features

#### ✅ Real-time Sync
- **Edit code** in Replit's native editor
- Watch the flowchart **update automatically** (debounced 500ms)
- Changes should reflect immediately in the visualization

#### ✅ Bi-directional Editing
- **Double-click** any flowchart node (except Start/End nodes)
- An edit dialog appears with the current code
- Modify the code and click **Save**
- The source file in Replit's editor updates automatically

#### ✅ Step-by-Step Execution
- Click **Play** (▶) to start automatic execution
- Click **Step Forward** (→) to manually step through
- Watch:
  - Current node highlighted in **green**
  - Variable values in the **Variables** panel
  - Execution progress indicator
- Use **Speed control** dropdown to adjust playback speed (0.5x - 5x)
- Enable **Loop** to continuously restart after completion

#### ✅ Fixed Minimap
- Use mouse wheel or +/- controls to **zoom** the main flowchart
- The minimap (bottom-left) should **stay at a fixed scale**
- The viewport indicator (grey box) shows your current view
- Click/drag on minimap to navigate

#### ✅ Code Editor Integration
- The left panel (code editor) should be **hidden** in extension mode
- Cartographer uses Replit's native editor instead
- File path displayed in the flowchart header

### 6. Test File Switching

1. Switch to a different JavaScript file in Replit's editor
2. Cartographer should automatically:
   - Detect the file change via `session.onActiveFileChange()`
   - Load and parse the new file
   - Update the flowchart visualization

### 7. Expected Behavior

**When Working Correctly:**
- ✅ Flowchart updates when you edit code in Replit
- ✅ Editing nodes updates the source file
- ✅ Step execution shows variable states
- ✅ Minimap stays fixed while main view zooms
- ✅ No code editor panel visible (uses Replit's editor)
- ✅ File switching updates visualization automatically

**Common Issues:**
- ❌ Flowchart not updating → Check file is saved in Replit
- ❌ Can't edit nodes → Only editable nodes have source data (not Start/End)
- ❌ Extension not loading → Verify `dist/extension/extension.json` exists and handler points to `extension.html`

## Debugging

If the extension doesn't work:

1. **Check Browser Console**:
   - Right-click in the extension preview → Inspect
   - Look for errors in the Console tab
   - Common issues: Replit API not available, file read errors

2. **Verify Adapter Initialization**:
   - Extension should log: `"ReplitAdapter initialized"`
   - If you see: `"Replit Extension API not available"` → Extension context is broken

3. **Rebuild if Needed**:
   ```bash
   npx vite build --config vite.extension.config.ts
   ```

4. **Check Scopes**:
   - Extension requires `read` and `write-exec` scopes
   - These are defined in `extension.json`

## What's Different from Standalone Mode?

| Feature | Standalone | Extension |
|---------|-----------|-----------|
| Code Editor | Built-in (left panel) | Replit's native editor |
| File Management | In-memory only | Real files via Replit APIs |
| File Watching | Manual refresh | Automatic via `fs.watchFile()` |
| Multi-file | Single function | Switch between project files |
| Deployment | Web server needed | Static bundle in Replit |

## Next Steps

After successful testing:
- Refine the extension based on your workflow
- Add support for more JavaScript features (loops, etc.)
- Publish to Replit Extensions Store
- Add support for other languages (TypeScript, Python, etc.)

---

**Need Help?**  
Check `EXTENSION_BUILD.md` for build configuration details or the main `README.md` for architecture overview.
