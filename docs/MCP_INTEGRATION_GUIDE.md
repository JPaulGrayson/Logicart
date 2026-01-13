# MCP Integration Guide: Logic-Aware AI

**The "Eyes" for your LLM: Connecting LogicArt to Cursor, Claude, and VS Code.**

---

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that allows AI assistants to interact with external tools and data sources. Think of it as a "plugin system" for AI models.

With MCP, LogicArt can act as a **visual logic engine** for AI agents. Instead of the AI just "guessing" how your code works, it can call LogicArt tools to **see** the flowchart, complexity, and structure in real-time.

---

## Quick Start: Connect to Claude Code

Claude Code uses MCP for tool integration. Register LogicArt with a single command:

```bash
claude mcp add logicart --transport sse http://localhost:5001/api/mcp/sse
```

Or create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "logicart": {
      "type": "sse",
      "url": "http://localhost:5001/api/mcp/sse"
    }
  }
}
```

Since Claude Code is terminal-based, use the `visualize_flow` tool to open flowcharts in your browser.

---

## Quick Start: Connect to Cursor

Cursor is a popular platform for MCP. Follow these steps to give Cursor "Visual Logic" capabilities:

1. **Start LogicArt**: Ensure your LogicArt server is running (`npm run dev`).

2. **Open Cursor Settings**: Navigate to `Settings` → `Features` → `MCP`.

3. **Add New Server**:
   - **Name**: `LogicArt`
   - **Type**: `sse`
   - **URL**: `http://localhost:5001/api/mcp/sse`

4. **Verify**: You should see a green "Active" status and a count of 6 tools.

---

## Available Tools

LogicArt provides these "Visual Instruments" to your AI:

### 1. `analyze_code`

Primary tool for structural understanding.

- **What the AI sees**: A JSON map of every node (loop, decision, action) and their connections.
- **Use case**: *"Analyze my Dijkstra implementation and tell me where the loop exit is."*

**Input**: `{ "code": "function example() { ... }" }`

**Output**: Nodes, edges, complexity score, and entry point.

---

### 2. `get_complexity`

Calculates the "Logical Density" of a function.

- **What the AI sees**: A score from 1-100 and a breakdown of why (nesting, cyclomatic complexity).
- **Use case**: *"Is this function simple enough to maintain?"*

**Input**: `{ "code": "..." }`

**Output**: `{ "score": 15, "level": "moderate", "breakdown": {...} }`

---

### 3. `explain_flow`

A natural language summary of the logic shape.

- **What the AI sees**: A summary like *"This code contains 3 return points and 1 nested loop."*
- **Use case**: Overview of unfamiliar logic.

**Input**: `{ "code": "..." }`

**Output**: Human-readable explanation of the code structure.

---

### 4. `find_branches`

Identifies all decision points and their conditions.

- **What the AI sees**: A list of every `if`, `switch`, `for`, and `while` with their conditions.
- **Use case**: *"What conditions can cause this function to exit early?"*

**Input**: `{ "code": "..." }`

**Output**: Array of branch nodes with conditions and line numbers.

---

### 5. `count_paths`

Counts all possible execution paths through the code.

- **What the AI sees**: The total number of unique paths from entry to exit.
- **Use case**: *"How many test cases would I need for full coverage?"*

**Input**: `{ "code": "..." }`

**Output**: `{ "pathCount": 8, "isComplex": true }`

---

### 6. `display_audit`

Detects duplicate component rendering.

- **What the AI sees**: Whether the same component is rendered from multiple locations.
- **Use case**: *"Before I add another return statement, are there already too many?"*

This is the **key tool for preventing code bloat** when AI agents iterate on code.

---

### 7. `visualize_flow`

Opens an interactive flowchart in your browser.

- **What the AI sees**: Confirmation that the visualizer has opened, plus the URL.
- **Use case**: *"Show me this code as a visual flowchart."*

This tool is essential for **terminal-based environments** (like Claude Code) where embedded panels aren't available. It automatically opens your default browser with the full LogicArt visualizer.

**Input**: `{ "code": "function example() { if (x > 0) return 'positive'; return 'other'; }" }`

**Output**:
```
I've opened the LogicArt flowchart visualizer in your browser.

URL: http://localhost:5001/?code=...&autorun=true

You can now see the interactive flowchart with:
- Step-by-step execution controls
- Variable state tracking
- Collapsible function containers
```

If the browser cannot be opened automatically (e.g., headless server), the URL is provided for manual access.

---

## How to Talk to Your AI (Best Practices)

To get the most out of the LogicArt bridge, use "Logic-First" prompts:

### Bad Prompts
- *"Explain this code."*
- *"Add a new feature."*

### Good Prompts (Visualized)

**For Understanding:**
> *"Use your LogicArt tools to analyze this code. Look at the decision nodes and tell me if I'm missing an edge case."*

**For Optimization:**
> *"Check the complexity score of this module. If it's above 10, suggest a refactoring to flatten the loops."*

**For Preventing Bloat (Display Audit):**
> *"Before adding a new return statement, use display_audit to check if this component already has too many render paths."*

**For Code Reviews:**
> *"Analyze the flow of this function. Are there any unreachable code paths?"*

---

## Technical Details

LogicArt uses the `@modelcontextprotocol/sdk` to maintain a persistent SSE connection.

| Property | Value |
|----------|-------|
| **Transport** | SSE (Server-Sent Events) |
| **Endpoint** | `/api/mcp/sse` |
| **Port** | 5001 (configurable) |
| **Security** | Localhost-only by default |
| **Protocol Version** | 1.0.0 |

### Architecture

```
┌─────────────┐         ┌─────────────────┐
│   Cursor    │   SSE   │    LogicArt     │
│   Claude    │ ◀─────▶ │    MCP Server   │
│   VS Code   │         │                 │
└─────────────┘         └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Acorn Parser   │
                        │  + acorn-jsx    │
                        └─────────────────┘
```

---

## REST Alternative

All MCP tools are also available as REST endpoints:

| MCP Tool | REST Endpoint |
|----------|---------------|
| `analyze_code` | `POST /api/agent/analyze` |
| `display_audit` | `POST /api/agent/display-audit` |

---

## Troubleshooting

**"Connection refused" error**
- Ensure LogicArt server is running on port 5001
- Check that the URL matches exactly: `http://localhost:5001/api/mcp/sse`

**"0 tools available"**
- The MCP server may not have initialized. Restart the LogicArt server.

**Tools not responding**
- Check the LogicArt server console for errors
- Verify the code you're sending is valid JavaScript/JSX

---

**Happy Vibe Coding.** 🎨
