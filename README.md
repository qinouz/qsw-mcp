# qsw-mcp

Smart Doc MCP Server - 为 AI Agent 提供统一的文档读取能力

## 功能特性

- **read_url**: 读取网页内容，返回标题、纯文本和 Markdown 格式（无登录状态）
- **read_url_browser**: 使用浏览器读取网页（支持登录状态、Cookie、SPA 页面）
- **read_clipboard_image**: 从系统剪贴板读取图片并识别文字（OCR），支持中英文等多种语言

## 安装

```bash
npm install
npm run build
```

### Playwright 浏览器安装（read_url_browser 需要）

```bash
npx playwright install chromium
```

## 使用方法

### 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "qsw-mcp": {
      "command": "node",
      "args": ["path/to/qswMCP/dist/index.js"]
    }
  }
}
```

### 在 VSCode Agent 中配置

在 `.vscode/settings.json` 中添加：

```json
{
  "claude.mcpServers": {
    "qsw-mcp": {
      "command": "node",
      "args": ["path/to/qswMCP/dist/index.js"]
    }
  }
}
```

## 工具说明

### read_url

读取网页内容（无登录状态）。

**输入参数**：
- `url` (string): 要读取的网页 URL

**输出示例**：
```json
{
  "success": true,
  "data": {
    "title": "网页标题",
    "content": "网页纯文本内容...",
    "markdown": "# 网页标题\n\n网页 Markdown 内容...",
    "url": "https://example.com",
    "length": 1234
  }
}
```

### read_url_browser

使用浏览器读取网页，支持登录状态、Cookie 和 SPA 页面。

**输入参数**：
- `url` (string): 要读取的网页 URL
- `waitFor` (number, 可选): 等待页面加载的时间（毫秒），默认 2000ms
- `useExisting` (boolean, 可选): 是否连接已打开的 Chrome（需要 Chrome 调试模式），默认使用新浏览器

**输出示例**：
```json
{
  "success": true,
  "data": {
    "title": "网页标题",
    "content": "网页纯文本内容...",
    "markdown": "# 网页标题\n\n网页 Markdown 内容...",
    "url": "https://example.com/final",
    "originalUrl": "https://example.com",
    "length": 1234,
    "mode": "browser"
  }
}
```

**连接已有 Chrome 浏览器**：
```bash
# 以调试模式启动 Chrome
chrome.exe --remote-debugging-port=9222
```

### read_clipboard_image

从系统剪贴板读取图片并进行 OCR 文字识别。

**输入参数**：
- `language` (string, 可选): 识别语言，默认 `chi_sim+eng`
  - `chi_sim`: 简体中文
  - `chi_tra`: 繁体中文
  - `eng`: 英文
  - `jpn`: 日文
  - `kor`: 韩文
  - `chi_sim+eng`: 简体中文+英文
  - `chi_tra+eng`: 繁体中文+英文
- `preprocess` (boolean, 可选): 是否预处理图片（提高识别准确率），默认开启

**输出示例**：
```json
{
  "success": true,
  "data": {
    "text": "识别出的文字内容...",
    "confidence": 95.5,
    "statistics": {
      "characters": 123,
      "words": 45,
      "lines": 10,
      "blocks": 5
    },
    "language": "chi_sim+eng",
    "preprocess": "已预处理（灰度、对比度标准化、锐化）",
    "blocks": [...],
    "source": "clipboard",
    "savedPath": "clipboard/clipboard_2026-05-31T00-52-00.png"
  }
}
```

**使用步骤**：
1. 复制图片（右键 → 复制图片，或 Win+Shift+S 截图）
2. 调用此工具进行 OCR 识别

## 开发

```bash
# 开发模式运行
npm run dev

# 编译
npm run build

# 监听模式
npm run watch
```

## 技术栈

- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- axios
- cheerio
- turndown
- playwright
- sharp
- tesseract.js
- zod

## 许可证

MIT
