# Quick Start: Testing LogicArt AI Integration

**Date:** December 31, 2025  
**Estimated Time:** 30 minutes for basic validation

---

## 🚀 Quick Setup

### 1. Start the Development Server

```bash
cd "/Users/paulg/Documents/Antigravity Github folder/LogicArt"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 2. Configure API Keys (Optional for Council Tests)

Create/update `.env` in the LogicArt root:

```bash
# Required for Council Service tests
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
```

---

## ✅ Quick Validation Tests

### Test 1: File Watch Mode (5 minutes)

**Goal:** Verify AI can edit flowchart and UI updates automatically.

1. **Open browser:** http://localhost:5173
2. **Open terminal** in LogicArt directory
3. **Run this command:**
   ```bash
   echo '{"code": "function test() { return 42; }", "nodes": [], "edges": []}' > data/flowchart.json
   ```
4. **Watch the browser:** Within 2 seconds, the UI should update
5. **Check console:** Should see: `[Watch Mode] External change detected, reloading...`

**✅ PASS if:** UI updates automatically without page refresh

---

### Test 2: Ask Antigravity to Use File Watch (10 minutes)

**Goal:** Verify Antigravity can manipulate the flowchart file.

1. **Ask Antigravity:**
   ```
   Please create a simple flowchart in data/flowchart.json with the following structure:
   - A "Start" node
   - A "Process" node
   - An "End" node
   - Connect them with edges
   
   Use valid LogicArt flowchart JSON format.
   ```

2. **Watch the browser:** UI should update to show the flowchart

3. **Ask Antigravity:**
   ```
   Now add a "Validation" node between Start and Process in the flowchart.
   ```

4. **Verify:** UI updates again automatically

**✅ PASS if:** 
- Antigravity can create/edit `data/flowchart.json`
- UI updates automatically after each edit
- No errors in browser console

---

### Test 3: Council Service CLI (5 minutes)

**Goal:** Verify the CLI council command works.

1. **Run in terminal:**
   ```bash
   npm run council "Write a function to reverse a string"
   ```

2. **Expected Output:**
   - Queries 4 AI models (GPT-4o, Gemini, Claude, Grok)
   - Returns chairman's verdict
   - Shows which model won

**✅ PASS if:** 
- Command runs without errors
- Returns a verdict from the chairman
- Shows comparison of all 4 models

**Note:** If you don't have API keys configured, you'll see "No API key configured" errors - that's expected.

---

### Test 4: Theme Toggle (2 minutes)

**Goal:** Verify manual theme switching works.

1. **Open browser:** http://localhost:5173
2. **Find theme toggle button** (should be in header, sun/moon icon)
3. **Click it**
4. **Verify:**
   - Theme switches between light and dark
   - All UI elements remain readable
   - Icon changes (sun ↔ moon)

**✅ PASS if:** 
- Theme toggle button is visible
- Clicking toggles theme
- No visual glitches

---

### Test 5: License System (5 minutes)

**Goal:** Verify authentication flow works.

1. **Open browser console** (F12)
2. **Check localStorage:**
   ```javascript
   localStorage.getItem('voyai_token')
   ```
   Should be `null` initially

3. **Test token extraction:**
   Navigate to: `http://localhost:5173/?token=test123`

4. **Verify:**
   - Console shows: `[Voyai] Failed to decode token` (expected for invalid token)
   - URL is cleaned (token removed)

5. **Ask Antigravity to generate a test JWT:**
   ```
   Create a test JWT token for LogicArt with:
   - appId: "logicart"
   - tier: "founder"
   - features: { history_database: true, github_sync: true }
   - email: "test@example.com"
   
   Use a simple payload, don't worry about signing it properly for this test.
   ```

6. **Try the generated token** in URL

**✅ PASS if:**
- Token is extracted from URL
- URL is cleaned
- Invalid tokens are rejected gracefully
- Valid tokens are accepted (check console logs)

---

## 🎯 Quick Test Results

| Test | Status | Notes |
|------|--------|-------|
| 1. File Watch Mode | ⬜ | |
| 2. Antigravity File Edit | ⬜ | |
| 3. Council CLI | ⬜ | |
| 4. Theme Toggle | ⬜ | |
| 5. License System | ⬜ | |

**Legend:** ✅ Pass | ❌ Fail | ⬜ Not Tested

---

## 🐛 Common Issues & Fixes

### Issue: UI doesn't update when file changes

**Fix:**
1. Check dev server is running
2. Verify browser console for errors
3. Check network tab - should see requests to `/api/file/status` every 2 seconds
4. Ensure `data/` directory exists

### Issue: Council CLI fails

**Fix:**
1. Check if API keys are in `.env`
2. Verify `.env` is in the root directory
3. Try with just one model first
4. Check for rate limiting

### Issue: Theme toggle not visible

**Fix:**
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Check if `ThemeToggle` component is imported
3. Look for it in the header/toolbar area

---

## 📋 Next Steps

After completing these quick tests:

1. **If all pass:** Proceed with full test plan in `AI_ASSISTANT_INTEGRATION_TEST_PLAN.md`
2. **If any fail:** Document the issue and investigate
3. **Test in other IDEs:** Try the same tests in VS Code, Cursor, and Windsurf

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the logs:**
   - Browser console (F12)
   - Terminal (dev server output)
   - Network tab (for API calls)

2. **Verify setup:**
   - Node.js version: `node --version` (should be v18+)
   - Dependencies installed: `npm install`
   - Dev server running: Check http://localhost:5173

3. **Review documentation:**
   - `watch_mode_instructions.md` - File watch details
   - `instructions.md` - Council and license details
   - `AI_ASSISTANT_INTEGRATION_TEST_PLAN.md` - Full test plan

---

**Ready to test? Start with Test 1! 🚀**
