# LogiGo Product Lineup

## Products

### LogiGo Studio
**Platform:** Replit (Web)  
**Target Users:** Replit users, web-based developers  
**URL:** [Replit LogiGo Project]

A full-featured web IDE for code visualization with:
- Interactive flowcharts
- Algorithm visualizers (Sorting, Pathfinding, Snake, TicTacToe)
- Step-through code execution
- Code import/export
- Built-in algorithm examples

---

### LogiGo for VS Code
**Platform:** VS Code, Antigravity, Cursor, and VS Code-compatible IDEs  
**Target Users:** Desktop developers using VS Code-based editors  
**Distribution:** VS Code Marketplace, Open VSX Registry

A VS Code extension providing:
- Interactive flowcharts in a side panel
- Click-to-navigate (node → source line)
- Collapsible containers (functions/classes)
- Auto-refresh on file changes
- Integration with host IDE's editor

---

## Subscription Tiers (Same for Both Products)

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| **Basic Flowchart** | ✅ | ✅ | ✅ |
| **Click-to-Navigate** | ✅ | ✅ | ✅ |
| **Collapsible Containers** | ✅ | ✅ | ✅ |
| **Auto-Refresh** | ✅ | ✅ | ✅ |
| **Execution Controller (Speed)** | ❌ | ✅ | ✅ |
| **Ghost Diff** | ❌ | ✅ | ✅ |
| **Time Travel** | ❌ | ✅ | ✅ |
| **Natural Language Search** | ❌ | ✅ | ✅ |
| **Floating Overlay** | ❌ | ✅ | ✅ |
| **Multi-File Visualization** | ❌ | ❌ | ✅ |
| **Real-time Collaboration** | ❌ | ❌ | ✅ |

---

## Shared Components

Both products share:

| Component | Location | Purpose |
|-----------|----------|---------|
| `@logigo/bridge` | `/bridge/` | Code parser (AST → Flowchart) |
| Feature Flags | `/client/src/lib/features.ts` | Tier gating logic |

---

## Business Model

### LogiGo Studio
- **Free Tier:** Basic features (lead generation)
- **Premium/Pro:** Paid via Voyai subscription integration

### LogiGo for VS Code
- **Free Tier:** Basic features (lead generation)
- **Premium/Pro:** Paid via:
  - Antigravity Pro bundle (revenue share)
  - OR standalone LogiGo subscription

---

## Roadmap: Feature Parity

### Currently Implemented

| Feature | LogiGo Studio | LogiGo for VS Code |
|---------|--------------|-------------------|
| Basic Flowchart | ✅ | ✅ |
| Collapsible Containers | ✅ | ✅ |
| Click-to-Navigate | ✅ | ✅ |
| Auto-Refresh | ✅ | ✅ |
| Algorithm Visualizers | ✅ | ❌ |
| Step-through Execution | ✅ | ❌ |
| Algorithm Examples | ✅ | ❌ |
| Ghost Diff | ✅ | ❌ |
| Time Travel | ✅ | ❌ |
| Speed Governor | ✅ | ❌ |

### Next Steps for VS Code
1. Add step-through execution
2. Add variable watch panel
3. Add time travel (rewind/forward)
4. Add ghost diff visualization
5. Add premium tier gating
6. Integrate with Antigravity Pro subscription

---

## Naming Convention

| Term | Meaning |
|------|---------|
| **LogiGo** | The brand/family |
| **LogiGo Studio** | Replit web app |
| **LogiGo for VS Code** | VS Code extension |
| **Free/Premium/Pro** | Subscription tiers (not product names) |

---

*Last Updated: December 14, 2024*
