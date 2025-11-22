# Extension Repl Recreation Guide - Step by Step

## ⚠️ CRITICAL: Follow This Exact Order

This guide will help you create a properly configured Extension Repl. The key is to **verify the Extension workspace is correct BEFORE copying any files**.

---

## Phase 1: Create New Extension Repl (5 minutes)

### Step 1.1: Delete the Broken Extension Repl
1. Go to your Replit dashboard
2. Find "Cartography Extension" Repl
3. Click the three dots (⋮) → Delete or Archive
4. Confirm deletion

### Step 1.2: Create Fresh Extension Repl
1. **Open this URL in your browser:**
   ```
   https://replit.com/new/extension?template=656d6107-3a39-4802-b8d9-59479cc5e358
   ```
   
2. **Name it:** `Cartographer Extension v2`

3. **Click:** "Create Extension Repl App" or "Create Repl"

4. **Wait for workspace to load** (should take 10-30 seconds)

---

## Phase 2: CRITICAL VERIFICATION (2 minutes)

### Step 2.1: Check for Extension Devtools Button

**Look at the TOP-RIGHT corner of your workspace toolbar.**

You should see a button labeled **"Extension Devtools"** (might have a puzzle piece icon).

✅ **IF YOU SEE IT:** Perfect! Continue to Step 2.2.

❌ **IF YOU DON'T SEE IT:** 
- Try force-refreshing: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- Still not there? Try creating again in a different browser (Chrome instead of Safari)
- Still failing? **STOP** and contact Replit Support - this is a platform issue

### Step 2.2: Verify Extension Devtools Pane

**Look at the RIGHT SIDE of your workspace.**

You should see a panel/tab labeled **"Extension Devtools"** with:
- Extension metadata editing interface
- "Load Locally" button
- Tools and File Handlers sections

✅ **IF YOU SEE IT:** Excellent! The Extension Repl is properly configured.

❌ **IF YOU DON'T SEE IT:** Click the "Extension Devtools" button from Step 2.1 to open it.

### Step 2.3: Test Load Locally

1. Click **"Load Locally"** in the Extension Devtools pane
2. Wait for the server to start
3. You should see a preview of the template extension

✅ **IF IT LOADS:** Perfect! Your Extension Repl is fully functional.

---

## Phase 3: Copy Files from Original Repl (5 minutes)

Now that we've verified the Extension workspace is correct, we can copy our Cartographer files.

### Step 3.1: Create Public Directory

1. In the new Extension Repl, create a folder called `public` at the root level
2. This is where all extension files will go

### Step 3.2: Copy Files

**Copy these files from your original "Cartographer" Repl to the new Extension Repl's `public/` folder:**

```
FROM: dist/extension/
TO: public/

Files to copy:
✓ extension.html
✓ extension.json
✓ icon.svg
✓ favicon.png
✓ assets/main-BU2VD84Z.js (735KB)
✓ assets/main-Bgj7Vesx.css (102KB)
```

**Directory structure should look like:**
```
Cartographer Extension v2/
├── public/
│   ├── extension.html
│   ├── extension.json
│   ├── icon.svg
│   ├── favicon.png
│   └── assets/
│       ├── main-BU2VD84Z.js
│       └── main-Bgj7Vesx.css
└── .replit
```

### Step 3.3: Copy Root extension.json

1. **ALSO copy** `extension.json` to the **root directory** (not just in public/)
2. You should have `extension.json` in TWO places:
   - `/extension.json` (root)
   - `/public/extension.json` (public folder)

---

## Phase 4: Configure .replit File (2 minutes)

### Step 4.1: Create/Edit .replit File

In the new Extension Repl, create or edit the `.replit` file with this EXACT content:

```toml
run = "python3 -m http.server 8080 --directory public"

[nix]
channel = "stable-24_05"

[deployment]
publicDir = "public"

[[ports]]
localPort = 8080
externalPort = 80
```

**Save the file** (Cmd+S or Ctrl+S)

---

## Phase 5: Test the Extension (3 minutes)

### Step 5.1: Load Your Extension

1. Go back to the **Extension Devtools** pane (right side)
2. Click **"Load Locally"**
3. Wait for server to start (should see Python http.server output)
4. Extension Devtools should show your Cartographer tool

### Step 5.2: Preview Cartographer

1. In Extension Devtools, find the **"Cartographer"** tool
2. Click **"Preview"** next to it
3. A new tab should open showing the Cartographer interface

✅ **EXPECTED:** You should see:
- Code editor panel (or no editor if ReplitAdapter detects Extension API)
- Flowchart visualization panel
- Variable watch panel
- Execution controls (play, pause, step, etc.)

### Step 5.3: Check ReplitAdapter Detection

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Look at Console tab
3. You should see: `"Replit Extension API detected - using ReplitAdapter"`

✅ **IF YOU SEE IT:** ReplitAdapter is working! The extension can access Replit's file system.

❌ **IF YOU SEE:** `"No Extension API - using StandaloneAdapter"` 
- This is okay for now - it means the extension is loading in preview mode
- The real test is when you publish and install it

---

## Phase 6: Publish to Extension Store (Optional - 5 minutes)

### Step 6.1: Review Extension Metadata

In Extension Devtools:
1. Verify the extension name: "Cartographer"
2. Check description looks good
3. Verify icon is showing

### Step 6.2: Submit for Review

1. Click **"Publish"** button in Extension Devtools
2. Review the submission details
3. Click **"Submit to Extension Store"**
4. Wait for Replit review (typically 1-3 days)

---

## Troubleshooting

### Problem: Extension Devtools button never appears
**Solution:** The workspace wasn't created as Extension type. Delete and recreate, or contact Replit Support.

### Problem: "Load Locally" fails
**Solution:** Check that `.replit` file has the correct run command with Python http.server.

### Problem: Preview shows blank page
**Solution:** 
- Check browser console for errors
- Verify all asset files copied correctly
- Ensure file paths in extension.html match actual file locations

### Problem: ReplitAdapter not detecting API
**Solution:** This is normal in preview mode. It will detect properly when installed as extension.

---

## Success Criteria Checklist

Before considering this complete, verify:

- ✅ Extension Devtools button visible in toolbar
- ✅ Extension Devtools pane accessible
- ✅ "Load Locally" successfully starts server
- ✅ Preview shows Cartographer interface
- ✅ Flowchart visualizes sample code
- ✅ Execution controls work (play/pause/step)
- ✅ No console errors in browser DevTools

---

## Quick Reference: File Locations

**Root `extension.json`** - Required for Extension detection:
```
/extension.json
```

**Public files** - Served to users:
```
/public/extension.json
/public/extension.html
/public/icon.svg
/public/favicon.png
/public/assets/main-BU2VD84Z.js
/public/assets/main-Bgj7Vesx.css
```

**Configuration:**
```
/.replit
```

---

## Time Estimate

- Phase 1 (Create): 5 minutes
- Phase 2 (Verify): 2 minutes
- Phase 3 (Copy files): 5 minutes
- Phase 4 (Configure): 2 minutes
- Phase 5 (Test): 3 minutes
- **Total: ~17 minutes**

---

## Support Contact

If Extension Devtools still doesn't appear after recreation:

**Replit Support:**
- URL: https://ask.replit.com
- Email: support@replit.com
- Tag: "Bug" → "Extensions"
- Provide: Extension Repl URL, browser/OS, template ID used (656d6107-3a39-4802-b8d9-59479cc5e358)

---

**Good luck! The extension is fully built and ready - we just need a properly initialized workspace to deploy it.**
