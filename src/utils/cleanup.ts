// @ts-nocheck
import fs from "fs/promises";
import path from "path";
import { logger } from "./logger.js";

// 获取北京时间日期字符串
function getBeijingDateStr(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bj = new Date(utc + 8 * 3600000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${bj.getFullYear()}-${pad(bj.getMonth() + 1)}-${pad(bj.getDate())}`;
}

// 获取昨天的北京时间日期字符串
function getYesterdayBeijingDateStr(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bj = new Date(utc + 8 * 3600000);
  bj.setDate(bj.getDate() - 1);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${bj.getFullYear()}-${pad(bj.getMonth() + 1)}-${pad(bj.getDate())}`;
}

/**
 * 清理昨天及之前的文件
 */
export async function cleanupOldFiles(): Promise<void> {
  try {
    const projectRoot = process.cwd();
    const yesterdayStr = getYesterdayBeijingDateStr();

    // 清理剪贴板图片（clipboard_YYYY-MM-DD*.png）
    const clipboardDir = path.join(projectRoot, "clipboard");
    try {
      const files = await fs.readdir(clipboardDir);
      let deletedCount = 0;
      for (const file of files) {
        // 删除昨天及之前的文件：clipboard_2026-05-29*.png
        if (file.startsWith("clipboard_") && file <= `clipboard_${yesterdayStr}`) {
          await fs.unlink(path.join(clipboardDir, file));
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        logger.info(`清理旧剪贴板图片: ${deletedCount} 个`);
      }
    } catch {}

    // 清理日志文件（mcp-YYYY-MM-DD.log）
    const logsDir = path.join(projectRoot, "logs");
    try {
      const files = await fs.readdir(logsDir);
      let deletedCount = 0;
      for (const file of files) {
        // 删除昨天及之前的日志：mcp-2026-05-29.log
        if (file.startsWith("mcp-") && file.endsWith(".log") && file <= `mcp-${yesterdayStr}.log`) {
          await fs.unlink(path.join(logsDir, file));
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        logger.info(`清理旧日志文件: ${deletedCount} 个`);
      }
    } catch {}
  } catch (e) {
    logger.warn("清理旧文件时出错", e);
  }
}
