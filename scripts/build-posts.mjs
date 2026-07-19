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

// 最基本的脚本剥离（内容来自仓库主人自己的 issue）
function sanitize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function enhance(html) {
  // 视频附件链接 → 内嵌播放器
  return html.replace(
    /<a href="(https?:\/\/[^"]+\.(?:mp4|mov|webm)[^"]*)"[^>]*>[^<]*<\/a>/gi,
    '<video controls preload="metadata" src="$1" style="max-width:100%;border-radius:6px;"></video>'
  );
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
    html: enhance(sanitize(marked.parse(body))),
  };
});

mkdirSync('posts', { recursive: true });
writeFileSync(
  'posts/posts.json',
  JSON.stringify({ generated_at: new Date().toISOString(), posts }, null, 2)
);
console.log(`OK: ${posts.length} 篇文章已写入 posts/posts.json`);
