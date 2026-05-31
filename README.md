# qsw-mcp

Smart Doc MCP Server - 为 AI Agent 提供统一的文档读取能力

## 功能特性

- **read_url**: 读取网页内容，返回标题、纯文本和 Markdown 格式
- **read_docx**: 读取 Word 文档（.docx），返回 HTML 和纯文本
- **read_pdf**: 读取 PDF 文档，提取文本内容
- **read_markdown**: 读取 Markdown 文件内容

## 安装

```bash
npm install
npm run build
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

读取网页内容。

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

### read_docx

读取 Word 文档。

**输入参数**：
- `path` (string): DOCX 文件路径

**输出示例**：
```json
{
  "success": true,
  "data": {
    "html": "<h1>文档标题</h1><p>文档内容...</p>",
    "text": "文档标题\n\n文档内容...",
    "path": "/path/to/document.docx",
    "length": 567
  }
}
```

### read_pdf

读取 PDF 文档。

**输入参数**：
- `path` (string): PDF 文件路径

**输出示例**：
```json
{
  "success": true,
  "data": {
    "text": "PDF 文本内容...",
    "path": "/path/to/document.pdf",
    "pages": 10,
    "info": { ... },
    "length": 890
  }
}
```

### read_markdown

读取 Markdown 文件。

**输入参数**：
- `path` (string): Markdown 文件路径

**输出示例**：
```json
{
  "success": true,
  "data": {
    "content": "# 标题\n\n内容...",
    "path": "/path/to/document.md",
    "fileName": "document.md",
    "length": 234
  }
}
```

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
- mammoth
- pdf-parse

## 许可证

MIT
