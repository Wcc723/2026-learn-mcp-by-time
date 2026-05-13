# MCP 教學範例：取得當前時間

一個極簡的 MCP server — 對外宣告 `get_current_time` 工具，回傳當下 ISO 8601 時間字串。

---

## 1. 安裝

```bash
npm install
```

會把 `@modelcontextprotocol/sdk` 裝進 `node_modules/`。

---

## 2. 直接啟動（可選，先看看 server 長怎樣）

```bash
node server.js
```

**會卡住、不退出，這是正確的行為** — server 在等 host 從 stdin 發送 JSON-RPC 訊息。按 `Ctrl+C` 可中止。

> 想看協定真正的樣子？貼下面這行進去再按 Enter，server 會回一段 JSON 自我介紹：
> ```json
> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0"}}}
> ```

---

## 3. 註冊到 AI CLI

### 先準備 `<ABS>`

`<ABS>` 是「server.js 的絕對路徑」placeholder。在範例資料夾下執行：

```bash
pwd
# 例：/Users/you/.../取得當前時間
```

接下來指令裡的 `<ABS>` 都用上面這串替換。

### Scope 對照表（本範例採 `project`）

| Scope | 寫到哪 | 在哪些目錄能用 |
|---|---|---|
| `local`（Claude Code 預設） | 執行 `mcp add` 當下那個目錄專屬設定 | **只有那一個目錄** |
| `project` ← 本範例 | 該專案根目錄的設定檔（隨資料夾走） | 任何人開啟該資料夾 |
| `user` | 全域 user 設定 | **所有目錄** |

---

### Claude Code → `.mcp.json`

兩種方式擇一，**結果完全相同** — 都會寫入 / 讀取專案根目錄的 `.mcp.json`：

**方式 1：CLI**

```bash
claude mcp add --scope project current-time -- node <ABS>/server.js
claude mcp list                # 確認註冊成功
```

**方式 2：手動建立 `.mcp.json`**

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

下次在此資料夾開啟 Claude Code 時會自動偵測，並跳出「是否信任此 server」提示。

### Codex CLI → `.codex/config.toml`

> ⚠️ `codex mcp add` 只能寫 user 層級，要做專案層級**只能手動編輯檔案**。

在專案根目錄建立 `.codex/config.toml`：

```toml
[mcp_servers.current-time]
command = "node"
args = ["<ABS>/server.js"]
```

**前置動作：先信任此專案**，否則整個 `.codex/` 會被忽略：

- 第一次跑 `codex` 時，TUI 會詢問是否信任，按同意即可
- 或在 `~/.codex/config.toml` 預先加：
  ```toml
  [projects."<ABS>"]
  trust_level = "trusted"
  ```

---

## 4. 驗證調用

在 Claude Code 或 Codex CLI 內輸入：

```
透過 mcp current-time 取得當前時間
```

預期：

- CLI 顯示 tool call 訊息（例如「Calling get_current_time…」）
- 回覆中出現當下的 ISO 時間，例如 `2026-05-07T10:42:13.521Z`
- 用 `/mcp` 可看到 `current-time` server 狀態

---

## 5. 延伸練習

1. **加參數**：讓 `get_current_time` 接受 `timezone` 參數，回傳指定時區的時間（需引入 `zod`）
2. **換 transport**：把 stdio 換成 HTTP，看 host 設定要跟著怎麼變
3. **換語言**：用 Python (`mcp` + FastMCP) 重寫一份，觀察「協定一致、語言可換」

---

## ⚠️ 最常踩的坑：不要 `console.log`

stdio transport 把 stdout 視為 JSON-RPC 訊息通道，任何非協定的輸出都會破壞訊息。除錯請用：

```javascript
console.error("debug:", something);   // stderr 不會汙染協定
```

註冊後 server 連不上、tool call 出錯？**第一個檢查**：是不是不小心 print 了東西到 stdout。
