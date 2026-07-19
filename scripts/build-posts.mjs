/**
 * build-posts.mjs
 * 把仓库里「open 且带 post 标签」的 issue 渲染成 posts/posts.json
 * 用法：GH_TOKEN=xxx REPO=owner/repo node scripts/build-posts.mjs
 *
 * - cover: 取正文第一张图片作为封面
 * - excerpt: 正文纯文本前 90 字
 * - mp4/mov/webm 链接 → <video> 播放器
 */
import { marked } from 'marked';
import { writeFileSync, mkdirSync } from 'node:fs';

const token = process.env.GH_TOKEN;
const repo = process.env.REPO; // e.g. "Everett406/Everett406.github.io"
if (!token || !repo) {
  console.error('缺少 GH_TOKEN 或 REPO 环境变量');
  process.exit(1);
}

marked.setOptions({ gfm: true, breaks: true });

// marked 对下划线 _ 的斜体切分跟「_**粗斜体**_」这类写法冲突，
// 会把第一个 _ 贪婪匹配到下一个 _，导致粗斜体散架。
// 这里在解析前把常见强调组合归一成 marked 支持良好的 *** 形式。
function normalizeEmphasis(md) {
  return md
    // _**text**_  → ***text***
    .replace(/_+\*\*([^*\n]+?)\*\*_+/g, '***$1***')
    // **_text_**  → ***text***
    .replace(/\*\*_+([^*\n]+?)_+\*\*/g, '***$1***')
    // __**text**__ → ***text***
    .replace(/__\*\*([^*\n]+?)\*\*__/g, '***$1***')
    // 单独的 _text_ 斜体 → *text*
    // marked 用 _ 判斜体时要求下划线两侧是空白/标点边界，
    // 紧贴中文时不识别（会原样留下 _）。星号对中文友好，统一转成星号。
    // 只转「两侧均非下划线」的成对 _..._，避免误伤 __粗体__ 与代码块。
    .replace(/(^|[^\w_])_([^_\n]+?)_(?=[^\w_]|$)/g, '$1*$2*');
}

// 最基本的脚本剥离（内容来自仓库主人自己的 issue）
function sanitize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function enhance(html) {
  // 1) 视频附件链接 → 内嵌播放器
  //    a) 显式扩展名 .mp4/.mov/.webm 的链接
  //    b) GitHub Issue 上传的视频附件（github.com/user-attachments/assets/<uuid>），
  //       这类链接没有扩展名，但实际是视频（用户把视频拖进 Issue 编辑器生成）。
  html = html.replace(
    /<a href="(https?:\/\/[^"]+\.(?:mp4|mov|webm)[^"]*)"[^>]*>[^<]*<\/a>/gi,
    '<video controls preload="metadata" src="$1"></video>'
  );
  html = html.replace(
    /<a href="(https:\/\/github\.com\/user-attachments\/assets\/[0-9a-f-]+)"[^>]*>[^<]*<\/a>/gi,
    '<video controls preload="metadata" src="$1"></video>'
  );

  // 2) marked 的 GFM task list 会渲染成 <ul><li><input type="checkbox">...，
  //    但不会给 ul 加 class，这里补上，方便 CSS 区分任务列表与普通无序列表。
  html = html.replace(
    /<ul>\s*<li><input type="checkbox"/g,
    '<ul class="task-list"><li><input type="checkbox"'
  );

  return html;
}

function extractCover(md) {
  const m = md.match(/!\[[^\]]*\]\((https?:\/\/[^)\s"]+)/) || md.match(/<img[^>]+src=["']?(https?:\/\/[^"'\s>]+)/i);
  return m ? m[1] : null;
}

function extractExcerpt(md) {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')          // 图片
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // 链接
    .replace(/```[\s\S]*?```/g, ' ')                  // 代码块
    .replace(/[#>*`_~|-]/g, '')                       // markdown 符号
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 90);
}

async function listPostIssues() {
  const issues = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?labels=post&state=open&per_page=100&page=${page}&sort=created&direction=desc`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    issues.push(...batch.filter(i => !i.pull_request));
    if (batch.length < 100) break;
    page++;
  }
  return issues;
}

const issues = await listPostIssues();

const posts = issues.map(i => {
  const body = i.body || '';
  return {
    slug: `p-${i.number}`,
    title: i.title || '未命名',
    date: (i.created_at || '').slice(0, 10),
    issue_url: i.html_url,
    number: i.number,
    cover: extractCover(body),
    excerpt: extractExcerpt(body),
    html: enhance(sanitize(marked.parse(normalizeEmphasis(body)))),
  };
});

mkdirSync('posts', { recursive: true });
writeFileSync(
  'posts/posts.json',
  JSON.stringify({ generated_at: new Date().toISOString(), posts }, null, 2)
);
console.log(`OK: ${posts.length} 篇文章已写入 posts/posts.json`);
