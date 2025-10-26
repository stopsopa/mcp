# MCP JSON-RPC Client

## Overview

This is a simple Express.js based client for interacting with the Model Context Protocol (MCP) server-filesystem via JSON-RPC over stdio.

## Features

- Spawns MCP server-filesystem process
- Provides a web interface for constructing and sending JSON-RPC requests
- Handles request/response communication over stdio

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

# Dev notes

https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem is used as a main MCP server

mcp-stdio\_\_copy.ts is a copy of https://github.com/modelcontextprotocol/servers/blob/2025.9.25/src/filesystem/index.ts I generally fed to Claude to make it better to reason about it.


