# MCP 教學範例：取得當前時間

> 2026 進階 AI 課程 — MCP 單元的第一個動手範例。
> 目的不是把你變成 MCP 高手，而是讓你**親眼看見**一個 MCP server 怎麼被 AI CLI 呼叫。

---

## 1. 什麼是 MCP？

**MCP（Model Context Protocol）是一個讓 LLM 應用能呼叫外部工具的「標準協定」**。

> 一句話比喻：MCP 之於 AI 工具，就像 USB 之於外接裝置。
> 你寫的 server 不綁特定 AI 應用 — 任何支援 MCP 的 host（Claude Code、Codex CLI、Claude Desktop…）都能用它。

它不是「另一種 HTTP API」。差別在於：MCP 規定了一套 JSON-RPC 訊息格式，host 與 server 雙方依此交換「我有哪些工具 / 請呼叫哪個工具 / 結果是什麼」。你的 server 只要實作協定，就能被生態圈內所有 host 使用。

---

## 2. MCP 的三個角色

```
   ┌──────────┐         ┌──────────┐  stdio (JSON-RPC)   ┌──────────┐
   │  使用者  │ ──────▶ │  Host +  │ ──────────────────▶ │  Server  │
   │ (你)     │         │  Client  │ ◀────────────────── │ (本範例) │
   └──────────┘         └──────────┘                     └──────────┘
                          ↑                                  │
                          │     "get_current_time" tool     │
                          └──────────────────────────────────┘
```

- **Host**：你實際操作的 AI 應用（Claude Code、Codex CLI…）
- **Client**：Host 內部負責跟 Server 對話的元件（你不需要自己寫）
- **Server**：本範例 — 提供一個 `get_current_time` 工具

---

## 3. 本範例會做什麼？

`server.js` 只做一件事：**對外宣告一個叫 `get_current_time` 的工具**，被呼叫時回傳當下 ISO 8601 時間字串。

核心程式碼只有 ~15 行。打開 `server.js` 你會看到三個關鍵動作：

1. `new McpServer({ name, version })` — 建立 server，自我介紹
2. `server.registerTool(name, schema, handler)` — 對外宣告一個能力
3. `server.connect(new StdioServerTransport())` — 用 stdin/stdout 跟 Host 講話

---

## 4. 安裝範例本身

```bash
npm install
```

這會把 `@modelcontextprotocol/sdk` 裝進 `node_modules/`。

---

## 5. 直接啟動（觀察 stdio 行為）

```bash
node server.js
```

**它會卡住、不退出，這是正確的行為**。因為 server 正在等 Host 透過 stdin 發送 JSON-RPC 訊息。按 `Ctrl+C` 可中止。

> 想看協定真正的樣子？貼這段 JSON 進去再按 Enter：
> ```json
> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0"}}}
> ```
> Server 會回一段 JSON 說明自己是誰、支援哪些能力。這就是 host 啟動 server 時做的第一件事。

---

## 6. 把這個 MCP server 註冊到 CLI

`<ABS>` 是「server.js 的絕對路徑」placeholder。在範例資料夾下執行：

```bash
pwd
# 例：/Users/you/.../取得當前時間
```

接下來指令裡的 `<ABS>` 都用上面這串替換。

| Scope | 寫到哪 | 在哪些目錄能用 |
|---|---|---|
| `local`（Claude Code 預設） | 你執行 `mcp add` 當下那個目錄專屬設定 | **只有那一個目錄** |
| `project` | 該專案根目錄的設定檔（隨資料夾走） | 任何人開啟該資料夾 |
| `user` | 全域 user 設定 | **所有目錄** |

**本範例採用 `project` scope**，因為設定檔跟著資料夾走，學員一眼就看到「設定檔就在我打開的這個資料夾裡」，最直觀。

---

### Claude Code（專案層級：`.mcp.json`）

兩種方式擇一，兩者**結果完全相同** — 都會寫入 / 讀取專案根目錄的 `.mcp.json`：

**方式 1：CLI 子命令**

```bash
claude mcp add --scope project current-time -- node <ABS>/server.js
claude mcp list                # 確認 current-time 出現在列表
```

**方式 2：手動建立 `.mcp.json`（與方式 1 等價）**

在專案根目錄建立 `.mcp.json`：

```json
{
  "mcpServers": {
    "current-time": {
      "type": "stdio",
      "command": "node",
      "args": ["<ABS>/server.js"]
    }
  }
}
```

下次在此資料夾開啟 Claude Code 時會自動偵測 `.mcp.json`，並跳出「是否信任此 server」提示，批准後用 `/mcp` 即可看到。

### Codex CLI（專案層級：`.codex/config.toml`）

> ⚠️ `codex mcp add` 子命令**只會寫到 user 層級**（`~/.codex/config.toml`），不支援 `--scope project`。要做專案層級設定**只能手動編輯檔案**。

在專案根目錄建立 `.codex/config.toml`：

```toml
[mcp_servers.current-time]
command = "node"
args = ["<ABS>/server.js"]
```

**前置動作：必須先信任此專案**，否則整個 `.codex/` 目錄都會被忽略：

- 第一次在這個資料夾跑 `codex`，TUI 會詢問是否信任，按同意即可
- 或在 `~/.codex/config.toml` 預先加：
  ```toml
  [projects."<ABS>"]
  trust_level = "trusted"
  ```

> **共通要點**：路徑**必須絕對**（用前面 `pwd` 拿到的 `<ABS>`）。雖然某些情況下相對路徑可行，但「host 啟動 server 時的 cwd」不一定等於專案根，**用絕對路徑最不會踩雷**。

---

## 7. 驗證調用

在 Claude Code 或 Codex CLI 內輸入：

```
現在幾點？
```

預期：

- CLI 顯示一段 tool call 訊息（例如「Calling get_current_time…」）
- 回覆中出現當下的 ISO 時間，例如 `2026-05-06T07:42:13.521Z`
- 在 CLI 內輸入 `/mcp` 可看到 `current-time` server 的狀態
