const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { verifyPdf } = require('./pdf-verifier');

function runCli(args = []) {
  const cliPath = path.resolve(__dirname, '../bin/cli.js');
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [cliPath, ...args], (err, stdout, stderr) => {
      resolve({
        code: err ? (err.code || 1) : 0,
        stdout,
        stderr,
        error: err
      });
    });
  });
}

async function testCliE2E() {
  console.log('\n💻 [E2E Suite 2/3] CLI Interface End-to-End Tests');

  const samplePath = path.resolve(__dirname, '../examples/sample.md');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-cli-e2e-'));

  try {
    // Test 1: CLI Help output
    console.log('  ▶ Test 2.1: Verify CLI --help output');
    const helpRes = await runCli(['--help']);
    assert.strictEqual(helpRes.code, 0, 'CLI --help should exit with code 0');
    assert.ok(helpRes.stdout.includes('md-to-pdf-lite'), 'Help text should contain app name');
    assert.ok(helpRes.stdout.includes('--theme'), 'Help text should mention --theme');
    assert.ok(helpRes.stdout.includes('--format'), 'Help text should mention --format');
    console.log('    ✔ CLI --help output verified');

    // Test 2: Standard conversion to output file
    console.log('  ▶ Test 2.2: Convert sample.md via CLI to PDF file');
    const outPdf1 = path.join(tmpDir, 'cli-sample-clean.pdf');
    const convRes1 = await runCli([samplePath, '-o', outPdf1, '--theme', 'clean']);
    assert.strictEqual(convRes1.code, 0, `CLI failed: ${convRes1.stderr}`);
    assert.ok(fs.existsSync(outPdf1), `Output file should exist: ${outPdf1}`);

    const pdfBuf1 = fs.readFileSync(outPdf1);
    const verif1 = await verifyPdf(pdfBuf1, {
      exactPages: 2,
      mustContain: ['md-to-pdf-lite Showcase Document', 'Markdown Source']
    });
    console.log(`    ✔ CLI conversion verified: ${verif1.pageCount} pages, ${verif1.byteSize} bytes`);

    // Test 3: Conversion with corporate-ja theme, Landscape, Letter format
    console.log('  ▶ Test 2.3: Convert with corporate-ja theme, --landscape, and --format Letter');
    const outPdf2 = path.join(tmpDir, 'cli-sample-corp-landscape.pdf');
    const convRes2 = await runCli([
      samplePath,
      '-o', outPdf2,
      '--theme', 'corporate-ja',
      '--format', 'Letter',
      '--landscape',
      '--title', 'Corporate Landscape Report'
    ]);
    assert.strictEqual(convRes2.code, 0, `CLI failed: ${convRes2.stderr}`);
    assert.ok(fs.existsSync(outPdf2), `Output file should exist: ${outPdf2}`);

    const pdfBuf2 = fs.readFileSync(outPdf2);
    const verif2 = await verifyPdf(pdfBuf2, {
      minPages: 2,
      mustContain: ['商業帳票', '見積', 'Web Architecture']
    });
    console.log(`    ✔ CLI landscape corporate-ja verified: ${verif2.pageCount} pages, ${verif2.byteSize} bytes`);

    // Test 4: Error handling for non-existent file
    console.log('  ▶ Test 2.4: Verify error handling on missing input file');
    const missingRes = await runCli(['/path/does/not/exist.md']);
    assert.notStrictEqual(missingRes.code, 0, 'CLI should exit with non-zero code on missing file');
    const outputText = (missingRes.stderr || '') + (missingRes.stdout || '');
    assert.ok(
      outputText.includes('File not found') || outputText.includes('No valid files found'),
      'CLI should report missing file error'
    );
    console.log('    ✔ CLI gracefully reported missing file error');

  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }

  console.log('  ✨ All CLI E2E tests passed successfully!\n');
}

module.exports = { testCliE2E };

if (require.main === module) {
  testCliE2E().catch(err => {
    console.error('❌ CLI E2E Test Suite failed:', err);
    process.exit(1);
  });
}
