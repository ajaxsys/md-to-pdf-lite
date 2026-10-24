# AGENTS.md — AI Coding Agent Context & Guidelines

Welcome! This file provides essential project architecture, conventions, and workflows to help AI coding agents quickly understand and work on `md-to-pdf-lite`.

---

## 1. Project Overview

**`md-to-pdf-lite`** is an ultra-lightweight, zero-Chromium-bundle Markdown-to-PDF conversion engine and Serverless Web Studio, featuring deep CJK (Chinese/Japanese/Korean) typography optimization, offline Mermaid vector diagrams, KaTeX math rendering, syntax highlighting, and AWS Serverless deployment.

### Key Value Propositions
- **Zero Bundled Chromium (CLI/SDK)**: Uses `puppeteer-core` and automatically locates the host machine's installed browser (Chrome, Edge, Brave, or Chromium) via `src/chrome-finder.js`.
- **100% Offline & Self-Contained Rendering**: Local images are automatically inlined as Base64 Data URLs (`inlineAllLocalImages`), and Mermaid/KaTeX/Highlight.js assets are embedded directly into the generated HTML before rendering.
- **Commercial CJK Aesthetics**: Three built-in themes (`github`, `clean`, `corporate-ja`) crafted for technical docs, modern minimal quotes (Booktabs), and Japanese enterprise documents (見積書/稟議書/提案書).
- **AWS Serverless Private Cloud**: Ready-to-deploy AWS Lambda (containerized with Noto Sans CJK fonts & `@sparticuz/chromium`) + S3/CloudFront trilingual Web Studio (TipTap WYSIWYG editor) protected by Dual-Channel Auth (Private API Key + SHA-256 Proof-of-Work).

---

## 2. Repository Structure

```text
md-to-pdf-lite/
├── bin/
│   └── cli.js                 # CLI entry point (`md-to-pdf-lite` / `md2pdf-lite`)
├── src/
│   ├── index.js               # Main SDK exports (convert, convertFile, convertBatch, etc.)
│   ├── converter.js           # Core HTML assembly & Puppeteer PDF generation pipeline
│   ├── markdown-parser.js     # markdown-it setup, KaTeX, task-lists, pagebreak & Base64 image inlining
│   ├── chrome-finder.js       # Cross-platform local Chrome/Edge/Brave executable auto-detection
│   ├── lambda-handler.js      # AWS Lambda HTTP handler (PoW + API Key auth, PDF base64 response)
│   ├── styles/                # Built-in CSS themes (`github.css`, `clean.css`, `corporate-ja.css`, `print.css`)
│   └── vendor/                # Offline client scripts (`mermaid.min.js`)
├── web/                       # Frontend Web Studio (Vite + TipTap Editor + Mermaid preview + PoW client)
├── infra/                     # Pulumi IaC (TypeScript) for AWS ECR, Lambda, S3, and CloudFront
├── test/                      # Unit & E2E test suites (`run-tests.js`, `run-e2e.js`, `pdf-verifier.js`)
├── docs/                      # Trilingual customization & AI prompt guides (`CUSTOMIZATION*.md`)
├── examples/                  # Sample Markdown files and generated PDF showcases
├── Dockerfile.lambda          # AWS Lambda container image (Node 24 + Noto CJK + @sparticuz/chromium)
├── deploy.sh                  # One-click build & AWS Pulumi deployment script
└── .agent/
    └── tmp/                   # Dedicated scratch/temporary workspace for AI agents (gitignored)
```

---

## 3. Common Commands & Workflows

### Core CLI & Library
```bash
# Run CLI locally
node bin/cli.js <input.md> -o <output.pdf> -t <github|clean|corporate-ja>

# Check local Chrome/Chromium environment detection
node bin/cli.js --check-env

# Run unit tests (fast parser, HTML builder, and theme verification)
npm test

# Run E2E tests (CLI, PDF generation & verification, Web Studio tests)
npm run test:e2e

# Run all tests
npm run test:all
```

### Web Studio (`web/`)
```bash
cd web
npm install
npm run dev      # Start Vite dev server
npm run build    # Build static assets to web/dist/
```

### Cloud Deployment (`infra/` & root)
```bash
# Full build + Pulumi deployment + CloudFront cache invalidation
./deploy.sh
```

---

## 4. Architecture & Coding Conventions

1. **Module System**:
   - Root package (`src/`, `bin/`, `test/`) uses **CommonJS (`require` / `module.exports`)** targeting Node.js `>=18.0.0`.
   - Frontend (`web/`) uses **ES Modules (`import` / `export`)** bundled with Vite.
   - Infrastructure (`infra/`) uses **TypeScript** with Pulumi.
2. **Offline-First & Security**:
   - Never introduce runtime CDN dependencies in `src/converter.js` or `src/markdown-parser.js`. All styles and scripts (`mermaid.min.js`, `katex.min.css`, `highlight.js`) must be inlined from local files so PDF conversion works 100% offline.
   - Local images in Markdown (`![]()` and `<img>`) are converted to Base64 Data URLs in `inlineAllLocalImages()` to prevent `file://` CORS issues in headless Chromium.
3. **Language & Font Handling**:
   - `buildHtmlDocument()` auto-detects Japanese (`ja`), Simplified Chinese (`zh-CN`), or English (`en`) from content Unicode ranges unless `options.lang` is explicitly passed, ensuring proper CJK glyph selection.
4. **Dual-Channel Auth in Lambda (`src/lambda-handler.js`)**:
   - **Channel A**: `x-api-key` or `Authorization: Bearer <PRIVATE_API_KEY>` (bypasses PoW for CLI/backend integration).
   - **Channel B**: `x-pow-timestamp` + `x-pow-nonce` verified against `SHA256("/api/convert:" + timestamp + ":" + WEB_CLIENT_SALT + ":" + nonce)` starting with `POW_DIFFICULTY` leading zeros.
5. **Trilingual Documentation**:
   - User-facing docs (`README*.md`, `docs/CUSTOMIZATION*.md`) are maintained in English (`.md`), Simplified Chinese (`.zh-CN.md`), and Japanese (`.ja.md`). Keep them synchronized when updating public features or CLI flags.

---

## 5. Agent Scratch & Temporary Workspace (`.agent/tmp/`)

When you (the AI agent) need to generate temporary artifacts—such as:
- Test Markdown files or intermediate HTML dumps
- Temporary generated PDFs for layout/visual inspection
- One-off verification or benchmark scripts
- Debugging logs

**Always place them inside `.agent/tmp/`** (or `.agent/` subdirectories) rather than cluttering the repository root.
- `.agent/` is configured in `.gitignore` (except `.agent/tmp/.gitkeep` if tracked, or completely ignored) so temporary test files will never pollute `git status` or accidental commits.
- Clean up large temporary PDFs/HTMLs in `.agent/tmp/` once your verification task is complete.
