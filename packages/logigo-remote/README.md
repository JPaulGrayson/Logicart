# logigo-remote

Send checkpoints from any app to LogiGo for real-time visualization.

## Installation

```bash
npm install logigo-remote
```

## Quick Start

```javascript
import { LogiGoRemote } from 'logigo-remote';

// Create a client
const logigo = new LogiGoRemote({
  serverUrl: 'https://your-logigo-app.replit.app',
  sessionName: 'My App'
});

// Send checkpoints as your code runs
await logigo.checkpoint('start', { input: userInput });
await logigo.checkpoint('processing', { step: 1, data: result });
await logigo.checkpoint('complete', { output: finalResult });

// Clean up when done
await logigo.end();
```

## Zero-Config Quick Connect

```javascript
import { LogiGoRemote } from 'logigo-remote';

// One-liner: auto-creates session, returns checkpoint function
const checkpoint = await LogiGoRemote.quickConnect('https://your-logigo-app.replit.app');

checkpoint('step-1', { x: 5 });
checkpoint('step-2', { result: 'done' });
```

## Configuration Options

```typescript
const logigo = new LogiGoRemote({
  serverUrl: 'https://your-logigo-app.replit.app',
  sessionName: 'My App',           // Display name in LogiGo
  code: 'function foo() {...}',    // Optional: source code for flowchart
  retryAttempts: 3,                // Retry failed requests
  retryDelayMs: 1000,              // Delay between retries
  batchIntervalMs: 50,             // Batch checkpoints every 50ms
  offlineQueueSize: 100            // Queue checkpoints if disconnected
});
```

## API

### `new LogiGoRemote(options)`

Create a new LogiGo remote client.

### `client.createSession(): Promise<SessionInfo>`

Manually create a session (called automatically on first checkpoint).

Returns `{ sessionId, connectUrl }` - open `connectUrl` in LogiGo to view checkpoints.

### `client.checkpoint(id, variables?, label?): Promise<void>`

Send a checkpoint event.

- `id`: Unique identifier for this checkpoint
- `variables`: Object with current variable values
- `label`: Optional human-readable label

### `client.end(): Promise<void>`

End the session and flush any pending checkpoints.

### `client.getSessionId(): string | null`

Get the current session ID.

### `client.getConnectUrl(): string | null`

Get the URL to view checkpoints in LogiGo.

### `LogiGoRemote.quickConnect(serverUrl, sessionName?): Promise<Function>`

Static helper for quick one-liner setup. Returns a checkpoint function.

## Example: Express Middleware

```javascript
import { LogiGoRemote } from 'logigo-remote';

const logigo = new LogiGoRemote({
  serverUrl: 'https://your-logigo-app.replit.app',
  sessionName: 'Express API'
});

app.use(async (req, res, next) => {
  await logigo.checkpoint('request', {
    method: req.method,
    path: req.path
  });
  next();
});

app.get('/api/users', async (req, res) => {
  await logigo.checkpoint('fetching-users');
  const users = await db.getUsers();
  await logigo.checkpoint('users-fetched', { count: users.length });
  res.json(users);
});
```

## Example: React App

```jsx
import { LogiGoRemote } from 'logigo-remote';

const logigo = new LogiGoRemote({
  serverUrl: 'https://your-logigo-app.replit.app',
  sessionName: 'React App'
});

function App() {
  const handleSubmit = async (data) => {
    await logigo.checkpoint('form-submit', { data });
    
    const result = await api.process(data);
    await logigo.checkpoint('processing-complete', { result });
    
    setResult(result);
  };

  return <Form onSubmit={handleSubmit} />;
}
```

## License

MIT
