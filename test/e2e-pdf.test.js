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
  console.log('  ▶ Test 1.1: Verify sample document with "clean" theme');
  const cleanResult = await convert({
    markdown: sampleMd,
    theme: 'clean',
    format: 'A4'
  });
  const cleanVerification = await verifyPdf(cleanResult.buffer, {
    exactPages: 4,
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
  console.log('  ▶ Test 1.2: Verify Japanese business document with "corporate-ja" theme');
  const jaResult = await convert({
    markdown: sampleMd,
    theme: 'corporate-ja',
    format: 'A4'
  });
  const jaVerification = await verifyPdf(jaResult.buffer, {
    exactPages: 4,
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
  console.log('  ▶ Test 1.3: Verify document with "github" theme');
  const githubResult = await convert({
    markdown: sampleMd,
    theme: 'github',
    format: 'A4'
  });
  const githubVerification = await verifyPdf(githubResult.buffer, {
    exactPages: 4,
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

  console.log('  ✨ All PDF compilation E2E tests passed successfully!\n');
}

module.exports = { testPdfE2E };

if (require.main === module) {
  testPdfE2E().catch(err => {
    console.error('❌ PDF E2E Test Suite failed:', err);
    process.exit(1);
  });
}
