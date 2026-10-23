const fs = require('fs');
const path = require('path');
const url = require('url');
const MarkdownIt = require('markdown-it');
const markdownItKatex = require('@vscode/markdown-it-katex').default || require('@vscode/markdown-it-katex');
const taskLists = require('markdown-it-task-lists');
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
 * Inlines local images (both markdown ![] and raw <img> tags) to Base64 Data URLs.
 * This completely avoids any browser local file restrictions (CORS/file:// security blocks).
 */
function inlineAllLocalImages(html, baseDir) {
  return html.replace(/<img\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*?)>/gi, (match, prefix, rawSrc, suffix) => {
    if (rawSrc.startsWith('http://') || rawSrc.startsWith('https://') || rawSrc.startsWith('data:')) {
      return match;
    }
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
        return `<img${prefix}src="data:${mime};base64,${base64}"${suffix}>`;
      } catch {
        return match;
      }
    }
    return match;
  });
}

/**
 * Creates and configures a Markdown parser.
 */
function createParser() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      if (lang === 'mermaid') {
        return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
      }
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

  // Enable GitHub-flavored task lists with checkboxes (- [x] and - [ ])
  md.use(taskLists, {
    enabled: false,
    label: true,
    labelAfter: true
  });

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
 * Parse Markdown to HTML string with custom options and base64 local image inlining.
 */
function parseMarkdown(markdownText, options = {}) {
  const baseDir = options.baseDir || process.cwd();
  const md = createParser();
  const preprocessed = preprocessMarkdown(markdownText);
  const origWarn = console.warn;
  console.warn = () => {};
  let html = '';
  try {
    html = md.render(preprocessed);
  } finally {
    console.warn = origWarn;
  }

  // Inline all local images (both markdown syntax and raw <img> tags)
  return inlineAllLocalImages(html, baseDir);
}

module.exports = {
  createParser,
  preprocessMarkdown,
  parseMarkdown,
  inlineAllLocalImages
};
