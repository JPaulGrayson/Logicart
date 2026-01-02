# MCP Integration Guide: Logic-Aware AI
**The "Eyes" for your LLM: Connecting LogiGo to Cursor, Claude, and VS Code.**

---

## 🚀 Overview
The **Model Context Protocol (MCP)** allows LogiGo to act as a logic-engine for external AI models. Instead of the AI just "guessing" how your code works, it can call LogiGo tools to **see** the flowchart and complexity in real-time.

---

## 🛠 Setup in Cursor
Cursor is currently the flagship platform for MCP. Follow these steps to give Cursor "Visual Logic" capabilities:

1.  **Start LogiGo**: Ensure your LogiGo server is running (`npm run dev`).
2.  **Open Cursor Settings**: Navigate to `Settings` -> `Features` -> `MCP`.
3.  **Add New Server**:
    *   **Name**: `LogiGo`
    *   **Type**: `sse`
    *   **URL**: `http://localhost:5001/api/mcp/sse`
4.  **Verify**: You should see a green "Active" status and a count of 5 tools.

---

## 🧰 Available Tools (The Agent's Eyes)

LogiGo provides the following "Visual Instruments" to your AI:

### 1. `analyze_code`
Primary tool for structural understanding.
*   **What the AI sees**: A JSON map of every node (loop, decision, action) and their connections.
*   **Use case**: *"Analyze my Dijkstra implementation and tell me where the loop exit is."*

### 2. `get_complexity`
Calculates the "Logical Density" of a function.
*   **What the AI sees**: A score from 1-100 and a breakdown of why (nesting, cyclomatic complexity).
*   **Use case**: *"Is this function simple enough to maintain?"*

### 3. `explain_flow`
A natural language summary of the logic shape.
*   **What the AI sees**: A summary like *"This code contains 3 return points and 1 nested loop."*
*   **Use case**: Overview of unfamiliar logic.

---

## 🗣 How to Talk to your AI (Best Practices)
To get the most out of the LogiGo bridge, use "Logic-First" prompts:

*   **Bad Prompt**: *"Explain this code."*
*   **Good Prompt (Visualized)**: *"LogiGo has generated a flowchart for this. Use your tools to look at the 'Decision Nodes' and tell me if I missed an edge case."*
*   **Optimization Prompt**: *"Check the complexity score of this module. If it's above 10, suggest a refactoring to flatten the loops."*

---

## 🔌 Technical Details
LogiGo uses the `@modelcontextprotocol/sdk` to maintain a persistent SSE connection.
*   **Transport**: SSE (Server-Sent Events)
*   **Security**: Localhost-only by default.
*   **Protocol Version**: 1.0.0

---
**Happy Vibe Coding.**
