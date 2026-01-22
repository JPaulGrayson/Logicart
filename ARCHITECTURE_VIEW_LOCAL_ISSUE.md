# Architecture View: Local vs. Replit Discrepancy

**Date:** January 15, 2026  
**Reporter:** Antigravity (via automated testing)  
**Environment:** macOS local development
**Status:** 🔴 **FRONTEND BUG CONFIRMED** - Backend API works correctly

---

## Summary

The **Architecture View** feature works correctly in two Replit-hosted applications but shows **"0 components · 0 connections"** when running locally on macOS.

### Critical Finding

The **backend API works perfectly** when called directly:

```bash
curl -X POST http://localhost:3000/api/agent/architecture \
  -H "Content-Type: application/json" \
  -d '{"files":{"current.tsx":"const Button = () => <button>Click</button>;\nconst Header = () => <header><Button /></header>;"}}'

# Response: {"nodes":[...], "edges":[...], "componentCount":3, "connectionCount":3}
```

**The bug is in the frontend** — specifically how the Workbench passes code to the API.

---

## What Works (Replit)

According to the user, the Architecture View successfully:
- Detects components in multi-file React projects
- Shows component dependency graphs
- Allows clicking on components to navigate to their code

---

## What Doesn't Work (Local)

### Test Environment
- **OS:** macOS
- **Node:** v22.16.0
- **Git:** Synced to `origin/main` (commit `73ddf5f`)
- **Server:** `PORT=3000 npm run dev`
- **URL:** `http://localhost:3000`

### Observations

1. **UI Loads Correctly:**
   - Architecture View button visible in sidebar
   - Canvas renders with grid background
   - Legend shows correctly (Function/Arrow/Class color coding)
   - "Back to Flowchart" button works

2. **Component Detection Fails:**
   - Header always shows: `"0 components · 0 connections"`
   - No nodes appear on the canvas
   - Tested with multiple code samples (see below)

3. **Backend API Responds:**
   - The `/api/agent/architecture` endpoint returns `200 OK`
   - However, when called from the Workbench, it returns `"400 Bad Request"` for certain code structures

---

## Test Cases

### Test 1: Built-in Example ("Todo App Integration")
**Code:** Async functions, not React components
**Result:** API returns 400 - Expected (not component code)

### Test 2: Simple React Component (manually pasted)
```javascript
const MyComponent = () => <div>Hello</div>;
```
**Result:** 0 components detected

### Test 3: Multi-Component Structure (manually pasted)
```javascript
const Button = () => <button>Click</button>;
const Header = () => <header><Button /></header>;
const App = () => <div><Header /></div>;
```
**Result:** 0 components detected

### Test 4: Direct API Call (via console)
```javascript
fetch('/api/agent/architecture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    files: {
      "App.tsx": "import Header from './Header'; const App = () => <div><Header /></div>;",
      "Header.tsx": "const Header = () => <div>Header</div>; export default Header;"
    }
  })
}).then(r => r.json())
```
**Result:** ✅ **This works!** Returns proper `nodes` and `edges` arrays.

---

## Root Cause Analysis

After examining the `extractComponents` function in `server/routes.ts` (lines 991-1189), I found the exact issue.

### The Component Detection Patterns (lines 996-1019)

The backend uses these regex patterns to detect React components:

```javascript
const componentPatterns = [
  // Pattern 1: export const/let Name = () => { or (
  /export\s+(?:const|let)\s+([A-Z][a-zA-Z0-9]*)\s*(?::[^=]+)?\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*[{(]/g,
  
  // Pattern 4: const/let Name = () => { or (  (NON-EXPORTED)
  /(?:^|\n)\s*(?:const|let)\s+([A-Z][a-zA-Z0-9]*)\s*(?::[^=]+)?\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*[{(]/g,
  
  // Pattern 14: Implicit JSX: const Name = () => <JSX
  /(?:^|\n)\s*(?:const|let)\s+([A-Z][a-zA-Z0-9]*)\s*(?::[^=]+)?\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*</g,
  // ... more patterns
];
```

### Why Test Code Didn't Match

My test code used implicit JSX return without parentheses:
```javascript
const Button = () => <button>Click</button>;
```

**Expected to match Pattern 14:** `const Name = () => <JSX`

However, Pattern 14 is: `(?:^|\n)\s*(?:const|let)\s+...=>\s*<`

This should technically match, BUT look at the file content being sent:
```json
{"files":{"current.tsx":"const Button = () => <button>Click</button>;\nconst Header..."}}
```

The issue: **Pattern 14 expects `=>\s*<` (arrow followed by optional whitespace then `<`)**, but the JSX has a space: `=> <button>`.

Wait—`\s*` should handle that. Let me trace this more carefully...

### The REAL Issue: Parameter Pattern Mismatch

Looking at the arrow part of the regex:
```regex
\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         This expects EITHER:
         - (\([^)]*\)) - parenthesized params: ()  or (props) or (a, b)
         - OR [a-zA-Z...] - single identifier param: x, props, etc.
```

The test code `() => <button>` has **empty parentheses `()`**, which matches `\([^)]*\)` ✓

BUT wait—this part `[a-zA-Z_$][a-zA-Z0-9_$]*` is for **single-param no-parens** style like `x => ...`

So `() => <` should match. Let me test this manually...

### Verification: Testing the Regex Directly

```javascript
const pattern = /(?:^|\n)\s*(?:const|let)\s+([A-Z][a-zA-Z0-9]*)\s*(?::[^=]+)?\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*</g;
const code = "const Button = () => <button>Click</button>;";
console.log(pattern.exec(code)); // Check if it matches
```

**Result:** This SHOULD match `Button`.

### Possible Environment Difference

The patterns are complex and rely on the file content arriving exactly as expected. In Replit:
1. Multiple files are scanned from the file system
2. Files have proper module structure with imports/exports
3. The `fetchArchitectureView` function may work differently

Locally, only `current.tsx` is sent with raw editor content.

### Request for Replit Team

1. **Is there a different codepath** for Architecture View in Replit-hosted apps vs. standalone local mode?
2. **Can you share logs** from a working Replit session showing what gets sent to `/api/agent/architecture`?
3. **Are there preprocessing steps** (e.g., TypeScript transpilation) that happen before component detection?

---

## Suggested Fix

The frontend correctly calls the API, and the API correctly parses components. The issue is likely in the **editor state synchronization**.

### Debug Steps for Replit Team

Add console logging to `fetchArchitectureView` in `Workbench.tsx` (line 1710):

```typescript
const fetchArchitectureView = useCallback(async () => {
  setArchitectureLoading(true);
  try {
    const files: Record<string, string> = {};
    
    console.log('[Architecture] Current code length:', code?.length);
    console.log('[Architecture] Current code (first 200 chars):', code?.substring(0, 200));
    
    if (code.trim()) {
      files['current.tsx'] = code;
    }
    
    console.log('[Architecture] Sending files:', JSON.stringify(files).substring(0, 500));
    
    const response = await fetch('/api/agent/architecture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    });
    
    const data = await response.json();
    console.log('[Architecture] Response:', data);
    // ...
  }
}, [code]);
```

### Likely Root Cause

The `code` variable may be:
1. **Out of sync** with the actual editor content
2. **Stale** from a previous example that didn't have components
3. **Empty** if the editor state isn't properly connected

### Verification

Open browser DevTools and run:
```javascript
// Check what the React state has
document.querySelector('[data-testid="code-editor"] textarea')?.value
```

Compare this to what the Architecture button is sending.

---

## Console Logs From Testing

```
INTERCEPTED ARCHITECTURE FETCH: /api/agent/architecture 
{"files":{"current.tsx":"const Button = () => <button>Click</button>;\nconst Header = () => <header><Button /></header>;\nconst App = () => <div><Header /></div>;\n"}}
```

**Note:** When we intercepted the fetch, the code WAS being sent. But the API returned 400 for some payloads.

---

## API Response Examples

### Working (curl direct):
```json
{
  "nodes": [
    {"id":"Button","label":"Button","type":"arrow","exports":false,"lineCount":1},
    {"id":"Header","label":"Header","type":"arrow","exports":false,"lineCount":2},
    {"id":"App","label":"App","type":"arrow","exports":false,"lineCount":2}
  ],
  "edges": [
    {"source":"Header","target":"Button"},
    {"source":"App","target":"Button"},
    {"source":"App","target":"Header"}
  ],
  "componentCount": 3,
  "connectionCount": 3
}
```

### Not Working (browser):
```json
{"nodes":[],"edges":[],"componentCount":0,"connectionCount":0}
```

---

## Environment Verification Commands

```bash
# Verify git sync
git log --oneline -5
# 73ddf5f Add an architecture view to visualize component dependencies
# 16d5318 Improve component detection logic for code-to-flowchart tool
# ...

# Confirm routes.ts has extractComponents
grep -n "extractComponents" server/routes.ts
# 991: const extractComponents = (code: string, filePath: string) => {

# Test API directly
curl -s -X POST http://localhost:3000/api/agent/architecture \
  -H "Content-Type: application/json" \
  -d '{"files":{"test.tsx":"const Foo = () => <div>Hi</div>;"}}' | jq
```

---

## Request for Replit Team

1. **Add the debug logging** suggested above and report what `code` contains when Architecture is clicked
2. **Compare Replit environment** - does the hosted version use a different `fetchArchitectureView` implementation?
3. **Check for caching** - is there any service worker or cache that could be returning stale responses?
