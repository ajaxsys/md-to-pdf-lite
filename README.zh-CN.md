# md-to-pdf-lite 🚀

> **超轻量、零 Chromium 捆绑包的现代 Markdown 转 PDF 引擎。深度优化中日韩（CJK）排版美学，原生支持 KaTeX 公式、语法高亮与自动化 CI/CD 流水线。**

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

---

## 💡 为什么选择 md-to-pdf-lite？

市面上现有的 Markdown 转 PDF 方案在特定场景下往往存在一些局限：
- **庞大的内置 Chromium 下载成本**：许多基于 Puppeteer 的传统 CLI 方案通常在安装时需要下载数百 MB 的专用 Chromium，在 Apple Silicon、容器或特定网络环境下容易遇到安装耗时久甚至超时中断；
- **工作流易受限于图形界面**：部分编辑器扩展主要面向单文件手动交互导出，难以灵活集成到命令行脚本、Git 钩子或云端自动化 CI/CD 批量构建流水线中；
- **中日韩（CJK）排版适配成本高**：通用打印样式有时可能出现字体回退不理想、表格分页截断或缺少便捷的强制换页机制。

**`md-to-pdf-lite` 为解决上述痛点而生：**
- ⚡ **零 Chromium 捆绑（秒级极速安装）**：无需额外下载数百 MB 浏览器，纯 JS 依赖数秒即可装完。自动嗅探并复用本机已有的 Google Chrome、Microsoft Edge、Brave 或 Chromium；
- 🎨 **开箱即用的商用级 CJK 排版**：针对苹方（PingFang SC）、微软雅黑、冬青黑体（Hiragino Sans）、Meiryo 等字体深度优化，字距舒展、行高舒适；
- 📄 **原生强制分页语法**：在 Markdown 任意位置插入 `<!-- pagebreak -->` 或 `---pagebreak---` 即可优雅换页；
- 🧮 **离线 KaTeX 数学公式与代码高亮**：完整支持公式排版与现代编程语言高亮，生成过程 100% 离线，安全极速；
- 🤖 **专为自动化与批量设计**：提供极简 CLI（支持多文件和通配符批量导出），并提供完整的 Node.js API 与 GitHub Actions 现成配置。

---

## 📦 安装

### 全局命令行工具 (CLI)
```bash
npm install -g md-to-pdf-lite
```
*(也可以无需全局安装，直接通过 `npx md-to-pdf-lite` 运行)*

### 项目依赖安装
```bash
npm install md-to-pdf-lite
```

---

## 🚀 命令行（CLI）快速上手

### 1. 转换单个文件
```bash
md2pdf-lite document.md
# 默认在当前目录下生成 document.pdf
```

### 2. 指定输出路径或目标目录
```bash
# 输出到具体文件
md2pdf-lite document.md -o output/report.pdf

# 输出到指定目录（保留原文件名）
md2pdf-lite document.md -o ./dist/
```

### 3. 批量转换（多文件或通配符）
```bash
md2pdf-lite 01_报价单.md 02_技术架构.md 03_变更说明.md
```

### 4. 自定义纸张格式与方向
```bash
# 纸张规格: A4, Letter, A3, Legal 等
md2pdf-lite document.md --format Letter

# 横向打印 (Landscape)
md2pdf-lite presentation.md --landscape
```

### 5. 自定义排版样式
```bash
# 使用外部 CSS 文件
md2pdf-lite document.md -s custom.css

# 传入内联 CSS 规则
md2pdf-lite document.md -c "body { font-size: 16px; color: #333; }"
```

### 6. 环境自检
```bash
md2pdf-lite --check-env
```

---

## 💻 Node.js 编程接口 (API)

```javascript
const { convert, convertFile, convertBatch } = require('md-to-pdf-lite');

// 1. 转换本地文件
async function run() {
  const result = await convert({
    input: './proposal.md',
    output: './dist/proposal.pdf',
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  console.log('PDF 已生成于:', result.pdfPath);
}

// 2. 将 Markdown 字符串转为内存 Buffer (适合 Web 服务 / Serverless 场景)
async function generateBuffer() {
  const { buffer } = await convert({
    markdown: '# 账单清单\n\n总金额：**¥5,000**',
    format: 'A4'
  });
  // buffer 是 PDF 的二进制 Buffer
}
```

---

## 📑 常用语法支持

### 强制换页 (Page Break)
在任意需要另起新页的地方加入：
```markdown
# 第一部分内容

<!-- pagebreak -->

# 第二部分内容（将在新的一页顶部开始）
```
*(同时也支持 `---pagebreak---`、`<!-- page-break -->` 或 `<div class="page"/>`)*

### KaTeX 科学公式
- 行内公式：`$E = mc^2$`
- 独立展示块公式：
```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

---

## 🤖 CI / CD 流水线集成 (GitHub Actions)

在 Git 仓库发布 Release 时，全自动批量导出 PDF 并打包上传：

```yaml
name: 生成 PDF 文档
on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: 安装 Chrome 浏览器
        run: |
          sudo apt-get update
          sudo apt-get install -y google-chrome-stable fonts-noto-cjk
      - name: 安装 md-to-pdf-lite
        run: npm install -g md-to-pdf-lite
      - name: 批量转换
        run: md2pdf-lite "docs/*.md" -o dist/
      - uses: actions/upload-artifact@v4
        with:
          name: pdf-documents
          path: dist/*.pdf
```

---

## ⚙️ 参数配置对照表

| 命令行参数 | API 字段 | 默认值 | 作用说明 |
| :--- | :--- | :--- | :--- |
| `-o, --output` | `output` | `[原文件名].pdf` | 输出 PDF 路径或目标文件夹 |
| `-f, --format` | `format` | `'A4'` | 纸张规格 (`A4`, `Letter`, `A3`, `Legal` 等) |
| `-l, --landscape` | `landscape` | `false` | 是否横向打印 |
| `-s, --stylesheet` | `stylesheet` | `undefined` | 自定义外部 CSS 样式表路径 |
| `-c, --css` | `css` | `undefined` | 自定义内联 CSS 字符串 |
| `--chrome` | `executablePath` | *自动嗅探* | 指定 Chrome/Chromium 二进制程序路径 |

---

## 📄 开源许可证

MIT License © 2026 ajaxsys
