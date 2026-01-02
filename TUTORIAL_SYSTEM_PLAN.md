# LogiGo Tutorial System Implementation Plan

This document outlines the architecture and implementation steps for the LogiGo Tutorial System, focused on "Agent-User Partnership" and "Vibe Coding" workflows.

## Objectives
- Introduce new users to LogiGo's unique spatial reasoning features.
- Demonstrate the power of the Agent (AI) in managing code complexity.
- Lower the barrier to entry for advanced features like Model Arena and Ghost Diff.

## Architecture

### 1. Tutorial Engine (`TutorialContext.tsx`)
A React context to manage:
- Active tutorial ID.
- Current step index.
- Tutorials registry.
- Persistence of completed tutorials.

### 2. UI Components
- **`TutorialOverlay.tsx`**: A portal-based component that renders "spotlights" around UI elements and tutorial cards.
- **`TutorialSpotlight.tsx`**: Uses `getBoundingClientRect` to highlight specific DOM elements.
- **`TutorialSidebar.tsx`**: A persistent guide in the sidebar during active tutorials.

### 3. Data Schema (`tutorials.ts`)
```typescript
interface TutorialStep {
  targetId?: string; // CSS ID of element to highlight
  title: string;
  content: string;
  actionRequired?: 'click' | 'input' | 'next';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}
```

## Tutorial Content

### Pathway A: "The Natural Language Bridge" (Agent Focus)
- **Step 1:** "Mind to Flow" - Ask the Agent to write a function.
- **Step 2:** "Visual Clarity" - Ask the Agent to add labels to the generated nodes.
- **Step 3:** "Logic Decoder" - Click a node and ask the Agent to explain it.

### Pathway B: "The Blueprint Master" (Architecture Focus)
- **Step 1:** "Adding Altitudes" - Using `// --- SECTION ---` markers.
- **Step 2:** "Collapsing Complexity" - Toggling container nodes.
- **Step 3:** "Ghost Tracking" - Using Ghost Diff to track refactoring changes.

### Pathway C: "The Visual Handshake" (UI Focus)
- **Step 1:** "Mapping State" - Seeing variable changes in real-time.
- **Step 2:** "DOM Highlighting" - Connecting code execution to page elements.
- **Step 3:** "Time Travel" - Stepping backward through UI states.

## Implementation Steps

### Phase 1: Foundation
1. [x] Create `client/src/contexts/TutorialContext.tsx`.
2. [x] Define initial tutorial content in `client/src/lib/tutorials.ts`.
3. [x] Integrate `TutorialProvider` in `App.tsx`.

### Phase 2: UI Implementation
1. [x] Build `TutorialOverlay` with spotlight effect.
2. [x] Implement `TutorialCard` component for step instructions (Integrated into `TutorialOverlay`).
3. [x] Add `TutorialTrigger` buttons in Header and Help Dialog.
4. [x] Build `TutorialSidebar` for persistent guidance.

### Phase 3: Agent Integration
1. [ ] Implement "Tutorial Mode" in Agent's system prompt (conceptual update).
2. [ ] Add "Success Action" detection (e.g., detecting specific tool calls or state changes).

### Phase 4: Content & Polish
1. [ ] Finalize scripts for all 4 pathways.
2. [ ] Add transitions and micro-animations.
3. [ ] Verify Group 9 (VS Code) compatibility.
