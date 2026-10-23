const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');
const puppeteer = require('puppeteer-core');
const { parseMarkdown } = require('./markdown-parser');
const { findChromeExecutable } = require('./chrome-finder');

// Cache builtin CSS files and vendor scripts
const builtinThemes = {
  github: fs.readFileSync(path.join(__dirname, 'styles/github.css'), 'utf8'),
  clean: fs.readFileSync(path.join(__dirname, 'styles/clean.css'), 'utf8'),
  'corporate-ja': fs.readFileSync(path.join(__dirname, 'styles/corporate-ja.css'), 'utf8')
};

const baseStyles = {
  print: fs.readFileSync(path.join(__dirname, 'styles/print.css'), 'utf8'),
  highlight: fs.readFileSync(require.resolve('highlight.js/styles/github.css'), 'utf8'),
  katex: fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8')
};

const mermaidScriptPath = path.join(__dirname, 'vendor/mermaid.min.js');
const mermaidScript = fs.existsSync(mermaidScriptPath)
  ? fs.readFileSync(mermaidScriptPath, 'utf8')
  : '';

/**
 * Builds a complete standalone HTML document string from markdown HTML content.
 */
function buildHtmlDocument(contentHtml, options = {}) {
  const title = options.title || 'Document';
  const themeKey = (options.theme || 'github').toLowerCase();
  const normalizedTheme = (themeKey === 'japanese' || themeKey === 'japan' || themeKey === 'business-ja')
    ? 'corporate-ja'
    : themeKey;
  const themeCss = builtinThemes[normalizedTheme] || builtinThemes.github;

  let customCss = '';
  if (options.css) {
    customCss = `<style>\n${options.css}\n</style>`;
  } else if (options.stylesheet && fs.existsSync(options.stylesheet)) {
    customCss = `<style>\n${fs.readFileSync(options.stylesheet, 'utf8')}\n</style>`;
  }

  let mermaidTags = '';
  if (contentHtml.includes('class="mermaid"') && mermaidScript) {
    mermaidTags = `
<script>
${mermaidScript}
</script>
<script>
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans", sans-serif'
    });
    window.__mermaidPromise = mermaid.run({ querySelector: '.mermaid' }).catch(function(err) {
      console.error('Mermaid render error:', err);
    });
  }
</script>`;
  }

  const docLang = options.lang || (
    /[\u3040-\u30ff]/.test(contentHtml) ? "ja" :
    /[\u4e00-\u9fa5]/.test(contentHtml) ? "zh-CN" : "en"
  );

  return `<!DOCTYPE html>
<html lang="${docLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${themeCss}
${baseStyles.highlight}
${baseStyles.katex}
${baseStyles.print}
  </style>
  ${customCss}
</head>
<body>
${contentHtml}
${mermaidTags}
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Core conversion function: converts Markdown string or file to PDF.
 */
async function convert(params = {}) {
  let markdownText = params.markdown || '';
  let baseDir = process.cwd();
  let outputPath = params.output;

  if (params.input) {
    const inputPath = path.resolve(params.input);
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }
    markdownText = fs.readFileSync(inputPath, 'utf8');
    baseDir = path.dirname(inputPath);

    if (!outputPath) {
      outputPath = inputPath.replace(/\.md$/i, '.pdf');
      if (outputPath === inputPath) outputPath += '.pdf';
    }
  }

  // 1. Locate Chrome / Chromium
  const chromePath = params.executablePath || findChromeExecutable();
  if (!chromePath) {
    throw new Error(
      'Could not find Google Chrome or Chromium executable on your system.\n' +
      'Please install Chrome/Chromium or set the CHROME_PATH environment variable.'
    );
  }

  // 2. Parse Markdown (with automatic local image inlining)
  const htmlContent = parseMarkdown(markdownText, { baseDir });
  const title = params.title || (params.input ? path.basename(params.input, path.extname(params.input)) : 'Document');
  const fullHtml = buildHtmlDocument(htmlContent, {
    title,
    theme: params.theme,
    css: params.css,
    stylesheet: params.stylesheet
  });

  // Write temporary HTML file to guarantee proper origin for local assets
  const tmpHtmlPath = path.join(
    os.tmpdir(),
    `md-to-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
  );
  fs.writeFileSync(tmpHtmlPath, fullHtml, 'utf8');

  // 3. Launch Puppeteer with host Chrome
  const defaultArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-zygote',
    '--allow-file-access-from-files',
    '--disable-web-security'
  ];
  const launchArgs = Array.isArray(params.puppeteerArgs) && params.puppeteerArgs.length > 0
    ? params.puppeteerArgs
    : defaultArgs;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: params.headless !== undefined ? params.headless : true,
    args: launchArgs,
    dumpio: Boolean(process.env.DEBUG || process.env.AWS_LAMBDA_FUNCTION_NAME)
  });

  try {
    const page = await browser.newPage();
    
    // Intercept and dismiss any dialogs
    page.on('dialog', async (dialog) => {
      try { await dialog.dismiss(); } catch {}
    });

    // Navigate to temp HTML file via file:// URL
    const fileUrl = url.pathToFileURL(tmpHtmlPath).href;
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // If Mermaid diagrams are present, wait until vector rendering completes
    if (fullHtml.includes('class="mermaid"')) {
      try {
        await page.waitForFunction(() => window.__mermaidPromise !== undefined, { timeout: 10000 });
        await page.evaluate(() => window.__mermaidPromise);
      } catch {
        // Continue if Mermaid render times out or errors
      }
    }

    const pdfOptions = {
      format: params.format || 'A4',
      landscape: Boolean(params.landscape),
      printBackground: true,
      tagged: params.tagged !== undefined ? Boolean(params.tagged) : false,
      margin: params.margin || {
        top: '15mm',
        right: '12mm',
        bottom: '15mm',
        left: '12mm'
      }
    };

    if (outputPath) {
      const resolvedOutput = path.resolve(outputPath);
      const parentDir = path.dirname(resolvedOutput);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      pdfOptions.path = resolvedOutput;
      await page.pdf(pdfOptions);
      return { pdfPath: resolvedOutput };
    } else {
      const rawPdf = await page.pdf(pdfOptions);
      const buffer = Buffer.isBuffer(rawPdf) ? rawPdf : Buffer.from(rawPdf);
      return { buffer };
    }
  } finally {
    try {
      if (fs.existsSync(tmpHtmlPath)) {
        fs.unlinkSync(tmpHtmlPath);
      }
    } catch {}
    await browser.close();
  }
}

module.exports = {
  convert,
  buildHtmlDocument,
  builtinThemes
};
