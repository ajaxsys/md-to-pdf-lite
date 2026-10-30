# md-to-pdf-lite 🚀

> **超轻量、零 Chromium 捆绑包的现代 Markdown 转 PDF 引擎。深度优化中日韩（CJK）排版美学，原生支持 Mermaid 矢量图表、KaTeX 公式与代码高亮。打通从 AI 大模型输出到客户高品质商业交付的“最后一公里”。**

<p align="center">
  <a href="https://d3gwzeb0uub1l.cloudfront.net/"><img src="https://img.shields.io/badge/⚡_在线体验-Web_工作台-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white" alt="在线体验"></a>
  <a href="#-一键部署至您自有的-aws-云端serverless-私有化"><img src="https://img.shields.io/badge/☁️_一键部署-AWS_Serverless-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="一键部署至 AWS"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="License"></a>
  <a href="#-安全防刷架构pow-工作量证明--私钥通道"><img src="https://img.shields.io/badge/防御-PoW_工作量证明-8b5cf6?style=for-the-badge" alt="PoW 防御"></a>
</p>

<p align="center">
  <a href="README.md"><b>English</b></a> | <a href="README.zh-CN.md"><b>简体中文</b></a> | <a href="README.ja.md"><b>日本語</b></a>
</p>

---

## 🌟 核心背景：打通从 AI 生成到客户交付的“最后一公里”

随着生成式 AI（ChatGPT、Claude、DeepSeek 等大模型）的全面普及，**Markdown 已经事实成为 AI 输出结构化内容的“标准通用语言”**。无论是由 AI 起草的技术规格书、商业提案、需求分析、报价单还是咨询报告，AI 都能在数秒内生成结构完整、条理清晰的 Markdown 文本、专业表格与 Mermaid 架构图。

然而在现实商业与团队协作中，**原始 Markdown 无法直接交付给客户**：
- 🏢 **客户与决策层需要专业交付件**：客户要的不是聊天窗口截图，也不是粗糙的纯文本，而是一份**排版精美、字体规范、具有商务质感且即可打印签署的商业级 PDF 报告**；
- ⏳ **传统排版流程繁琐且脆弱**：手动复制 Markdown 到 Word 或 Pages 重新排版耗时耗力，表格列宽、代码高亮、数学公式与 Mermaid 矢量图极易错乱变形；
- 🔒 **在线工具隐藏数据合规风险**：市面上的许多 SaaS 网页转换工具要求上传整个文档，对于涉及 NDA、企业报价或技术架构的敏感内容存在严重的隐私泄露隐患。

**`md-to-pdf-lite` 正是为打通这“最后一公里”而生：**  
无需配置庞大笨重的环境，运行过程 100% 本地离线隐私安全，秒级将 AI 创作的 Markdown 转化为具备商用印刷品质的 PDF 文件。配合内置的所见即所得编辑器、智能分页胶囊以及经典商务/技术预设，让 AI 生产力瞬间转化为专业客户交付成果。

---

## 💡 为什么选择 md-to-pdf-lite？

市面上现有的 Markdown 转 PDF 方案在特定场景下往往存在一些局限：
- **在线转换工具的数据泄露风险**：市面上的许多 SaaS 网页转换工具要求将整个文档上传至云端服务器，对于商业报价单、技术方案或敏感业务数据存在严重的隐私外泄与合规隐患；
- **庞大的内置 Chromium 下载成本**：许多基于 Puppeteer 的传统 CLI 方案通常在安装时需要下载数百 MB 的专用 Chromium，在 Apple Silicon、容器或特定网络环境下容易遇到安装耗时久甚至超时中断；
- **工作流易受限于图形界面**：部分编辑器扩展主要面向单文件手动交互导出，难以灵活集成到命令行脚本、Git 钩子或云端自动化 CI/CD 批量构建流水线中；
- **中日韩（CJK）排版适配成本高**：通用打印样式有时可能出现字体回退不理想、表格分页截断或缺少便捷的强制换页机制。

**`md-to-pdf-lite` 为解决上述痛点而生：**
- 🔒 **运行时 100% 离线与隐私安全**：安装完成后，所有文档解析、Mermaid 绘图、数学公式与本地图片均在本地浏览器沙盒中离线处理，**运行时无需任何网络通信，零数据外流**，完美适用于企业内网、军工金融与机密文档；
- ⚡ **零 Chromium 捆绑（秒级极速安装）**：无需额外下载数百 MB 浏览器，纯 JS 依赖数秒即可装完。自动嗅探并复用本机已有的 Google Chrome、Microsoft Edge、Brave 或 Chromium；
- 🖱️ **拖拽式智能分页与 1:1 实时动态重算**：彻底终结 Markdown 转 PDF 无法精确定位切分点、表格/代码块被意外腰斩的头号行业痛点。在所见即所得编辑器中直接**自由拖拽分页胶囊条**，系统按真实 96 DPI 盒模型实时切除并向下动态重算可用页面净高，保证浏览器视觉与导出 PDF 达到 100% 像素级对齐；
- 🎨 **开箱即用的商用级 CJK 排版**：针对苹方（PingFang SC）、微软雅黑、冬青黑体（Hiragino Sans）、Meiryo 等字体深度优化，字距舒展、行高舒适；
- 📊 **离线 Mermaid 矢量图表**：支持流程图、时序图、架构图等，离线直接渲染为高清矢量 SVG；
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

### 5. 切换预设主题（GitHub 技术风 / 欧美现代极简 / 日本商务大企业风）
```bash
# 1. 默认: GitHub 技术风格 (全网格边框、Primer 色系，适合技术文档/API 规格书)
md2pdf-lite document.md -t github

# 2. 现代商务极简风格 (欧美偏好的 Booktabs 无竖线三线表、优雅呼吸感，适合报价单/白皮书)
md2pdf-lite proposal.md -t clean

# 3. 日本正式商务风格 (日企大厂/SIer 标杆深绀色表头、左粗侧饰条、冬青黑/游黑体，适合見積書/稟議書/提案書)
md2pdf-lite estimate.md -t corporate-ja
```
👉 *多风格效果对比实测：经典技术风 [`sample-github.pdf`](examples/sample-github.pdf) vs 商务极简三线表 [`sample-clean.pdf`](examples/sample-clean.pdf) vs 日本正式商务风 [`sample-corporate-ja.pdf`](examples/sample-corporate-ja.pdf)*

### 6. 自定义排版样式（支持 AI 提示词定制）
```bash
# 使用外部 CSS 文件
md2pdf-lite document.md -s custom.css

# 传入内联 CSS 规则微调
md2pdf-lite document.md -c "body { font-size: 16px; color: #333; }"
```
> 🎨 **想要让 ChatGPT / Claude 帮您一秒生成公司专属品牌样式？**  
> 请阅读专门的 👉 **[面向 AI 时代的自定义排版指南 (docs/CUSTOMIZATION.zh-CN.md)](docs/CUSTOMIZATION.zh-CN.md)**，内含复制即用的标准 AI Prompt 模板与核心 CSS 字典！

### 7. 环境自检
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

## 🖥️ Web 工作台：拖拽式智能分页与 1:1 精准重算

以往使用 Markdown 排版 PDF 时，最令人抓狂的痛点莫过于：**“完全不知道导出的 PDF 哪一行会跨页，精心配色的代码块或报价表格经常被无情腰斩”**。

`md-to-pdf-lite` 内置了全新的 **TipTap 所见即所得 Web 工作台**，从根源上用直观交互终结这一难题：

- **🖱️ 拖拽式分页胶囊条**：分页符不再是冷冰冰的文本标记，而是实体化的可视化胶囊条（`[ 📄 Page Break · Page 1 End · 改ページ ]`）。点击工具栏按钮可一键插入，更支持直接按住胶囊**上下拖拽**，任意调整分页位置；
- **📐 1:1 物理纸张对齐与实时动态重算**：完美模拟 Chromium 底层 96 DPI 打印几何模型（A4 纸张在上下 15mm 边距下净高 1009.13px）。只要您拖动调整了分页符，排版引擎会以新位置瞬间截断本页，并从新起点为后续内容重新分配完整高度空间（`~50ms` 极速重算），动态刷新全局页码与自然溢出线；
- **⚡ 双层智能指示线**：清晰区分您放置的“手动改页符”与内容自然超出纸张的“自动分页虚线（Auto Break）”，绝不产生冗余重叠或错位切入；
- **📊 所见即所得 Mermaid 矢量编辑**：图表卡片支持一键展开源码编辑，收起即实时渲染为高精矢量 SVG；
- **💻 本地极速开发体验**：一行命令在本地启动完整工作台：
  ```bash
  npm run dev
  # Web 工作台本地运行于 http://localhost:3555/
  ```
  *(内置本地开发中间件，直接调用本机已有的 Chrome 秒级导出真实 PDF，无需联网或配置云端)*

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

### 代码块与显式暗黑卡片 (`:dark`)
为了在 A4 白纸与正式商务报告中保持素雅与省墨，所有主题的代码块默认采用精致浅灰白卡片（`#f8fafc`）。
如果您需要特别强调某段代码或展示终端命令行，可以在代码块语言后追加 `:dark` 或 `dark` 显式启用高级 Slate-900 暗色卡片：

````markdown
<!-- 默认：融入白纸的素雅浅白卡片 -->
```typescript
import { convert } from 'md-to-pdf-lite';
```

<!-- 显式暗黑卡片：酷炫深色背景与霓虹高亮 -->
```typescript:dark
import { convert } from 'md-to-pdf-lite';
```
````
*(同时也支持 ` ```bash dark `)*

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
| `-t, --theme` | `theme` | `'github'` | 内置排版主题 (`github`, `clean`, `corporate-ja`) |
| `-l, --landscape` | `landscape` | `false` | 是否横向打印 |
| `-s, --stylesheet` | `stylesheet` | `undefined` | 自定义外部 CSS 样式表路径 |
| `-c, --css` | `css` | `undefined` | 自定义内联 CSS 字符串 |
| `--title` | `title` | `undefined` | 自定义生成的 PDF 文档标题 |
| `--tagged` | `tagged` | `false` | 生成带辅助功能标签的 PDF |
| `--chrome` | `executablePath` | *自动嗅探* | 指定 Chrome/Chromium 二进制程序路径 |
| `--check-env` | — | — | 诊断本机 Chrome 与中日韩字体环境 |

---

## ☁️ 一键部署至您自有的 AWS 云端（Serverless 私有化）

针对有严格合规与数据安全要求的企业、医疗或金融场景，若**严禁将文档上传至任何第三方云服务**，您只需 2 分钟即可在自有的 AWS 账号下完成整套 Serverless 架构的一键私有化交付：

### 架构优势
- **AWS Lambda**（1536 MB 规格，预置 Chromium + 思源黑体 CJK 全套字体 + 彩色 Emoji）；
- **Amazon CloudFront** + **Amazon S3**（全球 CDN 加速托管三语 Web 工作台）；
- **双通道安全机制**：前端访客走无感 **PoW 工作量证明**（彻底免疫爬虫盲刷），本地 CLI/脚本走 **Private API Key** 极速免校验直通；
- **极低运行成本**：日常使用完全落在 AWS 永久免费额度（Free Tier）内，每月可免费转换高达 17 万次，闲置时 **0 元**。

### 🚀 极速部署指引
```bash
# 1. 克隆本仓库
git clone https://github.com/ajaxsys/md-to-pdf-lite.git
cd md-to-pdf-lite

# 2. 准备环境变量配置
cp .env.example .env
# 在 .env 中配置您的专属 PRIVATE_API_KEY

# 3. 一键自动化部署
./deploy.sh
```
部署脚本将自动构建 Docker 镜像、创建 ECR 仓库、部署 Lambda 函数并分发 CloudFront CDN，完成后直接输出可供团队内部访问的 CDN 专属地址！

---

## 📄 开源许可证

MIT License © 2026 ajaxsys
