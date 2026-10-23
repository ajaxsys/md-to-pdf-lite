const { testPdfE2E } = require('./e2e-pdf.test');
const { testCliE2E } = require('./e2e-cli.test');
const { testWebStudioE2E } = require('./e2e-web.test');

async function runAllE2E() {
  const startTime = Date.now();
  console.log('===============================================================');
  console.log('🚀 Starting md-to-pdf-lite Full End-to-End (E2E) Test Suite');
  console.log('===============================================================');

  try {
    // 1. PDF Compilation & Automated Content Verification
    await testPdfE2E();

    // 2. CLI Interface E2E
    await testCliE2E();

    // 3. Web Studio Frontend & WYSIWYG Editor E2E
    await testWebStudioE2E();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('===============================================================');
    console.log(`🎉 ALL E2E SUITES PASSED! (${elapsed}s)`);
    console.log('   - PDF automated content & Mermaid vector verification: PASS');
    console.log('   - CLI command-line interface & args: PASS');
    console.log('   - Web Studio WYSIWYG, Mermaid live render & theme sync: PASS');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('\n❌ E2E Test Suite Encountered a Failure:');
    console.error(err);
    process.exit(1);
  }
}

runAllE2E();
