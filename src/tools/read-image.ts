// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { logger } from "../utils/logger.js";

export function registerReadImageTool(server: McpServer) {
  server.tool(
    "read_clipboard_image",
    "从系统剪贴板读取图片并识别文字（OCR），支持中英文等多种语言",
    {
      language: z
        .enum(["chi_sim", "chi_tra", "eng", "jpn", "kor", "chi_sim+eng", "chi_tra+eng"])
        .default("chi_sim+eng")
        .describe("识别语言：chi_sim=简体中文, chi_tra=繁体中文, eng=英文, jpn=日文, kor=韩文"),
      preprocess: z
        .boolean()
        .default(true)
        .describe("是否预处理图片（提高识别准确率，默认开启）"),
    },
    async ({ language, preprocess }) => {
      let worker = null;

      try {
        logger.info("从剪贴板读取图片");

        // 保存到项目 clipboard 目录
        const clipboardDir = path.join(process.cwd(), "clipboard");
        await fs.mkdir(clipboardDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const tempPath = path.join(clipboardDir, `clipboard_${timestamp}.png`);

        let result = "";

        // 根据平台选择不同的剪贴板读取方式
        if (process.platform === "win32") {
          // Windows: PowerShell
          const psScriptPath = path.join(clipboardDir, "save_clipboard.ps1");
          const psPath = tempPath.replace(/\\/g, "/");
          const psScript = [
            "Add-Type -AssemblyName System.Windows.Forms",
            "Add-Type -AssemblyName System.Drawing",
            "if ([System.Windows.Forms.Clipboard]::ContainsImage()) {",
            "  $img = [System.Windows.Forms.Clipboard]::GetImage()",
            `  $img.Save('${psPath}', [System.Drawing.Imaging.ImageFormat]::Png)`,
            '  Write-Output "success"',
            "} else {",
            '  Write-Output "no_image"',
            "}",
          ].join("\n");
          await fs.writeFile(psScriptPath, psScript);
          result = execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`, {
            encoding: "utf-8",
            timeout: 10000,
          }).trim();
          try { await fs.unlink(psScriptPath); } catch (e) {}

        } else if (process.platform === "darwin") {
          // macOS: pngpaste（需 brew install pngpaste）或 osascript
          try {
            result = execSync(`pngpaste "${tempPath}" 2>/dev/null && echo "success" || echo "no_image"`, {
              encoding: "utf-8",
              timeout: 10000,
            }).trim();
          } catch (e) {
            // 备用方案：osascript
            const script = `
              try
                set theFile to POSIX file "${tempPath}"
                tell application "System Events" to ¬
                  set theImage to the clipboard as «class PNGf»
                open for access theFile with write permission
                write theImage to theFile
                close access theFile
                return "success"
              on error
                return "no_image"
              end try
            `;
            result = execSync(`osascript -e '${script}'`, {
              encoding: "utf-8",
              timeout: 10000,
            }).trim();
          }

        } else {
          // Linux: xclip
          result = execSync(
            `xclip -selection clipboard -t image/png -o > "${tempPath}" 2>/dev/null && echo "success" || echo "no_image"`,
            { encoding: "utf-8", timeout: 10000 }
          ).trim();
        }

        if (result === "no_image") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: "剪贴板中没有图片",
                    hint: "请先复制图片（Ctrl+C），然后再调用此工具",
                    steps: [
                      "1. 右键图片 → 复制图片",
                      "2. 或使用 Win+Shift+S 截图",
                      "3. 然后调用此工具",
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // 读取保存的图片
        let imageBuffer = await fs.readFile(tempPath);

        // 预处理
        let preprocessInfo = "";
        if (preprocess) {
          try {
            imageBuffer = await sharp(imageBuffer)
              .grayscale()
              .normalize()
              .sharpen()
              .toBuffer();
            preprocessInfo = "已预处理（灰度、对比度标准化、锐化）";
          } catch (preprocessError) {
            preprocessInfo = "预处理失败，使用原图";
          }
        }

        // OCR 识别
        worker = await createWorker(language);
        const { data } = await worker.recognize(imageBuffer);

        const text = data.text.trim();
        const confidence = data.confidence;
        const words = data.words?.length || 0;
        const lines = data.lines?.length || 0;

        const blocks = data.blocks?.map((block) => ({
          text: block.text.trim(),
          confidence: block.confidence,
          bbox: block.bbox,
        })) || [];

        logger.info(`剪贴板图片识别完成: ${text.length} 个字符, 置信度: ${confidence}%`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    text,
                    confidence,
                    statistics: {
                      characters: text.length,
                      words,
                      lines,
                      blocks: blocks.length,
                    },
                    language,
                    preprocess: preprocessInfo,
                    blocks: blocks.slice(0, 50),
                    source: "clipboard",
                    savedPath: tempPath,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        logger.error("剪贴板图片识别失败", error.message);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message || "剪贴板图片识别失败",
                  hint: "请确保已复制图片，并且 MCP Server 有权限访问剪贴板",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      } finally {
        if (worker) {
          await worker.terminate();
        }
      }
    }
  );

  logger.info("已注册工具: read_clipboard_image");
}
