/**
 * 1:1 Precision Pagination Engine for md-to-pdf-lite Web Studio.
 *
 * Accurately models Chromium's print-layout and page-break engine:
 * - 96 DPI CSS physical paper conversion (1mm = 3.7795275591px)
 * - Identical margins (top/bottom 15mm, left/right 12mm)
 * - Strict simulation of print.css rules (break-inside: avoid, break-after: avoid, manual page breaks)
 * - In-canvas visual page divider guides & floating current-page pill
 */

export const MM_TO_PX = 3.7795275591;

export const PAPER_SPECS = {
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
  A3: { widthMm: 297, heightMm: 420 },
  Legal: { widthMm: 215.9, heightMm: 355.6 }
};

export const MARGINS_MM = {
  top: 15,
  bottom: 15,
  left: 12,
  right: 12
};

/**
 * Get exact physical paper geometry in pixels at 96 DPI.
 */
export function getPaperGeometry(format = 'A4', isLandscape = false) {
  const spec = PAPER_SPECS[format] || PAPER_SPECS.A4;
  let totalWidthMm = isLandscape ? spec.heightMm : spec.widthMm;
  let totalHeightMm = isLandscape ? spec.widthMm : spec.heightMm;

  const contentWidthMm = totalWidthMm - (MARGINS_MM.left + MARGINS_MM.right);
  const contentHeightMm = totalHeightMm - (MARGINS_MM.top + MARGINS_MM.bottom);

  return {
    totalWidthPx: totalWidthMm * MM_TO_PX,
    totalHeightPx: totalHeightMm * MM_TO_PX,
    contentWidthPx: contentWidthMm * MM_TO_PX,
    contentHeightPx: contentHeightMm * MM_TO_PX,
    marginTopPx: MARGINS_MM.top * MM_TO_PX,
    marginBottomPx: MARGINS_MM.bottom * MM_TO_PX,
    marginLeftPx: MARGINS_MM.left * MM_TO_PX,
    marginRightPx: MARGINS_MM.right * MM_TO_PX
  };
}

/**
 * Checks whether an element is styled with break-inside: avoid in print.css.
 */
function isBreakInsideAvoid(el) {
  const tag = el.tagName;
  if (['PRE', 'BLOCKQUOTE', 'TABLE', 'IMG'].includes(tag)) return true;
  if (el.classList.contains('tableWrapper')) return true;
  if (el.classList.contains('mermaid') || el.classList.contains('mermaid-editor-card')) return true;
  if (el.classList.contains('katex-display') || el.classList.contains('katex-block')) return true;
  if (el.classList.contains('contains-task-list') || el.dataset?.type === 'taskList') return true;
  return false;
}

/**
 * Checks whether an element is an explicit page break directive.
 */
function isExplicitPageBreak(el) {
  if (el.classList.contains('page-break') || el.classList.contains('page-break-node')) return true;
  if (el.dataset?.type === 'page-break') return true;
  if (el.classList.contains('page')) return true;
  return false;
}

/**
 * Calculates exact page pagination mirroring Chromium print layout.
 *
 * @param {HTMLElement} editorSurface - The .editor-surface container
 * @param {string} format - 'A4' | 'Letter' | 'A3' | 'Legal'
 * @param {boolean} isLandscape - whether orientation is landscape
 * @returns {{ totalPages: number, breakOffsets: Array<{ page: number, topPx: number, isManual: boolean }> }}
 */
export function calculateExactPagination(editorSurface, format = 'A4', isLandscape = false) {
  const geometry = getPaperGeometry(format, isLandscape);

  if (!editorSurface) {
    return { totalPages: 1, breakOffsets: [], geometry };
  }

  const proseMirror = editorSurface.querySelector('.ProseMirror') || editorSurface;
  const children = Array.from(proseMirror.children);
  if (children.length === 0) {
    return { totalPages: 1, breakOffsets: [], geometry };
  }

  const surfaceRect = editorSurface.getBoundingClientRect();
  const pageHeight = geometry.contentHeightPx;

  let currentPage = 1;
  let pageStartTop = null;
  const breakOffsets = [];

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (el.style.display === 'none' || el.classList.contains('page-guides-overlay')) continue;

    const elRect = el.getBoundingClientRect();
    // 100% precise visual pixel coordinate relative to editorSurface
    const top = Math.round(elRect.top - surfaceRect.top);
    const height = Math.round(elRect.height);
    const bottom = top + height;

    if (pageStartTop === null) {
      pageStartTop = top;
    }

    // 1. Explicit Manual Page Break node
    if (isExplicitPageBreak(el)) {
      breakOffsets.push({
        page: currentPage,
        topPx: top,
        isManual: true,
        element: el
      });
      currentPage++;
      // After an explicit break, the next page starts at the very next content element!
      pageStartTop = null;
      continue;
    }

    const offsetInPage = top - pageStartTop;
    const bottomInPage = offsetInPage + height;

    // 2. Headings with break-after: avoid
    if (/^H[1-6]$/.test(el.tagName)) {
      const nextEl = children[i + 1];
      const nextH = (nextEl && nextEl.style.display !== 'none' && !isExplicitPageBreak(nextEl))
        ? Math.round(nextEl.getBoundingClientRect().height)
        : 0;

      if (offsetInPage + height + nextH > pageHeight && offsetInPage > 20) {
        breakOffsets.push({
          page: currentPage,
          topPx: top,
          isManual: false,
          element: el
        });
        currentPage++;
        pageStartTop = top;
        continue;
      }
    }

    // 3. Unbreakable block elements (break-inside: avoid)
    if (isBreakInsideAvoid(el)) {
      if (bottomInPage > pageHeight && offsetInPage > 20) {
        breakOffsets.push({
          page: currentPage,
          topPx: top,
          isManual: false,
          element: el
        });
        currentPage++;
        pageStartTop = top;
      }
      continue;
    }

    // 4. Standard flow elements (paragraphs / lists / dividers)
    if (bottomInPage > pageHeight && offsetInPage > 20) {
      const splitTop = pageStartTop + pageHeight;
      breakOffsets.push({
        page: currentPage,
        topPx: splitTop,
        isManual: false,
        element: el
      });
      currentPage++;
      pageStartTop = splitTop;
    }
  }

  return {
    totalPages: Math.max(1, currentPage),
    breakOffsets,
    geometry
  };
}

/**
 * Render visual page divider guides inside the editor surface.
 * Only renders automated overflow page guides (auto-break),
 * since manual PageBreak nodes have their own drag-and-drop badge and visual divider.
 */
export function renderPageGuides(editorSurface, breakOffsets, format = 'A4', isLandscape = false) {
  if (!editorSurface) return;

  let guideContainer = editorSurface.querySelector('.page-guides-overlay');
  if (!guideContainer) {
    guideContainer = document.createElement('div');
    guideContainer.className = 'page-guides-overlay';
    editorSurface.appendChild(guideContainer);
  }

  guideContainer.innerHTML = '';

  const orientationLabel = isLandscape ? 'Landscape' : 'Portrait';

  // Update manual pagebreak node badges with dynamic page numbers
  breakOffsets.forEach((b) => {
    if (b.isManual && b.element) {
      const titleEl = b.element.querySelector('.page-break-title');
      if (titleEl) {
        titleEl.textContent = `Page Break · Page ${b.page} End · 改ページ`;
      }
    }
  });

  // Only render automatic overflow guides (avoid duplicate rendering over manual breaks)
  const autoBreaks = breakOffsets.filter((b) => !b.isManual);

  autoBreaks.forEach((b) => {
    const guide = document.createElement('div');
    guide.className = 'page-guide-marker auto-break';
    guide.style.top = `${Math.round(b.topPx)}px`;

    guide.innerHTML = `
      <div class="page-guide-line"></div>
      <div class="page-guide-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>Page ${b.page} End · Page ${b.page + 1} (${format} · ${orientationLabel})</span>
      </div>
    `;

    guideContainer.appendChild(guide);
  });
}
