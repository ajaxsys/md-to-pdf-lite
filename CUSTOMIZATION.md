# 🎨 Customization & Theming Guide (AI-Oriented PDF Styling)

[English](CUSTOMIZATION.md) | [简体中文](CUSTOMIZATION.zh-CN.md) | [日本語](CUSTOMIZATION.ja.md)

---

`md-to-pdf-lite` provides commercial-grade typography out of the box, with **full freedom for visual styling and branding**.

In the AI era, you **no longer need to manually write hundreds of lines of CSS**. This guide is crafted specifically for **developer-AI pair programming (ChatGPT / Claude / Gemini / Cursor)**: simply copy our **[AI Prompt Template](#2--ready-to-use-ai-prompt-template)** to your AI assistant, and let it generate 100% compatible custom stylesheets in seconds!

---

## 📑 Table of Contents
1. [Built-in Themes & Sample Previews](#1-built-in-themes--sample-previews)
2. [Ready-to-Use AI Prompt Template](#2--ready-to-use-ai-prompt-template)
3. [CSS Selector Reference & Class Specifications](#3-css-selector-reference--class-specifications)
4. [Ready-to-Use Recipes](#4-ready-to-use-recipes)
   - [Recipe 1: Modern Borderless Business Table (Clean Booktabs)](#recipe-1-modern-borderless-business-table-clean-booktabs)
   - [Recipe 2: Modern Dark Mode](#recipe-2-modern-dark-mode)
   - [Recipe 3: Formal Academic Paper](#recipe-3-formal-academic-paper)
5. [How to Apply Custom Styles (CLI & Node.js API)](#5-how-to-apply-custom-styles-cli--nodejs-api)

---

## 1. Built-in Themes & Sample Previews

Two professionally tuned themes are built directly into `md-to-pdf-lite`:

| Theme | Key Visual Characteristics | Best Used For | Sample Preview PDF |
| :--- | :--- | :--- | :--- |
| **`github`** (default) | Classic technical developer style, full-grid borders, light-gray code background | Technical docs, API references, code archives | [`examples/sample-github.pdf`](examples/sample-github.pdf) |
| **`clean`** | **Modern minimalist, borderless Booktabs table (no vertical lines)**, generous whitespace | Commercial proposals, invoices, executive whitepapers | [`examples/sample-clean.pdf`](examples/sample-clean.pdf) |

### Switching Built-in Themes:
```bash
# Clean business theme (borderless table, breathable layout)
md2pdf-lite document.md --theme clean -o proposal.pdf

# Classic GitHub developer theme
md2pdf-lite document.md --theme github -o manual.pdf
```

---

## 2. 🤖 Ready-to-Use AI Prompt Template

> **💡 How to use**: Copy the prompt below and paste it into ChatGPT, Claude, Gemini, or Cursor. Fill in your requirements at the bottom (e.g., "*I need a fintech corporate look with navy accents*" or "*Design an ink-friendly monochrome academic theme*").

````text
You are a CSS Print Typography expert. Write a customized `custom.css` stylesheet for `md-to-pdf-lite`, a Markdown-to-PDF engine running on Google Chrome's headless print-to-pdf pipeline.

### Runtime Context & HTML Structure Constraints:
1. The document is rendered with standard HTML5 and Chrome Print to PDF;
2. Content includes standard text, H1-H6 headings, tables (table), blockquotes, code blocks (pre/code), KaTeX math formulas (.katex/.katex-display), and vector Mermaid diagrams (.mermaid);
3. Must be print-optimized: avoid heavy box-shadows (they rasterize poorly on print), and respect `page-break-inside: avoid` on tables, pre, and diagrams;
4. Table styling rule: Unless explicitly asked otherwise, favor modern "Booktabs" style tables (remove all vertical borders via `border-left/right: none`, using subtle horizontal rules and generous padding for breathing space);
5. Typography font stack must smoothly support Western typography (-apple-system, BlinkMacSystemFont, "Segoe UI") as well as CJK glyphs (PingFang SC, Hiragino Sans, Microsoft YaHei, Meiryo).

### My Specific Customization Needs:
- Target Purpose: [e.g. Enterprise SaaS proposal / Cyberpunk dark mode / Medical research report]
- Primary Brand Color: [e.g. Deep Navy #0d47a1 / Monochrome Minimal / Forest Green #1b5e20]
- Visual Details: [e.g. Thin accent underline beneath H1 / Subtle alternating rows in tables / Rounded code blocks]

Output only the clean, well-commented, production-ready CSS code block without unnecessary conversational filler.
````

---

## 3. CSS Selector Reference & Class Specifications

When you or your AI assistant need to target specific components, use this selector cheat sheet:

| Element | CSS Selector | Description & Print Recommendations |
| :--- | :--- | :--- |
| **Root Document** | `body` | Global font size (14~16px), line-height (1.6~1.8), font stack, and page background |
| **Headings** | `h1, h2, h3, h4` | Configured with `page-break-after: avoid`; safe to add accent `border-bottom` |
| **Data Tables** | `table` | Configured with `page-break-inside: avoid`; use `border-collapse: collapse` |
| **Table Headers** | `table th` | Bold font weight, subtle background tint, and `border-bottom: 1.5px solid ...` |
| **Table Cells** | `table td` | For borderless booktabs tables, set `border-left: none; border-right: none;` |
| **Alternating Rows**| `table tbody tr:nth-child(even)` | Add subtle background (e.g. `#f8fafc`) for readability in large data tables |
| **Blockquotes** | `blockquote` | Popular pattern: accent left bar via `border-left: 4px solid var(--primary)` |
| **Inline Code** | `code` | Monospace badge, typically styled with light background and slight padding |
| **Code Blocks** | `pre`, `pre code`, `.hljs` | Syntax highlighted container; customize padding, radius, and background |
| **KaTeX Math** | `.katex`, `.katex-display` | Math equation wrapper; print-scaled, avoid manual downscaling |
| **Mermaid Charts**| `.mermaid`, `.mermaid svg` | Vector diagram wrapper; centered by default, styled with `max-width: 100%` |
| **Page Break** | `.page-break` | Generated by `<!-- pagebreak -->` or `---pagebreak---` for manual hard breaks |

---

## 4. Ready-to-Use Recipes

### Recipe 1: Modern Borderless Business Table (Clean Booktabs)
> **Best for**: Invoices, corporate proposals, and consulting reports.

```css
/* Modern Booktabs & Corporate Proposal Styling */
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

/* Classic Booktabs Table (Zero vertical lines) */
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

### Recipe 2: Modern Dark Mode
> **Best for**: Slide handouts, developer pitch decks, and night-themed documents.

```css
/* High-Contrast Dark Mode */
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

### Recipe 3: Formal Academic Paper
> **Best for**: Technical whitepapers, research reproductions, and thesis preprints.

```css
/* Formal Academic / Preprint Paper Styling */
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
  text-indent: 2em; /* First-line indentation */
}

/* Academic Three-Line Table */
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

## 5. How to Apply Custom Styles (CLI & Node.js API)

### Approach A: Using an External CSS File (Recommended)
Save your AI-generated stylesheet as `my-theme.css` and pass it via `-s / --stylesheet`:

```bash
md2pdf-lite proposal.md -s my-theme.css -o dist/proposal.pdf
```

### Approach B: Quick Inline CSS Snippet
Fine-tune typography or colors directly from the terminal without creating extra files:

```bash
md2pdf-lite report.md -c "body { font-size: 16px; } h1 { color: #e65100; }"
```

### Approach C: Combine Built-in Themes with Custom Tweaks
Pick the `clean` theme for borderless tables, then layer your company brand color on top:

```bash
md2pdf-lite invoice.md --theme clean -c "h1 { color: #2e7d32; }"
```

### Approach D: Programmatic Node.js API
```javascript
const { convert } = require('md-to-pdf-lite');

await convert({
  input: './document.md',
  output: './dist/document.pdf',
  theme: 'clean',              // Built-in theme: 'github' | 'clean'
  stylesheet: './my-theme.css', // External CSS file
  css: 'h1 { color: #0288d1; }' // Inline CSS override
});
```
