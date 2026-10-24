const { convert, buildHtmlDocument, builtinThemes } = require('./converter');
const { parseMarkdown, createParser, preprocessMarkdown } = require('./markdown-parser');
const { findChromeExecutable } = require('./chrome-finder');

/**
 * Convenience helper to convert a single Markdown file to PDF.
 */
async function convertFile(inputPath, outputPath, options = {}) {
  const result = await convert({
    input: inputPath,
    output: outputPath,
    ...options
  });
  return result.pdfPath;
}

/**
 * Convenience helper to convert multiple Markdown files sequentially.
 */
async function convertBatch(fileList, options = {}) {
  const results = [];
  for (const file of fileList) {
    const res = await convert({
      input: file,
      ...options
    });
    results.push(res.pdfPath);
  }
  return results;
}

module.exports = {
  convert,
  convertFile,
  convertBatch,
  parseMarkdown,
  createParser,
  preprocessMarkdown,
  buildHtmlDocument,
  findChromeExecutable,
  builtinThemes
};
