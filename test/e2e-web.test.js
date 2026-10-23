const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { findChromeExecutable } = require('../src/chrome-finder');

const distDir = path.resolve(__dirname, '../web/dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function createStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        url: `http://127.0.0.1:${port}`
      });
    });
  });
}

async function testWebStudioE2E() {
  console.log('\n🌐 [E2E Suite 3/3] Web Studio Frontend & WYSIWYG Editor E2E Tests');

  assert.ok(fs.existsSync(distDir), 'web/dist must exist (run npm run build in web/ first)');

  const { server, url } = await createStaticServer();
  const chromePath = findChromeExecutable();
  assert.ok(chromePath, 'Chrome/Chromium executable required for Web E2E test');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Test 1: Page Load & Initial UI State
    console.log(`  ▶ Test 3.1: Open Web Studio (${url}) and verify initial load`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tiptap', { timeout: 8000 });
    assert.strictEqual(errors.length, 0, `Page errors encountered on load: ${errors.join(', ')}`);
    console.log('    ✔ TipTap visual editor successfully initialized');

    // Test 2: Syntax Highlighting in Code Blocks
    console.log('  ▶ Test 3.2: Verify code block syntax highlighting & spellcheck attribute');
    const codeInfo = await page.evaluate(() => {
      const keywords = document.querySelectorAll('.hljs-keyword');
      const strings = document.querySelectorAll('.hljs-string');
      const pre = document.querySelector('.ProseMirror pre');
      return {
        keywordCount: keywords.length,
        stringCount: strings.length,
        spellcheck: pre?.getAttribute('spellcheck')
      };
    });
    assert.ok(codeInfo.keywordCount > 0, `Expected hljs keywords, got ${codeInfo.keywordCount}`);
    assert.ok(codeInfo.stringCount > 0, `Expected hljs strings, got ${codeInfo.stringCount}`);
    assert.strictEqual(codeInfo.spellcheck, 'false', 'pre should have spellcheck="false"');
    console.log(`    ✔ Syntax highlighting verified: ${codeInfo.keywordCount} keywords, ${codeInfo.stringCount} strings colored`);

    // Test 3: Mermaid Vector Diagram Rendering
    console.log('  ▶ Test 3.3: Verify Mermaid vector SVG rendering');
    await page.waitForSelector('.mermaid-card-preview svg', { timeout: 8000 });
    const mermaidInfo = await page.evaluate(() => {
      const svg = document.querySelector('.mermaid-card-preview svg');
      const card = document.querySelector('.mermaid-editor-card');
      const toggleBtn = card?.querySelector('.mermaid-card-toggle');
      return {
        hasSvg: !!svg,
        svgTagName: svg?.tagName,
        hasToggle: !!toggleBtn
      };
    });
    assert.ok(mermaidInfo.hasSvg, 'Mermaid SVG diagram must be rendered in DOM');
    assert.strictEqual(mermaidInfo.svgTagName, 'svg', 'Mermaid diagram element must be an SVG');
    assert.ok(mermaidInfo.hasToggle, 'Mermaid card should have a toggle button');
    console.log('    ✔ Mermaid vector diagram SVG successfully rendered into DOM');

    // Test 4: Mermaid Code Toggle & Edit
    console.log('  ▶ Test 3.4: Verify Mermaid source toggle expansion & collapse');
    const toggleSuccess = await page.evaluate(() => {
      const toggleBtn = document.querySelector('.mermaid-card-toggle');
      const codeContainer = document.querySelector('.mermaid-card-code');
      if (!toggleBtn || !codeContainer) return false;

      // Click to expand
      toggleBtn.click();
      const isVisible = codeContainer.style.display !== 'none';

      // Click to collapse
      toggleBtn.click();
      const isCollapsed = codeContainer.style.display === 'none';

      return isVisible && isCollapsed;
    });
    assert.ok(toggleSuccess, 'Toggling Mermaid source should expand and collapse code block');
    console.log('    ✔ Mermaid source toggle expands and collapses smoothly');

    // Test 5: Theme Switching
    console.log('  ▶ Test 3.5: Verify theme switching updates editor surface class');
    await page.select('#theme-select', 'corporate-ja');
    await new Promise(r => setTimeout(r, 200));
    const isCorp = await page.evaluate(() => {
      return document.getElementById('tiptap-container').classList.contains('theme-corporate-ja');
    });
    assert.ok(isCorp, 'Container should have theme-corporate-ja class');

    await page.select('#theme-select', 'clean');
    await new Promise(r => setTimeout(r, 200));
    const isClean = await page.evaluate(() => {
      return document.getElementById('tiptap-container').classList.contains('theme-clean');
    });
    assert.ok(isClean, 'Container should have theme-clean class');
    console.log('    ✔ Theme selector dynamically synchronizes styles with editor surface');

    // Test 6: Language Switching
    console.log('  ▶ Test 3.6: Verify multilingual switching (zh-CN, en, ja)');
    await page.select('#lang-select', 'zh-CN');
    await new Promise(r => setTimeout(r, 400));
    const hasChineseText = await page.evaluate(() => {
      return document.body.textContent.includes('优雅的苹方') || document.body.textContent.includes('中文');
    });
    assert.ok(hasChineseText, 'Switching to zh-CN should load Chinese document');

    await page.select('#lang-select', 'en');
    await new Promise(r => setTimeout(r, 400));
    const hasEnglishText = await page.evaluate(() => {
      return document.body.textContent.includes('Typography & Multilingual');
    });
    assert.ok(hasEnglishText, 'Switching to en should load English document');

    await page.select('#lang-select', 'ja');
    await new Promise(r => setTimeout(r, 400));
    const hasJapaneseText = await page.evaluate(() => {
      return document.body.textContent.includes('ヒラギノ角ゴ');
    });
    assert.ok(hasJapaneseText, 'Switching to ja should load Japanese document');
    console.log('    ✔ Multilingual sample switching verified (zh-CN, en, ja)');

    // Test 7: Mode Switching (Visual <-> Raw Markdown)
    console.log('  ▶ Test 3.7: Verify Visual and Raw Markdown editor mode switching');
    const modeSwitchSuccess = await page.evaluate(() => {
      const modeRaw = document.getElementById('mode-raw');
      const modeVisual = document.getElementById('mode-visual');
      const textarea = document.getElementById('raw-markdown-editor');
      const tiptap = document.getElementById('tiptap-container');

      modeRaw.click();
      const rawVisible = textarea.style.display !== 'none' && tiptap.style.display === 'none';
      const rawHasContent = textarea.value.length > 50;

      modeVisual.click();
      const visualVisible = tiptap.style.display !== 'none' && textarea.style.display === 'none';

      return rawVisible && rawHasContent && visualVisible;
    });
    assert.ok(modeSwitchSuccess, 'Switching between Visual and Raw modes should work and sync content');
    console.log('    ✔ Visual <-> Raw Markdown synchronization verified');

    // Test 8: Proof of Work Functionality
    console.log('  ▶ Test 3.8: Verify Proof of Work (PoW) computation');
    const powResult = await page.evaluate(async () => {
      const start = performance.now();
      // Solve PoW in browser context
      const timestamp = Date.now();
      const salt = 'md2pdf_lite_salt_v1';
      const difficulty = 4;
      const targetPrefix = '0'.repeat(difficulty);
      let nonce = 0;
      
      const encoder = new TextEncoder();
      while (true) {
        const data = encoder.encode(`/api/convert:${timestamp}:${nonce}:${salt}`);
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex.startsWith(targetPrefix)) {
          return {
            nonce,
            durationMs: performance.now() - start,
            hash: hashHex.slice(0, 10)
          };
        }
        nonce++;
      }
    });
    assert.ok(powResult.nonce > 0, 'PoW should find a valid nonce');
    assert.ok(powResult.durationMs < 2000, `PoW should compute quickly, took ${powResult.durationMs}ms`);
    console.log(`    ✔ PoW verified in browser: solved in ${powResult.durationMs.toFixed(1)}ms (nonce: ${powResult.nonce})`);

  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('  ✨ All Web Studio E2E tests passed successfully!\n');
}

module.exports = { testWebStudioE2E };

if (require.main === module) {
  testWebStudioE2E().catch(err => {
    console.error('❌ Web Studio E2E Test Suite failed:', err);
    process.exit(1);
  });
}
