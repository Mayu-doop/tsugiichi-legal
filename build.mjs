// つぎいち 法務・サポートページ ジェネレーター
// content/*.md（単一ソース）→ ブランド配色の静的HTML を生成する。
// 使い方: node build.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const CONTENT = path.join(ROOT, 'content');

// ── ブランド配色（src/theme/tokens.ts の LIGHT より） ──
const C = {
  p: '#4F8CFF', sub: '#EEF5FF', ink: '#222C3D', muted: '#76829B',
  faint: '#A8B1C4', line: '#E8EDF5', bg: '#FFFFFF', purple: '#7C6CF0',
};

// ── ページ定義 ──
const PAGES = [
  { src: 'privacy.md',   out: 'privacy.html',   title: 'プライバシーポリシー', desc: 'つぎいちのプライバシーポリシー' },
  { src: 'terms.md',     out: 'terms.html',     title: '利用規約',             desc: 'つぎいちの利用規約' },
  { src: 'tokushoho.md', out: 'tokushoho.html', title: '特定商取引法に基づく表記', desc: 'つぎいちの特定商取引法に基づく表記' },
  { src: 'support.md',   out: 'support.html',   title: 'サポート・お問い合わせ', desc: 'つぎいちのサポート・お問い合わせ' },
];

// ── インライン変換（エスケープ → bold → link） ──
function inline(s) {
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

// ── Markdown（このプロジェクトで使う範囲）→ HTML ──
function mdToHtml(md) {
  // HTML コメントを除去
  md = md.replace(/<!--[\s\S]*?-->/g, '');
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  const flushList = () => {};
  while (i < lines.length) {
    let line = lines[i];
    const t = line.trim();
    if (t === '') { i++; continue; }
    // 見出し
    let m;
    if ((m = t.match(/^(#{1,6})\s+(.*)$/))) {
      const lvl = m[1].length;
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
      i++; continue;
    }
    // 水平線
    if (/^---+$/.test(t)) { out.push('<hr>'); i++; continue; }
    // テーブル
    if (t.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const header = t.split('|').slice(1, -1).map((c) => c.trim());
      i += 2; // ヘッダ＋区切り
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim().split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      if (header.length === 2) {
        // 2列＝ラベル/内容の定義リスト（スマホで縦積み）
        let dl = '<dl class="kv">';
        for (const r of rows) {
          dl += `<div><dt>${inline(r[0] || '')}</dt><dd>${inline(r[1] || '')}</dd></div>`;
        }
        dl += '</dl>';
        out.push(dl);
      } else {
        // 3列以上＝レスポンシブテーブル（スマホで各セルに項目名を出して縦積み）
        let tbl = '<div class="table-wrap"><table><thead><tr>';
        tbl += header.map((h) => `<th>${inline(h)}</th>`).join('');
        tbl += '</tr></thead><tbody>';
        for (const r of rows) {
          tbl += '<tr>' + header.map((h, idx) =>
            `<td data-label="${h.replace(/"/g, '&quot;')}">${inline(r[idx] || '')}</td>`).join('') + '</tr>';
        }
        tbl += '</tbody></table></div>';
        out.push(tbl);
      }
      continue;
    }
    // 順序なしリスト
    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    // 順序付きリスト
    if (/^\d+\.\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    // 段落（連続する通常行を結合）
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^(#{1,6})\s/.test(lines[i].trim()) && !/^---+$/.test(lines[i].trim()) &&
           !/^[-*]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim()) &&
           !lines[i].trim().startsWith('|')) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ── 共有テンプレート ──
function page({ title, desc, body, active }) {
  const nav = [
    ['index.html', 'ホーム'],
    ['privacy.html', 'プライバシー'],
    ['terms.html', '利用規約'],
    ['tokushoho.html', '特商法'],
    ['support.html', 'サポート'],
  ].map(([href, label]) =>
    `<a href="${href}"${href === active ? ' class="on"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}｜つぎいち</title>
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="index.html">つぎいち</a>
  <nav class="site-nav">${nav}</nav>
</header>
<main class="content">
${body}
</main>
<footer class="site-footer">
  <p class="links"><a href="privacy.html">プライバシーポリシー</a>・<a href="terms.html">利用規約</a>・<a href="tokushoho.html">特定商取引法に基づく表記</a>・<a href="support.html">サポート</a></p>
  <p class="copy">事業者：鈴木麻友　／　お問い合わせ：sub2.31245mail@gmail.com</p>
  <p class="copy">© つぎいち</p>
</footer>
</body>
</html>`;
}

// ── インデックス（ハブ） ──
function indexBody() {
  const cards = [
    ['privacy.html', 'プライバシーポリシー', '取得する情報・利用目的・外部サービス・お問い合わせ先について。'],
    ['terms.html', '利用規約', '本アプリの利用条件、サブスクリプション、免責などについて。'],
    ['tokushoho.html', '特定商取引法に基づく表記', '販売事業者・価格・支払い・解約・返金について。'],
    ['support.html', 'サポート・お問い合わせ', 'ご質問・ご要望・不具合のご報告、よくあるご質問。'],
  ].map(([href, t, d]) =>
    `<a class="card" href="${href}"><h2>${t}</h2><p>${d}</p><span class="go">開く →</span></a>`).join('');
  return `<p class="lead">アプリ「つぎいち」の各種ご案内ページです。</p>
<div class="cards">${cards}</div>`;
}

// ── CSS ──
const css = `:root{
  --p:${C.p}; --sub:${C.sub}; --ink:${C.ink}; --muted:${C.muted};
  --faint:${C.faint}; --line:${C.line}; --bg:${C.bg}; --purple:${C.purple};
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif;
  color:var(--ink); background:
    linear-gradient(180deg,#F4F8FF 0%,#FBFCFF 220px,#FFFFFF 520px) no-repeat;
  line-height:1.85; font-size:16px; -webkit-font-smoothing:antialiased;
}
a{color:var(--p);text-decoration:none}
a:hover{text-decoration:underline}
.site-header{
  max-width:760px;margin:0 auto;padding:20px 22px 10px;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;
}
.brand{
  font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:22px;color:var(--ink);
}
.brand:hover{text-decoration:none}
.site-nav{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:14px}
.site-nav a{color:var(--muted)}
.site-nav a.on{color:var(--p);font-weight:600}
.content{
  max-width:760px;margin:0 auto;padding:18px 22px 40px;
}
.content h1{
  font-family:"Zen Maru Gothic",sans-serif;font-weight:700;
  font-size:30px;line-height:1.4;color:var(--ink);margin:18px 0 6px;letter-spacing:.3px;
}
.content h2{
  font-family:"Zen Maru Gothic",sans-serif;font-weight:700;
  font-size:20px;color:var(--ink);margin:34px 0 10px;padding-top:8px;
}
.content h3{
  font-weight:700;font-size:16.5px;color:var(--ink);margin:22px 0 6px;
}
.content p{margin:12px 0;color:#33405A}
.content ul,.content ol{margin:12px 0 12px 1.4em;color:#33405A}
.content li{margin:6px 0}
.content strong{color:var(--ink);font-weight:700}
.content hr{border:none;border-top:1px solid var(--line);margin:30px 0}
.content a{font-weight:500}
.table-wrap{overflow-x:auto;margin:16px 0}
table{border-collapse:collapse;width:100%;font-size:14.5px;min-width:520px}
th,td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}
th{background:var(--sub);color:var(--ink);font-weight:700;white-space:nowrap}
td{color:#33405A}
/* 2列の定義リスト（特商法など） */
.kv{margin:18px 0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.kv>div{display:flex;border-top:1px solid var(--line)}
.kv>div:first-child{border-top:none}
.kv dt{flex:0 0 36%;background:var(--sub);padding:13px 15px;font-weight:700;color:var(--ink);font-size:14.5px}
.kv dd{flex:1;padding:13px 15px;color:#33405A;font-size:14.5px;min-width:0}
/* 最終更新日（H1直後の最初の段落） */
.content h1 + p{color:var(--muted);font-size:14px;margin-top:0}
.site-footer{
  max-width:760px;margin:0 auto;padding:26px 22px 50px;border-top:1px solid var(--line);
  color:var(--muted);font-size:13px;text-align:center;
}
.site-footer .links{margin-bottom:10px}
.site-footer .links a{color:var(--muted)}
.site-footer .copy{margin:4px 0;color:var(--faint)}
/* インデックス */
.lead{font-size:17px;color:var(--muted);margin:8px 0 22px}
.cards{display:grid;gap:14px}
.card{
  display:block;border:1px solid var(--line);border-radius:16px;padding:20px 22px;
  background:#fff;box-shadow:0 1px 3px rgba(20,40,80,.05);transition:.15s;
}
.card:hover{text-decoration:none;border-color:var(--p);box-shadow:0 8px 24px rgba(79,140,255,.14);transform:translateY(-1px)}
.card h2{font-family:"Zen Maru Gothic",sans-serif;font-size:18px;color:var(--ink);margin:0 0 6px}
.card p{color:var(--muted);font-size:14.5px;margin:0 0 10px;line-height:1.7}
.card .go{color:var(--p);font-weight:600;font-size:14px}
@media(max-width:520px){
  .content h1{font-size:25px}
  body{font-size:15.5px}
  /* 2列定義リストを縦積み */
  .kv>div{flex-direction:column}
  .kv dt{flex:none;border-bottom:1px solid var(--line)}
  /* 3列以上のテーブルを縦積みカードに */
  table{min-width:0}
  thead{display:none}
  table,tbody,tr,td{display:block;width:100%}
  tr{border:1px solid var(--line);border-radius:12px;margin:12px 0;background:#fff;overflow:hidden}
  td{border:none;border-top:1px solid var(--line);padding:10px 14px}
  tr td:first-child{border-top:none}
  td::before{content:attr(data-label);display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:3px}
}`;

// ── 生成 ──
fs.writeFileSync(path.join(ROOT, 'style.css'), css);
for (const p of PAGES) {
  const md = fs.readFileSync(path.join(CONTENT, p.src), 'utf8');
  const body = mdToHtml(md);
  fs.writeFileSync(path.join(ROOT, p.out), page({ title: p.title, desc: p.desc, body, active: p.out }));
  console.log('wrote', p.out);
}
fs.writeFileSync(path.join(ROOT, 'index.html'),
  page({ title: 'ご案内', desc: 'つぎいちの各種ご案内ページ', body: indexBody(), active: 'index.html' }));
console.log('wrote index.html');
// GitHub Pages がページを Jekyll 処理しないように
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');
console.log('done');
