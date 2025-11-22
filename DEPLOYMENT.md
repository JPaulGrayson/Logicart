# Cartographer Extension - Deployment Guide

## 🎯 Goal
Deploy Cartographer as a Replit Extension that users can install and use in their workspaces.

## 📋 Prerequisites
- The extension is already built in `dist/extension/` in this Repl
- All code is complete and working

## 🚀 Deployment Steps

### Step 1: Create Extension Repl (2 minutes)

1. **Open a new browser tab** and go to [replit.com](https://replit.com)
2. Click **"Create Repl"**
3. In the template search, type: **"React Extension"**
4. Select the **React Extension** template
5. Name it: **"Cartographer"**
6. Click **"Create Repl"**

### Step 2: Prepare the Extension Repl (1 minute)

Once your new Extension Repl opens:

1. **Delete everything in the Repl** (we'll replace with our built files)
   - Select all files and delete them
   
2. **Create this folder structure:**
   ```
   Cartographer/
   ├── public/
   │   ├── extension.html
   │   ├── extension.json
   │   └── assets/
   │       ├── main-BU2VD84Z.js
   │       └── main-Bgj7Vesx.css
   └── .replit (if doesn't exist, create it)
   ```

### Step 3: Copy Files (2 minutes)

**You'll need to copy files from THIS Repl to your NEW Extension Repl.**

#### Option A: Manual Copy (Easiest)
1. Keep both Repl tabs open side-by-side
2. In THIS Repl, go to `dist/extension/`
3. Copy each file's content and paste into the NEW Repl

#### Option B: Download and Upload
1. In THIS Repl, download the entire `dist/extension/` folder
2. In the NEW Repl, upload all files to the `public/` folder

### Files to Copy:

**File 1: `public/extension.html`**
- Source: `dist/extension/extension.html` (from this Repl)
- Destination: `public/extension.html` (in new Extension Repl)

**File 2: `public/extension.json`**
- Source: `dist/extension/extension.json` (from this Repl)
- Destination: `public/extension.json` (in new Extension Repl)

**File 3: `public/assets/main-BU2VD84Z.js`**
- Source: `dist/extension/assets/main-BU2VD84Z.js`
- Destination: `public/assets/main-BU2VD84Z.js`

**File 4: `public/assets/main-Bgj7Vesx.css`**
- Source: `dist/extension/assets/main-Bgj7Vesx.css`
- Destination: `public/assets/main-Bgj7Vesx.css`

### Step 4: Configure .replit File

Create or update `.replit` in your Extension Repl with:

```toml
run = "npm run dev"

[deployment]
run = ["sh", "-c", "npm run dev"]
```

### Step 5: Test in Extension Devtools

1. In your **Extension Repl**, look for the **"Extension Devtools"** button (usually in the top right or tools panel)
2. Click **"Extension Devtools"**
3. You should see Cartographer load with:
   - Code editor (left panel)
   - Flowchart visualization (center)
   - Variables panel (right)
   - Execution controls (top)

### Step 6: Verify ReplitAdapter Works

1. In the Extension Devtools view, check the **browser console** (F12)
2. You should see a message indicating ReplitAdapter is active (NOT "No Extension API - using StandaloneAdapter")
3. Create a test JavaScript file in your workspace (e.g., `test.js`)
4. The extension should detect and visualize it automatically

## 🎨 Optional: Add Custom Icon

Before publishing, add an icon:

1. Create a 512x512px icon image
2. Save it as `public/icon.png`
3. Update `extension.json` to reference it:
   ```json
   "icon": "icon.png"
   ```

## 📦 Publishing to Extensions Store

Once everything works in Devtools:

1. Click **"Publish Extension"** in the Extension Devtools
2. Fill out the publishing form
3. Submit for review by Replit staff
4. Your extension will appear in the Extensions Store after approval

## 🐛 Troubleshooting

**Problem: Extension Devtools button not visible**
- Make sure you created an **Extension-type Repl** (not a regular Repl)
- Try refreshing the page

**Problem: Blank screen in Devtools**
- Check browser console for errors
- Verify all files were copied correctly
- Make sure asset file names match exactly (case-sensitive)

**Problem: Shows "No Extension API - using StandaloneAdapter"**
- This is normal in regular browser tabs
- Extension API only works in Extension Devtools

## ✅ Success Checklist

- [ ] Extension Repl created
- [ ] Files copied to `public/` folder
- [ ] Extension Devtools loads the UI
- [ ] ReplitAdapter is active (check console)
- [ ] Can visualize JavaScript files from workspace
- [ ] Ready to publish!

---

**Need help?** Come back to this Repl and I can assist with any step.
