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
import { calculateExactPagination, renderPageGuides } from './pagination-engine.js';
import { translations, getInitialLanguage, setLanguage } from './i18n.js';
import { solveProofOfWork } from './pow.js';

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
}

/**
 * Load markdown content into both visual and raw editors
 */
function loadDocumentContent(markdown) {
  isProgrammatic = true;
  if (editor) {
    editor.commands.setContent(markdown);
  }
  rawTextarea.value = markdown;
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
        bulletListMarker: '-'
      }),
      PageBreak,
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
    content: t.sampleDoc,
    onUpdate: () => {
      if (!isProgrammatic) {
        hasUserEdited = true;
      }
      updateStats();
      syncToRawIfActive();
    }
  });

  // Set initial raw content
  rawTextarea.value = t.sampleDoc;
  hasUserEdited = false;
  updatePaperCanvasGeometry();
  updateStats();
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
 * Track current page in view on scroll
 */
function setupScrollObserver() {
  window.addEventListener('scroll', () => {
    if (currentMode !== 'visual' || !lastPaginationResult.breakOffsets) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const containerTop = tiptapContainer.getBoundingClientRect().top + scrollY;
    const currentOffsetInCanvas = Math.max(0, scrollY + 120 - containerTop);

    let activePage = 1;
    for (let i = 0; i < lastPaginationResult.breakOffsets.length; i++) {
      if (currentOffsetInCanvas >= lastPaginationResult.breakOffsets[i].topPx) {
        activePage = i + 2;
      }
    }

    if (activePage !== currentPageInView) {
      currentPageInView = activePage;
      const format = formatSelect.value || 'A4';
      updateFloatingPill(lastPaginationResult.totalPages, format);
    }
  }, { passive: true });

  // Floating pill navigation clicks
  if (pillPrev) {
    pillPrev.addEventListener('click', () => {
      if (currentPageInView <= 1) return;
      scrollToPage(currentPageInView - 1);
    });
  }

  if (pillNext) {
    pillNext.addEventListener('click', () => {
      if (currentPageInView >= lastPaginationResult.totalPages) return;
      scrollToPage(currentPageInView + 1);
    });
  }
}

/**
 * Smoothly scroll to a specific page boundary
 */
function scrollToPage(targetPage) {
  if (targetPage === 1) {
    window.scrollTo({ top: tiptapContainer.offsetTop - 70, behavior: 'smooth' });
    return;
  }

  const breakIdx = targetPage - 2;
  const breakInfo = lastPaginationResult.breakOffsets[breakIdx];
  if (breakInfo) {
    const targetScrollY = tiptapContainer.offsetTop + breakInfo.topPx - 30;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }
}

/**
 * Get current markdown string from either visual or raw mode
 */
function getCurrentMarkdown() {
  if (currentMode === 'visual' && editor) {
    return editor.storage.markdown.getMarkdown();
  }
  return rawTextarea.value;
}

/**
 * Sync content between Visual (TipTap) and Raw Textarea
 */
function syncToRawIfActive() {
  if (currentMode === 'visual') {
    rawTextarea.value = editor.storage.markdown.getMarkdown();
  }
}

/**
 * Switch mode between WYSIWYG and Raw Markdown
 */
function switchMode(mode) {
  if (mode === currentMode) return;

  if (mode === 'raw') {
    rawTextarea.value = editor.storage.markdown.getMarkdown();
    tiptapContainer.style.display = 'none';
    rawTextarea.style.display = 'block';
    modeRaw.classList.add('active');
    modeVisual.classList.remove('active');
  } else {
    editor.commands.setContent(rawTextarea.value);
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

  document.title = `${t.appTitle} | Serverless CJK PDF`;
  appTitle.textContent = t.appTitle;
  appBadge.textContent = t.appBadge;
  themeLabel.textContent = t.themeLabel;
  formatLabel.textContent = t.formatLabel;
  loadSampleText.textContent = t.loadSample;
  modeVisual.textContent = t.visualMode;
  modeRaw.textContent = t.rawMode;
  exportBtnText.textContent = t.exportBtn;

  // Update theme option labels
  themeSelect.options[0].textContent = t.themes.clean;
  themeSelect.options[1].textContent = t.themes['corporate-ja'];
  themeSelect.options[2].textContent = t.themes.github;

  orientationText.textContent = isLandscape ? t.landscape : t.portrait;
  langSelect.value = lang;

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
});
