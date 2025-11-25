# LogiGo × Antigravity Integration Plan

**Document Version:** 1.0  
**Date:** November 25, 2024  
**Status:** Proposal for Review

---

## Executive Summary

LogiGo is a code-to-flowchart visualization tool designed for "vibe coders" who use AI-assisted coding platforms. This document outlines a phased integration plan with Google Antigravity, clearly defining responsibilities between the LogiGo team and Antigravity platform team.

**Key Value Proposition:**
- **For AI-generated code**: Instant visual understanding of complex code
- **For debugging**: Step-by-step execution with time-travel debugging
- **For learning**: Visual flowcharts that update in real-time as code changes

---

## Current Implementation Status

### ✅ What LogiGo Has Built (Replit Platform)

**Core Engine:**
- AST Parser (JavaScript/TypeScript) with source location tracking
- Step-by-step interpreter with variable watching
- Bi-directional code editing (flowchart ↔ code)
- React Flow-based visualization
- Premium features: Ghost Diff, Time Travel, Natural Language Search

**Replit Integration:**
- Extension API adapter (`ReplitAdapter`)
- Real-time file sync (500ms debounce)
- Full workbench UI (editor + flowchart side-by-side)

**VS Code Extension:**
- Published to Open VSX Registry (Antigravity-compatible)
- Webview-based visualization
- Click-to-source navigation
- Auto-refresh on file changes

### 🚧 What Still Needs Building

**For Antigravity Integration:**
1. **Overlay Library Mode** - Lightweight injectable NPM package
2. **Checkpoint Runtime** - `LogiGo.checkpoint()` execution tracking
3. **Visual Handshake** - DOM element highlighting during execution
4. **Hierarchical Views** - Multi-level code visualization (system → feature → function)
5. **Real-time Metadata Capture** - Console.log and performance metrics
6. **AI-Powered Labeling** - LLM integration for semantic node naming

---

## Integration Architecture: Dual-Mode Approach

### Mode 1: VS Code Extension (Current - Needs Enhancement)

**How It Works:**
- User opens JavaScript file in Antigravity
- Extension icon in sidebar → opens webview panel
- Flowchart appears next to editor
- Syncs with editor changes automatically

**Current Limitations:**
- Read-only visualization (no execution tracking)
- Single-file scope (no project-wide view)
- No real-time runtime data capture

### Mode 2: Overlay Library (New - Recommended for Antigravity)

**How It Works:**
```javascript
// User's code in Antigravity
import LogiGo from '@logigo/runtime';

LogiGo.init({ 
  mode: 'overlay',
  position: 'bottom-right',
  theme: 'dark',
  enableTimeline: true
});

async function processOrder(order) {
  await LogiGo.checkpoint('validate-order');
  if (!validateOrder(order)) return false;
  
  await LogiGo.checkpoint('process-payment');
  const payment = await processPayment(order);
  
  await LogiGo.checkpoint('ship-order');
  await shipOrder(order);
  
  return true;
}
```

**Overlay Behavior:**
- Floating toolbar appears (similar to Chrome DevTools)
- Shows flowchart with highlighted checkpoint nodes
- Displays variable state at each checkpoint
- Timeline scrubber for time-travel debugging
- Minimize/maximize toggle

---

## Responsibility Matrix

### 🔵 LogiGo Team Responsibilities

#### Phase 1: NPM Library Package (4-6 weeks)
**Deliverables:**
- `@logigo/core` - Parser, interpreter, flowchart generator
- `@logigo/runtime` - Checkpoint execution tracking
- `@logigo/overlay-ui` - React-based overlay component
- Documentation and examples

**Technical Specifications:**
```typescript
// Package: @logigo/runtime
interface LogiGoConfig {
  mode: 'overlay' | 'inline' | 'headless';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  theme?: 'light' | 'dark' | 'auto';
  enableTimeline?: boolean;
  enableGhostDiff?: boolean; // Premium
  enableNaturalSearch?: boolean; // Premium
  apiKey?: string; // For premium features
}

class LogiGo {
  static init(config: LogiGoConfig): void;
  static checkpoint(id: string, metadata?: Record<string, any>): Promise<void>;
  static startExecution(functionName: string): void;
  static pauseExecution(): void;
  static destroy(): void;
}
```

**Implementation Details:**
- Zero dependencies for core parser (use native Acorn fork)
- UI components in separate package (React optional)
- Build targets: ESM, CJS, UMD for maximum compatibility
- Automatic code injection via Babel plugin (optional)

#### Phase 2: Enhanced VS Code Extension (2-3 weeks)
**Deliverables:**
- Runtime execution mode (not just static visualization)
- Checkpoint debugging support
- Variable watch panel
- Timeline scrubber integration

**Enhanced Features:**
- Detect `LogiGo.checkpoint()` calls in code
- Automatically start overlay when user runs code
- Integration with Antigravity's terminal/console

#### Phase 3: Hierarchical Views (3-4 weeks)
**Deliverables:**
- Comment-based grouping (`// --- AUTH LOGIC ---`)
- Zoom-level view switching:
  - < 50% zoom: Container nodes only (system view)
  - 50-75% zoom: Feature-level blocks
  - > 75% zoom: Individual statements (current)
- Multi-file flowcharts (project-wide view)

**Implementation:**
```typescript
// Parser enhancement
interface ContainerNode {
  id: string;
  label: string; // Extracted from comment
  children: FlowNode[];
  collapsed: boolean;
  zoomLevel: 'system' | 'feature' | 'function';
}
```

#### Phase 4: AI-Powered Enhancements (4-6 weeks)
**Deliverables:**
- LLM integration for semantic labeling
- Real-time console.log capture and display
- Performance metrics (execution timing)
- Intent-based node naming

**API Design:**
```typescript
// Optional LLM integration
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google-gemini';
  apiKey: string;
  model?: string;
  features: {
    semanticLabels?: boolean;
    codeExplanations?: boolean;
    bugDetection?: boolean;
  };
}

LogiGo.init({
  mode: 'overlay',
  ai: {
    provider: 'google-gemini',
    apiKey: user.apiKey,
    features: { semanticLabels: true }
  }
});
```

---

### 🟢 Antigravity Team Responsibilities

#### Phase 1: Platform Integration APIs (2-3 weeks)

**API 1: Code Execution Hooks**
```typescript
// Expose in Antigravity Extension API
interface AntigravityExecution {
  // Called when user runs code (Run button, terminal, etc.)
  onExecutionStart(callback: (context: ExecutionContext) => void): Disposable;
  
  // Called when execution completes/errors
  onExecutionEnd(callback: (result: ExecutionResult) => void): Disposable;
  
  // Stream runtime output (console.log, errors)
  onConsoleOutput(callback: (output: ConsoleMessage) => void): Disposable;
}

interface ExecutionContext {
  filePath: string;
  language: 'javascript' | 'typescript' | 'python';
  entryPoint: string; // Function name or file path
  environment: 'node' | 'browser' | 'deno';
}
```

**Rationale:** LogiGo needs to know when code runs to automatically show overlay and capture runtime data.

**API 2: Editor Decoration API**
```typescript
// Enhanced editor decoration for click-to-navigate
interface AntigravityEditor {
  // Highlight specific line with custom styling
  decorateLine(line: number, style: DecorationStyle): Disposable;
  
  // Add inline widgets (for checkpoint markers)
  addInlineWidget(line: number, widget: HTMLElement): Disposable;
  
  // Navigate to line and column
  revealPosition(position: Position, options?: RevealOptions): void;
}

interface DecorationStyle {
  backgroundColor?: string;
  borderColor?: string;
  gutterIcon?: string; // Icon to show in gutter
}
```

**Rationale:** Allows LogiGo to visually connect flowchart nodes to source code lines with rich decorations.

**API 3: AI Code Insertion Hooks**
```typescript
// Notify extensions when AI generates code
interface AntigravityAI {
  onCodeGeneration(callback: (event: CodeGenerationEvent) => void): Disposable;
}

interface CodeGenerationEvent {
  source: 'gemini' | 'copilot' | 'user-paste';
  code: string;
  language: string;
  insertionRange: Range;
  userPrompt?: string; // Original AI prompt
}
```

**Rationale:** Auto-show LogiGo flowchart when Gemini generates code, with "Understand this code" prompt.

#### Phase 2: Extension Marketplace Integration (1-2 weeks)

**Deliverables:**
- LogiGo published to Open VSX Registry (already done ✅)
- Featured in Antigravity extension recommendations
- Deep link support: `antigravity://extension/logigo.visualize?file=<path>`

**Recommendation: First-Party Integration**
Consider making LogiGo a **built-in tool** (like Git or debugger) rather than just an extension:
- Pre-installed in Antigravity
- Native UI integration (not webview)
- Keyboard shortcut: `Cmd+Shift+V` (Visualize)
- Appears in Command Palette: "Visualize Current Function"

#### Phase 3: Gemini Integration (2-3 weeks)

**Scenario 1: Auto-Visualization**
```
User: "Write a function to process user orders"
Gemini: [Generates code]
Antigravity: [Inserts code + shows LogiGo panel]
  "📊 I generated processOrder(). Want to see how it works?"
  [Show Flowchart] [No Thanks]
```

**Scenario 2: Explain with Flowchart**
```
User: [Selects complex function]
User: "Explain this code" (right-click menu)
Gemini: [Generates explanation]
LogiGo: [Shows flowchart + Gemini explanation side-by-side]
```

**Implementation:**
```typescript
// Antigravity Gemini API enhancement
interface GeminiResponse {
  text: string;
  code?: string;
  visualization?: {
    type: 'flowchart' | 'diagram' | 'graph';
    provider: 'logigo';
    data: any;
  };
}
```

#### Phase 4: Premium Feature Infrastructure (1-2 weeks)

**User Tier Detection:**
```typescript
// Expose in Antigravity Extension API
interface AntigravityUser {
  getUserTier(): Promise<'free' | 'pro' | 'enterprise'>;
  hasFeature(feature: string): Promise<boolean>;
}

// LogiGo checks tier
const tier = await antigravity.user.getUserTier();
LogiGo.init({
  mode: 'overlay',
  features: {
    ghostDiff: tier !== 'free',
    timeTravel: tier !== 'free',
    naturalSearch: tier === 'enterprise',
  }
});
```

**Recommendation:** Bundle LogiGo Premium with Antigravity Pro subscription
- Free tier: Basic flowchart, PNG export
- Antigravity Pro: Ghost Diff, Time Travel, PDF export, Natural Language Search
- Revenue share: 70% Antigravity / 30% LogiGo

---

## User Experience Flows

### Flow 1: First-Time User (AI Code Generation)

**Trigger:** User asks Gemini to generate a complex function

**UX Steps:**
1. Gemini generates code and inserts into editor
2. Small toast notification appears:
   ```
   📊 LogiGo can visualize this function
   [Show Flowchart] [Don't Show Again]
   ```
3. User clicks "Show Flowchart"
4. Overlay appears bottom-right with animated flowchart
5. Nodes pulse to indicate execution flow
6. User can click nodes to jump to code lines

**First-run Experience:**
```
╔═══════════════════════════════════════╗
║  Welcome to LogiGo! 👋                ║
║                                       ║
║  Visual debugging for AI-generated    ║
║  code. Here's what you can do:        ║
║                                       ║
║  • See your code as a flowchart       ║
║  • Step through execution visually   ║
║  • Time-travel debug (Pro)            ║
║                                       ║
║  [Take Tour] [Skip]                   ║
╚═══════════════════════════════════════╝
```

### Flow 2: Active Debugging Session

**Trigger:** User adds `LogiGo.checkpoint()` and runs code

**UX Steps:**
1. User runs code (terminal, Run button, etc.)
2. LogiGo overlay auto-appears
3. Flowchart nodes highlight in real-time as checkpoints execute
4. Variable state panel shows current values
5. Timeline scrubber allows time-travel (premium)
6. User can pause, step forward/backward

**Overlay Layout:**
```
┌─────────────────────────────────────────┐
│ LogiGo Runtime                    [−][×]│
├─────────────────────────────────────────┤
│                                         │
│     [Flowchart Visualization]          │
│         ┌─────────┐                    │
│         │  Start  │                    │
│         └────┬────┘                    │
│              │                          │
│         ┌────▼────┐  ← Highlighted     │
│         │Validate │     (current)      │
│         └────┬────┘                    │
│              │                          │
│                                         │
├─────────────────────────────────────────┤
│ Variables:                              │
│ order = { id: 123, total: 99.99 }     │
│ valid = true                            │
├─────────────────────────────────────────┤
│ [⏮][◀][▶][⏭]  Step 2 of 5            │
│ ═══════════════▓▓░░░░░░░░              │
└─────────────────────────────────────────┘
```

### Flow 3: Understanding Existing Code

**Trigger:** User opens complex file they didn't write

**UX Steps:**
1. User opens JavaScript file
2. Status bar shows: "LogiGo: Click to visualize" with icon
3. User clicks or uses `Cmd+Shift+V`
4. Side panel opens with flowchart of all functions
5. User selects function from dropdown
6. Flowchart zooms to that function
7. User can toggle hierarchical views:
   - System view (file structure)
   - Feature view (grouped by comments)
   - Function view (current detail level)

---

## Technical Implementation Details

### LogiGo NPM Package Structure

```
@logigo/
├── core/                 # Parser + Interpreter
│   ├── parser.ts         # AST → Flowchart
│   ├── interpreter.ts    # Step-by-step execution
│   └── differ.ts         # Ghost Diff engine
├── runtime/              # Execution tracking
│   ├── checkpoint.ts     # LogiGo.checkpoint() impl
│   ├── capture.ts        # Console.log capture
│   └── metrics.ts        # Performance timing
├── overlay-ui/           # React components
│   ├── Overlay.tsx       # Main floating UI
│   ├── Flowchart.tsx     # Visualization
│   ├── Timeline.tsx      # Scrubber (premium)
│   └── VariableWatch.tsx # State panel
└── vscode-extension/     # Enhanced VS Code support
    ├── extension.ts      # Main entry point
    └── webview/          # Overlay in webview
```

### Antigravity API Requirements

**Minimum Viable APIs (Phase 1):**
1. `antigravity.execution.onExecutionStart()` - Detect when code runs
2. `antigravity.editor.decorateLine()` - Highlight source lines
3. `antigravity.user.getUserTier()` - Check premium status

**Nice-to-Have APIs (Phase 2+):**
4. `antigravity.ai.onCodeGeneration()` - Auto-show on AI code
5. `antigravity.terminal.onConsoleOutput()` - Capture console.logs
6. `antigravity.workspace.getProjectStructure()` - Multi-file views

### Performance Considerations

**LogiGo Team:**
- Parser must handle files up to 10,000 lines
- Overlay rendering budget: <100ms for 50-node flowchart
- Memory footprint: <50MB for overlay + runtime
- Tree-shaking: Core parser only 15KB gzipped

**Antigravity Team:**
- Extension host process isolation (prevent main thread blocking)
- Webview recycling for memory efficiency
- API rate limiting for `onConsoleOutput()` (max 100 msgs/sec)

---

## Phased Rollout Plan

### Phase 1: Foundation (Weeks 1-6)
**LogiGo:**
- Build NPM package (`@logigo/core`, `@logigo/runtime`)
- Create overlay UI prototype
- Document integration APIs

**Antigravity:**
- Implement execution hooks API
- Add editor decoration API
- Review LogiGo extension submission

**Milestone:** Working demo of overlay in standalone HTML page

### Phase 2: Integration (Weeks 7-10)
**LogiGo:**
- Enhance VS Code extension with runtime mode
- Add checkpoint debugging
- Publish to Open VSX

**Antigravity:**
- Integrate execution hooks with LogiGo extension
- Add LogiGo to recommended extensions
- Test overlay in Antigravity environment

**Milestone:** LogiGo overlay works in Antigravity with manual setup

### Phase 3: AI Integration (Weeks 11-14)
**LogiGo:**
- Implement AI-powered semantic labeling
- Add console.log capture
- Build hierarchical views

**Antigravity:**
- Implement `onCodeGeneration()` hook
- Add Gemini flowchart visualization option
- Create "Explain with Flowchart" command

**Milestone:** Auto-show flowchart when Gemini generates code

### Phase 4: Premium & Polish (Weeks 15-18)
**LogiGo:**
- Complete premium features (Time Travel, Ghost Diff)
- Performance optimization
- Comprehensive documentation

**Antigravity:**
- Bundle LogiGo Premium with Antigravity Pro
- Add keyboard shortcuts and UI polish
- Marketing materials and launch

**Milestone:** Public launch with Antigravity Pro integration

---

## Success Metrics

### User Engagement Metrics
- **Activation:** % of Antigravity users who try LogiGo (Target: 30% in 3 months)
- **Retention:** % who use it weekly (Target: 50% of activations)
- **Premium Conversion:** % free → Pro (Target: 10%)

### Technical Metrics
- **Performance:** Overlay render time <100ms (p95)
- **Reliability:** Crash rate <0.1% of sessions
- **Compatibility:** Works with 95% of JavaScript codebases

### Business Metrics
- **Revenue Share:** Track Pro subscriptions attributed to LogiGo
- **User Satisfaction:** NPS score >40
- **Support Load:** <5% of users need help

---

## Open Questions for Antigravity Team

### Technical Questions
1. **Extension Host Permissions:** Does LogiGo need special permissions to inject overlay into user's runtime?
2. **Console Access:** Can extensions intercept `console.log()` in user's code execution?
3. **Gemini API:** Is there a public API for extensions to integrate with Gemini responses?
4. **Premium Tiers:** What's the preferred approach for premium feature gating?

### UX Questions
5. **Default Behavior:** Should flowchart auto-show on AI code generation, or require opt-in?
6. **UI Location:** Overlay (floating) vs. panel (docked) - which fits better with Antigravity's design?
7. **Keyboard Shortcuts:** Any existing shortcuts we should avoid conflicting with?
8. **Branding:** Should it be "LogiGo powered by Antigravity" or "Antigravity LogiGo"?

### Business Questions
9. **Revenue Model:** Bundle with Pro subscription or separate pricing?
10. **Go-to-Market:** Joint launch announcement or soft launch?
11. **Support:** Who handles user support tickets - LogiGo, Antigravity, or shared?

---

## Next Steps

### Immediate Actions (This Week)
- [ ] **LogiGo:** Review this plan and provide feedback
- [ ] **Antigravity:** Schedule kickoff call with engineering team
- [ ] **Both:** Align on Phase 1 deliverables and timeline

### Week 1-2
- [ ] **LogiGo:** Start NPM package structure
- [ ] **Antigravity:** Prototype execution hooks API
- [ ] **Both:** Weekly sync meetings (30 min)

### Week 3-4
- [ ] **LogiGo:** Demo overlay prototype
- [ ] **Antigravity:** Share execution hooks API draft
- [ ] **Both:** Test integration in staging environment

---

## Contact & Resources

**LogiGo Team:**
- Codebase: [Replit - LogiGo Project]
- Demo: [Extension in Open VSX Registry]
- Documentation: See `SPEC.md`, `replit.md` in repo

**Antigravity Resources Needed:**
- Extension API documentation
- Staging environment access for testing
- Design system / UI guidelines
- Premium tier management API docs

---

## Appendix: Code Examples

### Example 1: Basic Overlay Usage

```javascript
// User's code in Antigravity
import LogiGo from '@logigo/runtime';

// Initialize once
LogiGo.init({
  mode: 'overlay',
  position: 'bottom-right',
  theme: 'auto', // Matches Antigravity theme
});

// Add checkpoints to any function
async function calculateRoute(points) {
  await LogiGo.checkpoint('validate-points', { count: points.length });
  
  if (!points || points.length < 2) {
    throw new Error('Need at least 2 points');
  }
  
  await LogiGo.checkpoint('calculate-distances');
  const distances = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dist = haversineDistance(points[i], points[i + 1]);
    distances.push(dist);
  }
  
  await LogiGo.checkpoint('compute-total');
  const total = distances.reduce((sum, d) => sum + d, 0);
  
  return { distances, total };
}
```

### Example 2: Hierarchical Code Organization

```javascript
// System-level view: Group by comment regions
// --- USER AUTHENTICATION ---

async function loginUser(credentials) {
  await LogiGo.checkpoint('auth.validate');
  const valid = await validateCredentials(credentials);
  
  await LogiGo.checkpoint('auth.create-session');
  const session = await createSession(valid.userId);
  
  return session;
}

// --- ORDER PROCESSING ---

async function processOrder(order) {
  await LogiGo.checkpoint('order.validate');
  validateOrder(order);
  
  await LogiGo.checkpoint('order.payment');
  await processPayment(order);
  
  await LogiGo.checkpoint('order.ship');
  await shipOrder(order);
}

// LogiGo automatically groups these into containers:
// Container: "USER AUTHENTICATION" (2 checkpoints)
// Container: "ORDER PROCESSING" (3 checkpoints)
```

### Example 3: AI-Enhanced Labels

```javascript
// Without AI: Generic labels from code
function fn1(x) {
  if (x > 100) return true;
  return false;
}
// LogiGo shows: "if (x > 100)" ← Not helpful

// With AI: Semantic understanding
function fn1(x) {
  if (x > 100) return true;
  return false;
}
// LogiGo + Gemini shows: "Check if value exceeds threshold" ← Better!

// AI analyzes context and generates meaningful labels
```

---

**Document End**

*Questions or feedback? Let's discuss in the kickoff call.*
