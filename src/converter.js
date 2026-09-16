const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { parseMarkdown } = require('./markdown-parser');
const { findChromeExecutable } = require('./chrome-finder');

// Cache builtin CSS files
const baseStyles = {
  github: fs.readFileSync(path.join(__dirname, 'styles/github.css'), 'utf8'),
  print: fs.readFileSync(path.join(__dirname, 'styles/print.css'), 'utf8'),
  highlight: fs.readFileSync(require.resolve('highlight.js/styles/github.css'), 'utf8'),
  katex: fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8')
};

/**
 * Builds a complete standalone HTML document string from markdown HTML content.
 */
function buildHtmlDocument(contentHtml, options = {}) {
  const title = options.title || 'Document';
  let customCss = '';
  if (options.css) {
    customCss = `<style>\n${options.css}\n</style>`;
  } else if (options.stylesheet && fs.existsSync(options.stylesheet)) {
    customCss = `<style>\n${fs.readFileSync(options.stylesheet, 'utf8')}\n</style>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${baseStyles.github}
${baseStyles.highlight}
${baseStyles.katex}
${baseStyles.print}
  </style>
  ${customCss}
</head>
<body>
${contentHtml}
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
 * 
 * @param {Object} params
 * @param {string} [params.markdown] - Raw markdown text
 * @param {string} [params.input] - Input markdown file path
 * @param {string} [params.output] - Output PDF file path
 * @param {string} [params.executablePath] - Custom Chrome/Chromium binary path
 * @param {string} [params.format='A4'] - Paper format (A4, Letter, etc.)
 * @param {Object} [params.margin] - Margins object: { top, right, bottom, left }
 * @param {string} [params.css] - Custom inline CSS
 * @param {string} [params.stylesheet] - Custom external CSS file path
 * @param {boolean} [params.landscape=false] - Landscape orientation
 * @returns {Promise<{ pdfPath?: string, buffer?: Buffer }>}
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

  // 2. Parse Markdown
  const htmlContent = parseMarkdown(markdownText, { baseDir });
  const title = params.title || (params.input ? path.basename(params.input, path.extname(params.input)) : 'Document');
  const fullHtml = buildHtmlDocument(htmlContent, {
    title,
    css: params.css,
    stylesheet: params.stylesheet
  });

  // 3. Launch Puppeteer with host Chrome
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Intercept and dismiss any dialogs
    page.on('dialog', async (dialog) => {
      try { await dialog.dismiss(); } catch {}
    });

    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const pdfOptions = {
      format: params.format || 'A4',
      landscape: Boolean(params.landscape),
      printBackground: true,
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
      const buffer = await page.pdf(pdfOptions);
      return { buffer };
    }
  } finally {
    await browser.close();
  }
}

module.exports = {
  convert,
  buildHtmlDocument
};
