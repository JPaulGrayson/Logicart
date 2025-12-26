# LogiGo Agent API

The Agent API provides programmatic access to LogiGo's code analysis capabilities. Use this API to integrate flowchart generation and code analysis into your tools, CI pipelines, or AI agents.

## Endpoint

```
POST /api/agent/analyze
```

## Authentication

No authentication required. The API is publicly accessible.

## Request

### Headers

```
Content-Type: application/json
```

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | JavaScript code to analyze |
| `language` | string | No | Language identifier (default: "javascript") |

### Example Request

```bash
curl -X POST https://your-logigo-instance.com/api/agent/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
    "language": "javascript"
  }'
```

## Response

### Success Response (200 OK)

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

### Response Fields

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

### Flow Node Structure

Each node in the `flow` array has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique node identifier |
| `type` | string | Node type: `input`, `output`, `decision`, `default` |
| `label` | string | Display label for the node |
| `children` | array | Connections to other nodes |

### Error Responses

**400 Bad Request** - Missing or invalid code
```json
{
  "error": "Code is required"
}
```

**500 Internal Server Error** - Analysis failed
```json
{
  "error": "Failed to analyze code"
}
```

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
const flowchartUrl = `https://logigo.app/?code=${btoa(sourceCode)}`;
```

## Rate Limits

Currently no rate limits are enforced. For high-volume usage, please contact the LogiGo team.

## Supported Languages

- JavaScript (ES2020)
- More languages coming soon

## Related Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/share` | Create a shareable flowchart link |
| `GET /api/share/:id` | Retrieve a shared flowchart |
| `POST /api/arena/generate` | Generate code with 4 AI models |

## Changelog

### V1 (December 2025)
- Initial release of Agent API
- Support for JavaScript code analysis
- Flow structure and complexity scoring
