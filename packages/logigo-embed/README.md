# logigo-embed

Embeddable code-to-flowchart visualization component for React applications.

## Installation

```bash
npm install logigo-embed
```

## Usage

### Static Mode (Parse code at runtime)

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  const code = `
    function bubbleSort(arr) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
        }
      }
      return arr;
    }
  `;

  return (
    <LogiGoEmbed 
      code={code}
      position="bottom-right"
      defaultOpen={true}
      theme="dark"
    />
  );
}
```

### Live Mode (With Vite Plugin instrumentation)

```jsx
import { LogiGoEmbed } from 'logigo-embed';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <LogiGoEmbed 
      manifestUrl="/logigo-manifest.json"
      position="bottom-right"
      defaultOpen={true}
      showVariables={true}
      showHistory={true}
      theme="dark"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | - | JavaScript code to parse (Static Mode) |
| `manifestUrl` | `string` | - | URL to LogiGo manifest (Live Mode) |
| `manifestHash` | `string` | - | Hash for manifest validation |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Panel position |
| `defaultOpen` | `boolean` | `true` | Initially open |
| `defaultSize` | `{ width: number; height: number }` | `{ width: 400, height: 300 }` | Panel size |
| `showVariables` | `boolean` | `true` | Show variable inspector |
| `showHistory` | `boolean` | `false` | Show checkpoint history |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme |
| `onNodeClick` | `(nodeId: string) => void` | - | Node click handler |
| `onCheckpoint` | `(checkpoint) => void` | - | Checkpoint event handler |

## Features

- Real-time flowchart visualization
- Variable tracking and display
- Checkpoint history navigation
- HMR-aware session sync
- Lazy-loaded dagre layout (Static Mode only)

## Peer Dependencies

- `react >= 17.0.0`
- `react-dom >= 17.0.0`

## License

MIT
