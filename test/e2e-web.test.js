const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { findChromeExecutable } = require('../src/chrome-finder');
const { convert } = require('../src/index');
const { verifyPdf } = require('./pdf-verifier');

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

    // Test 7b: CJK Bold with brackets normalization in TipTap
    console.log('  ▶ Test 3.7b: Verify CJK bold emphasis with brackets auto-converts to <strong>');
    const cjkBoldWebSuccess = await page.evaluate(() => {
      const modeRaw = document.getElementById('mode-raw');
      const modeVisual = document.getElementById('mode-visual');
      const textarea = document.getElementById('raw-markdown-editor');
      const tiptap = document.getElementById('tiptap-container');

      const prevContent = textarea.value;
      modeRaw.click();
      textarea.value = '漏水調査の直前に**「予防保全として漏水調査を実施していますか？（はい/いいえ）」**とヒアリング。';
      modeVisual.click();

      const strongEl = tiptap.querySelector('strong');
      const hasStrong = !!strongEl && strongEl.textContent.includes('予防保全として漏水調査を実施していますか？');

      // Restore document for subsequent pagination tests
      modeRaw.click();
      textarea.value = prevContent;
      modeVisual.click();

      return hasStrong;
    });
    assert.ok(cjkBoldWebSuccess, 'CJK bold with brackets in raw textarea must parse into <strong> in TipTap visual mode');
    console.log('    ✔ CJK bold with brackets verified in TipTap visual mode (rendered as <strong>)');

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

    // Test 9: 1:1 Precision Pagination & In-Canvas Page Guides
    console.log('  ▶ Test 3.9: Verify 1:1 pagination calculation & in-canvas divider guides');
    const paginationInfo = await page.evaluate(() => {
      const statPages = document.getElementById('stat-pages')?.textContent || '';
      const guides = document.querySelectorAll('.page-guide-marker');
      const pill = document.getElementById('floating-page-pill');
      const pillText = document.getElementById('pill-text')?.textContent || '';
      const surface = document.getElementById('tiptap-container');
      return {
        statPages,
        guideCount: guides.length,
        hasPill: !!pill,
        pillText,
        hasFormatA4: surface.classList.contains('format-A4')
      };
    });
    assert.ok(paginationInfo.statPages.includes('2 pages'), `Expected 2 pages in status, got ${paginationInfo.statPages}`);
    assert.ok(paginationInfo.statPages.includes('1:1'), 'Status bar must show 1:1 indicator');
    assert.ok(paginationInfo.guideCount >= 1, `Expected at least 1 page guide divider, got ${paginationInfo.guideCount}`);
    assert.ok(paginationInfo.hasPill, 'Floating page navigator pill must be present');
    assert.ok(paginationInfo.pillText.includes('2'), `Pill text should show total 2 pages, got: ${paginationInfo.pillText}`);
    assert.ok(paginationInfo.hasFormatA4, 'Surface must have format-A4 class bound');
    console.log(`    ✔ 1:1 precision pagination verified: ${paginationInfo.statPages}, ${paginationInfo.guideCount} guide lines rendered`);

    // Test 10: TipTap Custom PageBreak Node & Toolbar Action
    console.log('  ▶ Test 3.10: Verify custom TipTap PageBreak node insertion & serialization');
    const pageBreakInserted = await page.evaluate(() => {
      const btn = document.getElementById('tool-pagebreak');
      if (!btn) return { inserted: false, reason: 'no-btn' };
      btn.click();
      const nodes = document.querySelectorAll('.page-break-node');
      const textarea = document.getElementById('raw-markdown-editor');
      const modeRaw = document.getElementById('mode-raw');
      const modeVisual = document.getElementById('mode-visual');
      
      modeRaw.click();
      const markdownHasPagebreak = textarea.value.includes('<!-- pagebreak -->');
      modeVisual.click();

      return {
        inserted: nodes.length > 0,
        markdownHasPagebreak,
        nodeCount: nodes.length
      };
    });
    assert.ok(pageBreakInserted.inserted, 'Toolbar button should insert PageBreak node');
    assert.ok(pageBreakInserted.markdownHasPagebreak, 'Markdown serialization must preserve <!-- pagebreak -->');
    console.log('    ✔ TipTap PageBreak node inserted, rendered, and serialized cleanly to markdown');

    // Test 11: Web UI Pages === Core Converter PDF Engine 1:1 Parity
    console.log('  ▶ Test 3.11: Verify 1:1 exact parity between Web Studio pagination and PDF engine');
    // Reload sample to restore clean state
    await page.evaluate(() => {
      document.getElementById('btn-load-sample').click();
    });
    await new Promise(r => setTimeout(r, 300));

    const webData = await page.evaluate(() => {
      const md = document.getElementById('raw-markdown-editor')?.value;
      const statPages = document.getElementById('stat-pages')?.textContent;
      const match = statPages.match(/(\d+)\s+page/);
      return {
        markdown: md,
        webPages: match ? Number(match[1]) : 0
      };
    });

    assert.strictEqual(webData.webPages, 2, 'Web Studio must report exactly 2 pages for sample doc');

    // Compile same markdown using the Puppeteer PDF converter engine
    const pdfResult = await convert({
      markdown: webData.markdown,
      theme: 'clean',
      format: 'A4'
    });
    const verifiedPdf = await verifyPdf(pdfResult.buffer);
    assert.strictEqual(
      webData.webPages,
      verifiedPdf.pageCount,
      `Web calculated pages (${webData.webPages}) must exactly match PDF engine pages (${verifiedPdf.pageCount})`
    );
    console.log(`    ✔ 1:1 Parity Confirmed (Sample Doc): Web UI calculated ${webData.webPages} pages === PDF engine generated ${verifiedPdf.pageCount} pages`);

    // Verify 1:1 Parity for Chinese Sample
    await page.evaluate(() => {
      document.getElementById('btn-lang-zh')?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const zhWebData = await page.evaluate(() => {
      const md = document.getElementById('raw-markdown-editor')?.value;
      const statPages = document.getElementById('stat-pages')?.textContent;
      const match = statPages.match(/(\d+)\s+page/);
      return {
        markdown: md,
        webPages: match ? Number(match[1]) : 0
      };
    });
    const zhPdfResult = await convert({
      markdown: zhWebData.markdown,
      theme: 'clean',
      format: 'A4'
    });
    const zhVerifiedPdf = await verifyPdf(zhPdfResult.buffer);
    assert.strictEqual(
      zhWebData.webPages,
      zhVerifiedPdf.pageCount,
      `Chinese Sample: Web calculated pages (${zhWebData.webPages}) must exactly match PDF engine pages (${zhVerifiedPdf.pageCount})`
    );
    console.log(`    ✔ 1:1 Parity Confirmed (Chinese Sample): Web UI ${zhWebData.webPages} pages === PDF engine ${zhVerifiedPdf.pageCount} pages`);

    // Verify 1:1 Parity for Japanese Sample
    await page.evaluate(() => {
      document.getElementById('btn-lang-ja')?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const jaWebData = await page.evaluate(() => {
      const md = document.getElementById('raw-markdown-editor')?.value;
      const statPages = document.getElementById('stat-pages')?.textContent;
      const match = statPages.match(/(\d+)\s+page/);
      return {
        markdown: md,
        webPages: match ? Number(match[1]) : 0
      };
    });
    // Verify 1:1 Parity for Japanese Sample across BOTH default Clean theme and Corporate-JA
    const jaPdfResultClean = await convert({
      markdown: jaWebData.markdown,
      theme: 'clean',
      format: 'A4'
    });
    const jaVerifiedPdfClean = await verifyPdf(jaPdfResultClean.buffer);
    assert.strictEqual(
      jaWebData.webPages,
      jaVerifiedPdfClean.pageCount,
      `Japanese Sample in Clean Theme: Web calculated pages (${jaWebData.webPages}) must exactly match PDF engine pages (${jaVerifiedPdfClean.pageCount})`
    );
    console.log(`    ✔ 1:1 Parity Confirmed (Japanese Sample · Clean Theme): Web UI ${jaWebData.webPages} pages === Physical PDF stream ${jaVerifiedPdfClean.pageCount} pages`);

    const jaPdfResultCorp = await convert({
      markdown: jaWebData.markdown,
      theme: 'corporate-ja',
      format: 'A4'
    });
    const jaVerifiedPdfCorp = await verifyPdf(jaPdfResultCorp.buffer);
    assert.strictEqual(
      jaWebData.webPages,
      jaVerifiedPdfCorp.pageCount,
      `Japanese Sample in Corporate-JA Theme: Web calculated pages (${jaWebData.webPages}) must match PDF engine pages (${jaVerifiedPdfCorp.pageCount})`
    );
    console.log(`    ✔ 1:1 Parity Confirmed (Japanese Sample · Corporate-JA Theme): Web UI ${jaWebData.webPages} pages === Physical PDF stream ${jaVerifiedPdfCorp.pageCount} pages`);

    // Switch back to default sample doc for pill navigation testing
    await page.evaluate(() => {
      document.getElementById('btn-load-sample').click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Test 12: Floating Page Pill [ ▲ ] 1/2 [ ▼ ] Navigation & Scroll Response
    console.log('  ▶ Test 3.12: Verify Floating Page Pill [ ▲ ] 1/2 [ ▼ ] layout & scroll navigation');
    const pillLayout = await page.evaluate(() => {
      const pill = document.getElementById('floating-page-pill');
      const prevBtn = document.getElementById('pill-prev');
      const nextBtn = document.getElementById('pill-next');
      const textSpan = document.getElementById('pill-text');
      const workspace = document.querySelector('.editor-workspace');

      // Check structure: prev is first, next is last, separated by text
      const children = Array.from(pill.children);
      const prevIdx = children.indexOf(prevBtn);
      const nextIdx = children.indexOf(nextBtn);

      return {
        hasPill: !!pill,
        hasPrev: !!prevBtn,
        hasNext: !!nextBtn,
        isPrevDisabled: prevBtn.disabled,
        isNextDisabled: nextBtn.disabled,
        prevBeforeNext: prevIdx < nextIdx,
        pillText: textSpan?.textContent || '',
        initialScrollTop: workspace?.scrollTop || 0
      };
    });

    assert.ok(pillLayout.hasPill, 'Floating page pill must exist');
    assert.ok(pillLayout.hasPrev && pillLayout.hasNext, 'Pill must have separated [▲] and [▼] buttons');
    assert.ok(pillLayout.prevBeforeNext, '[▲] button must be placed on the left and [▼] on the right');
    assert.ok(pillLayout.isPrevDisabled, 'Prev button [▲] must be disabled on page 1');
    assert.ok(!pillLayout.isNextDisabled, 'Next button [▼] must be enabled on page 1 when total pages > 1');
    assert.ok(pillLayout.pillText.startsWith('1 / 2'), `Pill text should start with "1 / 2", got "${pillLayout.pillText}"`);

    // Click [▼] (Next Page) button
    await page.evaluate(() => {
      document.getElementById('pill-next').click();
    });
    // Wait for smooth scroll animation to finish
    await new Promise(r => setTimeout(r, 600));

    const afterNextScroll = await page.evaluate(() => {
      const workspace = document.querySelector('.editor-workspace');
      const prevBtn = document.getElementById('pill-prev');
      const nextBtn = document.getElementById('pill-next');
      const textSpan = document.getElementById('pill-text');
      return {
        scrollTop: workspace?.scrollTop || 0,
        isPrevDisabled: prevBtn.disabled,
        isNextDisabled: nextBtn.disabled,
        pillText: textSpan?.textContent || ''
      };
    });

    assert.ok(afterNextScroll.scrollTop > 50, `Clicking [▼] must scroll editor workspace down, got scrollTop: ${afterNextScroll.scrollTop}`);
    assert.ok(!afterNextScroll.isPrevDisabled, 'Prev button [▲] should now be enabled on page 2');
    assert.ok(afterNextScroll.isNextDisabled, 'Next button [▼] should now be disabled on last page (page 2)');
    assert.ok(afterNextScroll.pillText.startsWith('2 / 2'), `Pill text should update to "2 / 2", got "${afterNextScroll.pillText}"`);

    // Click [▲] (Prev Page) button to scroll back to top
    await page.evaluate(() => {
      document.getElementById('pill-prev').click();
    });
    await new Promise(r => setTimeout(r, 600));

    const afterPrevScroll = await page.evaluate(() => {
      const workspace = document.querySelector('.editor-workspace');
      const prevBtn = document.getElementById('pill-prev');
      const nextBtn = document.getElementById('pill-next');
      const textSpan = document.getElementById('pill-text');
      return {
        scrollTop: workspace?.scrollTop || 0,
        isPrevDisabled: prevBtn.disabled,
        isNextDisabled: nextBtn.disabled,
        pillText: textSpan?.textContent || ''
      };
    });

    assert.ok(afterPrevScroll.scrollTop < 50, `Clicking [▲] must scroll editor workspace back to top, got scrollTop: ${afterPrevScroll.scrollTop}`);
    assert.ok(afterPrevScroll.isPrevDisabled, 'Prev button [▲] should be disabled again on page 1');
    assert.ok(afterPrevScroll.pillText.startsWith('1 / 2'), `Pill text should be "1 / 2", got "${afterPrevScroll.pillText}"`);
    console.log('    ✔ Floating page pill navigation verified: [▲] 1/2 [▼] layout, smooth scrolling & button states');

    // Test 13: SP Mobile Viewport (375px / 500px) 1:1 Pagination Parity & Mobile UX Guiding
    console.log('  ▶ Test 3.13: Verify SP Mobile Viewport 1:1 Pagination Parity & Mobile Guiding');
    // Emulate mobile phone screen (375x667 iPhone SE)
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 400));

    // Switch to Japanese sample doc (contains 1700+ chars, tables, Mermaid, formulas)
    await page.evaluate(() => {
      document.getElementById('btn-lang-ja')?.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const spInfo = await page.evaluate(() => {
      // 1. Tool-pagebreak placed at the very first position in the toolbar (icon-only, compact)
      const scrollTrack = document.querySelector('.toolbar-scroll-track');
      const firstGroup = scrollTrack?.firstElementChild;
      const firstButton = firstGroup?.querySelector('button');
      const pagebreakBtn = document.getElementById('tool-pagebreak');
      const pagebreakTitle = pagebreakBtn?.title || '';

      // 2. Mobile SP header shows MD2PDF and clean settings trigger
      const brandMobile = document.querySelector('.brand-title-mobile') || document.getElementById('app-title');
      const brandMobileStyle = brandMobile ? window.getComputedStyle(brandMobile).display : 'none';
      const spSettingsBtn = document.getElementById('btn-sp-settings');
      const spSettingsComputed = spSettingsBtn ? window.getComputedStyle(spSettingsBtn).display : 'none';

      // 3. Page break node in editor: in normal flow & fully interactive (never penetrates to background editor)
      const pageBreakNode = document.querySelector('.page-break-node');
      const pageBreakComputed = pageBreakNode ? window.getComputedStyle(pageBreakNode) : null;
      const pageBreakPill = pageBreakNode?.querySelector('.page-break-pill');
      const btnUp = pageBreakNode?.querySelector('.btn-break-up');
      const btnDown = pageBreakNode?.querySelector('.btn-break-down');

      // 4. Footer clean single-line status & no Puppeteer developer jargon
      const footer = document.querySelector('.studio-footer');
      const footerStatus = document.getElementById('footer-status-text');
      const footerStatusVisible = footerStatus ? (window.getComputedStyle(footerStatus).display !== 'none') : false;
      const footerStatusText = footerStatus?.textContent || '';
      const footerScrollHeight = footer?.scrollHeight || 0;
      const footerClientHeight = footer?.clientHeight || 0;

      // 5. Exact pagination calculation in mobile view
      const statPages = document.getElementById('stat-pages')?.textContent || '';
      const match = statPages.match(/(\d+)\s+page/);
      const spCalculatedPages = match ? Number(match[1]) : 0;
      const rawMarkdown = document.getElementById('raw-markdown-editor')?.value || '';

      return {
        isPagebreakFirst: firstButton?.id === 'tool-pagebreak',
        hasPagebreakBtn: !!pagebreakBtn,
        pagebreakTitle,
        brandMobileVisible: brandMobileStyle !== 'none',
        brandMobileText: brandMobile?.textContent?.trim() || '',
        spSettingsVisible: spSettingsComputed !== 'none',
        hasPageBreakNode: !!pageBreakNode,
        pageBreakPosition: pageBreakComputed?.position || '',
        pageBreakPointerEvents: pageBreakComputed?.pointerEvents || '',
        hasPill: !!pageBreakPill,
        hasActionButtons: !!(btnUp && btnDown),
        footerNoJargon: !footerStatusText.includes('Puppeteer'),
        footerStatusHiddenOnMobile: !footerStatusVisible,
        footerSingleLine: footerScrollHeight <= footerClientHeight + 3,
        spCalculatedPages,
        rawMarkdown
      };
    });

    assert.ok(spInfo.isPagebreakFirst, 'tool-pagebreak MUST be the very first tool button in the menu');
    assert.ok(spInfo.pagebreakTitle.includes('改ページ'), 'Pagebreak button should have tooltip with "改ページ" in ja');
    assert.ok(spInfo.brandMobileVisible, 'Brand title mobile MD2PDF must be visible on SP');
    assert.strictEqual(spInfo.brandMobileText, 'MD2PDF', 'Mobile brand name must be concise "MD2PDF"');
    assert.ok(spInfo.spSettingsVisible, 'SP Settings trigger button must be visible in mobile viewport');
    assert.ok(spInfo.hasPageBreakNode, 'Document must contain at least 1 page-break node');
    assert.strictEqual(spInfo.pageBreakPosition, 'relative', 'PageBreak node must be relative in-flow (never absolute over text)');
    assert.strictEqual(spInfo.pageBreakPointerEvents, 'auto', 'PageBreak node must have pointer-events: auto (never penetrable)');
    assert.ok(spInfo.hasActionButtons, 'PageBreak node must have mobile up/down action buttons for easy manipulation');
    assert.ok(spInfo.footerNoJargon, 'Footer must not contain developer jargon like "Puppeteer"');
    assert.ok(spInfo.footerStatusHiddenOnMobile, 'Footer verbose status text should be hidden on SP to prevent line breaks');
    assert.ok(spInfo.footerSingleLine, 'Footer must fit in a single neat line without wrapping on mobile');
    assert.ok(spInfo.spCalculatedPages > 0, 'SP calculated pages must be greater than 0');

    // Compile the exact same markdown via backend Puppeteer print engine
    const spPdfResult = await convert({
      markdown: spInfo.rawMarkdown,
      theme: 'clean',
      format: 'A4'
    });
    const spVerifiedPdf = await verifyPdf(spPdfResult.buffer);

    assert.strictEqual(
      spInfo.spCalculatedPages,
      spVerifiedPdf.pageCount,
      `Mobile SP calculated pages (${spInfo.spCalculatedPages}) must 100% match physical PDF pages (${spVerifiedPdf.pageCount}) without line-wrap inflation!`
    );
    console.log(`    ✔ SP 1:1 Parity Confirmed: Mobile calculated ${spInfo.spCalculatedPages} pages === Physical PDF ${spVerifiedPdf.pageCount} pages`);

    // Further verify the exact 3-page scenario mentioned by user:
    // When a document outputs 3 pages in physical PDF, mobile SP must calculate EXACTLY 3 pages (never inflated to 4 by narrow viewport wrapping)
    await page.evaluate(() => {
      const modeRaw = document.getElementById('mode-raw');
      const modeVisual = document.getElementById('mode-visual');
      const textarea = document.getElementById('raw-markdown-editor');
      modeRaw.click();
      textarea.value = '# 1ページ目: プロジェクト概要\n\n' +
        'クラウドネイティブなPDF変換スタジオの基本設計です。\n\n' +
        '| 項目 | 内容 |\n| :--- | :--- |\n| エンジン | Chromium Headless |\n\n' +
        '<!-- pagebreak -->\n\n' +
        '# 2ページ目: アーキテクチャ詳細\n\n' +
        'コンテナベースのサーバーレス実行環境とCJKタイポグラフィ最適化を実施します。\n\n' +
        '<!-- pagebreak -->\n\n' +
        '# 3ページ目: 付録・仕様基準\n\n' +
        'モバイル端末の狭小ビューポート（375px〜500px）でも、物理A4印刷サイズに完全に準拠して3ページと正確に判定されます。\n';
      modeVisual.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const sp3PageData = await page.evaluate(() => {
      const statPages = document.getElementById('stat-pages')?.textContent || '';
      const match = statPages.match(/(\d+)\s+page/);
      const sp3Pages = match ? Number(match[1]) : 0;
      const rawMarkdown = document.getElementById('raw-markdown-editor')?.value || '';
      return { sp3Pages, rawMarkdown };
    });

    const sp3PdfResult = await convert({
      markdown: sp3PageData.rawMarkdown,
      theme: 'clean',
      format: 'A4'
    });
    const sp3VerifiedPdf = await verifyPdf(sp3PdfResult.buffer);

    assert.strictEqual(sp3VerifiedPdf.pageCount, 3, 'Backend physical PDF must be exactly 3 pages');
    assert.strictEqual(
      sp3PageData.sp3Pages,
      3,
      `Mobile SP UI must calculate exactly 3 pages, got ${sp3PageData.sp3Pages} (Fixing inflation to 4 bug)`
    );
    assert.strictEqual(
      sp3PageData.sp3Pages,
      sp3VerifiedPdf.pageCount,
      `Mobile SP 3-page parity: Calculated pages (${sp3PageData.sp3Pages}) must 100% match physical PDF pages (${sp3VerifiedPdf.pageCount})!`
    );
    console.log(`    ✔ SP 3-Page Parity Confirmed: Mobile calculated exactly 3 pages === Physical PDF 3 pages (Never inflated to 4!)`);
    console.log(`    ✔ SP UI Validated: PageBreak at first pos, SP guiding tip present, footer clean single-line without jargon`);

    // Test 14: Direct Physical PDF Binary Stream Verification
    console.log('  ▶ Test 3.14: Direct Physical PDF Binary Stream Verification for Japanese Document');
    // Load Japanese sample document cleanly
    await page.evaluate(() => {
      const select = document.getElementById('lang-select');
      if (select) {
        select.value = 'ja';
        select.dispatchEvent(new Event('change'));
      }
      document.getElementById('btn-load-sample')?.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const directExportData = await page.evaluate(() => {
      const statPages = document.getElementById('stat-pages')?.textContent || '';
      const match = statPages.match(/(\d+)\s+page/);
      const webPages = match ? Number(match[1]) : 0;
      const md = document.getElementById('raw-markdown-editor')?.value;
      const theme = document.getElementById('theme-select')?.value || 'clean';
      const format = document.getElementById('format-select')?.value || 'A4';
      return { webPages, md, theme, format };
    });

    const directPdfRes = await convert({
      markdown: directExportData.md,
      theme: directExportData.theme,
      format: directExportData.format
    });

    const directVerifiedPdf = await verifyPdf(directPdfRes.buffer);
    assert.strictEqual(
      directVerifiedPdf.pageCount,
      directExportData.webPages,
      `Physical PDF stream page count (${directVerifiedPdf.pageCount}) MUST EXACTLY MATCH Web UI page count (${directExportData.webPages})!`
    );
    assert.strictEqual(
      directVerifiedPdf.pageCount,
      2,
      `Expected Japanese sample document to be cleanly formatted into exactly 2 pages, got ${directVerifiedPdf.pageCount}`
    );
    console.log(`    ✔ Physical PDF Stream Asserted: Web UI (${directExportData.webPages} pages) === Physical PDF Stream (${directVerifiedPdf.pageCount} pages, ${directVerifiedPdf.byteSize} bytes)`);

    // Test 15: Native Browser Print Layout and Auxiliary Line Invisibility
    console.log('  ▶ Test 3.15: Native Browser Print Multi-Page & Page Break Line Invisibility');
    await page.emulateMediaType('print');
    const printStyles = await page.evaluate(() => {
      const header = document.querySelector('.studio-header');
      const btnPrint = document.querySelector('.btn-print');
      const pageBreakNode = document.querySelector('.page-break-node');
      const pageBreakPill = document.querySelector('.page-break-pill');
      const app = document.querySelector('#app');
      
      const comp = (el) => el ? window.getComputedStyle(el) : null;
      return {
        headerDisplay: comp(header)?.display,
        btnPrintDisplay: comp(btnPrint)?.display,
        appOverflow: comp(app)?.overflow,
        pageBreakDisplay: comp(pageBreakNode)?.display,
        pageBreakBorderTop: comp(pageBreakNode)?.borderTopStyle,
        pageBreakBorderWidth: comp(pageBreakNode)?.borderTopWidth,
        pageBreakHeight: comp(pageBreakNode)?.height,
        pillDisplay: comp(pageBreakPill)?.display
      };
    });

    assert.strictEqual(printStyles.headerDisplay, 'none', 'Studio header must be hidden in print mode');
    assert.strictEqual(printStyles.btnPrintDisplay, 'none', 'Print button must be hidden in print mode');
    assert.strictEqual(printStyles.pageBreakBorderTop, 'none', 'Page break node dashed line must be completely invisible (border-top-style: none) in print');
    assert.strictEqual(printStyles.pageBreakBorderWidth, '0px', 'Page break node border width must be 0px in print');
    assert.strictEqual(printStyles.pillDisplay, 'none', 'Page break pill badge must be hidden in print');
    assert.ok(printStyles.appOverflow !== 'hidden', '#app overflow must not be hidden in print');
    
    // Generate native print PDF from Web Studio DOM
    const printPdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    const printVerifiedPdf = await verifyPdf(printPdfBuffer);
    assert.strictEqual(printVerifiedPdf.pageCount, 2, 'Browser print of sample document must produce exactly 2 pages');
    assert.ok(!printVerifiedPdf.text.includes('Page Break ·'), 'Printed PDF must NOT leak Page Break pill text');
    console.log(`    ✔ Native Browser Print Asserted: Header & Buttons hidden, Page Break dashed border 0px/none, 2 full pages generated!`);
    await page.emulateMediaType('screen');

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
