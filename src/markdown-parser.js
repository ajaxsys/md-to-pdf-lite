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
    highlight: function (str, lang, attrs) {
      let isDark = false;
      let cleanLang = (lang || '').trim();
      const rawAttrs = (attrs || '').trim();

      if (cleanLang.includes(':dark')) {
        isDark = true;
        cleanLang = cleanLang.replace(/:dark\b/g, '');
      } else if (cleanLang.endsWith('-dark')) {
        isDark = true;
        cleanLang = cleanLang.slice(0, -5);
      }
      if (/\bdark\b/i.test(rawAttrs) || /\{.*dark.*\}/i.test(rawAttrs)) {
        isDark = true;
      }

      if (cleanLang === 'mermaid') {
        return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
      }

      const darkClass = isDark ? ' code-theme-dark' : '';
      const darkAttr = isDark ? ' data-theme="dark"' : '';

      if (cleanLang && hljs.getLanguage(cleanLang)) {
        try {
          return `<pre class="hljs${darkClass}"${darkAttr} data-language="${cleanLang}"><code class="hljs language-${cleanLang}">${
            hljs.highlight(str, { language: cleanLang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch {
          // fallback
        }
      }
      return `<pre class="hljs${darkClass}"${darkAttr}><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
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
 * Automatically normalizes whitespace around bold (**...**) and bold-italic (***...***) syntax
 * to overcome CommonMark punctuation-flanking delimiter limitations in CJK (e.g. 直前に**「重要」**).
 * Preserves code blocks, inline code, math expressions, and markdown links/images.
 */
function normalizeBoldSpacing(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown;

  // Mask code blocks, inline code, display math, inline math, HTML tags, and link destinations
  const tokens = [];
  const maskRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`+[^`\n]+`+|\$\$[\s\S]*?\$\$|\$[^\$\n]+\$|<[^>]+>|!?\[[^\]]*\]\([^)]+\))/g;

  const masked = markdown.replace(maskRegex, (match) => {
    const placeholder = `__MD2PDF_MASK_TOKEN_${tokens.length}__`;
    tokens.push(match);
    return placeholder;
  });

  // Match pairs of ** or ***
  const boldRegex = /(\*{2,3})(?!\s)((?:[^\n*]|\*(?!\*))+?)(?<!\s)\1/g;

  const processed = masked.replace(boldRegex, (match, stars, content, offset, str) => {
    const before = offset > 0 ? str[offset - 1] : '';
    const after = offset + match.length < str.length ? str[offset + match.length] : '';

    // Add space before opening delimiter if preceded by non-whitespace and not an opening bracket/quote/delimiter
    const needSpaceBefore = before && !/\s/.test(before) && !/[#*_~`([{<「『【（《“‘]/.test(before);

    // Add space after closing delimiter if followed by non-whitespace and not a closing bracket/quote/punctuation
    const needSpaceAfter = after && !/\s/.test(after) && !/[*_~`.)}\]>」』】）》”’，。！？；：、,.:;!?]/.test(after);

    let res = '';
    if (needSpaceBefore) res += ' ';
    res += `${stars}${content}${stars}`;
    if (needSpaceAfter) res += ' ';
    return res;
  });

  return processed.replace(/__MD2PDF_MASK_TOKEN_(\d+)__/g, (_, idx) => tokens[Number(idx)]);
}

/**
 * Preprocesses markdown text for convenient syntax extensions:
 * - Automatically normalizes CJK bold/emphasis spacing
 * - <!-- pagebreak --> or <!-- page-break --> -> <div class="page-break"></div>
 * - ---pagebreak--- or ---break--- -> <div class="page-break"></div>
 */
function preprocessMarkdown(text) {
  if (!text) return '';

  // 1. Normalize CJK bold spacing to ensure proper CommonMark delimiter parsing
  const normalized = normalizeBoldSpacing(text);

  // 2. Protect code blocks and inline code from accidental page break replacement
  const codeTokens = [];
  // Match fenced code blocks (```...``` or ~~~...~~~) and inline code (`...`)
  const codeRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`+[^`\n]+`+)/g;
  const masked = normalized.replace(codeRegex, (match) => {
    const token = `__MD2PDF_CODE_TOKEN_${codeTokens.length}__`;
    codeTokens.push(match);
    return token;
  });

  // 3. Safely replace standalone pagebreak markers in markdown prose
  let processed = masked.replace(/<!--\s*page[-_]?break\s*-->/gi, '<div class="page-break"></div>');
  processed = processed.replace(/^---pagebreak---\s*$/gim, '<div class="page-break"></div>');
  processed = processed.replace(/^---break---\s*$/gim, '<div class="page-break"></div>');

  // 4. Restore protected code blocks and inline code spans
  processed = processed.replace(/__MD2PDF_CODE_TOKEN_(\d+)__/g, (_, idx) => {
    return codeTokens[Number(idx)];
  });

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
  normalizeBoldSpacing,
  inlineAllLocalImages
};
