const path = require('path');
const MarkdownIt = require('markdown-it');
const markdownItKatex = require('@vscode/markdown-it-katex').default || require('@vscode/markdown-it-katex');
const hljs = require('highlight.js');

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

  // Custom renderer for relative image paths -> file:// URI
  const defaultImageRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');
    if (srcIndex >= 0) {
      let src = token.attrs[srcIndex][1];
      // Convert local relative file paths to absolute file:// URLs
      if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('file://')) {
        const absolutePath = path.resolve(baseDir, src);
        token.attrs[srcIndex][1] = 'file://' + absolutePath;
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
