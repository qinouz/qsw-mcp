// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { logger } from "../utils/logger.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export function registerReadUrlTool(server: McpServer) {
  // 工具 1：普通模式（无登录状态）
  server.tool(
    "read_url",
    "读取网页内容，返回标题、纯文本和 Markdown 格式（无登录状态）",
    {
      url: z.string().url().describe("要读取的网页 URL"),
    },
    async ({ url }) => {
      try {
        logger.info(`开始读取网页: ${url}`);

        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          },
          responseType: "text",
        });

        const html = response.data;
        const $ = cheerio.load(html);
        $("script, style, nav, footer, header, iframe, noscript").remove();

        const title = $("title").text().trim() || $("h1").first().text().trim() || "无标题";
        const content = $("body").text().replace(/\s+/g, " ").trim();
        const markdown = turndownService.turndown(html);

        logger.info(`网页读取成功: ${title}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    title,
                    content: content.substring(0, 50000),
                    markdown: markdown.substring(0, 50000),
                    url,
                    length: content.length,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`网页读取失败: ${url}`, error.message);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message || "读取网页失败",
                  url,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 工具 2：浏览器模式（支持登录状态）
  server.tool(
    "read_url_browser",
    "使用浏览器读取网页（支持登录状态、Cookie、SPA 页面）",
    {
      url: z.string().url().describe("要读取的网页 URL"),
      waitFor: z
        .number()
        .min(0)
        .max(10000)
        .default(2000)
        .describe("等待页面加载的时间（毫秒），默认 2000ms"),
      useExisting: z
        .boolean()
        .default(false)
        .describe("是否连接已打开的 Chrome（需要 Chrome 调试模式），默认使用新浏览器"),
    },
    async ({ url, waitFor, useExisting }) => {
      let browser;
      try {
        logger.info(`使用浏览器读取网页: ${url}`);

        // 动态导入 playwright（避免启动时报错）
        const { chromium } = await import("playwright");

        if (useExisting) {
          // 连接到已打开的 Chrome 浏览器
          browser = await chromium.connectOverCDP("http://localhost:9222");
          logger.info("已连接到 Chrome 浏览器");
        } else {
          // 启动新的浏览器实例
          browser = await chromium.launch({
            headless: true,  // 无头模式
          });
          logger.info("已启动新浏览器实例");
        }

        let context;
        if (useExisting) {
          context = browser.contexts()[0];
        } else {
          context = await browser.newContext();
        }
        const page = await context.newPage();

        // 导航到目标 URL
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        // 等待页面加载（SPA 页面需要额外等待）
        if (waitFor > 0) {
          await page.waitForTimeout(waitFor);
        }

        // 获取页面内容
        const title = await page.title();
        const content = await page.evaluate(() => {
          // 移除不需要的元素
          const selectors = "script, style, nav, noscript";
          document.querySelectorAll(selectors).forEach((el) => el.remove());
          return document.body.innerText.replace(/\s+/g, " ").trim();
        });

        // 获取完整 HTML 并转换为 Markdown
        const html = await page.content();
        const markdown = turndownService.turndown(html);

        // 获取当前页面 URL（可能有重定向）
        const finalUrl = page.url();

        await page.close();

        logger.info(`浏览器读取成功: ${title}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    title,
                    content: content.substring(0, 50000),
                    markdown: markdown.substring(0, 50000),
                    url: finalUrl,
                    originalUrl: url,
                    length: content.length,
                    mode: "browser",
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`浏览器读取失败: ${url}`, error.message);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message || "浏览器读取失败",
                  url,
                  hint: '请确保 Chrome 以调试模式启动: chrome.exe --remote-debugging-port=9222',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }
  );

  logger.info("已注册工具: read_url, read_url_browser");
}
