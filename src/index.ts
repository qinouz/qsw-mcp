#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main() {
  try {
    logger.info("正在启动 qsw-mcp 服务器...");

    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    logger.info("qsw-mcp 服务器已启动，等待连接...");

    // 处理进程退出
    process.on("SIGINT", async () => {
      logger.info("收到退出信号，正在关闭服务器...");
      await server.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("收到终止信号，正在关闭服务器...");
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error("服务器启动失败", error);
    process.exit(1);
  }
}

main();
