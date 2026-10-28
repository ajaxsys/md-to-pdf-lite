/**
 * Trilingual localization dictionary (English, 简体中文, 日本語)
 * Auto-detects browser locale and persists user selection in localStorage.
 */

import sampleEn from '@examples/sample.md?raw';
import sampleZh from '@examples/sample.zh-CN.md?raw';
import sampleJa from '@examples/sample.ja.md?raw';

export const translations = {
  en: {
    appTitle: 'MD2PDF',
    appBadge: 'Serverless Lite',
    tagline: 'Professional typography with native CJK support & instant export',
    visualMode: 'Visual (WYSIWYG)',
    rawMode: 'Raw Markdown',
    loadSample: 'Load Sample',
    themeLabel: 'Theme',
    themes: {
      clean: 'Clean Business',
      'corporate-ja': 'Corporate Navy (JA)',
      github: 'GitHub Tech'
    },
    formatLabel: 'Size',
    orientationLabel: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
    taggedLabel: 'Tagged (Accessible)',
    filenamePlaceholder: 'document.pdf',
    exportBtn: 'Export PDF',
    printBtn: 'Print',
    generatingBtn: 'Rendering PDF...',
    successToast: 'PDF downloaded successfully!',
    errorToast: 'PDF generation failed. Please check your content.',
    emptyWarning: 'Document is empty. Please enter some text.',
    sampleDoc: sampleEn
  },
  'zh-CN': {
    appTitle: 'MD2PDF',
    appBadge: 'Serverless 极速版',
    tagline: '原生中日韩排版优化 · 云端无头渲染 · 一键导出高品质文档',
    visualMode: '所见即所得',
    rawMode: 'Markdown 源码',
    loadSample: '加载示例',
    themeLabel: '排版主题',
    themes: {
      clean: 'Clean 现代商务',
      'corporate-ja': 'Corporate 日企浓绀',
      github: 'GitHub 技术风'
    },
    formatLabel: '纸张尺寸',
    orientationLabel: '版面方向',
    portrait: '纵向 (Portrait)',
    landscape: '横向 (Landscape)',
    taggedLabel: '无障碍 PDF (Tagged)',
    filenamePlaceholder: '文档.pdf',
    exportBtn: '导出 PDF',
    printBtn: '打印',
    generatingBtn: '正在极速渲染...',
    successToast: 'PDF 已成功生成并开始下载！',
    errorToast: '导出失败，请检查输入或重试。',
    emptyWarning: '文档内容为空，请输入内容后再试。',
    sampleDoc: sampleZh
  },
  ja: {
    appTitle: 'MD2PDF',
    appBadge: 'サーバーレス軽量版',
    tagline: '日本語・CJK組版に最適化された商用グレードPDF作成エディタ',
    visualMode: 'ビジュアル編集',
    rawMode: 'Markdown ソース',
    loadSample: 'サンプル読込',
    themeLabel: 'デザインテーマ',
    themes: {
      clean: 'Clean ビジネス',
      'corporate-ja': '日本企業向け (濃紺)',
      github: 'GitHub スタイル'
    },
    formatLabel: '用紙サイズ',
    orientationLabel: '用紙の向き',
    portrait: '縦向き',
    landscape: '横向き',
    taggedLabel: 'アクセシブルPDF (Tagged)',
    filenamePlaceholder: '提案書.pdf',
    exportBtn: 'PDF を出力',
    printBtn: '印刷',
    generatingBtn: 'レンダリング中...',
    successToast: 'PDF の出力が完了しました！',
    errorToast: 'PDF 出力に失敗しました。再試行してください。',
    emptyWarning: 'ドキュメントが空です。テキストを入力してください。',
    sampleDoc: sampleJa
  }
};

const STORAGE_KEY = 'md2pdf_preferred_lang';

/**
 * Detect the initial language from localStorage or navigator
 */
export function getInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && translations[saved]) {
    return saved;
  }

  const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh-CN';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

/**
 * Persist user language choice
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}
