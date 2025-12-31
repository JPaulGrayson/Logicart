# LogiGo AI Integration - Replit Browser Testing Instructions

**Date:** December 31, 2025  
**Tester:** Replit Agent  
**Estimated Time:** 90 minutes  
**Prerequisites:** Antigravity backend tests completed ✅

---

## 🎯 Your Mission

Test the **UI/browser integration** of LogiGo's new AI features. Antigravity has already verified that all backend code is correct. Your job is to verify the **user-facing functionality** works in the browser.

---

## ✅ What Antigravity Already Tested

You **DON'T** need to retest these:
- ✅ File structure (all files exist)
- ✅ API endpoints (`/api/file/status`, `/api/file/load`, `/api/file/save`)
- ✅ JWT middleware implementation
- ✅ Council CLI tool
- ✅ Code quality and error handling

---

## 🧪 Your Test Suite (5 Tests)

### **TEST 1: File Watch UI Updates** ⭐ CRITICAL (20 minutes)

**Goal:** Verify the browser UI automatically updates when `data/flowchart.json` is edited externally.

**Steps:**

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open browser** to the application URL (should be shown in terminal)

3. **Open browser DevTools** (F12) and go to Console tab

4. **Verify polling is active:**
   - Look for network requests to `/api/file/status` every 2 seconds
   - Check Console for any errors

5. **Test external file edit:**
   ```bash
   echo '{"code": "function externalEdit() { return 'Hello from Replit'; }"}' > data/flowchart.json
   ```

6. **Watch the browser:**
   - Within 2 seconds, the UI should update
   - Console should show: `[Watch Mode] External change detected, reloading...`
   - The code editor should show the new function

7. **Test multiple edits:**
   ```bash
   echo '{"code": "function secondEdit() { return 42; }"}' > data/flowchart.json
   ```
   - UI should update again

8. **Test rapid edits:**
   - Make 3 consecutive edits within 5 seconds
   - Verify UI handles them gracefully (no crashes, shows final state)

**Pass Criteria:**
- [ ] Network tab shows `/api/file/status` requests every 2 seconds
- [ ] UI updates within 2 seconds of file change
- [ ] Console shows watch mode messages
- [ ] No errors in console
- [ ] Rapid edits don't crash the UI

**Screenshots:**
- `test1_network_polling.png` - Network tab showing status requests
- `test1_ui_updated.png` - UI after external file edit
- `test1_console_logs.png` - Console showing watch mode messages

---

### **TEST 2: Theme Toggle** ⭐ CRITICAL (10 minutes)

**Goal:** Verify the manual theme toggle works (fixes R3.3 partial pass from V1 testing).

**Steps:**

1. **Locate the theme toggle button:**
   - Should be in the header/toolbar
   - Look for a sun/moon icon

2. **Verify initial state:**
   - Note whether you're in light or dark mode
   - Check the icon (sun in dark mode, moon in light mode)

3. **Click the toggle:**
   - Theme should switch immediately
   - Icon should change
   - All UI elements should remain readable

4. **Test in dark mode:**
   - Background should be dark
   - Text should be light
   - Flowchart nodes should have good contrast
   - Code editor should use dark theme

5. **Test in light mode:**
   - Background should be light
   - Text should be dark
   - All elements should remain readable

6. **Test persistence:**
   - Refresh the page (F5)
   - Theme should persist (same as before refresh)

7. **Test during execution:**
   - Load an example (e.g., Fibonacci)
   - Start execution (Play button)
   - Toggle theme while execution is running
   - Verify execution continues and highlighting is visible

**Pass Criteria:**
- [ ] Theme toggle button is visible and accessible
- [ ] Clicking toggles between light and dark
- [ ] Icon changes appropriately (sun ↔ moon)
- [ ] All UI elements readable in both themes
- [ ] Theme persists on page reload
- [ ] Theme toggle doesn't interrupt execution

**Screenshots:**
- `test2_dark_mode.png` - Full UI in dark mode
- `test2_light_mode.png` - Full UI in light mode
- `test2_toggle_button.png` - Close-up of toggle button

---

### **TEST 3: License Authentication Flow** ⭐ HIGH (15 minutes)

**Goal:** Verify Voyai JWT authentication works in the browser.

**Steps:**

1. **Check initial state:**
   - Open browser DevTools → Application tab → Local Storage
   - Verify `voyai_token` is null or doesn't exist

2. **Test invalid token:**
   - Navigate to: `/?token=invalid_token_123`
   - Check Console for error message
   - Verify URL is cleaned (token removed)
   - Verify localStorage still has no valid token

3. **Generate a test JWT:**
   - Use this test payload structure:
     ```json
     {
       "userId": "test-user-123",
       "email": "test@example.com",
       "appId": "logigo",
       "tier": "founder",
       "features": {
         "history_database": true,
         "rabbit_hole_rescue": true,
         "github_sync": true
       },
       "iat": 1735689600,
       "exp": 9999999999
     }
     ```
   - Encode it as a JWT (you can use a simple base64 encoding for testing)
   - **Note:** For real testing, you'd need a properly signed JWT, but for UI testing, the client-side decode should work with any valid JWT structure

4. **Test with valid token structure:**
   - Navigate to: `/?token=<your_test_jwt>`
   - Check Console for: `[Voyai] Token accepted, user: test@example.com`
   - Verify localStorage now has `voyai_token`
   - Verify URL is cleaned

5. **Test feature gates:**
   - Look for UI elements that should be gated:
     - "Save" button (requires `history_database`)
     - "Sync to GitHub" button (requires `github_sync`)
     - "Rescue Me" button in Arena (requires `rabbit_hole_rescue`)
   - With founder tier, all should be enabled

6. **Test "Login with Voyai" button:**
   - Find the login button (should be in header)
   - Click it
   - Verify it redirects to: `https://voyai.org/login?app=logigo&return_to=<current_url>`
   - **Note:** Don't complete the login, just verify the redirect URL is correct

**Pass Criteria:**
- [ ] Invalid tokens are rejected with clear console messages
- [ ] URL is cleaned after token extraction
- [ ] Valid JWT structure is accepted
- [ ] Token is stored in localStorage
- [ ] Console shows appropriate auth messages
- [ ] Login button redirects to correct Voyai URL

**Screenshots:**
- `test3_invalid_token.png` - Console showing invalid token rejection
- `test3_valid_token.png` - Console showing token acceptance
- `test3_local_storage.png` - localStorage with voyai_token

---

### **TEST 4: Bidirectional Sync** ⭐ CRITICAL (20 minutes)

**Goal:** Verify sync works both ways (UI → File and File → UI).

**Steps:**

1. **Test UI → File:**
   - In the browser, edit the code (add a new function)
   - Click "Save" or trigger a save action
   - Check `data/flowchart.json` in the file system
   - Verify the file contains your changes

2. **Test File → UI:**
   - Edit `data/flowchart.json` directly:
     ```bash
     echo '{"code": "function fromFile() { return 'Replit was here'; }"}' > data/flowchart.json
     ```
   - Watch browser UI update automatically

3. **Test concurrent edits:**
   - Edit code in UI (but don't save yet)
   - While UI has unsaved changes, edit the file:
     ```bash
     echo '{"code": "function conflict() { return 'test'; }"}' > data/flowchart.json
     ```
   - Observe behavior:
     - UI should update (file change wins)
     - Or UI should show a warning about external changes

4. **Test save after external change:**
   - Edit file externally
   - Wait for UI to update
   - Make a change in UI
   - Save from UI
   - Verify file has the UI changes (last write wins)

5. **Test with flowchart data:**
   - Create a more complex structure:
     ```json
     {
       "code": "function test() { return 42; }",
       "nodes": [
         {"id": "1", "type": "FUNCTION", "label": "test"}
       ],
       "edges": []
     }
     ```
   - Verify UI renders the flowchart

**Pass Criteria:**
- [ ] UI changes are saved to file
- [ ] File changes update UI automatically
- [ ] Concurrent edits are handled gracefully
- [ ] Last write wins (no data corruption)
- [ ] Complex data structures sync correctly

**Screenshots:**
- `test4_ui_to_file.png` - File content after UI save
- `test4_file_to_ui.png` - UI after external file edit
- `test4_flowchart_sync.png` - Flowchart rendered from file data

---

### **TEST 5: Council Service UI Integration** ⭐ HIGH (25 minutes)

**Goal:** Verify the Council Service (Arena) works from the UI.

**Prerequisites:**
- At least one API key configured in `.env` (for testing)
- If no API keys, verify graceful error handling

**Steps:**

1. **Locate the Arena/Council interface:**
   - Look for "Arena" or "Council" in the navigation
   - Or a button to "Ask the Council"

2. **Test code generation mode:**
   - Enter a prompt: "Write a function to reverse a string"
   - Submit the request
   - Verify:
     - Loading indicator appears
     - Results from 4 models appear (or error messages if no API keys)
     - Chairman verdict is displayed
     - Latency metrics are shown

3. **Test debug mode:**
   - Switch to debug mode (if available)
   - Enter a prompt: "Why is my React component re-rendering?"
   - Verify:
     - Models provide debugging advice (not code)
     - Chairman synthesizes the best approach

4. **Test chairman selection:**
   - If UI allows, try different chairman models:
     - OpenAI (GPT-4o)
     - Gemini
     - Claude
     - Grok
   - Verify verdict changes based on chairman

5. **Test error handling:**
   - If no API keys configured:
     - Verify clear error messages
     - UI doesn't crash
   - If one API key missing:
     - Verify partial results (3 models instead of 4)
     - Chairman still provides verdict

6. **Test UI responsiveness:**
   - Submit a request
   - Verify UI doesn't freeze
   - Verify you can still interact with other parts of the app

**Pass Criteria:**
- [ ] Arena/Council interface is accessible
- [ ] Code mode generates code from all models
- [ ] Debug mode provides debugging advice
- [ ] Chairman verdict is displayed
- [ ] Latency metrics are shown
- [ ] Error handling is graceful
- [ ] UI remains responsive during requests

**Screenshots:**
- `test5_arena_interface.png` - Council/Arena UI
- `test5_code_results.png` - Results from code generation
- `test5_debug_results.png` - Results from debug mode
- `test5_chairman_verdict.png` - Chairman's verdict display

---

## 🐛 Error Scenarios to Test

### Error Test 1: Server Disconnect
1. Stop the dev server while UI is open
2. **Expected:** UI shows error, doesn't crash
3. Restart server
4. **Expected:** File watch resumes automatically

### Error Test 2: Invalid JSON in File
1. Edit `data/flowchart.json` with invalid JSON:
   ```bash
   echo '{invalid json}' > data/flowchart.json
   ```
2. **Expected:** UI shows parse error, doesn't crash

### Error Test 3: Missing API Keys
1. Ensure no API keys in `.env`
2. Try to use Council service
3. **Expected:** Clear error messages, UI functional

---

## 📊 Test Results Template

After completing all tests, fill out this summary:

```markdown
# LogiGo Replit Browser Test Results

**Date:** [Date]
**Tester:** Replit Agent
**Total Tests:** 5
**Passed:** [X]
**Failed:** [Y]
**Partial:** [Z]

## Test Results

| Test ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| 1 | File Watch UI Updates | ⬜ | |
| 2 | Theme Toggle | ⬜ | |
| 3 | License Authentication | ⬜ | |
| 4 | Bidirectional Sync | ⬜ | |
| 5 | Council Service UI | ⬜ | |

## Critical Issues Found
[List any blockers]

## Recommendations
[Suggestions for improvements]

## Launch Readiness
**Status:** GO / NO-GO / CONDITIONAL
**Reasoning:** [Explanation]
```

---

## 🎯 Success Criteria

For LogiGo to be **AI Assistant Ready**:

### CRITICAL (Must Pass):
- [ ] File watch updates UI automatically
- [ ] Theme toggle works in both modes
- [ ] Bidirectional sync works without data loss
- [ ] No crashes or critical errors

### HIGH (Should Pass):
- [ ] License authentication flow works
- [ ] Council service accessible from UI
- [ ] Error messages are clear
- [ ] UI remains responsive

---

## 🆘 Troubleshooting

### File Watch Not Working
- Check Network tab for `/api/file/status` requests
- Check Console for errors
- Verify `data/` directory exists
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Theme Toggle Not Visible
- Check if component is imported in header
- Look in Settings or toolbar area
- Try searching for sun/moon icon

### Council Service Errors
- Verify at least one API key in `.env`
- Check Console for specific error messages
- Verify Arena routes are accessible

---

## 📸 Screenshot Checklist

Make sure to capture:
- [ ] Network tab showing file watch polling
- [ ] UI before and after external file edit
- [ ] Theme toggle in both light and dark modes
- [ ] Console logs for authentication
- [ ] localStorage with voyai_token
- [ ] Council/Arena interface
- [ ] Model results and chairman verdict

---

## ⏱️ Time Estimates

- **Test 1:** 20 minutes
- **Test 2:** 10 minutes
- **Test 3:** 15 minutes
- **Test 4:** 20 minutes
- **Test 5:** 25 minutes
- **Total:** 90 minutes

---

**Good luck! The LogiGo AI integration depends on your thorough testing! 🚀**
