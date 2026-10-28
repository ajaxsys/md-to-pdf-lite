import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { lowlight } from 'lowlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

import { MermaidNodeView, StandardCodeBlockNodeView } from './mermaid-node-view.js';
import { PageBreak } from './page-break-extension.js';
import { MathExtension } from './math-extension.js';
import { calculateExactPagination, renderPageGuides } from './pagination-engine.js';
import { translations, getInitialLanguage, setLanguage } from './i18n.js';
import { solveProofOfWork } from './pow.js';
import { normalizeBoldSpacing } from './markdown-cleaner.js';
import 'katex/dist/katex.min.css';

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ({ node, view, getPos }) => {
      if (node.attrs.language === 'mermaid') {
        return new MermaidNodeView(node, view, getPos);
      }
      return new StandardCodeBlockNodeView(node, view, getPos);
    };
  }
});

// App State
let currentLang = getInitialLanguage();
let currentMode = 'visual'; // 'visual' | 'raw'
let isLandscape = false;
let editor = null;
let hasUserEdited = false;
let isProgrammatic = false;
let lastPaginationResult = { totalPages: 1, breakOffsets: [] };
let currentPageInView = 1;

// DOM Elements
const editorWorkspace = document.getElementById('editor-workspace');
const tiptapContainer = document.getElementById('tiptap-container');
const rawTextarea = document.getElementById('raw-markdown-editor');
const langSelect = document.getElementById('lang-select');
const themeSelect = document.getElementById('theme-select');
const formatSelect = document.getElementById('format-select');
const orientationToggle = document.getElementById('orientation-toggle');
const orientationText = document.getElementById('orientation-text');
const btnExport = document.getElementById('btn-export-pdf');
const exportBtnText = document.getElementById('export-btn-text');
const exportSpinner = document.getElementById('export-spinner');
const btnPrint = document.getElementById('btn-print');
const printBtnText = document.getElementById('print-btn-text');
const btnLoadSample = document.getElementById('btn-load-sample');
const modeVisual = document.getElementById('mode-visual');
const modeRaw = document.getElementById('mode-raw');
const toast = document.getElementById('toast');

// Floating Page Navigator
const floatingPagePill = document.getElementById('floating-page-pill');
const pillText = document.getElementById('pill-text');
const pillPrev = document.getElementById('pill-prev');
const pillNext = document.getElementById('pill-next');

// Stats Elements
const statWords = document.getElementById('stat-words');
const statChars = document.getElementById('stat-chars');
const statPages = document.getElementById('stat-pages');

// I18n UI Text Targets
const appTitle = document.getElementById('app-title');
const appBadge = document.getElementById('app-badge');
const themeLabel = document.getElementById('theme-label');
const formatLabel = document.getElementById('format-label');
const loadSampleText = document.getElementById('load-sample-text');

// Header & SP Drawer Enhancement Elements
const docFilenameDisplay = document.getElementById('doc-filename-display');
const btnSpSettings = document.getElementById('btn-sp-settings');
const spSummaryBadge = document.getElementById('sp-summary-badge');
const btnThemeMode = document.getElementById('btn-theme-mode');
const footerStatusText = document.getElementById('footer-status-text');

const drawerBackdrop = document.getElementById('drawer-backdrop');
const spBottomSheet = document.getElementById('sp-bottom-sheet');
const sheetTitle = document.getElementById('sheet-title');
const sheetClose = document.getElementById('sheet-close');
const sheetThemeLabel = document.getElementById('sheet-theme-label');
const sheetThemeSelect = document.getElementById('sheet-theme-select');
const sheetFormatLabel = document.getElementById('sheet-format-label');
const sheetFormatSelect = document.getElementById('sheet-format-select');
const sheetOrientLabel = document.getElementById('sheet-orient-label');
const sheetOrientPortrait = document.getElementById('sheet-orient-portrait');
const sheetOrientLandscape = document.getElementById('sheet-orient-landscape');
const sheetLangLabel = document.getElementById('sheet-lang-label');
const sheetLangSelect = document.getElementById('sheet-lang-select');
const sheetSampleLabel = document.getElementById('sheet-sample-label');
const sheetBtnSample = document.getElementById('sheet-btn-sample');
const sheetPrintLabel = document.getElementById('sheet-print-label');
const sheetBtnPrint = document.getElementById('sheet-btn-print');

/**
 * Dynamically synchronize browser print page size and orientation with selected settings
 */
function updatePrintOrientation() {
  let styleEl = document.getElementById('print-orientation-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'print-orientation-style';
    document.head.appendChild(styleEl);
  }
  const format = formatSelect ? formatSelect.value || 'A4' : 'A4';
  const orientation = isLandscape ? 'landscape' : 'portrait';
  styleEl.textContent = `@media print { @page { size: ${format} ${orientation}; margin: 15mm 12mm; } }`;
}

/**
 * Apply paper dimensions class to sync canvas with selected format & orientation
 */
function updatePaperCanvasGeometry() {
  const format = formatSelect.value || 'A4';
  const formats = ['format-A4', 'format-Letter', 'format-A3', 'format-Legal'];

  formats.forEach((f) => {
    tiptapContainer.classList.remove(f);
    rawTextarea.classList.remove(f);
  });

  tiptapContainer.classList.add(`format-${format}`);
  rawTextarea.classList.add(`format-${format}`);

  if (isLandscape) {
    tiptapContainer.classList.add('is-landscape');
    rawTextarea.classList.add('is-landscape');
  } else {
    tiptapContainer.classList.remove('is-landscape');
    rawTextarea.classList.remove('is-landscape');
  }

  updatePrintOrientation();
}

/**
 * Load markdown content into both visual and raw editors
 */
function loadDocumentContent(markdown) {
  const normalized = normalizeBoldSpacing(markdown);
  isProgrammatic = true;
  if (editor) {
    editor.commands.setContent(normalized);
  }
  rawTextarea.value = normalized;
  hasUserEdited = false;
  updateStats();
  setTimeout(() => {
    isProgrammatic = false;
  }, 50);
}

/**
 * Initialize TipTap Editor instance
 */
function initEditor() {
  const t = translations[currentLang];
  const initialContent = normalizeBoldSpacing(t.sampleDoc);

  editor = new Editor({
    element: tiptapContainer,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: false
      }),
      CustomCodeBlock.configure({
        lowlight,
        defaultLanguage: 'plaintext'
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true
      }),
      PageBreak,
      MathExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document in Markdown...'
      })
    ],
    content: initialContent,
    onUpdate: () => {
      if (!isProgrammatic) {
        hasUserEdited = true;
      }
      updateStats();
      syncToRawIfActive();
    }
  });

  // Hook TipTap markdown parser to automatically normalize CJK bold spacing on setContent, insertContentAt, or paste
  if (editor.storage?.markdown?.parser) {
    const origParse = editor.storage.markdown.parser.parse.bind(editor.storage.markdown.parser);
    editor.storage.markdown.parser.parse = function (content, options) {
      if (typeof content === 'string') {
        content = normalizeBoldSpacing(content);
      }
      return origParse(content, options);
    };
  }

  // Set initial raw content
  rawTextarea.value = initialContent;
  hasUserEdited = false;
  updatePaperCanvasGeometry();
  updateStats();
}

/**
 * Update dynamic document filename derived from first H1 heading
 */
function updateDocFilenameDisplay(markdown) {
  if (!docFilenameDisplay) return;
  const titleMatch = (markdown || '').match(/^#\s+(.+)$/m);
  const safeTitle = titleMatch ? titleMatch[1].replace(/[\\/:*?"<>|#]/g, '').trim().slice(0, 40) : '';
  const defaultDoc = currentLang === 'ja' ? '提案書.pdf' : currentLang === 'zh-CN' ? '文档.pdf' : 'document.pdf';
  docFilenameDisplay.textContent = safeTitle ? `${safeTitle}.pdf` : defaultDoc;
  docFilenameDisplay.title = safeTitle ? `${safeTitle}.pdf` : defaultDoc;
}

/**
 * Sync Drawer controls with main header controls
 */
function syncDrawerControls() {
  if (sheetThemeSelect && themeSelect) sheetThemeSelect.value = themeSelect.value;
  if (sheetFormatSelect && formatSelect) sheetFormatSelect.value = formatSelect.value;
  if (sheetLangSelect && langSelect) sheetLangSelect.value = langSelect.value;
  if (sheetOrientPortrait && sheetOrientLandscape) {
    if (isLandscape) {
      sheetOrientPortrait.classList.remove('active');
      sheetOrientLandscape.classList.add('active');
    } else {
      sheetOrientPortrait.classList.add('active');
      sheetOrientLandscape.classList.remove('active');
    }
  }
  if (spSummaryBadge) {
    const themeName = themeSelect.value === 'corporate-ja' ? 'Corporate' : themeSelect.value === 'github' ? 'GitHub' : 'Clean';
    const formatName = formatSelect.value || 'A4';
    spSummaryBadge.textContent = `${themeName} · ${formatName}`;
  }
}

/**
 * Update word, character, 1:1 precision page calculation, and divider guides
 */
function updateStats() {
  const content = getCurrentMarkdown();
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  statWords.textContent = `${words} words`;
  statChars.textContent = `${chars} chars`;

  // Update header document filename indicator
  updateDocFilenameDisplay(content);

  // Sync SP Drawer status
  syncDrawerControls();

  // Exact 1:1 pagination simulation
  const format = formatSelect.value || 'A4';
  const targetSurface = currentMode === 'visual' ? tiptapContainer : null;
  const pagination = calculateExactPagination(targetSurface, format, isLandscape);
  lastPaginationResult = pagination;

  const totalPages = pagination.totalPages;
  statPages.textContent = `${totalPages} page${totalPages > 1 ? 's' : ''} (${format} 1:1)`;

  // Render guides inside canvas
  if (currentMode === 'visual') {
    renderPageGuides(tiptapContainer, pagination.breakOffsets, format, isLandscape);
  }

  // Update floating navigator
  updateFloatingPill(totalPages, format);
}

/**
 * Update floating pill text and visibility
 */
function updateFloatingPill(totalPages, format) {
  if (!pillText) return;
  const safePage = Math.min(Math.max(1, currentPageInView), totalPages);
  currentPageInView = safePage;
  const orient = isLandscape ? (currentLang === 'ja' ? '横' : currentLang === 'zh-CN' ? '横向' : 'Land') : (currentLang === 'ja' ? '縦' : currentLang === 'zh-CN' ? '纵向' : 'Port');
  pillText.textContent = `${safePage} / ${totalPages} (${format} · ${orient})`;

  if (pillPrev) {
    pillPrev.disabled = safePage <= 1;
    pillPrev.classList.toggle('is-disabled', safePage <= 1);
  }
  if (pillNext) {
    pillNext.disabled = safePage >= totalPages;
    pillNext.classList.toggle('is-disabled', safePage >= totalPages);
  }
}

/**
 * Setup DOM mutation and drag observers to recalculate pagination dynamically
 */
function setupEditorObservers() {
  if (!tiptapContainer) return;

  let debounceTimer = null;
  const debouncedRecalc = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateStats();
    }, 40);
  };

  // 1. Observe ProseMirror children reordering (e.g., drag and drop nodes)
  const proseMirror = tiptapContainer.querySelector('.ProseMirror') || tiptapContainer;
  const observer = new MutationObserver((mutations) => {
    let shouldRecalc = false;
    for (const m of mutations) {
      if (m.type === 'childList') {
        shouldRecalc = true;
        break;
      }
    }
    if (shouldRecalc) debouncedRecalc();
  });

  observer.observe(proseMirror, { childList: true, subtree: false });

  // 2. Drag & Drop events on canvas
  tiptapContainer.addEventListener('dragend', () => {
    setTimeout(updateStats, 60);
  });
  tiptapContainer.addEventListener('drop', () => {
    setTimeout(updateStats, 60);
  });

  // 3. Window resize observer
  window.addEventListener('resize', debouncedRecalc, { passive: true });
}

/**
 * Track current page in view on scroll within the .editor-workspace container
 */
function setupScrollObserver() {
  const workspace = document.querySelector('.editor-workspace');

  if (workspace) {
    workspace.addEventListener('scroll', () => {
      if (currentMode !== 'visual' || !lastPaginationResult || !lastPaginationResult.breakOffsets) return;

      const scrollY = workspace.scrollTop;
      let activePage = 1;
      const breaks = lastPaginationResult.breakOffsets;

      for (let i = 0; i < breaks.length; i++) {
        const b = breaks[i];
        let breakTop = b.topPx;
        if (b.element && b.element.isConnected) {
          const rect = b.element.getBoundingClientRect();
          const wsRect = workspace.getBoundingClientRect();
          breakTop = workspace.scrollTop + (rect.top - wsRect.top);
        }
        if (scrollY + 120 >= breakTop) {
          activePage = b.page + 1;
        }
      }

      if (activePage !== currentPageInView) {
        currentPageInView = activePage;
        const format = formatSelect.value || 'A4';
        updateFloatingPill(lastPaginationResult.totalPages, format);
      }
    }, { passive: true });
  }

  // Floating pill navigation clicks
  if (pillPrev) {
    pillPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (currentPageInView <= 1) return;
      scrollToPage(currentPageInView - 1);
    });
  }

  if (pillNext) {
    pillNext.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const total = lastPaginationResult ? lastPaginationResult.totalPages : 1;
      if (currentPageInView >= total) return;
      scrollToPage(currentPageInView + 1);
    });
  }
}

/**
 * Smoothly scroll the .editor-workspace to a specific page boundary
 */
function scrollToPage(targetPage) {
  const workspace = document.querySelector('.editor-workspace');
  if (!workspace) return;

  const total = lastPaginationResult ? lastPaginationResult.totalPages : 1;
  const clamped = Math.max(1, Math.min(targetPage, total));

  if (clamped <= 1) {
    workspace.scrollTo({ top: 0, behavior: 'smooth' });
    currentPageInView = 1;
    updateFloatingPill(total, formatSelect.value || 'A4');
    return;
  }

  const breaks = lastPaginationResult.breakOffsets || [];
  const breakInfo = breaks.find(b => b.page === clamped - 1) || breaks[clamped - 2];
  if (breakInfo) {
    if (breakInfo.element && breakInfo.element.isConnected) {
      breakInfo.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      workspace.scrollTo({ top: Math.max(0, breakInfo.topPx - 20), behavior: 'smooth' });
    }
    currentPageInView = clamped;
    updateFloatingPill(total, formatSelect.value || 'A4');
  }
}

/**
 * Get current markdown string from either visual or raw mode
 */
function getCurrentMarkdown() {
  if (currentMode === 'visual' && editor) {
    let md = editor.storage.markdown.getMarkdown();
    // Normalize tight task lists (prevent tiptap-markdown from inserting loose \n\n between task items)
    md = md.replace(/(- \[[ xX]\] [^\n]+)\n\n(?=- \[[ xX]\])/g, '$1\n');
    return normalizeBoldSpacing(md);
  }
  return normalizeBoldSpacing(rawTextarea.value || '');
}

/**
 * Sync content between Visual (TipTap) and Raw Textarea
 */
function syncToRawIfActive() {
  if (currentMode === 'visual' && editor) {
    rawTextarea.value = getCurrentMarkdown();
  }
}

/**
 * Switch mode between WYSIWYG and Raw Markdown
 */
function switchMode(mode) {
  if (mode === currentMode) return;

  if (mode === 'raw') {
    rawTextarea.value = getCurrentMarkdown();
    tiptapContainer.style.display = 'none';
    rawTextarea.style.display = 'block';
    modeRaw.classList.add('active');
    modeVisual.classList.remove('active');
  } else {
    const clean = normalizeBoldSpacing(rawTextarea.value);
    rawTextarea.value = clean;
    editor.commands.setContent(clean);
    rawTextarea.style.display = 'none';
    tiptapContainer.style.display = 'block';
    modeVisual.classList.add('active');
    modeRaw.classList.remove('active');
  }

  currentMode = mode;
  updateStats();
}

/**
 * Show temporary toast message
 */
let toastTimeout;
function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.className = `toast-notification show ${type}`;
  toastTimeout = setTimeout(() => {
    toast.className = 'toast-notification';
  }, 3500);
}

/**
 * Apply localized strings to UI elements
 */
function applyLocalization(lang) {
  currentLang = lang;
  setLanguage(lang);
  const t = translations[lang];

  document.title = `MD2PDF | Serverless CJK PDF`;
  appTitle.textContent = 'MD2PDF';
  appBadge.textContent = t.appBadge;
  themeLabel.textContent = t.themeLabel;
  formatLabel.textContent = t.formatLabel;
  loadSampleText.textContent = t.loadSample;
  modeVisual.textContent = t.visualMode;
  modeRaw.textContent = t.rawMode;
  exportBtnText.textContent = t.exportBtn;
  if (printBtnText) {
    printBtnText.textContent = t.printBtn || (lang === 'ja' ? '印刷' : lang === 'zh-CN' ? '打印' : 'Print');
  }

  // Update theme option labels
  themeSelect.options[0].textContent = t.themes.clean;
  themeSelect.options[1].textContent = t.themes['corporate-ja'];
  themeSelect.options[2].textContent = t.themes.github;

  orientationText.textContent = isLandscape ? t.landscape : t.portrait;
  langSelect.value = lang;

  // Localize mobile bottom sheet drawer
  if (sheetTitle) {
    sheetTitle.textContent = lang === 'ja' ? '用紙・デザイン設定' : lang === 'zh-CN' ? '页面与排版设置' : 'Page & Layout Settings';
  }
  if (sheetThemeLabel) sheetThemeLabel.textContent = t.themeLabel;
  if (sheetFormatLabel) sheetFormatLabel.textContent = t.formatLabel;
  if (sheetOrientLabel) sheetOrientLabel.textContent = t.orientationLabel || (lang === 'ja' ? '用紙の向き' : lang === 'zh-CN' ? '版面方向' : 'Orientation');
  if (sheetOrientPortrait) sheetOrientPortrait.textContent = t.portrait;
  if (sheetOrientLandscape) sheetOrientLandscape.textContent = t.landscape;
  if (sheetLangLabel) sheetLangLabel.textContent = lang === 'ja' ? '表示言語' : lang === 'zh-CN' ? '界面语言' : 'Language';
  if (sheetSampleLabel) sheetSampleLabel.textContent = lang === 'ja' ? 'サンプル' : lang === 'zh-CN' ? '示例文档' : 'Sample';
  if (sheetBtnSample) sheetBtnSample.textContent = t.loadSample;
  if (sheetPrintLabel) sheetPrintLabel.textContent = t.printBtn || (lang === 'ja' ? '印刷' : lang === 'zh-CN' ? '打印' : 'Print');
  if (sheetBtnPrint) {
    sheetBtnPrint.textContent = lang === 'ja' ? 'ブラウザから印刷 (Print)' : lang === 'zh-CN' ? '浏览器直接打印 (Print)' : 'Print from Browser';
  }

  if (sheetThemeSelect && sheetThemeSelect.options.length >= 3) {
    sheetThemeSelect.options[0].textContent = t.themes.clean;
    sheetThemeSelect.options[1].textContent = t.themes['corporate-ja'];
    sheetThemeSelect.options[2].textContent = t.themes.github;
  }

  // Highlight page break tooltip localization
  const toolPagebreak = document.getElementById('tool-pagebreak');
  if (toolPagebreak) {
    toolPagebreak.title = lang === 'ja'
      ? '改ページ (Ctrl+Enter)'
      : lang === 'zh-CN'
        ? '插入分页符 (Ctrl+Enter)'
        : 'Insert Page Break (Ctrl+Enter)';
  }

  // Footer status human-readable text
  if (footerStatusText) {
    footerStatusText.textContent = lang === 'ja' ? '準備完了' : lang === 'zh-CN' ? '就绪' : 'Ready';
  }

  updateStats();
}

/**
 * Connect Toolbar Formatting Buttons
 */
function setupToolbar() {
  const bind = (id, action) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        if (currentMode === 'raw') {
          showToast('Switch to Visual mode to use toolbar buttons', 'error');
          return;
        }
        editor.chain().focus();
        action();
      });
    }
  };

  bind('tool-bold', () => editor.chain().toggleBold().run());
  bind('tool-italic', () => editor.chain().toggleItalic().run());
  bind('tool-strike', () => editor.chain().toggleStrike().run());
  bind('tool-h1', () => editor.chain().toggleHeading({ level: 1 }).run());
  bind('tool-h2', () => editor.chain().toggleHeading({ level: 2 }).run());
  bind('tool-h3', () => editor.chain().toggleHeading({ level: 3 }).run());
  bind('tool-bullet', () => editor.chain().toggleBulletList().run());
  bind('tool-ordered', () => editor.chain().toggleOrderedList().run());
  bind('tool-quote', () => editor.chain().toggleBlockquote().run());
  bind('tool-code', () => editor.chain().toggleCodeBlock().run());
  bind('tool-table', () => editor.chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run());
  bind('tool-hr', () => editor.chain().setHorizontalRule().run());
  bind('tool-pagebreak', () => editor.chain().setPageBreak().run());

  // Update active state of toolbar buttons based on selection
  const updateActiveStates = () => {
    if (!editor || currentMode === 'raw') return;
    const check = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        if (fn()) el.classList.add('is-active');
        else el.classList.remove('is-active');
      }
    };
    check('tool-bold', () => editor.isActive('bold'));
    check('tool-italic', () => editor.isActive('italic'));
    check('tool-strike', () => editor.isActive('strike'));
    check('tool-h1', () => editor.isActive('heading', { level: 1 }));
    check('tool-h2', () => editor.isActive('heading', { level: 2 }));
    check('tool-h3', () => editor.isActive('heading', { level: 3 }));
    check('tool-bullet', () => editor.isActive('bulletList'));
    check('tool-ordered', () => editor.isActive('orderedList'));
    check('tool-quote', () => editor.isActive('blockquote'));
    check('tool-code', () => editor.isActive('codeBlock'));
  };

  editor.on('transaction', updateActiveStates);
  editor.on('selectionUpdate', updateActiveStates);

  btnLoadSample.addEventListener('click', () => {
    const t = translations[currentLang];
    loadDocumentContent(t.sampleDoc);
    showToast(currentLang === 'zh-CN' ? '已重新载入示例模板' : currentLang === 'ja' ? 'サンプルを読み込みました' : 'Sample document loaded');
  });

  modeVisual.addEventListener('click', () => switchMode('visual'));
  modeRaw.addEventListener('click', () => switchMode('raw'));

  rawTextarea.addEventListener('input', () => {
    if (!isProgrammatic) {
      hasUserEdited = true;
    }
    updateStats();
  });
}

/**
 * Export PDF Action
 */
async function handleExportPDF() {
  const markdown = getCurrentMarkdown().trim();
  const t = translations[currentLang];

  if (!markdown) {
    showToast(t.emptyWarning, 'error');
    return;
  }

  // Set loading state
  btnExport.disabled = true;
  exportBtnText.textContent = t.generatingBtn;
  exportSpinner.style.display = 'inline-block';

  try {
    // Smart filename: derive from first H1 heading or timestamp fallback
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const safeTitle = titleMatch ? titleMatch[1].replace(/[\\/:*?"<>|#]/g, '').trim().slice(0, 50) : '';
    const filename = safeTitle ? `${safeTitle}.pdf` : `document-${Date.now()}.pdf`;

    const payload = {
      markdown,
      theme: themeSelect.value,
      format: formatSelect.value,
      landscape: isLandscape,
      filename
    };

    // Solve lightweight Proof of Work challenge (~50-90ms)
    const salt = import.meta.env.VITE_WEB_CLIENT_SALT || 'md2pdf_lite_salt_v1';
    const difficulty = Number(import.meta.env.VITE_POW_DIFFICULTY) || 4;
    const pow = solveProofOfWork({ path: '/api/convert', salt, difficulty });

    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-pow-timestamp': String(pow.timestamp),
      'x-pow-nonce': String(pow.nonce)
    };

    if (import.meta.env.VITE_API_KEY) {
      requestHeaders['x-api-key'] = import.meta.env.VITE_API_KEY;
    }

    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }, 3000);

    showToast(t.successToast, 'success');
  } catch (err) {
    console.error('Export error:', err);
    showToast(`${t.errorToast} (${err.message})`, 'error');
  } finally {
    btnExport.disabled = false;
    exportBtnText.textContent = t.exportBtn;
    exportSpinner.style.display = 'none';
  }
}

/**
 * Direct Browser Print Action (Fallback when server is unavailable)
 */
function handlePrint() {
  const markdown = getCurrentMarkdown().trim();
  const t = translations[currentLang];

  if (!markdown) {
    showToast(t.emptyWarning, 'error');
    return;
  }

  // Ensure print orientation and page size matches current setup
  updatePrintOrientation();

  // If mobile bottom sheet is open, close it
  if (spBottomSheet && spBottomSheet.classList.contains('is-open')) {
    if (drawerBackdrop) drawerBackdrop.classList.remove('is-open');
    spBottomSheet.classList.remove('is-open');
  }

  // If in raw markdown mode, temporarily sync content to visual editor
  const wasRaw = (currentMode === 'raw');
  if (wasRaw) {
    const clean = normalizeBoldSpacing(rawTextarea.value);
    rawTextarea.value = clean;
    isProgrammatic = true;
    editor.commands.setContent(clean);
    tiptapContainer.style.display = 'block';
    rawTextarea.style.display = 'none';
    setTimeout(() => { isProgrammatic = false; }, 50);
  }

  // Trigger native browser print dialog
  window.print();

  if (wasRaw) {
    tiptapContainer.style.display = 'none';
    rawTextarea.style.display = 'block';
  }
}

// Ensure correct print behavior when user triggers print via Cmd/Ctrl + P
let printWasRaw = false;
window.addEventListener('beforeprint', () => {
  updatePrintOrientation();
  if (currentMode === 'raw') {
    printWasRaw = true;
    const clean = normalizeBoldSpacing(rawTextarea.value);
    rawTextarea.value = clean;
    isProgrammatic = true;
    editor.commands.setContent(clean);
    tiptapContainer.style.display = 'block';
    rawTextarea.style.display = 'none';
  }
});

window.addEventListener('afterprint', () => {
  if (printWasRaw) {
    printWasRaw = false;
    tiptapContainer.style.display = 'none';
    rawTextarea.style.display = 'block';
    isProgrammatic = false;
  }
});

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initEditor();
  setupToolbar();
  setupEditorObservers();
  setupScrollObserver();
  applyLocalization(currentLang);

  // Language Select
  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    const t = translations[newLang];

    if (hasUserEdited) {
      const confirmMsg = newLang === 'zh-CN'
        ? '切换语言将载入对应的示例模板，当前编辑内容将被覆盖，是否继续？'
        : newLang === 'ja'
        ? '言語を切り替えるとサンプル文書が再読込され、現在の編集内容が上書きされます。よろしいですか？'
        : 'Switching language will load the localized sample and overwrite current changes. Continue?';
      if (!confirm(confirmMsg)) {
        applyLocalization(newLang);
        return;
      }
    }

    applyLocalization(newLang);
    if (t && t.sampleDoc) {
      loadDocumentContent(t.sampleDoc);
    }
  });

  // Theme Select Handler
  function updateThemeClass(theme) {
    if (!tiptapContainer) return;
    tiptapContainer.classList.remove('theme-clean', 'theme-corporate-ja', 'theme-github');
    tiptapContainer.classList.add(`theme-${theme}`);
    updateStats();
  }

  themeSelect.addEventListener('change', (e) => {
    updateThemeClass(e.target.value);
  });
  updateThemeClass(themeSelect.value);

  // Paper Format Select Handler
  formatSelect.addEventListener('change', () => {
    updatePaperCanvasGeometry();
    updateStats();
  });

  // Orientation Toggle Handler
  const orientationIcon = document.getElementById('orientation-icon');
  orientationToggle.addEventListener('click', () => {
    isLandscape = !isLandscape;
    const t = translations[currentLang];
    orientationText.textContent = isLandscape ? t.landscape : t.portrait;
    if (orientationIcon) {
      if (isLandscape) orientationIcon.classList.add('is-landscape');
      else orientationIcon.classList.remove('is-landscape');
    }
    updatePaperCanvasGeometry();
    updateStats();
  });

  // Export PDF Button
  btnExport.addEventListener('click', handleExportPDF);

  // Direct Browser Print Button
  if (btnPrint) {
    btnPrint.addEventListener('click', handlePrint);
  }
  if (sheetBtnPrint) {
    sheetBtnPrint.addEventListener('click', handlePrint);
  }

  // Setup Mobile Bottom Sheet Drawer
  function toggleBottomSheet(open) {
    if (!drawerBackdrop || !spBottomSheet) return;
    if (open) {
      syncDrawerControls();
      drawerBackdrop.classList.add('is-open');
      spBottomSheet.classList.add('is-open');
    } else {
      drawerBackdrop.classList.remove('is-open');
      spBottomSheet.classList.remove('is-open');
    }
  }

  if (btnSpSettings) {
    btnSpSettings.addEventListener('click', () => {
      toggleBottomSheet(true);
    });
  }
  if (sheetClose) sheetClose.addEventListener('click', () => toggleBottomSheet(false));
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => toggleBottomSheet(false));

  if (sheetThemeSelect) {
    sheetThemeSelect.addEventListener('change', (e) => {
      themeSelect.value = e.target.value;
      themeSelect.dispatchEvent(new Event('change'));
      syncDrawerControls();
    });
  }

  if (sheetFormatSelect) {
    sheetFormatSelect.addEventListener('change', (e) => {
      formatSelect.value = e.target.value;
      formatSelect.dispatchEvent(new Event('change'));
      syncDrawerControls();
    });
  }

  if (sheetLangSelect) {
    sheetLangSelect.addEventListener('change', (e) => {
      langSelect.value = e.target.value;
      langSelect.dispatchEvent(new Event('change'));
      syncDrawerControls();
    });
  }

  if (sheetOrientPortrait) {
    sheetOrientPortrait.addEventListener('click', () => {
      if (isLandscape) orientationToggle.click();
      syncDrawerControls();
    });
  }

  if (sheetOrientLandscape) {
    sheetOrientLandscape.addEventListener('click', () => {
      if (!isLandscape) orientationToggle.click();
      syncDrawerControls();
    });
  }

  if (sheetBtnSample) {
    sheetBtnSample.addEventListener('click', () => {
      btnLoadSample.click();
      toggleBottomSheet(false);
    });
  }

  // Setup GitHub Primer Carbon Dark / Light Mode Toggle
  function updateThemeModeIcon(mode) {
    if (!btnThemeMode) return;
    if (mode === 'dark') {
      btnThemeMode.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"></path>
      </svg>`;
      btnThemeMode.title = 'Switch to Light mode';
    } else {
      btnThemeMode.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM0 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 8Zm13 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 13 8ZM2.343 13.657a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 1 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0Zm9.193-9.193a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 1 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0Z"></path>
      </svg>`;
      btnThemeMode.title = 'Switch to Carbon Dark mode';
    }
  }

  function toggleColorMode() {
    const current = document.documentElement.getAttribute('data-color-mode') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-color-mode', next);
    localStorage.setItem('md2pdf_color_mode', next);
    updateThemeModeIcon(next);
  }

  const savedColorMode = localStorage.getItem('md2pdf_color_mode') || 'light';
  document.documentElement.setAttribute('data-color-mode', savedColorMode);
  updateThemeModeIcon(savedColorMode);

  if (btnThemeMode) {
    btnThemeMode.addEventListener('click', toggleColorMode);
  }

  // Mobile SP Toolbar Scroll Overflow & Peek Guidance
  const scrollTrack = document.querySelector('.toolbar-scroll-track');
  const overflowFade = document.querySelector('.toolbar-overflow-fade');

  if (scrollTrack && overflowFade) {
    const updateOverflowFade = () => {
      const isAtEnd = scrollTrack.scrollLeft + scrollTrack.clientWidth >= scrollTrack.scrollWidth - 8;
      overflowFade.classList.toggle('is-hidden', isAtEnd);
    };
    scrollTrack.addEventListener('scroll', updateOverflowFade, { passive: true });
    window.addEventListener('resize', updateOverflowFade);
    updateOverflowFade();
  }

  function setupSpInteractionGuides() {
    if (window.innerWidth > 768) return;

    // Horizontal Scroll Peek on Toolbar to guide user that formatting strip scrolls
    if (scrollTrack && !sessionStorage.getItem('md2pdf_sp_scroll_hint')) {
      sessionStorage.setItem('md2pdf_sp_scroll_hint', 'true');
      setTimeout(() => {
        scrollTrack.scrollTo({ left: 70, behavior: 'smooth' });
        setTimeout(() => {
          scrollTrack.scrollTo({ left: 0, behavior: 'smooth' });
        }, 500);
      }, 600);
    }
  }
  setupSpInteractionGuides();
});
