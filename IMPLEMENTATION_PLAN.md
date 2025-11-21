# Cartographer Implementation Plan

## Phase 1: Source Mapping & Interaction (Foundation)
**Goal:** Connect the visual graph back to the code to enable "Navigation".
- [ ] **Parser Upgrade:** Update `parser.ts` to capture AST location data (`start`, `end`, `line`) for every node.
- [ ] **Interactive Nodes:** Add `onNodeClick` handlers to React Flow nodes.
- [ ] **Editor Integration:** When a node is clicked, highlight the corresponding code block in the editor.
- [ ] **Bi-directional Highlighting:** Hovering code lines highlights the corresponding node (stretch goal).

## Phase 2: The Visual Interpreter (Core Value)
**Goal:** Allow Vibe Coders to "watch" their logic execute step-by-step.
- [ ] **Interpreter Engine:** Build a JavaScript-based step-by-step executor (`client/src/lib/interpreter.ts`).
    - Support: Variables, Math, Logic (`<`, `>`, `===`), `If/Else`, `Return`.
    - Structure: Generator function or state machine to allow pausing/stepping.
- [ ] **Control Panel:** Add Play, Pause, Step, and Reset controls to the Workbench UI.
- [ ] **State Visualization:**
    - **Active Node:** Highlight the currently executing node in Green.
    - **Variable Watch:** Create a side panel showing current variable values (e.g., `n: 5`).
    - **Call Stack:** Show recursion depth for algorithms like Factorial.

## Phase 3: Bi-directional Editing
**Goal:** Allow fixing logic bugs directly from the flowchart.
- [ ] **Node Editing:** Enable double-click on nodes to edit their condition or statement.
- [ ] **Code Patcher:** Implement logic to replace the specific AST range in the source code string with the new text.
- [ ] **Re-hydration:** Automatically re-parse and update the graph after editing.

## Phase 4: Advanced Layout & Structure
**Goal:** Support complex code without "spaghetti" graphs.
- [ ] **Auto-Layout:** Replace manual x/y positioning in `parser.ts` with a layout library (e.g., `dagre` or `elkjs`) to handle nested loops and complex branching automatically.
- [ ] **Complex Structures:** Add visual support for `While` loops (returning arrows) and `Try/Catch` blocks.
