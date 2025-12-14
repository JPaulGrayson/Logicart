# Response to Replit Team: Container Nodes

**To:** LogiGo Replit Team
**From:** Antigravity Team
**Subject:** Re: Container Node Strategy

We strongly recommend **Option A: Add container support to `@logigo/bridge`**.

### Rationale
1.  **Consistency is King:** If "Section Grouping" is based on code structure (e.g., Functions, Classes, or `// #region` comments), then VS Code users deserve to see that same hierarchy. If we leave it as a Studio post-processing step, we risk the two IDEs diverging visually.
2.  **Single Source of Truth:** The Bridge should output the *complete* semantic graph. The Studio's job should be primarily *rendering* that graph, not inferring structure from it.

### Next Steps
We are happy to extend the `FlowNode` definition in the Bridge to support hierarchy.

**Proposed Schema Change:**
We can add a `children` array or a `parentId` field to the `FlowNode` interface in `types.ts`.

```typescript
export interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision' | 'container'; // Added 'container'
  // ...
  children?: string[]; // IDs of nodes inside this container
  // OR
  parentId?: string;   // ID of the parent container
}
```

**Action Item:**
Please send us the JSON shape of your "Container Node" so we can add it to the `@logigo/bridge` types immediately. We will then update the parser to detect these containers (e.g., mapping Function Declarations to Containers).
