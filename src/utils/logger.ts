// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 获取 MCP 服务器所在目录（dist/utils/ -> 上两级到项目根目录）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const MCP_ROOT = path.resolve(__dirname, "../..");

// 日志目录（固定在 MCP 服务器目录下）
const LOG_DIR = path.join(MCP_ROOT, "logs");

// 获取北京时间
function getBeijingTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 8 * 3600000); // UTC+8
}

// 获取北京时间字符串
function getBeijingTimeStr(): string {
  const d = getBeijingTime();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// 获取当天日志文件路径（北京时间）
function getLogFilePath(): string {
  const d = getBeijingTime();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return path.join(LOG_DIR, `mcp-${date}.log`);
}

// 确保日志目录存在
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {}

class Logger {
  private server: McpServer | null = null;
  private level: LogLevel = LogLevel.INFO;

  setServer(server: McpServer) {
    this.server = server;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private writeToFile(logMessage: string) {
    try {
      fs.appendFileSync(getLogFilePath(), logMessage + "\n");
    } catch {}
  }

  private async log(level: LogLevel, message: string, data?: any) {
    if (level < this.level) return;

    const timestamp = getBeijingTimeStr();
    const levelStr = LogLevel[level];
    const dataStr = data ? " " + JSON.stringify(data) : "";
    const logMessage = `[${timestamp}] [${levelStr}] ${message}${dataStr}`;

    // 写入日志文件
    this.writeToFile(logMessage);

    // 如果有 server，发送日志通知
    if (this.server) {
      try {
        await this.server.server.sendLoggingMessage({
          level: levelStr.toLowerCase(),
          logger: "qsw-mcp",
          data: logMessage,
        });
      } catch {
        // 忽略通知错误
      }
    }
  }

  async debug(message: string, data?: any) {
    await this.log(LogLevel.DEBUG, message, data);
  }

  async info(message: string, data?: any) {
    await this.log(LogLevel.INFO, message, data);
  }

  async warn(message: string, data?: any) {
    await this.log(LogLevel.WARN, message, data);
  }

  async error(message: string, data?: any) {
    await this.log(LogLevel.ERROR, message, data);
  }

  getLogPath(): string {
    return getLogFilePath();
  }

  getLogDir(): string {
    return LOG_DIR;
  }
}

export const logger = new Logger();
