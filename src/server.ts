import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { z } from "zod";

import fs from "node:fs/promises";

type UserType = {
  id?: number;
  name: string;
  email: string;
  address: string;
  phone: string;
};

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

    server.tool(
      "create-user",
      "Create a new user in the database",
      {
        name: z.string(),
        email: z.string(),
        address: z.string(),
        phone: z.string(),
      },
      {
        title: "Create User",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      async (params) => {
        try {
          const id = await createUser(params);

          return {
            content: [
              {
                type: "text",
                text: `User with id: ${id} created successfully`,
              },
            ],
          };
        } catch (e) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to save user",
              },
            ],
          };
        }
      }
    );

    async function createUser(params: UserType) {
      const tmp = await import("./data/users.json", {
        with: { type: "json" },
      });

      const users = tmp.default as UserType[];

      const id = users.length + 1;

      users.push({ id, ...params });

      // Write the updated users back to the file
      await fs.writeFile(
        "./src/data/users.json",
        JSON.stringify(users, null, 2)
      );

      return id;
    }
    const transport = new StdioServerTransport();

    await server.connect(transport);
  } catch (e) {
    // Don't use console.error as it interferes with MCP JSON protocol
    // Write to stderr directly or use a proper logging mechanism
    process.stderr.write(`Error starting MCP server: ${e}\n`);

    process.exit(1);
  }
})();
