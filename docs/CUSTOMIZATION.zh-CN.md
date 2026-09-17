# 🎨 Customization & Theming Guide (面向 AI 时代的自定义排版指南)

[English](CUSTOMIZATION.md) | [简体中文](CUSTOMIZATION.zh-CN.md) | [日本語](CUSTOMIZATION.ja.md)

---

`md-to-pdf-lite` 不仅提供开箱即用的商用级排版，更支持**高度自由的视觉定制**。

在 AI 大模型时代，您**无需手动手写冗长的 CSS**。本指南专门为 **人类开发者与 AI（ChatGPT / Claude / Gemini / Cursor）协同** 而设计：只需将本文档中的 **[AI 专用提示词](#2-ai-专用提示词模板复制即用)** 复制给 AI，AI 即可为您一秒生成 100% 兼容的定制主题！

---

## 📑 目录
1. [内置主题与样例预览 (Presets & Previews)](#1-内置主题与样例预览-presets--previews)
2. [AI 专用提示词模板（复制即用）](#2-ai-专用提示词模板复制即用)
3. [样式字典与核心 CSS 选择器规范](#3-样式字典与核心-css-选择器规范)
4. [精选经典配方 (Ready-to-Use Recipes)](#4-精选经典配方-ready-to-use-recipes)
   - [配方 1：欧美现代三线表商务风 (Clean Booktabs)](#配方-1欧美现代三线表商务风-clean-booktabs)
   - [配方 2：极客暗黑风 (Modern Dark Mode)](#配方-2极客暗黑风-modern-dark-mode)
   - [配方 3：严谨学术与出版物风 (Academic Paper)](#配方-3严谨学术与出版物风-academic-paper)
5. [如何应用自定义样式 (CLI & Node.js API)](#5-如何应用自定义样式-cli--nodejs-api)

---

## 1. 内置主题与样例预览 (Presets & Previews)

工具箱内置了三种经过专业调优的基础预设，可通过 `--theme <name>` 直接启用：

| 主题名称 | 风格特征 | 适用场景 | 对应预览文件 |
| :--- | :--- | :--- | :--- |
| **`github`** (默认) | 经典技术社区风格、完整全网格边框、灰色代码背景 | 技术文档、API 手册、代码归档 | [`sample-github.pdf`](../examples/sample-github.pdf) |
| **`clean`** | **现代商务极简、三线表设计（去除所有竖线）**、呼吸感留白 | 商业报价单、项目提案、对外白皮书 | [`sample-clean.pdf`](../examples/sample-clean.pdf) |
| **`corporate-ja`** | **日本正规企业商务风、深绀色表头（濃紺 #1b365d）、左侧饰条见出、冬青黑/游黑体优化** | 見積書、稟議書、自治体/大企业提案、仕様書 | [`sample-corporate-ja.pdf`](../examples/sample-corporate-ja.pdf) |

### 切换内置主题命令：
```bash
# 使用极简商务风（无竖线三线表）
md2pdf-lite document.md --theme clean -o proposal.pdf

# 使用经典 GitHub 技术风格
md2pdf-lite document.md --theme github -o manual.pdf
```

---

## 2. 🤖 AI 专用提示词模板（复制即用）

> **💡 使用方法**：直接复制下方框内的 Prompt 发送给 ChatGPT、Claude、Gemini 或 Cursor，并在末尾填入您的个性化要求（如“*我需要一家咨询公司的现代深蓝商务风格*”或“*帮我改成适合打印的单色学术论文风*”）。

````text
你是一位精通 CSS Print 排版的美术设计专家。请为基于 Chrome 无头打印引擎的 Markdown 转 PDF 工具 `md-to-pdf-lite` 编写一份定制的 `custom.css`。

### 运行时上下文与 HTML 结构约束：
1. 页面由标准的 HTML5 和 Google Chrome 的 Print to PDF 引擎渲染；
2. 页面中可能包含普通文本、H1-H6 标题、表格（table）、引用块（blockquote）、代码块（pre/code）、KaTeX 数学公式（.katex/.katex-display）以及 Mermaid 矢量架构图（.mermaid）；
3. 必须针对打印场景优化：避免不必要的阴影（box-shadow 在打印机中容易失真），针对分页必须遵守 `page-break-inside: avoid`；
4. 针对表格排版：除非用户特别要求，优先采用现代高质感的“三线表 / Booktabs”设计（移除所有单元格竖线 border-left/right: none，使用细横线和适度 padding 营造呼吸感）；
5. 字体栈必须优先支持中日韩（PingFang SC, Hiragino Sans, Microsoft YaHei, Meiryo）和西文（-apple-system, Segoe UI）。

### 我的具体定制需求：
- 目标用途：[例如：科技公司商务提案 / 极客暗色代码集 / 医院科研报告]
- 品牌主色调：[例如：深海蓝 #0d47a1 / 极简黑白 / 森林绿 #1b5e20]
- 特殊偏好：[例如：标题下加细线 / 表格采用浅蓝交替背景 / 代码块带圆角边框]

请直接输出高质量、带清晰注释且结构规范的 CSS 代码块，不要有多余的废话。
````

---

## 3. 样式字典与核心 CSS 选择器规范

如果您或 AI 需要对特定组件进行精准微调，以下是引擎内标准组件的选择器参考字典：

| 目标元素 | CSS 选择器 | 说明与排版建议 |
| :--- | :--- | :--- |
| **全局页面** | `body` | 控制全局字号（建议 14~16px）、行高（建议 1.6~1.8）、全局字体栈与背景 |
| **主副标题** | `h1, h2, h3, h4` | 自动配置了 `page-break-after: avoid`，可安全添加底边线 `border-bottom` |
| **数据表格** | `table` | 容器已配置 `page-break-inside: avoid`；设置 `border-collapse: collapse` |
| **表头** | `table th` | 建议加粗、微调背景色与下底线 `border-bottom: 2px solid ...` |
| **数据单元格** | `table td` | 若需要欧美极简风，设置 `border-left: none; border-right: none;` |
| **交替行底色** | `table tbody tr:nth-child(even)` | 可指定微弱底色（如 `#f8fafc`）增强长数据表的可读性 |
| **引用区块** | `blockquote` | 常用设计：左侧加色条 `border-left: 4px solid var(--primary)` |
| **行内代码** | `code` | 行内等宽标签，背景通常设为 `rgba(...)` 或轻灰色 |
| **代码高亮块** | `pre`, `pre code`, `.hljs` | 语法高亮外层容器，可定制内边距、圆角与背景颜色 |
| **KaTeX 数学公式** | `.katex`, `.katex-display` | 公式容器，已针对打印缩放优化，不建议强行缩小字号 |
| **Mermaid 矢量图** | `.mermaid`, `.mermaid svg` | 架构流程图容器，默认居中对齐，支持 `svg { max-width: 100%; }` |
| **强制换页符** | `.page-break` | 在 Markdown 中写 `<!-- pagebreak -->` 转换出的空标签，用于硬分页 |

---

## 4. 精选经典配方 (Ready-to-Use Recipes)

### 配方 1：欧美现代三线表商务风 (Clean Booktabs)
> **特色**：彻底消除表格中令人窒息的竖线，表头与表底加粗，适合商业合同、报价与对外方案。

```css
/* 现代三线表与优雅商务排版 */
body {
  font-size: 15px;
  line-height: 1.75;
  color: #2c3e50;
}

h1, h2, h3 {
  color: #1a365d;
}

h1 {
  border-bottom: 2px solid #3182ce;
  padding-bottom: 6px;
}

/* 经典三线表 (Booktabs) */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border-top: 2.5px solid #2d3748;
  border-bottom: 2.5px solid #2d3748;
}

table th {
  padding: 12px 14px;
  background-color: transparent;
  color: #1a202c;
  font-weight: 700;
  border-top: none;
  border-bottom: 1.5px solid #4a5568;
  border-left: none;
  border-right: none;
}

table td {
  padding: 12px 14px;
  border-top: none;
  border-bottom: 1px solid #e2e8f0;
  border-left: none;
  border-right: none;
}

table tbody tr:last-child td {
  border-bottom: none;
}

blockquote {
  border-left: 4px solid #3182ce;
  background-color: #ebf8ff;
  color: #2b6cb0;
  border-radius: 0 4px 4px 0;
}
```

---

### 配方 2：极客暗黑风 (Modern Dark Mode)
> **特色**：适用于投影演示或深色主题爱好者的高对比度极客排版。

```css
/* 深色高对比主题 */
html, body {
  background-color: #0d1117 !important;
  color: #c9d1d9;
}

h1, h2, h3, h4, h5, h6 {
  color: #58a6ff;
  border-bottom-color: #21262d;
}

a {
  color: #58a6ff;
}

table th {
  background-color: #161b22;
  color: #f0f6fc;
  border-color: #30363d;
}

table td {
  border-color: #30363d;
}

table tr:nth-child(2n) {
  background-color: #161b22;
}

pre, code {
  background-color: #161b22;
  border-color: #30363d;
  color: #79c0ff;
}

blockquote {
  border-left-color: #388bfd;
  color: #8b949e;
  background-color: rgba(56, 139, 253, 0.1);
}
```

---

### 配方 3：严谨学术与出版物风 (Academic Paper)
> **特色**：适合论文复刻、研究报告或正式技术白皮书。

```css
/* 学术论文风格 */
body {
  font-family: "Times New Roman", "Songti SC", "SimSun", serif;
  font-size: 14px;
  line-height: 1.8;
  color: #111;
  text-align: justify;
}

h1, h2, h3 {
  font-family: -apple-system, "PingFang SC", "Heiti SC", sans-serif;
  color: #000;
  text-align: center;
}

h1 {
  font-size: 1.8em;
  border: none;
}

p {
  text-indent: 2em; /* 首行缩进 */
}

/* 学术三线表 */
table {
  width: 90%;
  margin: 20px auto;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
}

table th {
  border-bottom: 1px solid #000;
  text-align: center;
  border-left: none;
  border-right: none;
}

table td {
  border: none;
  padding: 8px 12px;
  text-align: center;
}
```

---

## 5. 如何应用自定义样式 (CLI & Node.js API)

### 方式 A：通过外部 CSS 文件覆盖（推荐）
将 AI 生成的样式保存为 `my-theme.css`，在转换时指定 `-s / --stylesheet`：

```bash
md2pdf-lite proposal.md -s my-theme.css -o dist/proposal.pdf
```

### 方式 B：通过内联 CSS 参数微调
无需创建文件，直接在终端里快速改个字号或配色：

```bash
md2pdf-lite report.md -c "body { font-size: 16px; } h1 { color: #e65100; }"
```

### 方式 C：结合内置主题与自定义微调
可以同时指定 `--theme clean` 获得优雅的三线表结构，再叠加外部 CSS 改换品牌色：

```bash
md2pdf-lite invoice.md --theme clean -c "h1 { color: #2e7d32; }"
```

### 方式 D：在 Node.js 代码中调用
```javascript
const { convert } = require('md-to-pdf-lite');

await convert({
  input: './document.md',
  output: './dist/document.pdf',
  theme: 'corporate-ja',      // 内置主题: 'github' | 'clean' | 'corporate-ja'
  stylesheet: './my-theme.css',// 外部 CSS 路径
  css: 'h1 { color: #0288d1; }'// 内联 CSS 覆盖
});
```
