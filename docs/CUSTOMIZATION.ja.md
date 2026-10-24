# 🎨 Customization & Theming Guide (AI 時代のためのカスタム組版ガイド)

[English](CUSTOMIZATION.md) | [简体中文](CUSTOMIZATION.zh-CN.md) | [日本語](CUSTOMIZATION.ja.md)

---

`md-to-pdf-lite` は、実務でそのまま使える商用レベルの組版を標準装備しているだけでなく、**極めて自由度の高いスタイリングとブランドカスタマイズ**に対応しています。

生成 AI 時代の現在、**CSS を手作業でゼロから書く必要はありません**。本ガイドは **人間と AI（ChatGPT / Claude / Gemini / Cursor）の協調** を前提に設計されています。本文に記載された **[AI 専用プロンプト雛形](#2--ai-専用プロンプト雛形コピペで即利用可能)** を AI に渡すだけで、わずか数秒で 100% 互換性のある美しい専用スタイルが完成します。

---

## 📑 目次
1. [組み込みテーマとプレビュー (Presets & Previews)](#1-組み込みテーマとプレビュー-presets--previews)
2. [AI 専用プロンプト雛形（コピペで即利用可能）](#2--ai-専用プロンプト雛形コピペで即利用可能)
3. [セレクタ辞書とクラス仕様リファレンス](#3-セレクタ辞書とクラス仕様リファレンス)
4. [実務ですぐ使える厳選レシピ集 (Recipes)](#4-実務ですぐ使える厳選レシピ集-recipes)
   - [レシピ 1：モダンビジネス三線表スタイル（縦罫線なし・Clean）](#レシピ-1モダンビジネス三線表スタイル縦罫線なしclean)
   - [レシピ 2：開発者向けモダンダークモード (Dark Mode)](#レシピ-2開発者向けモダンダークモード-dark-mode)
   - [レシピ 3：学術論文・公式刊行物スタイル (Academic Paper)](#レシピ-3学術論文公式刊行物スタイル-academic-paper)
5. [カスタムスタイルの適用方法 (CLI & Node.js API)](#5-カスタムスタイルの適用方法-cli--nodejs-api)

---

## 1. 組み込みテーマとプレビュー (Presets & Previews)

`md-to-pdf-lite` には、専門的にチューニングされた 3 種類の組み込みテーマが用意されており、`--theme <name>` で瞬時に切り替え可能です：

| テーマ名 | 主な視覚的特徴 | 推奨される用途 | プレビュー PDF |
| :--- | :--- | :--- | :--- |
| **`github`** (デフォルト) | 開発者に馴染みのある GitHub 風、格子枠線テーブル、薄灰色のコード背景 | 技術ドキュメント、API リファレンス、設計書 | [`sample-github.pdf`](../examples/sample-github.pdf) |
| **`clean`** | **欧米ビジネス標準の三線表（縦罫線を全廃）**、十分な余白と高い可読性 | 見積書、提案書、エグゼクティブ向け白書 | [`sample-clean.pdf`](../examples/sample-clean.pdf) |
| **`corporate-ja`** | **日本企業向けビジネス文書（濃紺ヘッダー #1b365d、アクセント見出し、游ゴシック/ヒラギノ組版）** | 見積書、請求書、稟議書、官公庁・大手企業向け提案書 | [`sample-corporate-ja.pdf`](../examples/sample-corporate-ja.pdf) |

### 組み込みテーマの切り替えコマンド：
```bash
# 縦罫線のない極簡ビジネススタイル（三線表）
md2pdf-lite document.md --theme clean -o proposal.pdf

# 日本企業向けビジネススタイル
md2pdf-lite document.md --theme corporate-ja -o proposal.pdf

# 従来の GitHub 技術ドキュメントスタイル
md2pdf-lite document.md --theme github -o manual.pdf
```

---

## 2. 🤖 AI 専用プロンプト雛形（コピペで即利用可能）

> **💡 使い方**：以下の枠内のプロンプトをコピーして ChatGPT、Claude、Gemini、Cursor 等に送信し、末尾にご自身の要望（例：「*コンサルティング会社向けのシックな濃紺デザイン*」や「*印刷に適したモノクロ論文スタイル*」）を書き加えてください。

````text
あなたは CSS Print タイポグラフィと印刷組版の専門家です。Google Chrome のヘッドレス Print to PDF エンジンで動作する Markdown 変換ツール `md-to-pdf-lite` 向けに、カスタマイズ用スタイルシート `custom.css` を作成してください。

### 動作コンテキストと HTML 構造制約：
1. 標準的な HTML5 マークアップと Chrome の PDF 印刷エンジンによってレンダリングされます；
2. 本文には見出し (H1-H6)、テーブル (table)、引用 (blockquote)、コードブロック (pre/code)、KaTeX 数式 (.katex/.katex-display)、Mermaid ベクター図 (.mermaid) が含まれます；
3. 印刷向け最適化：印刷時に劣化しやすい強い box-shadow は避け、表やコードブロックの改ページには `page-break-inside: avoid` を厳守してください；
4. テーブルのデザイン規則：特別な指示がない限り、欧米で好まれる「三線表（Booktabs）」スタイル（すべての縦罫線を border-left/right: none で排除し、適度な行高と余白で品格を出す）を優先してください；
5. 日本語フォントスタック（Hiragino Sans, Meiryo, Yu Gothic, Noto Sans JP）および欧文フォント (-apple-system, Segoe UI) のフォールバックを滑らかに維持してください。

### 私の具体的なカスタマイズ要望：
- ドキュメントの用途：[例：IT 企業の見積書・提案書 / ダークモードの技術資料 / 医療機関の研究報告]
- ブランド・テーマカラー：[例：ネイビーブルー #0d47a1 / ミニマルモノクロ / フォレストグリーン #1b5e20]
- 特殊な要望：[例：H1 の下にアクセント線を引く / 表の偶数行に淡い背景色 / コードブロックの角丸を大きめにする]

無駄な前置きや解説は省き、そのまま保存して使える完成度の高い CSS コードブロックのみを出力してください。
````

---

## 3. セレクタ辞書とクラス仕様リファレンス

AI や開発者が特定の構成要素をピンポイントでカスタマイズする際は、以下のセレクタを参照してください：

| 対象要素 | CSS セレクタ | 仕様と組版の推奨事項 |
| :--- | :--- | :--- |
| **全体文書** | `body` | 基本文字サイズ（14〜16px）、行高（1.6〜1.8）、フォントスタック、背景色を指定 |
| **見出し** | `h1, h2, h3, h4` | `page-break-after: avoid` が標準適用済。アクセント下線などを安全に設定可能 |
| **データテーブル** | `table` | `page-break-inside: avoid` 適用済。`border-collapse: collapse` を指定 |
| **表見出し (TH)** | `table th` | 太字フォント、薄い背景色、太めの境界線 `border-bottom: 1.5px solid ...` |
| **データセル (TD)** | `table td` | 縦罫線を消す場合は `border-left: none; border-right: none;` |
| **偶数行背景** | `table tbody tr:nth-child(even)` | 長大な表の視認性を高めるため、ごく淡い背景（例：`#f8fafc`）を設定 |
| **引用ブロック** | `blockquote` | 左端に縦アクセント線 `border-left: 4px solid var(--primary)` を配置 |
| **インラインコード**| `code` | 等幅フォント。薄い背景色と小さなパディングを設定 |
| **コードブロック** | `pre`, `pre code`, `.hljs`, `pre.code-theme-dark` | 標準は用紙に調和する明色（`#f8fafc`）。`:dark`（例: ` ```ts:dark `）でダークカードに切替 |
| **KaTeX 数式** | `.katex`, `.katex-display` | 印刷サイズ最適化済。極端な縮小指定は避けることを推奨 |
| **Mermaid ベクター図**| `.mermaid`, `.mermaid svg` | ダイアグラムのラッパー。標準で中央揃え、`max-width: 100%` を適用 |
| **強制改ページ** | `.page-break` | Markdown 内の `<!-- pagebreak -->` で出力される空要素 |

---

## 4. 実務ですぐ使える厳選レシピ集 (Recipes)

### レシピ 1：モダンビジネス三線表スタイル（縦罫線なし・Clean）
> **用途**：見積書、業務委託提案書、コンサルティングレポート。

```css
/* モダンビジネス・三線表タイポグラフィ */
body {
  font-size: 15px;
  line-height: 1.75;
  color: #2c3e50;
}

h1, h2, h3 {
  color: #1a365d;
}

h1 {
  border-bottom: 2px solid #3182ce;
  padding-bottom: 6px;
}

/* 伝統的な三線表 (Booktabs) */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border-top: 2.5px solid #2d3748;
  border-bottom: 2.5px solid #2d3748;
}

table th {
  padding: 12px 14px;
  background-color: transparent;
  color: #1a202c;
  font-weight: 700;
  border-top: none;
  border-bottom: 1.5px solid #4a5568;
  border-left: none;
  border-right: none;
}

table td {
  padding: 12px 14px;
  border-top: none;
  border-bottom: 1px solid #e2e8f0;
  border-left: none;
  border-right: none;
}

table tbody tr:last-child td {
  border-bottom: none;
}

blockquote {
  border-left: 4px solid #3182ce;
  background-color: #ebf8ff;
  color: #2b6cb0;
  border-radius: 0 4px 4px 0;
}
```

---

### レシピ 2：開発者向けモダンダークモード (Dark Mode)
> **用途**：プレゼン資料、開発者向けスライド、夜間閲覧用の配布物。

```css
/* 高コントラスト・ダークモード */
html, body {
  background-color: #0d1117 !important;
  color: #c9d1d9;
}

h1, h2, h3, h4, h5, h6 {
  color: #58a6ff;
  border-bottom-color: #21262d;
}

a {
  color: #58a6ff;
}

table th {
  background-color: #161b22;
  color: #f0f6fc;
  border-color: #30363d;
}

table td {
  border-color: #30363d;
}

table tr:nth-child(2n) {
  background-color: #161b22;
}

pre, code {
  background-color: #161b22;
  border-color: #30363d;
  color: #79c0ff;
}

blockquote {
  border-left-color: #388bfd;
  color: #8b949e;
  background-color: rgba(56, 139, 253, 0.1);
}
```

---

### レシピ 3：学術論文・公式刊行物スタイル (Academic Paper)
> **用途**：技術論文、調査報告書、公的申請書類。

```css
/* 明朝体ベースの学術刊行物スタイル */
body {
  font-family: "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", serif;
  font-size: 14px;
  line-height: 1.8;
  color: #111;
  text-align: justify;
}

h1, h2, h3 {
  font-family: -apple-system, "Hiragino Sans", "Yu Gothic", sans-serif;
  color: #000;
  text-align: center;
}

h1 {
  font-size: 1.8em;
  border: none;
}

p {
  text-indent: 1em; /* 段落冒頭のインデント */
}

/* 学術用三線表 */
table {
  width: 90%;
  margin: 20px auto;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
}

table th {
  border-bottom: 1px solid #000;
  text-align: center;
  border-left: none;
  border-right: none;
}

table td {
  border: none;
  padding: 8px 12px;
  text-align: center;
}
```

---

## 5. カスタムスタイルの適用方法 (CLI & Node.js API)

### 方法 A：外部 CSS ファイルを指定する（推奨）
AI が生成した CSS を `my-theme.css` として保存し、`-s / --stylesheet` で指定します：

```bash
md2pdf-lite proposal.md -s my-theme.css -o dist/proposal.pdf
```

### 方法 B：インライン CSS で素早く微調整する
ファイルを作成せず、コマンドラインから直接一部のスタイルを微調整できます：

```bash
md2pdf-lite report.md -c "body { font-size: 16px; } h1 { color: #e65100; }"
```

### 方法 C：組み込みテーマと追加スタイルの組み合わせ
`--theme clean` で上品な三線表構造を適用した上で、企業のコーポレートカラーだけを上書きできます：

```bash
md2pdf-lite invoice.md --theme clean -c "h1 { color: #2e7d32; }"
```

### 方法 D：Node.js プログラミング API での利用
```javascript
const { convert } = require('md-to-pdf-lite');

await convert({
  input: './document.md',
  output: './dist/document.pdf',
  theme: 'clean',              // 組み込みテーマ: 'github' | 'clean'
  stylesheet: './my-theme.css', // 外部 CSS ファイルのパス
  css: 'h1 { color: #0288d1; }' // インライン CSS による上書き
});
```
