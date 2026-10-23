/**
 * Trilingual localization dictionary (English, 简体中文, 日本語)
 * Auto-detects browser locale and persists user selection in localStorage.
 */

export const translations = {
  en: {
    appTitle: 'md-to-pdf studio',
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
    generatingBtn: 'Rendering PDF...',
    successToast: 'PDF downloaded successfully!',
    errorToast: 'PDF generation failed. Please check your content.',
    emptyWarning: 'Document is empty. Please enter some text.',
    sampleDoc: `# Executive Project Proposal

> **Version**: 1.0.0 | **Author**: Antigravity Studio | **Date**: 2026-10-24

---

## 1. Executive Summary

This proposal outlines the deployment and benefits of **md-to-pdf-lite**, an ultra-lightweight, zero-Chromium-bundle PDF generation engine running directly on modern cloud infrastructure.

### Key Highlights
- **100% Privacy & Offline Rendering**: No sensitive data leaks to third-party online converters.
- **Superior Typography**: Automatic font fallback across Latin, Chinese, and Japanese scripts.
- **Cost Effective**: Serverless design ensures minimal running costs.

---

## 2. Infrastructure Comparison

| Platform | Cold Start | Concurrency | Monthly Free Tier |
| :--- | :--- | :--- | :--- |
| **AWS Lambda + CloudFront** | ~1.8s (Warm: 0s) | Elastic (1000+) | 400,000 GB-seconds |
| **Traditional PaaS** | 30s - 60s | 1 instance (OOM risk) | 750 hours (15min idle sleep) |
| **Dedicated VPS** | 0s | Fixed capacity | \$5 - \$20 / month |

---

## 3. Implementation Timeline

- [x] High-performance Puppeteer Lambda handler
- [x] CJK Noto Sans & IPA Gothic enterprise fonts
- [x] TipTap trilingual markdown editor
- [ ] Custom domain DNS verification

\`\`\`bash
# CLI test command
curl -X POST https://your-service.cloudfront.net/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"markdown": "# Hello World"}' \\
  --output result.pdf
\`\`\`
`
  },
  'zh-CN': {
    appTitle: 'md-to-pdf 工作台',
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
    generatingBtn: '正在极速渲染...',
    successToast: 'PDF 已成功生成并开始下载！',
    errorToast: '导出失败，请检查输入或重试。',
    emptyWarning: '文档内容为空，请输入内容后再试。',
    sampleDoc: `# 技术架构与实施方案

> **文档版本**: 1.0.0 | **架构师**: 技术方案组 | **签署日期**: 2026-10-24

---

## 一、方案背景与目标

传统在线 Markdown 转 PDF 工具普遍存在**数据安全泄露风险**以及中日韩文字发虚、表格跨页腰斩等排版硬伤。

本项目依托 **AWS Lambda + CloudFront + Chromium** 打造私有化 Serverless 渲染引擎：
- 🛡️ **高私密性**：数据不落第三方服务器，生成完即刻释放；
- 🖋️ **顶级 CJK 排版**：原生支持思源黑体（Noto Sans CJK）、微软雅黑、苹方，字距舒适；
- ⚡ **极致响应**：毫秒级加载与极速单实例渲染。

---

## 二、部署模式性能对比表

| 架构选型 | 冷启动延时 | 并发能力 | 每月免费额度 | 综合评价 |
| :--- | :--- | :--- | :--- | :--- |
| **AWS Lambda (本架构)** | 约 1.8 秒 (预热 0s) | 千级瞬时弹性扩容 | 400,000 GB-秒 | ⭐⭐⭐⭐⭐ **最优解** |
| **传统单容器 PaaS** | 30 ~ 60 秒冷唤醒 | 仅单实例 (极易 OOM) | 750 小时 (闲置休眠) | ⭐⭐ 玩具级可用 |
| **传统独立虚拟机** | 0 秒 (24h常开) | 受限于固定配置 | 无 (固定月租费用) | ⭐⭐⭐ 成本偏高 |

---

## 三、关键交付里程碑

- [x] 完成容器化 Chromium + CJK 字体深度适配
- [x] 封装 Lambda Function URL 高性能无头流式传输
- [x] 开发 TipTap 中英日三语多模式在线编辑器
- [ ] 接入独立域名并完成 CloudFront 全球加速

\`\`\`bash
# 外部系统 API 快速调用
curl -X POST https://your-service.cloudfront.net/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"markdown": "# 自动化生成测试", "theme": "clean"}' \\
  -o 报表.pdf
\`\`\`
`
  },
  ja: {
    appTitle: 'md-to-pdf スタジオ',
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
    generatingBtn: 'レンダリング中...',
    successToast: 'PDF の出力が完了しました！',
    errorToast: 'PDF 出力に失敗しました。再試行してください。',
    emptyWarning: 'ドキュメントが空です。テキストを入力してください。',
    sampleDoc: `# 新規クラウド基盤 移行提案書

> **文書番号**: PR-2026-1024 | **作成者**: システム推進部 | **作成日**: 2026年10月24日

---

## 1. 提案の目的

本提案は、社内技術文書・仕様書の自動PDF組版基盤を **AWS Lambda + CloudFront** を用いた完全サーバーレス構成へ刷新し、**情報漏洩リスクの完全排除**と**高品質な日本語印刷表現**を両立することを目的とします。

### 本方式の主要メリット
- 🔒 **情報漏洩ゼロ**: 外部SaaS変換サービスへの機密文書アップロードを防止
- 📖 **端麗な日本語組版**: Noto Sans CJK / IPAゴシックによる文字化け・罫線欠損の防止
- 💰 **大幅な運用コスト削減**: リクエスト時のみ起動し、月間数十万回まで実質無償

---

## 2. 方式別 比較評価表

| 評価項目 | AWS Lambda (採用方式) | 一般的な PaaS (無料枠) | 仮想専用サーバ (VPS) |
| :--- | :--- | :--- | :--- |
| **起動特性** | コールド約1.8秒 / 保活時即時 | 休眠復帰に 30〜60 秒要 | 常時稼働 (0秒) |
| **同時実行性** | 自動スケール (1,000+) | 1並行でメモリ枯渇 (OOM) | サーバ性能に依存 |
| **月間維持費** | **0 円** (無償枠内運用) | 0 円 (ただし制限多数) | 月額 1,000〜3,000 円 |
| **日本語対応** | **標準完全対応** | 手動設定が必要 | 手動設定が必要 |

---

## 3. 実施タスク・マイルストーン

- [x] Lambda 最適化 Chromium コンテナ環境の構築
- [x] IPAゴシック・Noto Sans 日本語フォント統合
- [x] TipTap ベースの 3言語対応 高機能エディタUI実装
- [ ] 独自ドメイン及び CloudFront CDN 配信設定

\`\`\`bash
# API 経由での自動化実行例
curl -X POST https://your-service.cloudfront.net/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"markdown": "# 日報レポート\\n\\n本日業務完了", "theme": "corporate-ja"}' \\
  -o 業務日報.pdf
\`\`\`
`
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
