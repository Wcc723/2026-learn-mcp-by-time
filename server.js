import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "current-time",
  version: "1.0.0",
});

server.registerTool(
  "get_current_time",
  {
    description: "取得當前時間，回傳 ISO 8601 格式字串",
    inputSchema: {},
  },
  async () => ({
    content: [
      { type: "text", text: new Date().toISOString() },
    ],
  }),
);

await server.connect(new StdioServerTransport());
