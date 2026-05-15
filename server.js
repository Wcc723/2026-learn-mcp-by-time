import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "current-time",
  version: "1.0.0",
});

// ───── Tool：AI 主動呼叫的功能（model-controlled）
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

// ───── Prompt：使用者觸發的對話範本（user-controlled，在 host 顯示為 slash command）
server.registerPrompt(
  "format_now",
  {
    description: "請 AI 用指定格式回報當前時間",
    argsSchema: {},
  },
  async () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "請呼叫 get_current_time 並用『今天是 YYYY 年 M 月 D 日，現在是 HH:MM』格式回我",
        },
      },
    ],
  }),
);

// ───── Resource：使用者可附加進 context 的資料（app-controlled，在 host 以 @ 提及挑選）
server.registerResource(
  "timezones",
  "time://timezones",
  {
    title: "支援的時區清單",
    description: "常用時區代碼，可作為 get_current_time 的參考",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: "Asia/Taipei\nAsia/Tokyo\nUTC\nAmerica/New_York\nEurope/London",
      },
    ],
  }),
);

await server.connect(new StdioServerTransport());
