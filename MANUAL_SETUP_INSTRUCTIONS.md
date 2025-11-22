# Manual Setup Instructions for Extension Repl

## Step 1: Download the Extension Bundle

1. In **this current Repl** (Cartographer), open the Preview/Webview
2. Navigate to: `/cartographer-extension.zip`
3. **Download the ZIP file** to your computer (should be ~253KB)

Or use this direct link from your browser:
```
https://cartographer.jpaulgraygrayson.repl.co/cartographer-extension.zip
```

## Step 2: Upload to Extension Repl

1. Switch to your **"Cartographer Extension v2"** Repl
2. In the Files panel, create a folder called `public`
3. **Drag and drop** the `cartographer-extension.zip` file into the `public` folder
4. Right-click the ZIP file → **Extract here** (or use Shell: `cd public && unzip cartographer-extension.zip`)

## Step 3: Copy extension.json to Root

1. In the Files panel, find `public/extension.json`
2. **Copy it**
3. **Paste it** at the root level (same level as `.replit`)
4. You should now have `extension.json` in TWO places:
   - `/extension.json` (root)
   - `/public/extension.json`

## Step 4: Create .replit File

1. In the Extension Repl, create or edit the `.replit` file
2. **Replace all contents** with this:

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

3. **Save the file**

## Step 5: Test the Extension

1. Open **Tools menu** → **Extensions Devtools**
2. Click **"Load Locally"**
3. Wait for Python server to start
4. Click **"Preview"** next to Cartographer tool
5. **Extension should load!**

---

## Quick Checklist

- ✅ Downloaded `cartographer-extension.zip` from original Repl
- ✅ Created `public/` folder in Extension Repl
- ✅ Extracted ZIP contents to `public/`
- ✅ Copied `extension.json` to root directory
- ✅ Created `.replit` with correct configuration
- ✅ Opened Extensions Devtools
- ✅ Clicked "Load Locally"
- ✅ Previewed Cartographer tool

---

## File Structure Should Look Like:

```
Cartographer Extension v2/
├── extension.json          ← ROOT LEVEL (copy from public/)
├── .replit                 ← Configuration file
└── public/
    ├── extension.json      ← Also here
    ├── extension.html
    ├── icon.svg
    ├── favicon.png
    └── assets/
        ├── main-BU2VD84Z.js
        └── main-Bgj7Vesx.css
```

---

Total time: ~5 minutes with manual file operations
