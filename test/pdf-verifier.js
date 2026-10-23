const { PDFParse } = require('pdf-parse');
const assert = require('assert');

/**
 * Automatically inspects and validates a compiled PDF buffer or file.
 *
 * Checks:
 * 1. Valid PDF header magic bytes (%PDF-1.x)
 * 2. Non-trivial file size
 * 3. Page count matches expectations (minPages, maxPages, exactPages)
 * 4. Text content extraction & verification (mustContain strings)
 * 5. Absence of raw uncompiled directives (mustNotContain strings)
 * 6. Mermaid vector verification: ensures diagram labels exist and raw declarations do NOT leak into printed text
 *
 * @param {Buffer} pdfBuffer - The raw binary PDF buffer
 * @param {Object} expectations - Validation rules
 * @returns {Promise<{valid: boolean, pageCount: number, textLength: number, byteSize: number, text: string}>}
 */
async function verifyPdf(pdfInput, expectations = {}) {
  const pdfBuffer = Buffer.isBuffer(pdfInput)
    ? pdfInput
    : (pdfInput instanceof Uint8Array ? Buffer.from(pdfInput) : null);
  assert.ok(pdfBuffer, 'PDF input must be a Node.js Buffer or Uint8Array');
  assert.ok(pdfBuffer.length > 500, `PDF buffer too small: ${pdfBuffer.length} bytes`);

  // 1. Verify PDF Magic Number Header
  const magic = pdfBuffer.subarray(0, 5).toString('ascii');
  assert.strictEqual(magic, '%PDF-', `Invalid PDF header magic bytes: ${magic}`);

  // 2. Extract text and metadata via PDFParse
  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const rawText = textResult.text || '';
  // Normalize with NFKC so CJK glyphs/Kangxi radicals match standard characters
  const text = rawText.normalize('NFKC');
  const pageCount = textResult.total || 0;

  // 3. Verify Page Counts
  if (expectations.minPages !== undefined) {
    assert.ok(
      pageCount >= expectations.minPages,
      `Expected at least ${expectations.minPages} pages, but PDF has ${pageCount}`
    );
  }
  if (expectations.maxPages !== undefined) {
    assert.ok(
      pageCount <= expectations.maxPages,
      `Expected at most ${expectations.maxPages} pages, but PDF has ${pageCount}`
    );
  }
  if (expectations.exactPages !== undefined) {
    assert.strictEqual(
      pageCount,
      expectations.exactPages,
      `Expected exactly ${expectations.exactPages} pages, but PDF has ${pageCount}`
    );
  }

  // 4. Verify Required Text Strings
  if (Array.isArray(expectations.mustContain)) {
    for (const expectedStr of expectations.mustContain) {
      assert.ok(
        text.includes(expectedStr),
        `PDF verification failed: missing expected text "${expectedStr}" in PDF output`
      );
    }
  }

  // 5. Verify Forbidden Text Strings (raw uncompiled markdown/syntax)
  if (Array.isArray(expectations.mustNotContain)) {
    for (const forbiddenStr of expectations.mustNotContain) {
      assert.ok(
        !text.includes(forbiddenStr),
        `PDF verification failed: unexpected unrendered raw text found in PDF: "${forbiddenStr}"`
      );
    }
  }

  // 6. Verify Mermaid Vector Diagram Compilation
  if (expectations.expectMermaid) {
    if (Array.isArray(expectations.mermaidNodeLabels)) {
      for (const label of expectations.mermaidNodeLabels) {
        assert.ok(
          text.includes(label),
          `PDF Mermaid verification failed: diagram node label "${label}" not found in PDF`
        );
      }
    }
    // Raw graph TD or style directives should NOT leak as raw text if properly rendered to vector SVG
    assert.ok(
      !text.includes('style A fill:'),
      'PDF Mermaid verification failed: raw "style A fill:" directive found in PDF output'
    );
  }

  return {
    valid: true,
    pageCount,
    textLength: text.length,
    byteSize: pdfBuffer.length,
    text
  };
}

module.exports = { verifyPdf };
