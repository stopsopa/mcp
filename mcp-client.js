import { spawn } from 'child_process';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    // Buffer to accumulate response data across multiple chunks
    let buffer = '';

    // Listen for response on stdout
    const responseHandler = (data) => {
      try {
        // Accumulate data in buffer
        buffer += data.toString();

        // Check if we have a complete JSON message (ends with newline)
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex === -1) {
          // Message not complete yet, wait for more data
          return;
        }

        // Extract the complete JSON message
        const completeMessage = buffer.substring(0, newlineIndex).trim();

        // Parse the complete JSON response
        const jsonRpcResponse = JSON.parse(completeMessage);

        // Remove the listener after receiving response
        proc.stdout.removeListener('data', responseHandler);

        // Check if response contains media data (base64-encoded image/audio)
        if (jsonRpcResponse.result &&
            jsonRpcResponse.result.content &&
            Array.isArray(jsonRpcResponse.result.content) &&
            jsonRpcResponse.result.content.length > 0) {

          const content = jsonRpcResponse.result.content[0];

          // If it has 'data' and 'mimeType', it's media content
          if (content.data && content.mimeType) {
            // Decode base64 to binary
            const binaryData = Buffer.from(content.data, 'base64');

            // Set proper Content-Type header
            res.setHeader('Content-Type', content.mimeType);
            res.setHeader('Content-Length', binaryData.length);

            // Send binary data
            res.send(binaryData);
            return;
          }
        }

        // For all other responses, send as JSON
        res.json(jsonRpcResponse);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.error('Buffer content length:', buffer.length);
        console.error('Buffer preview:', buffer.substring(0, 200));

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