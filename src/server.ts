// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "./utils/logger.js";
import { cleanupOldFiles } from "./utils/cleanup.js";
import { registerReadUrlTool } from "./tools/read-url.js";
import { registerReadImageTool } from "./tools/read-image.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "qsw-mcp",
    version: "1.0.0",
  });

  // 设置 logger
  logger.setServer(server);

  // 清理旧文件（昨天及之前的图片和日志）
  cleanupOldFiles().catch(() => {});

  // 注册所有工具
  registerReadUrlTool(server);
  registerReadImageTool(server);

  logger.info("MCP Server 初始化完成，已注册 3 个工具");

  return server;
}
