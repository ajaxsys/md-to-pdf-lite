import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';

import { translations, getInitialLanguage, setLanguage } from './i18n.js';
import { solveProofOfWork } from './pow.js';

// App State
let currentLang = getInitialLanguage();
let currentMode = 'visual'; // 'visual' | 'raw'
let isLandscape = false;
let editor = null;

// DOM Elements
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
 * Initialize TipTap Editor instance
 */
function initEditor() {
  const t = translations[currentLang];

  editor = new Editor({
    element: tiptapContainer,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] }
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-'
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start writing your document in Markdown...'
      })
    ],
    content: t.sampleDoc,
    onUpdate: () => {
      updateStats();
      syncToRawIfActive();
    }
  });

  // Set initial raw content
  rawTextarea.value = t.sampleDoc;
  updateStats();
}

/**
 * Update word, character and page estimates
 */
function updateStats() {
  const content = getCurrentMarkdown();
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estPages = Math.max(1, Math.ceil(chars / 1800));

  statWords.textContent = `${words} words`;
  statChars.textContent = `${chars} chars`;
  statPages.textContent = `~${estPages} page${estPages > 1 ? 's' : ''}`;
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
    if (currentMode === 'visual') {
      editor.commands.setContent(t.sampleDoc);
    } else {
      rawTextarea.value = t.sampleDoc;
    }
    updateStats();
    showToast(currentLang === 'zh-CN' ? '已重新载入示例模板' : currentLang === 'ja' ? 'サンプルを読み込みました' : 'Sample document loaded');
  });

  modeVisual.addEventListener('click', () => switchMode('visual'));
  modeRaw.addEventListener('click', () => switchMode('raw'));

  rawTextarea.addEventListener('input', () => updateStats());
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
    const payload = {
      markdown,
      theme: themeSelect.value,
      format: formatSelect.value,
      landscape: isLandscape,
      filename: `document-${Date.now()}.pdf`
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
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = payload.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

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
  applyLocalization(currentLang);

  // Language Select
  langSelect.addEventListener('change', (e) => {
    applyLocalization(e.target.value);
  });

  // Orientation Toggle
  const orientationIcon = document.getElementById('orientation-icon');
  orientationToggle.addEventListener('click', () => {
    isLandscape = !isLandscape;
    const t = translations[currentLang];
    orientationText.textContent = isLandscape ? t.landscape : t.portrait;
    if (orientationIcon) {
      if (isLandscape) orientationIcon.classList.add('is-landscape');
      else orientationIcon.classList.remove('is-landscape');
    }
  });

  // Export PDF Button
  btnExport.addEventListener('click', handleExportPDF);
});
