const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { convert } = require('../src/index');
const { verifyPdf } = require('./pdf-verifier');

async function testPdfE2E() {
  console.log('\n📄 [E2E Suite 1/3] Automated PDF Compilation & Content Verification');

  const samplePath = path.resolve(__dirname, '../examples/sample.md');
  const sampleMd = fs.readFileSync(samplePath, 'utf8');

  // Test 1: Full Document with Clean Theme
  console.log('  ▶ Test 1.1: Verify sample document with "clean" theme (exactly 2 pages)');
  const cleanResult = await convert({
    markdown: sampleMd,
    theme: 'clean',
    format: 'A4'
  });
  const cleanVerification = await verifyPdf(cleanResult.buffer, {
    exactPages: 2,
    mustContain: [
      'md-to-pdf-lite Showcase Document',
      'CJK Typography',
      'Web Architecture',
      'generateReport',
      'Markdown Source',
      'Checklist & Feature Coverage'
    ],
    expectMermaid: true,
    mermaidNodeLabels: ['Markdown Source', 'Host Chrome', 'Commercial High-Res PDF']
  });
  console.log(`    ✔ Clean theme PDF verified: ${cleanVerification.pageCount} pages, ${cleanVerification.byteSize} bytes`);

  // Test 2: Full Document with Corporate JA Theme
  console.log('  ▶ Test 1.2: Verify Japanese business document with "corporate-ja" theme (exactly 2 pages)');
  const jaResult = await convert({
    markdown: sampleMd,
    theme: 'corporate-ja',
    format: 'A4'
  });
  const jaVerification = await verifyPdf(jaResult.buffer, {
    exactPages: 2,
    mustContain: [
      '商業帳票・見積テーブル',
      'ヒラギノ角ゴ',
      'コードハイライト',
      'フローチャート・ダイアグラム'
    ],
    expectMermaid: true
  });
  console.log(`    ✔ Corporate JA theme PDF verified: ${jaVerification.pageCount} pages, ${jaVerification.byteSize} bytes`);

  // Test 3: Full Document with GitHub Theme
  console.log('  ▶ Test 1.3: Verify document with "github" theme (exactly 2 pages)');
  const githubResult = await convert({
    markdown: sampleMd,
    theme: 'github',
    format: 'A4'
  });
  const githubVerification = await verifyPdf(githubResult.buffer, {
    exactPages: 2,
    mustContain: ['md-to-pdf-lite Showcase Document', 'Syntax Highlighting'],
    expectMermaid: true
  });
  console.log(`    ✔ GitHub theme PDF verified: ${githubVerification.pageCount} pages, ${githubVerification.byteSize} bytes`);

  // Test 4: Explicit Page Break Verification
  console.log('  ▶ Test 1.4: Verify explicit page break splitting');
  const pageBreakMd = `# Page One Content\n\nSome text on page one.\n\n<!-- pagebreak -->\n\n# Page Two Content\n\nSome text on page two.\n\n---pagebreak---\n\n# Page Three Content`;
  const pageBreakResult = await convert({
    markdown: pageBreakMd,
    format: 'A4'
  });
  const pageBreakVerification = await verifyPdf(pageBreakResult.buffer, {
    exactPages: 3,
    mustContain: ['Page One Content', 'Page Two Content', 'Page Three Content']
  });
  console.log(`    ✔ Page break PDF verified: exactly ${pageBreakVerification.pageCount} pages generated`);

  // Test 5: Standalone Complex Mermaid Flowchart
  console.log('  ▶ Test 1.5: Verify standalone Mermaid flowchart rendering');
  const standaloneMermaidMd = `
# System Workflow

\`\`\`mermaid
graph LR
  Client[Web Browser] -->|REST API| Gateway[API Gateway]
  Gateway --> ServiceA[Auth Service]
  Gateway --> ServiceB[Billing Service]
\`\`\`
`;
  const mermaidResult = await convert({
    markdown: standaloneMermaidMd,
    theme: 'clean'
  });
  const mermaidVerification = await verifyPdf(mermaidResult.buffer, {
    minPages: 1,
    mustContain: ['System Workflow', 'Web Browser', 'API Gateway', 'Billing Service'],
    mustNotContain: ['graph LR', 'style A fill:'],
    expectMermaid: true,
    mermaidNodeLabels: ['Web Browser', 'API Gateway', 'Billing Service']
  });
  console.log(`    ✔ Standalone Mermaid PDF verified: nodes cleanly compiled into vector diagram`);

  // Test 6: Multilingual Sample Documents Alignment (2 Pages)
  console.log('  ▶ Test 1.6: Verify sample.ja.md and sample.zh-CN.md render exactly 2 pages');
  const jaSampleMd = fs.readFileSync(path.resolve(__dirname, '../examples/sample.ja.md'), 'utf8');
  const zhSampleMd = fs.readFileSync(path.resolve(__dirname, '../examples/sample.zh-CN.md'), 'utf8');

  const jaPdf = await convert({ markdown: jaSampleMd, theme: 'corporate-ja', format: 'A4' });
  const jaVer = await verifyPdf(jaPdf.buffer, {
    exactPages: 2,
    mustContain: ['2ページ目', 'Page Break']
  });
  assert.strictEqual(jaVer.pageCount, 2, 'sample.ja.md must render exactly 2 pages');

  const zhPdf = await convert({ markdown: zhSampleMd, theme: 'clean', format: 'A4' });
  const zhVer = await verifyPdf(zhPdf.buffer, {
    exactPages: 2,
    mustContain: ['Page Break', 'Mermaid']
  });
  assert.strictEqual(zhVer.pageCount, 2, 'sample.zh-CN.md must render exactly 2 pages');
  console.log('    ✔ Multilingual showcase documents render exactly 2 pages');

  // Test 7: Code Block & Inline Code Pagebreak Immunity
  console.log('  ▶ Test 1.7: Verify inline backticks and fenced code do not trigger false page breaks');
  const immunityMd = `
# Single Page Title

Explain syntax with backticks: \`<!-- pagebreak -->\` and \`---pagebreak---\`.

\`\`\`markdown
<!-- pagebreak -->
---pagebreak---
\`\`\`

All should remain on page 1.
`;
  const immunityRes = await convert({ markdown: immunityMd, format: 'A4' });
  const immunityVer = await verifyPdf(immunityRes.buffer, {
    exactPages: 1,
    mustContain: ['Single Page Title', '<!-- pagebreak -->', '---pagebreak---']
  });
  assert.strictEqual(immunityVer.pageCount, 1, 'Code with pagebreak directives must not split page');
  console.log('    ✔ False page break immunity verified in code blocks & inline backticks');

  // Test 8: CJK Bold with punctuation brackets (e.g. 直前に**「予防保全...」**)
  console.log('  ▶ Test 1.8: Verify CJK bold emphasis with punctuation brackets parses into strong in PDF');
  const cjkBoldTestMd = '# 漏水調査報告\n\n漏水調査の直前に**「予防保全として漏水調査を実施していますか？（はい/いいえ）」**とヒアリングを実施。';
  const cjkBoldRes = await convert({ markdown: cjkBoldTestMd, format: 'A4' });
  const cjkBoldVer = await verifyPdf(cjkBoldRes.buffer, {
    exactPages: 1,
    mustContain: ['漏水調査報告', '予防保全として漏水調査を実施していますか？'],
    mustNotContain: ['**']
  });
  assert.strictEqual(cjkBoldVer.pageCount, 1);
  console.log('    ✔ CJK bold with brackets properly converted to PDF vector text');

  console.log('  ✨ All PDF compilation E2E tests passed successfully!\n');
}

module.exports = { testPdfE2E };

if (require.main === module) {
  testPdfE2E().catch(err => {
    console.error('❌ PDF E2E Test Suite failed:', err);
    process.exit(1);
  });
}
