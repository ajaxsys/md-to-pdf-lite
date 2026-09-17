# md-to-pdf-lite 🚀

> **Chromiumを内包しない超軽量設計のモダン Markdown to PDF コンバーター。日本語（CJK）の美しい商用組版、Mermaid ベクター図、KaTeX 数式、コードハイライト、CI/CD 自動化に完全対応。**

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

---

## 💡 なぜ md-to-pdf-lite なのか？

既存の Markdown to PDF ツールには、実務環境においていくつかの課題が存在します：
- **オンライン変換ツールの機密漏洩リスク**: 多くの SaaS 型 Web ツールは社内文書を外部サーバーへアップロードさせるため、秘密保持契約（NDA）下の見積書、社内設計書、機密データの流出リスクを伴います；
- **大容量 Chromium のダウンロード負荷**: Puppeteer に依存する一般的な CLI ツールはインストール時に数百 MB の専用 Chromium を強制ダウンロードするため、ネットワーク制限環境や Apple Silicon、コンテナ環境でハングアップやインストール失敗が頻発します；
- **GUI やエディタへの依存**: エディタ拡張機能などは手動操作を前提としていることが多く、シェルスクリプトや Git フック、CI/CD パイプラインによる自動化が困難です；
- **日中韓（CJK）フォントの組版品質**: 標準的な印刷用スタイルではフォントフォールバックの不具合や、ページをまたぐ表の途切れ、柔軟な改ページ制御の不足が見られます。

**`md-to-pdf-lite` はこれらの課題をすべて解決します：**
- 🔒 **実行時 100% オフライン・完全なデータ秘匿性**: インストール後、Markdown 解析、Mermaid 作図、KaTeX 数式、ローカル画像の埋め込みはすべて端末内のブラウザサンドボックスで完結。**実行時の外部ネットワーク通信は一切発生しない**ため、機密保持が求められる企業内イントラネットでも安心です；
- ⚡ **Chromium バンドル不要（秒速インストール）**: 数百 MB のブラウザダウンロードが一切不要。軽量な JS 依存関係のみで数秒でインストール完了し、端末にインストール済みの Google Chrome、Microsoft Edge、Brave、Chromium を自動検出して活用します；
- 🎨 **日本語ビジネス文書に最適化されたタイポグラフィ**: ヒラギノ角ゴ (Hiragino Sans)、メイリオ (Meiryo)、游ゴシック、システムフォントに配慮し、見積書や提案書にふさわしい美しいレイアウトを提供します；
- 📊 **オフライン Mermaid ベクター図**: フローチャート、シーケンス図、アーキテクチャ図を外部通信なしで高品質なベクター SVG として描画；
- 📄 **直感的な改ページ構文**: `<!-- pagebreak -->` または `---pagebreak---` を記述するだけで思い通りのページ分割が可能です；
- 🧮 **KaTeX 数式・構文ハイライト**: 外部通信なしの完全オフラインで数式やソースコードを高速・美麗にレンダリングします；
- 🤖 **自動化・一括変換ファースト**: 単一ファイルはもちろん、複数ファイルの一括変換（`md2pdf-lite "docs/*.md"`）や Node.js API、GitHub Actions との連携を標準装備しています。

---

## 📦 インストール

### グローバル CLI
```bash
npm install -g md-to-pdf-lite
```
*(インストールせずに `npx md-to-pdf-lite` で直接実行することも可能です)*

### プロジェクト依存関係としての追加
```bash
npm install md-to-pdf-lite
```

---

## 🚀 CLI の使い方

### 1. 単一ファイルの変換
```bash
md2pdf-lite document.md
# 実行ディレクトリに document.pdf が生成されます
```

### 2. 出力先ファイル名またはディレクトリの指定
```bash
# 特定のファイル名に出力
md2pdf-lite document.md -o output/report.pdf

# 特定のディレクトリに出力（元ファイル名を維持）
md2pdf-lite document.md -o ./dist/
```

### 3. 複数ファイルの一括変換（バッチ処理）
```bash
md2pdf-lite 01_要件定義.md 02_設計書.md 03_御見積書.md
```

### 4. 用紙サイズ・印刷方向の指定
```bash
# 用紙サイズ: A4, Letter, A3, Legal など (デフォルト: A4)
md2pdf-lite document.md --format Letter

# 横向き印刷 (Landscape)
md2pdf-lite presentation.md --landscape
```

### 5. 組み込みテーマの切り替え（GitHub技術風 / クリーン書票風 / 日本ビジネス帳票風）
```bash
# 1. デフォルト: GitHub 技術ドキュメント風 (Primer公式グリッド表、API仕様書向け)
md2pdf-lite document.md -t github

# 2. モダン・クリーン風 (欧米スタイルの三線表・罫線レス、ホワイトペーパー・見積向け)
md2pdf-lite proposal.md -t clean

# 3. 日本企業ビジネス・稟議書風 (伝統の濃紺ヘッダー、縦帯見出し、ヒラギノ角ゴ/游ゴシック最適化、御見積書・稟議書向け)
md2pdf-lite estimate.md -t corporate-ja
```
👉 *仕上がり比較サンプル：GitHub風 [`sample-github.pdf`](examples/sample-github.pdf) vs クリーン風 [`sample-clean.pdf`](examples/sample-clean.pdf) vs 日本ビジネス風 [`sample-corporate-ja.pdf`](examples/sample-corporate-ja.pdf)*

### 6. カスタムスタイルの適用（AI 時代向けカスタマイズ）
```bash
# 外部 CSS ファイルの指定
md2pdf-lite document.md -s custom.css

# インライン CSS の直接指定
md2pdf-lite document.md -c "body { font-size: 16px; color: #333; }"
```
> 🎨 **ChatGPT や Claude に自社専用スタイルを一瞬で生成させたい場合：**  
> 専用ガイド 👉 **[AI 時代のカスタム組版ガイド (docs/CUSTOMIZATION.ja.md)](docs/CUSTOMIZATION.ja.md)** をご覧ください。コピペですぐ使えるプロンプト雛形とセレクタ辞書を収録しています！

### 7. 動作環境の自己診断
```bash
md2pdf-lite --check-env
```

---

## 💻 Node.js プログラミング API

```javascript
const { convert, convertFile, convertBatch } = require('md-to-pdf-lite');

// 1. ファイルから変換
async function run() {
  const result = await convert({
    input: './proposal.md',
    output: './dist/proposal.pdf',
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  console.log('PDF 生成完了:', result.pdfPath);
}

// 2. Markdown 文字列からメモリ上の Buffer を生成（Web サービス・Lambda 等に最適）
async function generateBuffer() {
  const { buffer } = await convert({
    markdown: '# 請求明細書\n\n合計金額：**¥50,000**',
    format: 'A4'
  });
  // buffer に PDF バイナリが格納されます
}
```

---

## 📑 便利な記法サポート

### 改ページ (Page Break)
ページを区切りたい箇所に挿入します：
```markdown
# 第1章：システム概要

<!-- pagebreak -->

# 第2章：インフラ構成（新しいページの先頭から始まります）
```
*(※ `---pagebreak---`、`<!-- page-break -->`、`<div class="page"/>` にも対応しています)*

### 数式レンダリング (KaTeX)
- インライン数式：`$E = mc^2$`
- ブロック表示数式：
```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

---

## 🤖 CI / CD パイプライン連携 (GitHub Actions)

Release 公開時に、リポジトリ内のドキュメントから自動で PDF を生成・添付するワークフロー例：

```yaml
name: PDF 自動生成
on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Chrome および日本語フォントのインストール
        run: |
          sudo apt-get update
          sudo apt-get install -y google-chrome-stable fonts-noto-cjk
      - name: md-to-pdf-lite のインストール
        run: npm install -g md-to-pdf-lite
      - name: PDF 一括変換
        run: md2pdf-lite "docs/*.md" -o dist/
      - uses: actions/upload-artifact@v4
        with:
          name: pdf-documents
          path: dist/*.pdf
```

---

## ⚙️ オプション一覧

| CLI オプション | API プロパティ | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `-o, --output` | `output` | `[元の名前].pdf` | 出力先 PDF パスまたは保存先ディレクトリ |
| `-f, --format` | `format` | `'A4'` | 用紙サイズ (`A4`, `Letter`, `A3`, `Legal` 等) |
| `-l, --landscape` | `landscape` | `false` | 横向きレイアウトを有効化 |
| `-s, --stylesheet` | `stylesheet` | `undefined` | 外部 CSS ファイルのパス |
| `-c, --css` | `css` | `undefined` | インライン CSS 文字列 |
| `--chrome` | `executablePath` | *自動検出* | 使用する Chrome/Chromium の実行パス |

---

## 📄 ライセンス

MIT License © 2026 ajaxsys
