# Plan: MCP JSON-RPC Intercept Logger

## Overview
Create a transparent proxy wrapper (`intercept.js`) that sits between the parent process and the MCP filesystem server, logging all JSON-RPC request/response pairs to timestamped log files.

## Current State
```javascript
const proc = spawn("node", ["node_modules/.bin/mcp-server-filesystem", "."], {
  stdio: ["pipe", "pipe", "pipe"],
});
```

## Target State
```javascript
const proc = spawn("node", ["intercept.js", "--", "node", "node_modules/.bin/mcp-server-filesystem", "."], {
  stdio: ["pipe", "pipe", "pipe"],
});
```

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│ mcp-client  │ stdin   │ intercept.js │ stdin   │ MCP filesystem  │
│   .js       ├────────>│   (proxy)    ├────────>│     server      │
│             │         │              │         │                 │
│             │ stdout  │  - Parse     │ stdout  │                 │
│             │<────────┤  - Log       │<────────┤                 │
│             │         │  - Forward   │         │                 │
│             │ stderr  │              │ stderr  │                 │
│             │<────────┤  stderr      │<────────┤                 │
└─────────────┘         │  (passthru)  │         └─────────────────┘
                        │              │
                        │    ↓         │
                        │  [timestamp] │
                        │    -log.log  │
                        └──────────────┘
```

## Implementation Plan

### 1. Create `intercept.js` Script

**File:** `/Users/sdzialowski/Workspace/STOPSOPA__mcp/STOPSOPA__mcp/intercept.js`

**Key Components:**

#### A. Command Line Parsing
- Parse arguments to find `--` separator
- Extract command and args after `--`
- Validate that command exists

#### B. Log File Management
- Generate filename: `YYYY-MM-DDTHH-mm-ss-log.log`
- Create in project root directory
- Use append mode for writing

#### C. Child Process Management
- Spawn actual MCP server with same stdio configuration
- Handle process lifecycle (errors, exit codes)
- Forward exit signals

#### D. Stream Interception

**stdin (parent → child):**
- Buffer incoming data from parent stdin
- Parse newline-delimited JSON
- Extract JSON-RPC requests
- Store request with ID for matching
- Forward raw data to child stdin
- Log request immediately

**stdout (child → parent):**
- Buffer outgoing data from child stdout
- Parse newline-delimited JSON
- Extract JSON-RPC responses
- Match response to request by `id` field
- Forward raw data to parent stdout
- Log complete request/response pair

**stderr (child → parent):**
- Pass through transparently
- No logging required (it's not JSON-RPC)

#### E. JSON-RPC Message Matching
- Maintain in-memory map: `requestId → { request, timestamp }`
- When response arrives, lookup request by `id`
- Create log entry with both request and response
- Clean up stored request after logging

### 2. Log File Format

```
2025-01-26T14:30:15.123Z
REQUEST:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
RESPONSE:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
DURATION: 45ms

================================================================================

2025-01-26T14:30:16.456Z
REQUEST:
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": { "path": "./README.md" }
  }
}
RESPONSE:
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [...]
  }
}
DURATION: 12ms

================================================================================
```

### 3. Update `mcp-client.js`

**Changes needed:**
- Line 22: Update spawn call to use intercept.js
- Keep all other code unchanged (transparent proxy)

**Before:**
```javascript
const proc = spawn("node", ["node_modules/.bin/mcp-server-filesystem", "."], {
  stdio: ["pipe", "pipe", "pipe"],
});
```

**After:**
```javascript
const proc = spawn("node", ["intercept.js", "--", "node", "node_modules/.bin/mcp-server-filesystem", "."], {
  stdio: ["pipe", "pipe", "pipe"],
});
```

## Implementation Details

### intercept.js Pseudocode

```javascript
#!/usr/bin/env node

import { spawn } from 'child_process';
import { appendFileSync } from 'fs';
import path from 'path';

// 1. Parse command line
const separatorIndex = process.argv.indexOf('--');
const [command, ...args] = process.argv.slice(separatorIndex + 1);

// 2. Generate log filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const logFile = path.join(process.cwd(), `${timestamp}-log.log`);

// 3. Request tracking
const pendingRequests = new Map(); // id -> { request, startTime }

// 4. Spawn actual server
const child = spawn(command, args, {
  stdio: ['pipe', 'pipe', 'pipe']
});

// 5. Setup stdin interception (parent → child)
let stdinBuffer = '';
process.stdin.on('data', (chunk) => {
  const data = chunk.toString();
  stdinBuffer += data;

  // Parse complete JSON messages (newline-delimited)
  const lines = stdinBuffer.split('\n');
  stdinBuffer = lines.pop(); // Keep incomplete line

  for (const line of lines) {
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        const startTime = Date.now();

        // Store request for later matching
        if (request.id !== undefined) {
          pendingRequests.set(request.id, { request, startTime });
        }

        // Log request immediately (without response yet)
        logRequest(request, startTime);
      } catch (err) {
        // Not valid JSON, just forward
      }
    }
  }

  // Forward to child
  child.stdin.write(chunk);
});

// 6. Setup stdout interception (child → parent)
let stdoutBuffer = '';
child.stdout.on('data', (chunk) => {
  const data = chunk.toString();
  stdoutBuffer += data;

  // Parse complete JSON messages
  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop();

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);

        // Match with request
        if (response.id !== undefined && pendingRequests.has(response.id)) {
          const { request, startTime } = pendingRequests.get(response.id);
          const duration = Date.now() - startTime;

          // Log complete pair
          logRequestResponse(request, response, duration);

          // Cleanup
          pendingRequests.delete(response.id);
        }
      } catch (err) {
        // Not valid JSON, just forward
      }
    }
  }

  // Forward to parent
  process.stdout.write(chunk);
});

// 7. Pass stderr through
child.stderr.pipe(process.stderr);

// 8. Handle stdin end
process.stdin.on('end', () => {
  child.stdin.end();
});

// 9. Handle child exit
child.on('exit', (code) => {
  process.exit(code || 0);
});

// 10. Handle signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

// Logging functions
function logRequest(request, startTime) {
  const entry = `
${new Date(startTime).toISOString()}
REQUEST:
${JSON.stringify(request, null, 2)}

`;
  appendFileSync(logFile, entry);
}

function logRequestResponse(request, response, duration) {
  const entry = `
${new Date().toISOString()}
REQUEST:
${JSON.stringify(request, null, 2)}
RESPONSE:
${JSON.stringify(response, null, 2)}
DURATION: ${duration}ms

${'='.repeat(80)}

`;
  appendFileSync(logFile, entry);
}
```

## Edge Cases to Handle

1. **Multiple concurrent requests**: Use Map to track by ID
2. **Responses without matching requests**: Log anyway with note
3. **Notifications (no ID)**: Log but don't try to match
4. **Large messages**: Buffer properly, don't assume single chunk = single message
5. **Binary data**: Shouldn't happen with JSON-RPC, but forward as-is
6. **Child process crash**: Propagate exit code to parent
7. **Malformed JSON**: Forward through, log error to stderr

## Testing Plan

1. **Basic request/response**: Send a simple tools/list request
2. **Multiple concurrent requests**: Send several requests without waiting
3. **Large responses**: Test with read_file on a large file
4. **Error responses**: Test invalid requests
5. **Process lifecycle**: Test Ctrl+C handling
6. **Log file verification**: Check format and completeness

## Benefits

- ✅ Transparent - no changes to existing communication protocol
- ✅ Zero impact on performance (async logging)
- ✅ Complete audit trail of all JSON-RPC traffic
- ✅ Timestamped logs for debugging
- ✅ Request/response pairing by ID
- ✅ Duration metrics for performance analysis
- ✅ Easy to enable/disable (just change spawn call)

## Alternatives Considered

1. **Logging in dist.js**: Would require modifying the MCP server code
2. **Logging in mcp-client.js**: Would only capture one side of the conversation
3. **Using a separate logging server**: Overly complex for this use case

## Conclusion

The intercept.js approach provides a clean, transparent way to log all JSON-RPC traffic without modifying either the client or server code. It's easily toggled on/off and provides comprehensive logging for debugging and analysis.
