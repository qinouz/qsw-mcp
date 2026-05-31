# Smart Doc MCP 使用指南

## 目录

- [快速开始](#快速开始)
- [工具列表](#工具列表)
- [浏览器模式配置](#浏览器模式配置)
- [OCR 语言包预下载](#ocr-语言包预下载)
- [日志查看](#日志查看)
- [使用示例](#使用示例)
- [常见问题](#常见问题)

---

## 快速开始

### 1. 安装依赖

```bash
# 安装 npm 依赖
npm install

# 安装 Playwright 浏览器（仅浏览器模式需要）
npx playwright install chromium
```

### 2. 预下载 OCR 语言包（重要！）

首次使用 OCR 工具时会自动下载语言包（约 20MB），可能导致卡住。建议提前下载：

```bash
# 下载英文语言包
node -e "const {createWorker}=require('tesseract.js');createWorker('eng').then(w=>{console.log('英文 OK');w.terminate()})"

# 下载中文语言包
node -e "const {createWorker}=require('tesseract.js');createWorker('chi_sim').then(w=>{console.log('中文 OK');w.terminate()})"
```

### 3. 编译项目

```bash
npm run build
```

### 4. 配置 Agent

在 Claude Desktop 或 VSCode Agent 的配置文件中添加：

```json
{
  "mcpServers": {
    "qsw-mcp": {
      "command": "node",
      "args": ["e:/myproject/qswMCP/dist/index.js"]
    }
  }
}
```

---

## 工具列表

| 工具 | 功能 | 适用场景 |
|------|------|---------|
| read_url | 读取公开网页 | 公开网页、无需登录 |
| read_url_browser | 浏览器读取网页 | 需要登录、SPA 页面 |
| read_clipboard_image | 剪贴板图片 OCR | 截图识别、复制图片识别 |

---

### 1. read_url

**功能**：读取公开网页内容

**适用场景**：
- 公开网页
- 无需登录的页面
- 静态页面

**输入参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | ✅ | 网页 URL |

**输出示例**：

```json
{
  "success": true,
  "data": {
    "title": "页面标题",
    "content": "纯文本内容...",
    "markdown": "## Markdown 内容...",
    "url": "https://example.com",
    "length": 1234
  }
}
```

**调用示例**：

```
请读取 https://example.com
```

---

### 2. read_url_browser

**功能**：使用浏览器读取网页（支持登录状态）

**适用场景**：
- 需要登录的页面
- SPA（单页应用）
- 动态加载的页面
- 企业内部系统

**输入参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| url | string | ✅ | - | 网页 URL |
| waitFor | number | ❌ | 2000 | 等待页面加载的时间（毫秒） |

**输出示例**：

```json
{
  "success": true,
  "data": {
    "title": "私有文档标题",
    "content": "登录后的内容...",
    "markdown": "## 内容...",
    "url": "https://private-site.com/docs",
    "originalUrl": "https://private-site.com/docs",
    "length": 5678,
    "mode": "browser"
  }
}
```

**调用示例**：

```
使用浏览器读取 https://company.wiki.com/docs
```

---

### 3. read_clipboard_image

**功能**：从系统剪贴板读取图片并识别文字（OCR）

**适用场景**：
- 截图后直接识别
- 复制图片后识别
- 不需要保存图片文件

**输入参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| language | string | ❌ | chi_sim+eng | 识别语言 |
| preprocess | boolean | ❌ | true | 是否预处理图片 |

**语言选项**：

| 值 | 说明 |
|------|------|
| chi_sim | 简体中文 |
| chi_tra | 繁体中文 |
| eng | 英文 |
| jpn | 日文 |
| kor | 韩文 |
| chi_sim+eng | 中英文混合（推荐） |

**输出示例**：

```json
{
  "success": true,
  "data": {
    "text": "识别出的文字内容...",
    "confidence": 95.5,
    "statistics": {
      "characters": 1234,
      "words": 56,
      "lines": 12,
      "blocks": 8
    },
    "language": "chi_sim+eng",
    "preprocess": "已预处理（灰度、对比度标准化、锐化）",
    "source": "clipboard",
    "savedPath": "/tmp/qsw-mcp-clipboard/clipboard_2026-05-30T16-26-38.png"
  }
}
```

**使用方法**：

```
1. 截图（Win+Shift+S）或复制图片（Ctrl+C）
2. 告诉 Agent：识别图片 剪贴板
3. 自动完成！
```

**跨平台支持**：

| 平台 | 方式 |
|------|------|
| Windows | PowerShell |
| macOS | pngpaste 或 osascript |
| Linux | xclip |

---

## 浏览器模式配置

### 方式 1：命令行启动 Chrome（推荐）

**必须先关闭所有 Chrome 窗口，再执行以下命令：**

```bash
# Windows PowerShell
taskkill /F /IM chrome.exe
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug"

# macOS
pkill -f "Google Chrome"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"

# Linux
pkill -f chrome
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `--remote-debugging-port=9222` | 开启调试端口 |
| `--user-data-dir="C:\chrome-debug"` | 使用独立用户数据目录，避免与正常 Chrome 冲突 |

> **重要**：必须使用 `--user-data-dir` 指定独立目录，否则会与已打开的 Chrome 冲突导致无法启动。

### 启动后的使用流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 使用快捷方式启动 Chrome（带调试模式）                      │
│                                                             │
│  2. 在 Chrome 中登录目标网站                                  │
│     - 企业 Wiki                                               │
│     - 飞书文档                                                │
│     - 腾讯文档                                                │
│     - 其他需要登录的网站                                       │
│                                                             │
│  3. 向 Agent 发送请求                                         │
│     "请使用浏览器读取 https://company.wiki.com/docs"           │
│                                                             │
│  4. Agent 调用 read_url_browser 工具                          │
│     → 连接到你的 Chrome                                        │
│     → 读取当前登录状态下的页面内容                               │
│     → 返回结构化数据                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## OCR 语言包预下载

首次使用 OCR 工具（read_image、read_clipboard_image 等）时，tesseract.js 会自动下载语言训练数据（约 20MB）。如果网络不好，可能导致卡住。

### 预下载命令

```bash
# 进入项目目录
cd e:/myproject/qswMCP

# 下载英文语言包
node -e "const {createWorker}=require('tesseract.js');createWorker('eng').then(w=>{console.log('英文 OK');w.terminate()})"

# 下载中文语言包
node -e "const {createWorker}=require('tesseract.js');createWorker('chi_sim').then(w=>{console.log('中文 OK');w.terminate()})"
```

### 语言包缓存位置

```
# Windows
%TEMP%\tessdata\

# macOS / Linux
/tmp/tessdata/
```

### 支持的语言

| 语言代码 | 说明 |
|----------|------|
| eng | 英文 |
| chi_sim | 简体中文 |
| chi_tra | 繁体中文 |
| jpn | 日文 |
| kor | 韩文 |
| chi_sim+eng | 中英文混合（推荐） |

---

## 日志查看

MCP Server 的日志会写入项目 `logs` 目录，方便排查问题。

### 日志文件位置

```
项目目录/logs/mcp.log
```

### 查看日志

```bash
# Windows
type logs\mcp.log

# macOS / Linux
cat logs/mcp.log
```

### 实时查看日志

```bash
# PowerShell（需指定 UTF-8 编码，否则中文乱码）
Get-Content logs\mcp.log -Encoding UTF8 -Wait

# 或者先设置终端编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-Content logs\mcp.log -Wait

# Git Bash / macOS / Linux
tail -f logs/mcp.log
```

### 日志格式

```
[2026-05-30T16:39:13.417Z] [INFO] 正在启动 qsw-mcp 服务器...
[2026-05-30T16:39:13.424Z] [INFO] 已注册工具: read_url, read_url_browser
[2026-05-30T16:39:13.424Z] [INFO] 已注册工具: read_docx
[2026-05-30T16:39:13.425Z] [INFO] 已注册工具: read_pdf
[2026-05-30T16:39:13.425Z] [INFO] 已注册工具: read_markdown
[2026-05-30T16:39:13.426Z] [INFO] 已注册工具: read_image, read_images_batch, read_image_base64, read_clipboard_image
[2026-05-30T16:39:13.426Z] [INFO] MCP Server 初始化完成，已注册 9 个工具
[2026-05-30T16:39:13.427Z] [INFO] qsw-mcp 服务器已启动，等待连接...
[2026-05-30T16:40:00.000Z] [INFO] 开始读取网页: https://example.com
[2026-05-30T16:40:01.000Z] [INFO] 网页读取成功: Example Domain
```

---

## 使用示例

### 示例 1：读取公开网页

```
用户：请读取 https://platform.xiaomimimo.com 的内容

Agent 调用：read_url({ url: "https://platform.xiaomimimo.com" })

返回：网页标题、纯文本、Markdown 格式内容
```

### 示例 2：读取私有文档（需要登录）

```
前提：Chrome 已启动调试模式，并登录了企业 Wiki

用户：请使用浏览器读取 https://company.wiki.com/docs/项目需求

Agent 调用：read_url_browser({ 
  url: "https://company.wiki.com/docs/项目需求",
  waitFor: 3000 
})

返回：登录后的文档内容
```

### 示例 3：读取本地文档

```
用户：请读取 /docs/需求文档.docx

Agent 调用：read_docx({ path: "/docs/需求文档.docx" })

返回：Word 文档的 Markdown 格式内容
```

### 示例 4：结合业务开发

```
用户：请阅读这个业务文档并帮我开发功能
      文档地址：https://company.wiki.com/docs/订单系统

Agent 执行流程：
1. 调用 read_url_browser 读取文档
2. 分析业务需求
3. 理解订单状态、流程等
4. 生成符合业务逻辑的代码
```

---

## 常见问题

### Q1: 浏览器模式连接失败？

**错误信息**：`connect ECONNREFUSED 127.0.0.1:9222`

**解决方案**：

1. 确保 Chrome 以调试模式启动：
   ```bash
   chrome.exe --remote-debugging-port=9222
   ```

2. 检查端口是否被占用：
   ```bash
   netstat -ano | findstr 9222
   ```

3. 如果端口被占用，尝试其他端口：
   ```bash
   chrome.exe --remote-debugging-port=9223
   ```
   
   然后修改代码中的端口号

---

### Q2: 读取的页面内容不完整？

**可能原因**：
- 页面是 SPA，内容动态加载
- 需要滚动加载更多内容

**解决方案**：

增加 `waitFor` 参数：
```json
{
  "url": "https://example.com",
  "waitFor": 5000
}
```

---

### Q3: 如何同时使用多个浏览器？

**当前限制**：只能连接一个 Chrome 实例（端口 9222）

**解决方案**：
- 使用不同的 Chrome 配置文件
- 或使用不同的端口启动多个实例

---

### Q4: 浏览器模式会影响正常使用吗？

**不会**。`read_url_browser` 会：
1. 连接到你的 Chrome
2. **新建一个标签页**读取内容
3. 读取完成后**关闭该标签页**
4. 你原有的标签页不受影响

---

### Q5: 如何查看 Chrome 是否以调试模式启动？

访问：http://localhost:9222/json

如果返回 JSON 数据，说明调试模式已启用。

---

## 高级配置

### 修改默认等待时间

编辑 `src/tools/read-url.ts`：

```typescript
waitFor: z
  .number()
  .min(0)
  .max(30000)  // 最大 30 秒
  .default(5000)  // 默认 5 秒
  .describe("等待页面加载的时间（毫秒）"),
```

### 修改端口号

编辑 `src/tools/read-url.ts`：

```typescript
browser = await chromium.connectOverCDP("http://localhost:9223");
```

---

## 技术支持

如有问题，请查看：

- [项目 README](../README.md)
- [MCP 官方文档](https://modelcontextprotocol.io)
- [Playwright 文档](https://playwright.dev)

---

**最后更新**：2024-01-15
