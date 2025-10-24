const { spawn } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Spawn the MCP server-filesystem process
// const proc = spawn('npx', ['@modelcontextprotocol/server-filesystem', '.'], {
const proc = spawn('node', ['node_modules/.bin/mcp-server-filesystem', '.'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

if (!proc || !proc.stdout || !proc.stderr) {
  console.error('Failed to spawn MCP server process');
  process.exit(1);
}

// JSON-RPC request handler
app.post('/jsonrpc', (req, res) => {
  try {
    const jsonRpcRequest = req.body;

    // Write the JSON-RPC request to the process stdin
    proc.stdin.write(JSON.stringify(jsonRpcRequest) + '\n');

    // Listen for response on stdout
    const responseHandler = (data) => {
      try {
        const responseStr = data.toString().trim();
        const jsonRpcResponse = JSON.parse(responseStr);

        // Remove the listener after receiving response
        proc.stdout.removeListener('data', responseHandler);

        // Send the response back to the client
        res.json(jsonRpcResponse);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);

        // Remove the listener on error too
        proc.stdout.removeListener('data', responseHandler);

        res.status(500).json({
          error: 'Failed to parse server response',
          details: parseError.message
        });
      }
    };

    proc.stdout.on('data', responseHandler);
  } catch (error) {
    console.error('Error handling JSON-RPC request:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

// Serve the main UI
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`MCP Client server running at http://localhost:${port}`);
});

// Handle process errors
proc.on('error', (error) => {
  console.error('MCP Server process error:', error);
});

proc.stderr.on('data', (data) => {
  console.error('MCP Server stderr:', data.toString());
});

// Graceful shutdown
process.on('SIGINT', () => {
  proc.kill();
  process.exit();
});