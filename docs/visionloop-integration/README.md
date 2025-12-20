# LogiGo Integration for VisionLoop

This folder contains ready-to-use code for adding LogiGo visualization to VisionLoop.

## Quick Start

### Step 1: Install logigo-core in VisionLoop

Open VisionLoop in Replit and run:
```bash
npm install logigo-core
```

### Step 2: Replace routes.ts

Copy the contents of `routes-instrumented.ts` and replace your VisionLoop `server/routes.ts` file.

### Step 3: Run and Watch

Start VisionLoop and run an experiment. You'll see checkpoint logs in the console showing the flow:

```
[LogiGo] Checkpoint: iteration:start { experimentId, currentIteration, maxIterations }
[LogiGo] Checkpoint: vision:analyze_start { model: 'gemini', imageUrl: '...' }
[LogiGo] Checkpoint: vision:gemini { model: 'gemini', imagePath: '...' }
[LogiGo] Checkpoint: vision:complete { descriptionLength, promptLength }
[LogiGo] Checkpoint: generate:start { model: 'dalle', promptPreview: '...' }
[LogiGo] Checkpoint: generate:dalle { model: 'dalle' }
[LogiGo] Checkpoint: generate:complete { generatedImageUrl, processingTimeMs }
[LogiGo] Checkpoint: iteration:complete { iterationNumber, newImageUrl, nextAction }
```

## Checkpoints Added

The instrumented code adds these checkpoints to visualize the VisionLoop flow:

### Iteration Flow
| Checkpoint | Description |
|------------|-------------|
| `iteration:start` | Beginning of each iteration |
| `iteration:check_max` | Checking if max iterations reached |
| `iteration:create_record` | Creating database record |
| `iteration:complete` | Iteration finished successfully |
| `iteration:error` | Error during iteration |

### Vision Analysis
| Checkpoint | Description |
|------------|-------------|
| `vision:analyze_start` | Starting image analysis |
| `vision:grok` | Using Grok vision model |
| `vision:gemini` | Using Gemini vision model |
| `vision:gpt` | Using GPT vision model |
| `vision:manual_prompt` | Using manually edited prompt |
| `vision:complete` | Analysis complete |

### Image Generation
| Checkpoint | Description |
|------------|-------------|
| `generate:start` | Starting image generation |
| `generate:dalle` | Using DALL-E |
| `generate:aurora` | Using Aurora |
| `generate:gemini` | Using Gemini/Imagen |
| `generate:complete` | Generation complete |

### Loop Control
| Checkpoint | Description |
|------------|-------------|
| `loop:schedule_next` | Scheduling next iteration |
| `loop:paused` | Paused for manual editing |
| `loop:complete` | All iterations finished |
| `loop:critical_error` | Critical error stopped loop |

## Client-Side Integration (Optional)

To add the visual overlay UI to VisionLoop's frontend, add this to your main React component:

```javascript
import LogiGoOverlay from 'logigo-core';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const overlay = new LogiGoOverlay({ 
      speed: 1.0,
      debug: true,
      position: 'bottom-right'
    });
    overlay.init();
    
    return () => overlay.destroy();
  }, []);

  // ... rest of your app
}
```

## What You'll See

When you run an experiment in VisionLoop with these checkpoints:

1. **Console Logging**: Each checkpoint logs its ID and variables
2. **Execution Flow**: See exactly which AI model is being used
3. **Variable Tracking**: Watch how descriptions and prompts evolve
4. **Timing**: See processing time for each step
5. **Error Tracking**: Errors are captured with context

## Customizing Checkpoints

You can add more checkpoints anywhere in the code:

```javascript
await LogiGo.checkpoint('my:custom:checkpoint', {
  variables: {
    anyData: 'you want to track',
    numbers: 42,
    arrays: [1, 2, 3]
  }
});
```

## Visualization in LogiGo Studio

To see the flowchart visualization:
1. Copy the instrumented routes.ts code
2. Paste it into LogiGo Studio
3. The flowchart will show all the labeled nodes
4. Step through to see execution flow
