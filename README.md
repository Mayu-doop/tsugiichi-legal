# つぎいち 法務・サポートページ

モバイルアプリ「つぎいち」のプライバシーポリシー・利用規約・特定商取引法に基づく表記・サポートページを GitHub Pages で公開するための静的サイト。

## 構成

- `content/*.md` … 各ページの本文（単一ソース）
- `build.mjs` … `content/*.md` → ブランド配色の HTML を生成するジェネレーター（依存なし・`node build.mjs`）
- `*.html` / `style.css` … 生成物（GitHub Pages がそのまま配信）
- `.nojekyll` … GitHub Pages の Jekyll 処理を無効化

## 更新のしかた

1. `content/` の Markdown を編集
2. `node build.mjs` で再生成
3. コミット & push（GitHub Pages が自動反映）

## 公開URL

- ホーム: `https://kimera-doop.github.io/tsugiichi-legal/`
- プライバシーポリシー: `.../privacy.html`
- 利用規約: `.../terms.html`
- 特定商取引法に基づく表記: `.../tokushoho.html`
- サポート: `.../support.html`

事業者：鈴木麻友 ／ お問い合わせ：sub2.31245mail@gmail.com
