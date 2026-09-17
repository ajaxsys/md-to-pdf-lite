# md-to-pdf-lite 🚀

> **Ultra-lightweight, zero-chromium-bundle Markdown to PDF engine. Optimized for CJK typography, with native support for offline Mermaid vector diagrams, KaTeX formulas, syntax highlighting, and CI/CD pipelines.**

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

---

## 💡 Why md-to-pdf-lite?

Existing Markdown-to-PDF solutions often come with practical trade-offs:
- **Heavyweight 300MB+ Chromium downloads**: Many Puppeteer-based CLI tools force a full bundled Chromium download during installation, which frequently hangs or fails in restricted networks, container environments, or Apple Silicon architectures.
- **GUI-bound workflows**: Many popular editor extensions require manual exports from a GUI window, making them difficult to automate in command-line scripts, Git hooks, or CI/CD pipelines.
- **Suboptimal CJK (Chinese, Japanese, Korean) typography**: Generic print stylesheets often suffer from awkward font fallbacks, truncated table pagination, and lack of intuitive page-break controls.

**`md-to-pdf-lite` solves all of these:**
- ⚡ **Zero-Chromium Bundle (Lightning Fast)**: No 300MB+ browser downloads; lightweight JS dependencies install in seconds. Automatically discovers your host Google Chrome, Microsoft Edge, Brave, or Chromium.
- 🎨 **Beautiful Out-of-the-box CJK Typography**: Commercial proposal & GitHub-style theme optimized for PingFang, Hiragino Sans, Meiryo, and system fonts.
- 📊 **Offline Mermaid Vector Diagrams**: Flowcharts, sequence diagrams, and architecture graphs render directly to crisp vector SVGs without external network calls.
- 📄 **Intuitive Page Breaks**: Cleanly split pages using `<!-- pagebreak -->` or `---pagebreak---`.
- 🧮 **KaTeX Math & Syntax Highlighting**: Math formulas and code blocks render smoothly without external network requests.
- 🤖 **Built for Automation**: Native CLI support for single or batch globs (`md2pdf-lite "docs/*.md"`), plus programmatic Node.js API and GitHub Actions workflow.

---

## 📦 Installation

### Global CLI
```bash
npm install -g md-to-pdf-lite
```
*(Or run instantly without installation using `npx md-to-pdf-lite`)*

### Local Project Dependency
```bash
npm install md-to-pdf-lite
```

---

## 🚀 CLI Usage

### 1. Convert a single file
```bash
md2pdf-lite document.md
# Output: document.pdf
```

### 2. Specify output file or destination directory
```bash
# Output to a specific PDF path
md2pdf-lite document.md -o output/report.pdf

# Output to a folder (keeps original basename)
md2pdf-lite document.md -o ./dist/
```

### 3. Batch conversion (multiple files or glob)
```bash
md2pdf-lite 01_intro.md 02_architecture.md 03_pricing.md
```

### 4. Custom paper format & orientation
```bash
# A4, Letter, A3, Legal, etc.
md2pdf-lite document.md --format Letter

# Landscape printing
md2pdf-lite presentation.md --landscape
```

### 5. Switch Built-in Themes (GitHub / Clean Booktabs / Corporate Japan)
```bash
# 1. Default: GitHub Technical Style (Full-grid borders, official Primer palette, ideal for dev docs)
md2pdf-lite document.md -t github

# 2. Modern Clean Style: Borderless Booktabs table, breathable whitespace, ideal for proposals & invoices
md2pdf-lite proposal.md -t clean

# 3. Corporate Japan Style: Classic Navy headers, accent bar headings, Hiragino/YuGothic typography, ideal for Japanese estimates & formal proposals
md2pdf-lite estimate.md -t corporate-ja
```
👉 *Preview comparison: GitHub Grid [`sample-github.pdf`](examples/sample-github.pdf) vs Clean Booktabs [`sample-clean.pdf`](examples/sample-clean.pdf) vs Corporate Japan [`sample-corporate-ja.pdf`](examples/sample-corporate-ja.pdf)*

### 6. Custom styling (AI-Assisted Theming)
```bash
# Custom CSS file
md2pdf-lite document.md -s custom.css

# Inline CSS rules
md2pdf-lite document.md -c "body { font-size: 16px; color: #333; }"
```
> 🎨 **Want AI (ChatGPT / Claude / Cursor) to generate custom themes for your brand?**  
> Read our dedicated 👉 **[AI-Oriented Theming Guide (CUSTOMIZATION.md)](CUSTOMIZATION.md)** featuring ready-to-use prompts, recipes, and CSS selector specifications!

### 7. Check environment
```bash
md2pdf-lite --check-env
```

---

## 💻 Programmatic Node.js API

```javascript
const { convert, convertFile, convertBatch } = require('md-to-pdf-lite');

// 1. Convert from a file
async function run() {
  const result = await convert({
    input: './proposal.md',
    output: './dist/proposal.pdf',
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  console.log('Generated PDF:', result.pdfPath);
}

// 2. Convert raw Markdown string to buffer (useful in serverless / web services)
async function generateBuffer() {
  const { buffer } = await convert({
    markdown: '# Invoice\n\nTotal: **$500**',
    format: 'A4'
  });
  // buffer is a Buffer containing the PDF binary
}
```

---

## 📑 Syntax Highlights

### Page Breaks
Insert a clean page break anywhere in your document:
```markdown
# Section 1

<!-- pagebreak -->

# Section 2 (starts on a new page)
```
*(Also supports `---pagebreak---`, `<!-- page-break -->`, and `<div class="page"/>`)*

### Mathematical Formulas (KaTeX)
- Inline equation: `$E = mc^2$`
- Display block equation:
```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

---

## 🤖 CI / CD Integration (GitHub Actions)

Automatically build and attach PDFs when a release is published:

```yaml
name: Generate PDFs
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
      - name: Install Chrome
        run: |
          sudo apt-get update
          sudo apt-get install -y google-chrome-stable fonts-noto-cjk
      - name: Install md-to-pdf-lite
        run: npm install -g md-to-pdf-lite
      - name: Convert
        run: md2pdf-lite "docs/*.md" -o dist/
      - uses: actions/upload-artifact@v4
        with:
          name: pdf-documents
          path: dist/*.pdf
```

---

## ⚙️ Options Reference

| CLI Flag | API Property | Default | Description |
| :--- | :--- | :--- | :--- |
| `-o, --output` | `output` | `[name].pdf` | Output PDF file path or target directory |
| `-f, --format` | `format` | `'A4'` | Paper format (`A4`, `Letter`, `A3`, `Legal`, etc.) |
| `-l, --landscape` | `landscape` | `false` | Enable landscape orientation |
| `-s, --stylesheet` | `stylesheet` | `undefined` | Path to custom external CSS file |
| `-c, --css` | `css` | `undefined` | Custom inline CSS string |
| `--chrome` | `executablePath` | *Auto-detected* | Custom Chrome/Chromium executable path |

---

## 📄 License

MIT License © 2026 ajaxsys
