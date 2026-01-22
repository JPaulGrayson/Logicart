# LogicArt AI Assistant Integration Test Plan

**Version:** 1.0  
**Date:** December 31, 2025  
**Objective:** Validate LogicArt integration with Antigravity, VS Code, Cursor, and Windsurf

---

## 🎯 Overview

This test plan validates that LogicArt's new **File Watch Mode**, **Council Service**, and **License System** work correctly across all major AI coding assistant platforms.

### New Features to Test:
1. **File Watch Mode** (`useWatchFile` hook) - Bi-directional sync between AI agents and UI
2. **Council Service** (`councilService.ts`) - Multi-model AI consensus system
3. **License System** (`useLicense` hook) - Voyai authentication and feature gates
4. **Theme Toggle** - Manual light/dark mode switching
5. **CLI Council** (`ask-council.ts`) - Command-line access to AI council

---

## 🤖 Test Matrix

| Feature | Antigravity | VS Code | Cursor | Windsurf | Priority |
|---------|-------------|---------|--------|----------|----------|
| File Watch Mode | ✅ Test | ✅ Test | ✅ Test | ✅ Test | CRITICAL |
| Council Service | ✅ Test | ✅ Test | ✅ Test | ✅ Test | HIGH |
| License System | ✅ Test | ✅ Test | ✅ Test | ✅ Test | HIGH |
| Theme Toggle | ✅ Test | ✅ Test | ✅ Test | ✅ Test | MEDIUM |
| CLI Council | ✅ Test | ✅ Test | ✅ Test | ✅ Test | MEDIUM |

---

## 📋 Test Suite

### **TEST 1: File Watch Mode Integration** ⭐ CRITICAL

**Goal:** Verify that AI assistants can edit `data/flowchart.json` and the UI updates automatically.

#### Test 1.1: Antigravity Integration

**Prerequisites:**
- LogicArt dev server running (`npm run dev`)
- Browser open to `http://localhost:5173`
- Antigravity AI active in VS Code/Cursor

**Steps:**
1. Open LogicArt project in your IDE with Antigravity active
2. Ask Antigravity: *"Create a simple flowchart in data/flowchart.json with 3 nodes: Start, Process, and End"*
3. Verify Antigravity creates/modifies `data/flowchart.json`
4. **Expected Result:** Within 2 seconds, the browser UI should update to show the new flowchart
5. Ask Antigravity: *"Add a new node called 'Validation' between Start and Process"*
6. **Expected Result:** UI updates automatically without page refresh

**Pass Criteria:**
- [ ] Antigravity can read and write `data/flowchart.json`
- [ ] UI polls `/api/file/status` every 2 seconds
- [ ] UI detects file changes via `lastModified` timestamp
- [ ] UI automatically loads new data from `/api/file/load`
- [ ] No page refresh required
- [ ] Console shows: `[Watch Mode] External change detected, reloading...`

**Screenshot:** `test1_1_antigravity_file_watch.png`

---

#### Test 1.2: VS Code Integration

**Prerequisites:**
- LogicArt dev server running
- VS Code with built-in AI (Copilot or similar)

**Steps:**
1. Open `data/flowchart.json` in VS Code
2. Use VS Code AI to generate a flowchart structure
3. Save the file
4. Check browser UI for automatic update

**Pass Criteria:**
- [ ] VS Code AI can generate valid flowchart JSON
- [ ] File saves trigger UI update
- [ ] No conflicts between VS Code and UI edits

**Screenshot:** `test1_2_vscode_file_watch.png`

---

#### Test 1.3: Cursor Integration

**Prerequisites:**
- LogicArt dev server running
- Cursor IDE active

**Steps:**
1. Open LogicArt project in Cursor
2. Ask Cursor AI: *"Modify data/flowchart.json to add a loop structure"*
3. Verify UI updates automatically
4. Test bidirectional sync:
   - Make a change in the UI (add a node via UI)
   - Ask Cursor to read the file
   - Verify Cursor sees the UI changes

**Pass Criteria:**
- [ ] Cursor AI can read/write flowchart file
- [ ] UI updates when Cursor modifies file
- [ ] Cursor can see changes made in UI
- [ ] No race conditions or data loss

**Screenshot:** `test1_3_cursor_file_watch.png`

---

#### Test 1.4: Windsurf Integration

**Prerequisites:**
- LogicArt dev server running
- Windsurf IDE active

**Steps:**
1. Open LogicArt project in Windsurf
2. Ask Windsurf AI: *"Create a complex flowchart with nested conditionals in data/flowchart.json"*
3. Verify UI updates
4. Test rapid changes:
   - Ask Windsurf to make 3 consecutive edits
   - Verify UI handles rapid updates gracefully

**Pass Criteria:**
- [ ] Windsurf AI can manipulate flowchart file
- [ ] UI handles rapid consecutive updates
- [ ] No UI flickering or data corruption
- [ ] Last write wins (no merge conflicts)

**Screenshot:** `test1_4_windsurf_file_watch.png`

---

### **TEST 2: Council Service Integration** ⭐ HIGH

**Goal:** Verify AI assistants can invoke the Council Service for multi-model consensus.

#### Test 2.1: Antigravity Council Access

**Prerequisites:**
- API keys configured in `.env`:
  ```
  OPENAI_API_KEY=sk-...
  GEMINI_API_KEY=...
  ANTHROPIC_API_KEY=sk-ant-...
  XAI_API_KEY=xai-...
  ```

**Steps:**
1. Ask Antigravity: *"Use the LogicArt Council Service to generate code for a binary search function"*
2. Verify Antigravity can:
   - Import `councilService.ts`
   - Call `askCouncil(prompt, "code", keys, "openai")`
   - Receive responses from all 4 models
   - Get chairman's verdict
3. Ask Antigravity to display the results

**Pass Criteria:**
- [ ] Antigravity can import and call council service
- [ ] All 4 models return responses (GPT-4o, Gemini-3-Flash, Claude Opus 4.5, Grok-4)
- [ ] Chairman provides a verdict
- [ ] Response includes latency metrics
- [ ] No API errors (unless keys are invalid)

**Screenshot:** `test2_1_antigravity_council.png`

---

#### Test 2.2: CLI Council Test (All IDEs)

**Prerequisites:**
- Terminal access in IDE
- API keys configured

**Steps:**
1. In terminal, run: `npm run council "Write a function to validate email addresses"`
2. **Expected:** Council queries all 4 models and returns chairman's verdict
3. Test with file input:
   - Create `council_prompt.md` with a complex debugging question
   - Run: `npm run council`
   - **Expected:** Reads from `council_prompt.md` and returns verdict
4. Test in each IDE (Antigravity, VS Code, Cursor, Windsurf)

**Pass Criteria:**
- [ ] CLI script runs in all IDEs
- [ ] Accepts string arguments
- [ ] Reads from `council_prompt.md` if no argument
- [ ] Outputs only the chairman's verdict (no extra logging)
- [ ] Works with all 4 chairman options (openai, gemini, anthropic, xai)

**Screenshot:** `test2_2_cli_council_output.png`

---

#### Test 2.3: Debug Mode Council

**Prerequisites:**
- API keys configured

**Steps:**
1. Ask AI assistant: *"Use the council service in debug mode to analyze why a React component is re-rendering unnecessarily"*
2. Verify the assistant can:
   - Call `askCouncil(prompt, "debug", keys)`
   - Receive debugging advice from all 4 models
   - Get chairman's synthesized verdict

**Pass Criteria:**
- [ ] Debug mode uses `DEBUG_ANALYSIS_SYSTEM_PROMPT`
- [ ] Models provide debugging advice (not code)
- [ ] Chairman synthesizes best approach
- [ ] Response format includes sections: Best Approach, Consensus Points, Unique Insights, Action Plan

**Screenshot:** `test2_3_debug_council.png`

---

### **TEST 3: License System Integration** ⭐ HIGH

**Goal:** Verify Voyai authentication and feature gating work across all platforms.

#### Test 3.1: License Hook Integration

**Prerequisites:**
- LogicArt dev server running
- Browser open

**Steps:**
1. Open browser console
2. Check `localStorage` for `voyai_token`
3. Ask AI assistant: *"Generate a test Voyai JWT token for LogicArt with founder tier"*
4. Navigate to: `http://localhost:5173/?token=<generated_token>`
5. **Expected:** Token is stored, URL is cleaned, user is authenticated
6. Verify in console: `[Voyai] Token accepted, user: <email>`

**Pass Criteria:**
- [ ] Token is extracted from URL query parameter
- [ ] Token is validated (JWT decode)
- [ ] Token is stored in localStorage
- [ ] URL is cleaned (token removed from query string)
- [ ] `useLicense` hook exposes: `isAuthenticated`, `user`, `hasFeature()`, `isFounder()`
- [ ] Invalid tokens are rejected

**Screenshot:** `test3_1_license_auth.png`

---

#### Test 3.2: Feature Gates

**Prerequisites:**
- Authenticated with a test token

**Steps:**
1. Create test tokens with different feature flags:
   - Token A: `features: { history_database: true, github_sync: false }`
   - Token B: `features: { history_database: false, rabbit_hole_rescue: true }`
2. Test each token and verify UI gates:
   - **History Database:** Save button should show upgrade modal if `!hasFeature('history_database')`
   - **GitHub Sync:** Sync button should be disabled with tooltip if `!hasFeature('github_sync')`
   - **Rabbit Hole Rescue:** Rescue button should be disabled if `!hasFeature('rabbit_hole_rescue')`

**Pass Criteria:**
- [ ] Feature flags are correctly decoded from JWT
- [ ] UI elements are gated based on features
- [ ] Tooltips explain why features are disabled
- [ ] "Login with Voyai" button redirects to: `https://voyai.org/login?app=logicart&return_to=<current_url>`

**Screenshot:** `test3_2_feature_gates.png`

---

#### Test 3.3: Backend Middleware

**Prerequisites:**
- Valid founder-tier token

**Steps:**
1. Test protected endpoints:
   - `POST /api/arena/save` (requires founder tier)
   - `GET /api/arena/history` (requires founder tier)
2. Test without token:
   - **Expected:** 401 Unauthorized
3. Test with invalid token:
   - **Expected:** 401 Unauthorized
4. Test with valid token but wrong `appId`:
   - **Expected:** 403 Forbidden
5. Test with valid founder token:
   - **Expected:** 200 OK

**Pass Criteria:**
- [ ] Middleware verifies JWT using RS256 public key
- [ ] Middleware checks `payload.appId === 'logicart'`
- [ ] Middleware checks `payload.tier === 'founder'`
- [ ] Protected routes return 401 without valid token
- [ ] Protected routes work with valid token

**Screenshot:** `test3_3_backend_auth.png`

---

### **TEST 4: Theme Toggle** ⭐ MEDIUM

**Goal:** Verify manual theme switching works (addresses R3.3 partial pass).

#### Test 4.1: Theme Toggle UI

**Prerequisites:**
- LogicArt dev server running
- Browser open

**Steps:**
1. Locate the theme toggle button (should be in header/toolbar)
2. Verify it shows sun icon in dark mode, moon icon in light mode
3. Click the toggle
4. **Expected:** Theme switches immediately
5. Verify:
   - Background color changes
   - Text color changes
   - Flowchart nodes have good contrast
   - Code editor theme updates
6. Test in all AI assistant contexts (Antigravity, VS Code, Cursor, Windsurf)

**Pass Criteria:**
- [ ] Theme toggle button is visible
- [ ] Button shows correct icon (sun/moon)
- [ ] Clicking toggles between light and dark
- [ ] Theme persists on page reload
- [ ] All UI elements remain readable in both themes
- [ ] No visual glitches during transition

**Screenshot:** 
- `test4_1_theme_light.png`
- `test4_1_theme_dark.png`

---

### **TEST 5: Cross-Platform Compatibility** ⭐ CRITICAL

**Goal:** Ensure all features work consistently across all AI assistants.

#### Test 5.1: Antigravity Full Workflow

**Steps:**
1. Open LogicArt in VS Code/Cursor with Antigravity
2. Ask Antigravity to:
   - Create a flowchart via file watch
   - Query the council for code generation
   - Authenticate with a test token
   - Toggle the theme
3. Verify all features work seamlessly

**Pass Criteria:**
- [ ] All features accessible via Antigravity
- [ ] No errors in console
- [ ] Smooth workflow integration

---

#### Test 5.2: VS Code Full Workflow

**Steps:**
1. Open LogicArt in VS Code
2. Use VS Code AI to:
   - Edit flowchart file
   - Run council CLI command
   - Test authentication flow
3. Verify integration

**Pass Criteria:**
- [ ] VS Code AI can access all LogicArt features
- [ ] Terminal commands work
- [ ] No IDE-specific issues

---

#### Test 5.3: Cursor Full Workflow

**Steps:**
1. Open LogicArt in Cursor
2. Use Cursor AI to:
   - Manipulate flowchart via file watch
   - Invoke council service
   - Test license features
3. Verify integration

**Pass Criteria:**
- [ ] Cursor AI has full access to LogicArt features
- [ ] Bidirectional sync works
- [ ] No Cursor-specific bugs

---

#### Test 5.4: Windsurf Full Workflow

**Steps:**
1. Open LogicArt in Windsurf
2. Use Windsurf AI to:
   - Create complex flowcharts
   - Use council for debugging
   - Test authentication
3. Verify integration

**Pass Criteria:**
- [ ] Windsurf AI can utilize all features
- [ ] Performance is acceptable
- [ ] No Windsurf-specific issues

---

## 🧪 Advanced Integration Tests

### **TEST 6: Race Condition Handling**

**Goal:** Ensure file watch mode handles concurrent edits gracefully.

**Steps:**
1. Have AI assistant edit `data/flowchart.json`
2. Simultaneously edit the flowchart in the UI
3. Save both changes within 1 second
4. **Expected:** Last write wins, no data corruption

**Pass Criteria:**
- [ ] No data loss
- [ ] No merge conflicts
- [ ] UI shows final state correctly
- [ ] Console shows appropriate warnings

---

### **TEST 7: Performance Testing**

**Goal:** Verify file watch polling doesn't impact performance.

**Steps:**
1. Open browser dev tools → Performance tab
2. Let the app run for 5 minutes with file watch active
3. Monitor:
   - CPU usage
   - Memory usage
   - Network requests (should be 1 request every 2 seconds to `/api/file/status`)
4. Verify no memory leaks

**Pass Criteria:**
- [ ] CPU usage remains low (< 5%)
- [ ] Memory stable (no leaks)
- [ ] Network requests are efficient (small payload)
- [ ] UI remains responsive

---

### **TEST 8: Error Handling**

**Goal:** Verify graceful degradation when services fail.

#### Test 8.1: File Watch Errors

**Steps:**
1. Stop the dev server while UI is open
2. **Expected:** Console shows error, but UI doesn't crash
3. Restart server
4. **Expected:** File watch resumes automatically

**Pass Criteria:**
- [ ] No UI crash on server disconnect
- [ ] Error messages are clear
- [ ] Automatic recovery when server returns

---

#### Test 8.2: Council Service Errors

**Steps:**
1. Remove API keys from `.env`
2. Try to use council service
3. **Expected:** Graceful error messages for each model
4. **Expected:** Chairman can still provide verdict if at least 1 model succeeds

**Pass Criteria:**
- [ ] Missing API keys don't crash the service
- [ ] Error messages indicate which keys are missing
- [ ] Partial results are still useful

---

#### Test 8.3: License Errors

**Steps:**
1. Try to access protected route without token
2. **Expected:** 401 with clear error message
3. Try with expired token
4. **Expected:** Token is rejected, user is logged out

**Pass Criteria:**
- [ ] Clear error messages for auth failures
- [ ] Expired tokens are detected and removed
- [ ] User is prompted to log in again

---

## 📊 Test Results Template

### Summary Table

| Test ID | Feature | Antigravity | VS Code | Cursor | Windsurf | Status |
|---------|---------|-------------|---------|--------|----------|--------|
| 1.1 | File Watch - Antigravity | ⬜ | N/A | N/A | N/A | Not Started |
| 1.2 | File Watch - VS Code | N/A | ⬜ | N/A | N/A | Not Started |
| 1.3 | File Watch - Cursor | N/A | N/A | ⬜ | N/A | Not Started |
| 1.4 | File Watch - Windsurf | N/A | N/A | N/A | ⬜ | Not Started |
| 2.1 | Council - Antigravity | ⬜ | N/A | N/A | N/A | Not Started |
| 2.2 | Council - CLI | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 2.3 | Council - Debug Mode | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 3.1 | License - Auth Flow | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 3.2 | License - Feature Gates | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 3.3 | License - Backend | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 4.1 | Theme Toggle | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 5.1 | Full Workflow - Antigravity | ⬜ | N/A | N/A | N/A | Not Started |
| 5.2 | Full Workflow - VS Code | N/A | ⬜ | N/A | N/A | Not Started |
| 5.3 | Full Workflow - Cursor | N/A | N/A | ⬜ | N/A | Not Started |
| 5.4 | Full Workflow - Windsurf | N/A | N/A | N/A | ⬜ | Not Started |
| 6 | Race Conditions | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 7 | Performance | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 8.1 | Error - File Watch | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 8.2 | Error - Council | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |
| 8.3 | Error - License | ⬜ | ⬜ | ⬜ | ⬜ | Not Started |

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial | ⬜ Not Started | N/A Not Applicable

---

## 🚀 Testing Workflow

### Phase 1: Setup (30 minutes)
1. Pull latest code: `git pull origin main`
2. Install dependencies: `npm install`
3. Configure API keys in `.env`
4. Start dev server: `npm run dev`
5. Verify server is running on `http://localhost:5173`

### Phase 2: File Watch Tests (60 minutes)
- Test 1.1 - 1.4 across all platforms
- Document any issues
- Take screenshots

### Phase 3: Council Service Tests (45 minutes)
- Test 2.1 - 2.3
- Verify CLI works
- Test debug mode

### Phase 4: License System Tests (45 minutes)
- Test 3.1 - 3.3
- Generate test tokens
- Verify feature gates

### Phase 5: Theme & Integration (30 minutes)
- Test 4.1 (Theme toggle)
- Test 5.1 - 5.4 (Full workflows)

### Phase 6: Advanced Tests (60 minutes)
- Test 6 (Race conditions)
- Test 7 (Performance)
- Test 8.1 - 8.3 (Error handling)

**Total Estimated Time:** 4.5 hours

---

## 📝 Reporting

After completing all tests, create a summary report:

```markdown
# LogicArt AI Assistant Integration Test Report

**Date:** [Date]
**Tester:** [Name]
**Total Tests:** 19
**Passed:** [X]
**Failed:** [Y]
**Partial:** [Z]

## Critical Findings
[List any blockers or critical issues]

## Platform-Specific Issues
### Antigravity
[Issues specific to Antigravity]

### VS Code
[Issues specific to VS Code]

### Cursor
[Issues specific to Cursor]

### Windsurf
[Issues specific to Windsurf]

## Recommendations
[Suggestions for improvements]

## Launch Readiness
**Status:** GO / NO-GO / CONDITIONAL
**Reasoning:** [Explanation]
```

---

## ✅ Success Criteria

For LogicArt to be considered **AI Assistant Ready**, the following must pass:

### CRITICAL (Must Pass):
- [ ] File watch mode works in all 4 platforms
- [ ] Council service accessible from all platforms
- [ ] License system authenticates correctly
- [ ] No data corruption in concurrent edits
- [ ] No crashes or critical errors

### HIGH (Should Pass):
- [ ] CLI council works in all IDEs
- [ ] Feature gates function correctly
- [ ] Theme toggle is accessible
- [ ] Performance is acceptable (< 5% CPU)

### MEDIUM (Nice to Have):
- [ ] Error messages are user-friendly
- [ ] Recovery from failures is automatic
- [ ] Documentation is clear

---

## 🔧 Troubleshooting Guide

### File Watch Not Working
- Check dev server is running
- Verify `/api/file/status` endpoint responds
- Check browser console for errors
- Ensure `data/` directory exists

### Council Service Errors
- Verify API keys in `.env`
- Check API key format (should start with `sk-` for OpenAI, etc.)
- Test each model individually
- Check rate limits

### License Issues
- Verify JWT token format
- Check token expiration
- Ensure `appId === 'logicart'`
- Verify public key matches

### Theme Toggle Missing
- Check if `ThemeToggle` component is imported in header
- Verify `next-themes` is installed
- Check for CSS conflicts

---

## 📚 Reference Documentation

- **File Watch Implementation:** `watch_mode_instructions.md`
- **Council Service:** `instructions.md` (Phase 3)
- **License System:** `instructions.md` (Phase 2)
- **API Endpoints:** `server/routes.ts`
- **Hooks:** `client/src/hooks/`

---

**Happy Testing! 🎉**
