# LogicArt Agent API

The Agent API provides programmatic access to LogicArt's code analysis capabilities. Use this API to integrate flowchart generation and code analysis into your tools, CI pipelines, or AI agents.

## Endpoints Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/agent/analyze` | Analyze code structure and generate flowchart data |
| `POST /api/agent/display-audit` | Detect duplicate component rendering |

---

## Code Analysis Endpoint

```
POST /api/agent/analyze
```

### Authentication

No authentication required. The API is publicly accessible.

### Request

#### Headers

```
Content-Type: application/json
```

#### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | JavaScript code to analyze |
| `language` | string | No | Language identifier (default: "javascript") |

#### Example Request

```bash
curl -X POST https://your-logicart-instance.com/api/agent/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
    "language": "javascript"
  }'
```

### Response

#### Success Response (200 OK)

```json
{
  "summary": {
    "nodeCount": 5,
    "complexityScore": 3,
    "entryPoint": "fibonacci"
  },
  "flow": [
    {
      "id": "node_1",
      "type": "input",
      "label": "function fibonacci(n)",
      "children": [{ "targetId": "node_2" }]
    },
    {
      "id": "node_2",
      "type": "decision",
      "label": "n <= 1",
      "children": [
        { "targetId": "node_3", "condition": "true" },
        { "targetId": "node_4", "condition": "false" }
      ]
    }
  ],
  "nodes": 5,
  "edges": 4,
  "complexity": 3,
  "language": "javascript"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary` | object | High-level analysis summary |
| `summary.nodeCount` | number | Total number of nodes in the flowchart |
| `summary.complexityScore` | number | Cyclomatic complexity score |
| `summary.entryPoint` | string | Name of the main function |
| `flow` | array | Array of flow nodes with connections |
| `nodes` | number | Total node count |
| `edges` | number | Total edge count |
| `complexity` | number | Complexity score |
| `language` | string | Detected/specified language |

#### Flow Node Structure

Each node in the `flow` array has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique node identifier |
| `type` | string | Node type: `input`, `output`, `decision`, `default` |
| `label` | string | Display label for the node |
| `children` | array | Connections to other nodes |

---

## Display Audit Endpoint

```
POST /api/agent/display-audit
```

This endpoint helps AI agents detect when multiple code paths render the same component, preventing redundant display logic from accumulating over time.

### The Problem It Solves

When AI agents iterate on code, they often add new render statements (`return <Component />`) in different places rather than consolidating them. This leads to:

- **Code bloat** - Same component rendered from 3, 4, or more different locations
- **Maintenance burden** - Changes need to be made in multiple places
- **Inconsistent behavior** - Different code paths may render slightly different variations

### Request

#### Headers

```
Content-Type: application/json
```

#### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | JSX/JavaScript code to audit |

#### Example Request

```bash
curl -X POST https://your-logicart-instance.com/api/agent/display-audit \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function Dashboard({ user }) {\n  if (!user) return <Card>Not logged in</Card>;\n  if (user.isAdmin) return <Card>Admin Panel</Card>;\n  if (user.isPremium) return <Card>Premium Dashboard</Card>;\n  return <Card>Basic Dashboard</Card>;\n}"
  }'
```

### Response

#### Success Response (200 OK)

```json
{
  "hasIssues": true,
  "pathCount": 4,
  "severity": "warning",
  "paths": [
    { "component": "Card", "line": 2 },
    { "component": "Card", "line": 3 },
    { "component": "Card", "line": 4 },
    { "component": "Card", "line": 5 }
  ],
  "suggestion": "Consider consolidating these render paths into a single return statement"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `hasIssues` | boolean | Whether duplicate renders were detected |
| `pathCount` | number | Number of unique render points found |
| `severity` | string | `"none"`, `"info"`, `"warning"`, or `"critical"` |
| `paths` | array | Details of each render location |
| `paths[].component` | string | Name of the component being rendered |
| `paths[].line` | number | Line number where it's rendered |
| `suggestion` | string | Recommendation for fixing the issue |

#### Severity Thresholds

| Path Count | Severity | Meaning |
|------------|----------|---------|
| 0-2 | `none` | No issues detected |
| 3 | `info` | Minor duplication, consider reviewing |
| 4-5 | `warning` | Moderate duplication, should consolidate |
| 6+ | `critical` | High duplication, strongly recommend refactoring |

### Use Case: AI Agent Pre-Check

Before making code changes, AI agents can call this endpoint to audit existing code:

```javascript
async function checkBeforeEditing(code) {
  const audit = await fetch('/api/agent/display-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  }).then(r => r.json());
  
  if (audit.severity === 'critical') {
    console.log('⚠️ Code has', audit.pathCount, 'render points for the same component.');
    console.log('Consider consolidating before adding more.');
  }
  
  return audit;
}
```

---

## Node Types

| Type | Description | Visual |
|------|-------------|--------|
| `input` | Function entry point | Rounded rectangle |
| `output` | Return statement | Rounded rectangle |
| `decision` | Conditional (if, while, for) | Diamond shape |
| `default` | Regular statement | Rectangle |

## Complexity Score

The complexity score is based on cyclomatic complexity:

| Score | Interpretation |
|-------|----------------|
| 1-5 | Simple, easy to understand |
| 6-10 | Moderate complexity |
| 11-20 | Complex, consider refactoring |
| 21+ | Very complex, high risk |

## Use Cases

### 1. CI/CD Integration

Analyze code complexity in your build pipeline:

```javascript
const response = await fetch('/api/agent/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: fileContents })
});

const analysis = await response.json();
if (analysis.complexity > 20) {
  console.warn('High complexity detected!');
}
```

### 2. AI Agent Integration

Provide code structure context to AI agents:

```javascript
async function analyzeForAgent(code) {
  const result = await fetch('/api/agent/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  }).then(r => r.json());
  
  return `Code has ${result.nodes} nodes, ${result.edges} edges, complexity: ${result.complexity}`;
}
```

### 3. Documentation Generation

Generate flowchart documentation:

```javascript
const analysis = await analyzeCode(sourceCode);
const flowchartUrl = `https://logicart.app/?code=${encodeURIComponent(sourceCode)}`;
```

## Rate Limits

Currently no rate limits are enforced. For high-volume usage, please contact the LogicArt team.

## Supported Languages

- JavaScript (ES2020)
- JSX (React components)
- More languages coming soon

## Related Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/share` | Create a shareable flowchart link |
| `GET /api/share/:id` | Retrieve a shared flowchart |
| `POST /api/arena/generate` | Generate code with 4 AI models |

## MCP Integration

These endpoints are also available via the Model Context Protocol (MCP). See the [MCP Integration Guide](/api/docs/mcp-guide) for connecting LogicArt to Cursor, Claude, and VS Code.

## Changelog

### V1.1 (January 2026)
- Added Display Audit endpoint (`POST /api/agent/display-audit`)
- JSX parsing support via acorn-jsx
- MCP tool `display_audit` for AI agent integration

### V1 (December 2025)
- Initial release of Agent API
- Support for JavaScript code analysis
- Flow structure and complexity scoring
