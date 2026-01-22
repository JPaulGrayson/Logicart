# LogicArt V1 Manual Test Checklist

**Date:** December 30, 2025  
**Tester:** Paul  
**Application URL:** https://cartographer-flow-jpaulgrayson.replit.app/

---

## ✅ Already Completed (Automated Tests)
- [x] **R1.1**: Static Code Parsing (5 algorithm patterns)
- [x] **R1.2**: Execution Stepping (Play/Pause, Step Forward/Back, Reset)
- [x] **R1.3**: Variable Tracking (Real-time updates in Debug Panel)

---

## 🔲 Remaining Tests (Manual)

### **R1.4: User Labels** (5 minutes)
**Goal:** Verify that `@logicart:` annotations are extracted and displayed.

1. In the code editor, add a comment like: `// @logicart: Calculate sum`
2. Verify that the label appears on the corresponding flowchart node
3. Try multiple labels in different parts of the code
4. **Expected:** Labels should be visible on nodes, enhancing readability

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R1.5: Breakpoints** (5 minutes)
**Goal:** Verify node-level execution pauses.

1. Click on a flowchart node to set a breakpoint (should show a red indicator)
2. Click "Play" to start execution
3. Verify execution pauses at the breakpoint
4. Click "Play" again to continue
5. Remove the breakpoint and verify execution continues normally

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R2.1: Layout Presets** (10 minutes)
**Goal:** Test different layout configurations.

1. Look for the Layout Presets dropdown (should be in toolbar)
2. Try each preset:
   - [ ] **Default Layout**
   - [ ] **Code Focus** (larger code panel)
   - [ ] **Flowchart Focus** (larger flowchart panel)
   - [ ] **Presentation** (minimal UI, max flowchart)
3. For each, verify:
   - Panel sizes adjust appropriately
   - Flowchart remains readable
   - Layout persists when switching examples

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R2.2: Hierarchical Navigation (Collapsible Containers)** (10 minutes)
**Goal:** Test container node collapse/expand functionality.

1. Select "API Handler Integration" or "Fibonacci Memoized" example
2. Look for container nodes (functions, loops, conditionals)
3. Click on a container to collapse it
   - [ ] Child nodes disappear
   - [ ] Container shows summary/indicator
4. Click again to expand
   - [ ] Child nodes reappear
   - [ ] Layout adjusts correctly
5. Test during execution:
   - [ ] Collapsed state maintained while stepping
   - [ ] Execution still highlights within collapsed containers

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R2.3: Undo/Redo** (5 minutes)
**Goal:** Verify history stack for code changes.

1. Make a code change in the editor
2. Press `Cmd+Z` (Mac) or `Ctrl+Z` (Windows) to undo
   - [ ] Code reverts to previous state
   - [ ] Flowchart updates to match
3. Press `Cmd+Shift+Z` or `Ctrl+Y` to redo
   - [ ] Code returns to edited state
   - [ ] Flowchart updates again
4. Test multiple undo/redo cycles

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R2.4: Enhanced Sharing** (5 minutes)
**Goal:** Test share dialog and URL generation.

1. Click the "Share" button (should be in toolbar)
2. Verify the share dialog opens with:
   - [ ] Current code snapshot
   - [ ] Metadata (title, description fields)
   - [ ] Generated shareable URL
3. Copy the URL and open in a new tab
   - [ ] Code loads correctly
   - [ ] Flowchart renders
   - [ ] Execution works

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R2.5: Example Selector** (5 minutes)
**Goal:** Test dynamic loading of algorithm templates.

1. Open the Examples dropdown/menu
2. Try loading each example:
   - [ ] Calculator
   - [ ] Fibonacci (Simple)
   - [ ] Fibonacci (Memoized)
   - [ ] Tic-Tac-Toe
   - [ ] API Handler Integration
   - [ ] Any other examples available
3. For each, verify:
   - Code loads correctly
   - Flowchart renders
   - Execution works

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R3.1: Responsive Design** (10 minutes)
**Goal:** Test UI adaptability across screen sizes.

1. **Desktop (current):**
   - [ ] All panels visible and functional
2. **Tablet (resize browser to ~768px width):**
   - [ ] Layout adjusts appropriately
   - [ ] No critical UI elements hidden
3. **Mobile (resize to ~375px width):**
   - [ ] Mobile-friendly layout
   - [ ] Core features still accessible

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R3.2: Keyboard Shortcuts** (5 minutes)
**Goal:** Verify global keyboard accessibility.

Test each shortcut:
- [ ] **Space**: Play/Pause execution
- [ ] **S**: Step Forward
- [ ] **B**: Step Backward
- [ ] **R**: Reset execution
- [ ] **F**: Toggle fullscreen (if available)
- [ ] **?**: Show keyboard shortcuts help

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R3.3: Theme Support** (3 minutes)
**Goal:** Test Light/Dark mode consistency.

1. Look for theme toggle (usually in settings or toolbar)
2. Switch to Dark mode:
   - [ ] All UI elements readable
   - [ ] Flowchart nodes have good contrast
   - [ ] Code editor syntax highlighting works
3. Switch to Light mode:
   - [ ] Same checks as above

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

### **R3.4: Error Handling** (5 minutes)
**Goal:** Test graceful degradation on errors.

1. **Syntax Error:**
   - Enter invalid JavaScript (e.g., `function test( {`)
   - [ ] Error message displayed clearly
   - [ ] No app crash
2. **Network Failure (if applicable):**
   - Disconnect internet briefly
   - [ ] Appropriate error message
   - [ ] App remains functional for local operations

**Status:** ⬜ Not Started | ⬜ Pass | ⬜ Fail  
**Notes:**

---

## 📊 Summary

**Total Tests:** 12  
**Completed:** 0  
**Passed:** 0  
**Failed:** 0  
**Blocked:** 0  

**Estimated Time:** 70 minutes

---

## 🚦 Go/No-Go Criteria

- **CRITICAL (Must Pass):** R1.4, R1.5, R2.1, R2.2, R2.5, R3.2
- **HIGH (Should Pass):** R2.3, R2.4, R3.1, R3.3, R3.4
- **NICE-TO-HAVE:** Additional polish items

**Final Recommendation:** _[To be filled after testing]_
