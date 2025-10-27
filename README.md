# MCP JSON-RPC Client

## Overview

This is a simple Express.js based client for interacting with the Model Context Protocol (MCP) server-filesystem via JSON-RPC over stdio.

## Demo

https://stopsopa.github.io/mcp

> [!WARNING]
> On github it can present example payload for requests, but there is not server powering it due to static nature of github pages.
> But can be launched locally to test responses.


## Features

- Spawns MCP server-filesystem process
- Provides a web interface for constructing and sending JSON-RPC requests
- Handles request/response communication over stdio
- Transparent JSON-RPC intercept proxy for logging all traffic
- Request/response logging with duration metrics

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the client:

```bash
npm run start

or

xx
```

3. Open http://localhost:3000 in your browser

## Usage

- Enter a valid JSON-RPC 2.0 request in the textarea or use buttons to bring up sample requests
- Click "Send Request" to submit the request to the MCP server
- View the response in the Response section

## Intercept Proxy

The project includes a transparent JSON-RPC intercept proxy (`intercept.js`) that logs all communication between the client and MCP server.

### How it works

```
mcp-client.js → intercept.js → MCP filesystem server
              ↓ logs to ./var/
```

The proxy:
- Intercepts all stdin/stdout traffic between client and server
- Parses newline-delimited JSON-RPC messages
- Matches requests to responses by ID
- Logs complete request/response pairs with timestamps and duration
- Forwards all data transparently (zero protocol impact)

### Log Files

Logs are stored in `./var/` directory with timestamped filenames:
```
./var/2025-01-26T14-30-15-log.log
```

Each log entry includes:
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
  "result": { ... }
}
DURATION: 45ms
================================================================================
```

### Configuration

The intercept proxy is enabled by default in `mcp-client.js`. To disable it, modify the spawn call:

```javascript
// WITH intercept (default)
const proc = spawn("node", ["intercept.js", "--", "node", "node_modules/.bin/mcp-server-filesystem", "."], {...});

// WITHOUT intercept
const proc = spawn("node", ["node_modules/.bin/mcp-server-filesystem", "."], {...});
```

### Standalone Usage

The intercept proxy can be used with any command that uses JSON-RPC over stdio:

```bash
node intercept.js -- <command> [args...]
```

Example:
```bash
node intercept.js -- node my-jsonrpc-server.js
```

# Dev notes

https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem is used as a main MCP server

mcp-stdio\_\_copy.ts is a copy of https://github.com/modelcontextprotocol/servers/blob/2025.9.25/src/filesystem/index.ts I generally fed to Claude to make it better to reason about it.


