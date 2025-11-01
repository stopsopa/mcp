import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Tools - most used
 *   Is for AI to be able to use functions and do things inside the MCP ecosystem
 * Resources - second most used
 *   Is for AI to be able to access and use external data and services
 * Prompts - third most used
 *   Is for AI to be able to generate and use prompts for various tasks
 * Samplings - least used
 *   Is for server to request client AI for some helper information about propmpt Clinent sent to process further
 * from: https://youtu.be/ZoZxQwp1PiM?t=152
 */
(async function () {
  try {
    const server = new McpServer({
      name: "test",
      version: "0.0.1",
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    });

    const transport = new StdioServerTransport();
    
    await server.connect(transport);
  } catch (e) {
    console.error("Error starting MCP server:", e);
    process.exit(1);
  }
})();
