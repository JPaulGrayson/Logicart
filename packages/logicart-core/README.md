# logicart-core

LogicArt runtime library for checkpoint-based debugging and live code visualization.

## Installation

```bash
npm install logicart-core
```

## Usage

### Manual Instrumentation

```javascript
import { checkpoint } from 'logicart-core';

function bubbleSort(arr) {
  checkpoint('sort_start', { arr });
  
  for (let i = 0; i < arr.length; i++) {
    checkpoint('outer_loop', { i });
    
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        checkpoint('swap', { i, j, arr: [...arr] });
      }
    }
  }
  
  checkpoint('sort_end', { arr });
  return arr;
}
```

### Async Checkpoints with Breakpoints

```javascript
import { checkpointAsync, LogicArtRuntime } from 'logicart-core';

const runtime = new LogicArtRuntime({ manifestHash: 'abc123' });
runtime.setBreakpoint('critical_point', true);

async function processData(data) {
  await checkpointAsync('critical_point', { data });
  // Execution pauses here until runtime.resume() is called
}
```

## API

### `checkpoint(id, variables?)`
Synchronously records a checkpoint with optional variable capture.

### `checkpointAsync(id, variables?)`
Records a checkpoint that can pause execution at breakpoints.

### `LogicArtRuntime`
Full runtime class with session management, breakpoints, and queue control.

### `generateGroundingContext(nodes, edges)`
Generates lightweight JSON for LLM consumption from flowchart data.

## Features

- Deferred serialization for performance
- Queue overflow protection (5000 limit)
- Breakpoint support for debugging
- Session management for HMR sync
- Grounding layer for AI integration

## License

MIT
