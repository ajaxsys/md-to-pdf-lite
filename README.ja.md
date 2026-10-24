# md-to-pdf-lite 🚀

> **Chromiumを内包しない超軽量設計のモダン Markdown to PDF コンバーター。日本語（CJK）商用組版、Mermaid ベクター図、KaTeX 数式、構文ハイライトに完全対応。AIの生成結果からクライアント向け公式ドキュメント納品までの「ラストワンマイル」を解決します。**

<p align="center">
  <a href="https://d3gwzeb0uub1l.cloudfront.net/"><img src="https://img.shields.io/badge/⚡_オンライン体験-Web_スタジオ-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white" alt="オンライン体験"></a>
  <a href="#-自社-aws-への-1-click-サーバーレス-プライベートデプロイ"><img src="https://img.shields.io/badge/☁️_自社デプロイ-AWS_Serverless-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWSへデプロイ"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="License"></a>
  <a href="#-セキュリティbot防止アーキテクチャpow--プライベートキー"><img src="https://img.shields.io/badge/防御-PoW_計算証明対応-8b5cf6?style=for-the-badge" alt="PoW 防御"></a>
</p>

<p align="center">
  <a href="README.md"><b>English</b></a> | <a href="README.zh-CN.md"><b>简体中文</b></a> | <a href="README.ja.md"><b>日本語</b></a>
</p>

---

## 🌟 開発の背景：AIの生成結果からクライアント納品までの「ラストワンマイル」を解決

ChatGPT、Claude、DeepSeek などの生成AIがビジネスの現場に定着した現在、**Markdown はあらゆる大規模言語モデル（LLM）が出力する「標準共通言語」**となっています。システム要件定義書、アーキテクチャ設計書、見積書、コンサルティング提案書から議事録に至るまで、AI は極めて質の高い Markdown 構造や Mermaid 図を瞬時に生成してくれます。

しかし、実際のビジネス現場における顧客納品には大きな断絶が存在していました：
- 🏢 **クライアントや経営陣にそのまま渡せる形式ではない**: 顧客が求めるのはチャット画面のスクリーンショットや生のテキストではなく、**洗練されたタイポグラフィ、整ったレイアウト、そのまま印刷・押印・社外提示が可能な高品質の商業グレード PDF** です；
- ⏳ **Word や Pages への手動流し込みによる工数増とレイアウト崩れ**: コピペでオフィスソフトへ移植すると、表の列幅崩れ、コードハイライトの消失、数式やダイアグラムの破損が頻発し、手作業の再調整に多くの時間が奪われます；
- 🔒 **Web 変換サービスの機密漏洩・セキュリティリスク**: 機密保持契約（NDA）下の提案書や社外秘の設計書をクラウド型変換サービスにアップロードすることは、コンプライアンス上許容されません。

**`md-to-pdf-lite` は、この「AI 出力からクライアント納品までのラストワンマイル」を解決するために生まれました：**  
重厚なブラウザの追加ダウンロードを一切排除し、完全オフラインでデータを100%保護しながら、AI が作成した Markdown をわずか数秒でプロ品質の PDF へ変換します。直感的なドラッグ＆ドロップ改ページ機能を備えた Web スタジオや、日本のビジネス文書に最適化された濃紺テーマにより、AI の生産性をそのまま公式な納品価値へと直結させます。

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
- 🖱️ **ドラッグ＆ドロップ改ページと 1:1 リアルタイム再計算**: Markdown からの PDF 出力における最大の悩みである「どこで改ページされるか分からない」「表やコードブロックが意図せず分断される」問題を直感的操作で解消。WYSIWYG エディタ上で改ページカプセルを**直接ドラッグ＆ドロップ**でき、96 DPI 物理紙面モデルに基づき下部コンテンツの残余高さをリアルタイム再計算します；
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

## 🖥️ Web スタジオ：ドラッグ＆ドロップ改ページと 1:1 リアルタイム再計算

従来の Markdown to PDF 変換では、**「どの要素がページをまたいで分断されるか事前に分からず、試行錯誤を繰り返す」**という大きな課題がありました。

`md-to-pdf-lite` は、TipTap ベースの**所見即所得（WYSIWYG）Web スタジオ**を標準装備し、この問題を直感的に解決します：

- **🖱️ ドラッグ＆ドロップ改ページカプセル**: 改ページが単なる見えないタグではなく、視覚的なカプセルバー（`[ 📄 Page Break · Page 1 End · 改ページ ]`）として表示されます。ツールバーからワンクリックで挿入でき、カプセルを**上下にドラッグ＆ドロップ**するだけで改ページ位置を自由自在に微調整できます；
- **📐 1:1 物理紙面モデルとリアルタイム自動再計算**: Chromium の印刷エンジン（96 DPI / A4 有効高さ 1009.13px）を忠実にシミュレート。改ページバーを動かした瞬間、その位置を基点として下部コンテンツの残余スペースを極速（`~50ms`）で再計算し、ページ番号と自動改ページ破線を更新します；
- **⚡ スマート2層ガイド線**: ユーザーが意図して配置した「手動改ページ」と、紙面から溢れ出たことによる「自動改ページ点（Auto Break）」を明確に区別し、重複やコードブロックへの誤侵入を完全に防ぎます；
- **📊 Mermaid リアルタイム編集**: 図表カードのソースコード編集ボタンを展開し、直感的に図を修正・即時ベクター SVG レンダリング；
- **💻 ローカル開発環境の即時起動**: コマンド1つでローカルスタジオが起動：
  ```bash
  npm run dev
  # Web スタジオが http://localhost:3555/ で起動します
  ```
  *(組み込みのローカル開発ミドルウェアにより、端末内の Chrome と連携して即座に商用クオリティの PDF を出力可能です)*

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

### コードブロックとダークモード指定 (`:dark`)
A4 用紙や見積書などのビジネス文書での可読性とインク節約のため、コードブロックはデフォルトで白紙に調和する明色カード（`#f8fafc`）で統一されています。
ターミナル出力や特定のコードを強調したい場合、言語名の後ろに `:dark` または `dark` を付与することで、Slate-900 のダークテーマカードに切り替え可能です：

````markdown
<!-- デフォルト：用紙に馴染む上品な明色カード -->
```typescript
import { convert } from 'md-to-pdf-lite';
```

<!-- 明示的なダークカード：スタイリッシュな暗色背景とネオンハイライト -->
```typescript:dark
import { convert } from 'md-to-pdf-lite';
```
````
*(※ ` ```bash dark ` にも対応しています)*

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

## ☁️ 自社 AWS への 1-Click サーバーレス プライベートデプロイ

社内コンプライアンスや機密保持要件により**ドキュメントを外部の第三者サーバーへアップロードすることが禁じられている**企業や医療・金融機関向けに、自社の AWS アカウント配下へわずか 2 分で完全プライベートな Serverless 変換環境を構築できます：

### アーキテクチャの強み
- **AWS Lambda** (1536 MB メモリ、Chromium + Noto Sans CJK 日本語フォント一式 + カラー絵文字を標準内包)
- **Amazon CloudFront** + **Amazon S3** (3言語対応 TipTap Web スタジオの静的ホスティング＆グローバル CDN 配信)
- **デュアルチャネル・セキュリティ**: Web 訪問者向けの**クライアント側 PoW (工作量証明)**（Bot やクローラーによるスパムを完全防御） + CLI/CI/CD 向けの **Private API Key** による即時パス
- **圧倒的な低コスト**: AWS 常時無料枠（Always-Free Tier）の範囲内で毎月最大 17 万ドキュメントまで追加料金なしで利用可能（待機コストは **完全0円**）

### 🚀 ワンステップ簡単デプロイ手順
```bash
# 1. 本リポジトリをクローン
git clone https://github.com/ajaxsys/md-to-pdf-lite.git
cd md-to-pdf-lite

# 2. 環境変数の設定
cp .env.example .env
# .env 内に独自の PRIVATE_API_KEY を設定

# 3. コマンド1発で全自動デプロイ
./deploy.sh
```
デプロイスクリプトが Amazon ECR へのコンテナビルド、Lambda 関数、CloudFront CDN の構築をすべて自動で行い、完了時に社内専用の CloudFront URL を表示します！

---

## 📄 ライセンス

MIT License © 2026 ajaxsys

