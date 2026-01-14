# Bug Report: Remote JSX/React Code Fails to Parse in LogicArt

## Bug Description

**What's broken:**
When external applications (Turai, Cursor, Claude Code, etc.) send React/JSX code to LogicArt via the remote session flow, the parser fails to generate a proper flowchart. Instead of showing the actual function name and control flow, users see either:
1. A "GLOBAL FLOW" placeholder node instead of the actual component name
2. Parse errors due to JSX syntax not being recognized by Acorn

**Expected behavior:**
When a React component like `export function QAModal() { ... }` is sent from an external app, LogicArt should:
1. Strip TypeScript/JSX syntax using sucrase transpiler
2. Detect the exported function declaration
3. Display "QAModal" as the container name with proper control flow nodes

---

## Steps to Reproduce

1. Open an external vibe coding platform (e.g., Turai, Cursor, Antigravity)
2. Have a React component file open, such as:
   ```tsx
   export function QAModal({ isOpen, onClose }: Props) {
     const [answer, setAnswer] = useState('');
     
     if (!isOpen) return null;
     
     return <div className="modal">...</div>;
   }
   ```
3. Use the integration to send this code to LogicArt for visualization
4. Observe the flowchart output - it shows "GLOBAL FLOW" or fails to parse

---

## Relevant Code

### File: `client/src/lib/parser.ts`
```typescript
// This file re-exports the parser from the bridge package
// PROBLEM: It was pointing to docs/bridge/src/parser.ts (old, unfixed version)
// instead of bridge/src/parser.ts (the fixed version with sucrase support)

// OLD (broken):
export { parseCodeToFlow } from '../../../docs/bridge/src/parser';

// NEW (should be):
export { parseCodeToFlow } from '../../../bridge/src/parser';
```

### File: `bridge/src/parser.ts` (the correct parser with fixes)
```typescript
import * as acorn from 'acorn';
import dagre from 'dagre';
import { transform } from 'sucrase';

// This function strips TypeScript and JSX before Acorn parses the code
function stripTypeScriptAndJSX(code: string): string {
  // Check if code contains TypeScript syntax
  const hasTypeScript = /\b(interface|type)\s+\w+/.test(code) ||
    /:\s*[\w<>\[\]|&]+\s*[=,)\n{]/.test(code) ||
    /import\s+type\s+/.test(code);
  
  // Check if code contains JSX syntax (tags like <Component or <div)
  const hasJSX = /<[A-Za-z][A-Za-z0-9]*[\s/>]/.test(code) || 
    /<\/[A-Za-z]/.test(code) ||
    /<>/.test(code);
  
  // If neither TypeScript nor JSX, return as-is
  if (!hasTypeScript && !hasJSX) {
    return code;
  }
  
  try {
    // Use sucrase to transpile TypeScript/TSX/JSX to JavaScript
    const result = transform(code, {
      transforms: ['typescript', 'jsx'],
      disableESTransforms: true,
    });
    return result.code;
  } catch (e) {
    console.error('[Parser] Sucrase transform failed:', e);
    return code;
  }
}

// In parseCodeToFlow, the code should be processed BEFORE parsing:
export function parseCodeToFlow(code: string): FlowData {
  try {
    // Strip TypeScript and JSX syntax before parsing
    const processedCode = stripTypeScriptAndJSX(code);
    
    let ast;
    try {
      ast = acorn.parse(processedCode, { ecmaVersion: 2020, locations: true, sourceType: 'module' });
    } catch {
      ast = acorn.parse(processedCode, { ecmaVersion: 2020, locations: true, sourceType: 'script' });
    }
    // ... rest of parsing logic
  }
}
```

### File: `bridge/src/parser.ts` - detectSections function
```typescript
// This function detects function declarations to create container nodes
// PROBLEM: It wasn't handling exported functions (ExportNamedDeclaration)

function detectSections(code: string, ast: any): CodeSection[] {
  // ... earlier code ...
  
  if (sections.length === 0 && ast && ast.body) {
    ast.body.forEach((node: any) => {
      // Handle direct function declarations
      if (node.type === 'FunctionDeclaration' && node.id && node.loc) {
        functionDeclarations.push({
          name: node.id.name,
          startLine: node.loc.start.line,
          endLine: node.loc.end.line
        });
      }
      // Handle exported functions: export function QAModal() { ... }
      else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.id && decl.loc) {
          functionDeclarations.push({
            name: decl.id.name,
            startLine: decl.loc.start.line,
            endLine: decl.loc.end.line
          });
        }
      }
      // Handle default exports: export default function QAModal() { ... }
      else if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.loc) {
          functionDeclarations.push({
            name: decl.id?.name || 'default',
            startLine: decl.loc.start.line,
            endLine: decl.loc.end.line
          });
        }
      }
    });
  }
}
```

### File: `docs/bridge/src/parser.ts` (the OLD parser - should NOT be used)
```typescript
// This is a DOCUMENTATION COPY of the parser
// It does NOT have the sucrase/JSX fixes
// The client was incorrectly importing from this file

// Missing: stripTypeScriptAndJSX function
// Missing: ExportNamedDeclaration/ExportDefaultDeclaration handling
// Result: JSX code fails to parse, exported functions not detected
```

---

## Error Messages

### Console Error (when JSX is not stripped)
```
Uncaught SyntaxError: Unexpected token '<'
    at acorn.parse (parser.ts:309)
    at parseCodeToFlow (parser.ts:306)
```

### Symptom (no visible error, but wrong output)
- Flowchart shows single container labeled "GLOBAL FLOW"
- No child nodes for the actual function logic
- Function name like "QAModal" not displayed

---

## What We've Tried

| Attempt | What Was Done | Why It Didn't Work |
|---------|---------------|-------------------|
| 1 | Added `stripTypeScriptAndJSX` to `docs/bridge/src/parser.ts` | Wrong file - this is documentation, not the bundled parser |
| 2 | Added `stripTypeScriptAndJSX` to `bridge/src/parser.ts` | Correct file, but client wasn't importing from it |
| 3 | Updated `detectSections` to handle `ExportNamedDeclaration` | Fix was in correct file but client import path was wrong |
| 4 | Fixed client import from `docs/bridge` → `bridge` | **This is the actual fix** - pending verification |

### Root Cause
The `client/src/lib/parser.ts` file was importing from the wrong location:
- **Wrong**: `../../../docs/bridge/src/parser.ts` (documentation copy, no fixes)
- **Correct**: `../../../bridge/src/parser.ts` (production parser with sucrase)

---

## File Structure

```
LogicArt/
├── bridge/                          # Production bridge package
│   └── src/
│       ├── parser.ts               # ✅ CORRECT parser (has sucrase fixes)
│       └── types.ts
│
├── docs/                           # Documentation folder
│   └── bridge/
│       └── src/
│           ├── parser.ts           # ❌ OLD parser (no fixes, documentation only)
│           └── types.ts
│
├── client/
│   └── src/
│       └── lib/
│           └── parser.ts           # Re-exports parseCodeToFlow
│                                    # Was importing from docs/bridge (wrong)
│                                    # Now imports from bridge (correct)
│
├── server/
│   └── routes.ts                   # Server-side API routes
│
└── package.json
```

---

## Dependencies

From `package.json`:

```json
{
  "dependencies": {
    "acorn": "^8.x",           // JavaScript parser - does NOT support JSX/TypeScript
    "acorn-jsx": "^5.x",       // JSX plugin for acorn (not currently used)
    "sucrase": "^3.x",         // Fast TypeScript/JSX transpiler (the fix)
    "@xyflow/react": "^12.x",  // Flowchart visualization
    "dagre": "^0.8.x"          // Graph layout algorithm
  }
}
```

### Why sucrase?
- Acorn cannot parse JSX or TypeScript syntax natively
- sucrase is a lightweight, fast transpiler that converts TSX/JSX → plain JavaScript
- The transformed code can then be parsed by Acorn

---

## Solution Applied

1. **Fixed import path** in `client/src/lib/parser.ts`:
   ```typescript
   // Changed from:
   export { parseCodeToFlow } from '../../../docs/bridge/src/parser';
   
   // To:
   export { parseCodeToFlow } from '../../../bridge/src/parser';
   ```

2. **Added sucrase transformation** in `bridge/src/parser.ts`:
   - Detects TypeScript syntax (interfaces, type annotations, import type)
   - Detects JSX syntax (`<Component>`, `</div>`, `<>`)
   - Transpiles to plain JavaScript before Acorn parsing

3. **Added export handling** in `detectSections`:
   - Now detects `ExportNamedDeclaration` (e.g., `export function Foo()`)
   - Now detects `ExportDefaultDeclaration` (e.g., `export default function Foo()`)

---

## Verification Steps

After the fix, verify by:
1. Restart the LogicArt application
2. From an external app, send a React component with JSX
3. Confirm the flowchart shows:
   - The actual function name (not "GLOBAL FLOW")
   - Proper control flow nodes for if/else, loops, etc.
   - No parse errors in the console
