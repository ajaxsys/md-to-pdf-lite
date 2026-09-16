# md-to-pdf-lite 🚀

> **Ultra-lightweight, zero-chromium-bundle Markdown to PDF converter with native CJK typography, KaTeX math, syntax highlighting, and CI/CD automation.**

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

---

## 💡 Why md-to-pdf-lite?

Most existing Markdown-to-PDF tools suffer from common pain points:
- **Heavyweight 300MB+ Chromium downloads**: Tools like the deprecated `md-to-pdf` force a full bundled Chromium download during `npm install`, which frequently hangs or fails on Apple Silicon (M1/M2/M3/M4) and modern Node.js versions.
- **Locked inside IDEs**: VS Code extensions (like `markdown-pdf`) provide great rendering, but cannot be easily automated in command-line batch jobs, Git hooks, or CI/CD pipelines.
- **Poor CJK (Chinese, Japanese, Korean) typography**: Standard print CSS often causes blurry fonts, awkward table breaks, or missing character glyphs.

**`md-to-pdf-lite` solves all of these:**
- ⚡ **Zero-Download Install**: Installs in under 5 seconds (< 1MB npm footprint). Automatically discovers your host Google Chrome, Microsoft Edge, Brave, or Chromium.
- 🎨 **Beautiful Out-of-the-box CJK Typography**: Commercial proposal & GitHub-style theme optimized for PingFang, Hiragino Sans, Meiryo, and system fonts.
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

### 5. Custom styling
```bash
# Custom CSS file
md2pdf-lite document.md -s custom.css

# Inline CSS
md2pdf-lite document.md -c "body { font-size: 16px; color: #333; }"
```

### 6. Check environment
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
