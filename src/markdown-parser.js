const fs = require('fs');
const path = require('path');
const url = require('url');
const MarkdownIt = require('markdown-it');
const markdownItKatex = require('@vscode/markdown-it-katex').default || require('@vscode/markdown-it-katex');
const hljs = require('highlight.js');

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon'
};

/**
 * Creates and configures a Markdown parser.
 */
function createParser(options = {}) {
  const baseDir = options.baseDir || process.cwd();

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code class="hljs language-${lang}">${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch {
          // fallback
        }
      }
      return `<pre class="hljs"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  // Enable KaTeX math rendering ($math$ and $$math$$) with strict ignored
  md.use(markdownItKatex, {
    throwOnError: false,
    errorColor: '#cc0000',
    strict: 'ignore'
  });

  // Custom renderer for images: automatically inlines local images as base64 Data URLs
  // This completely eliminates Chrome local resource security restrictions (CORS/file:// blocks)
  const defaultImageRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');
    if (srcIndex >= 0) {
      const rawSrc = token.attrs[srcIndex][1];
      if (!rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:')) {
        let localPath = rawSrc;
        if (rawSrc.startsWith('file://')) {
          try {
            localPath = url.fileURLToPath(rawSrc);
          } catch {
            localPath = rawSrc.replace(/^file:\/\//, '');
          }
        } else {
          localPath = path.isAbsolute(rawSrc) ? rawSrc : path.resolve(baseDir, rawSrc);
        }

        if (fs.existsSync(localPath)) {
          try {
            const ext = path.extname(localPath).toLowerCase();
            const mime = MIME_TYPES[ext] || 'image/png';
            const base64 = fs.readFileSync(localPath).toString('base64');
            token.attrs[srcIndex][1] = `data:${mime};base64,${base64}`;
          } catch (err) {
            token.attrs[srcIndex][1] = url.pathToFileURL(localPath).href;
          }
        } else {
          token.attrs[srcIndex][1] = url.pathToFileURL(localPath).href;
        }
      }
    }
    return defaultImageRender(tokens, idx, options, env, self);
  };

  return md;
}

/**
 * Preprocesses markdown text for convenient syntax extensions:
 * - <!-- pagebreak --> or <!-- page-break --> -> <div class="page-break"></div>
 * - ---pagebreak--- or ---break--- -> <div class="page-break"></div>
 */
function preprocessMarkdown(text) {
  let processed = text.replace(/<!--\s*page[-_]?break\s*-->/gi, '<div class="page-break"></div>');
  processed = processed.replace(/^---pagebreak---\s*$/gim, '<div class="page-break"></div>');
  processed = processed.replace(/^---break---\s*$/gim, '<div class="page-break"></div>');
  return processed;
}

/**
 * Parse Markdown to HTML string with custom options.
 */
function parseMarkdown(markdownText, options = {}) {
  const md = createParser(options);
  const preprocessed = preprocessMarkdown(markdownText);
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    return md.render(preprocessed);
  } finally {
    console.warn = origWarn;
  }
}

module.exports = {
  createParser,
  preprocessMarkdown,
  parseMarkdown
};
