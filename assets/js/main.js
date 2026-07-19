/* ═══════════════════════════════════════════════════════════
   《折腾志》 main.js v2
   主题 / 路由+丝滑转场 / 滚动动效 / 看板 / 黑胶唱机 / 光标+磁吸
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── 工具 ─────────────────────────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 1023px)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
async function fetchJSON(url, timeout = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
function jsonp(url, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const cb = '__ztzcb' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    const t = setTimeout(() => { cleanup(); reject(new Error('jsonp timeout')); }, timeout);
    window[cb] = d => { cleanup(); resolve(d); };
    s.onerror = () => { cleanup(); reject(new Error('jsonp error')); };
    function cleanup() { clearTimeout(t); try { window[cb] = () => {}; } catch {} s.remove(); }
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.head.appendChild(s);
  });
}

/* ── 主题（墨黑书卷） ─────────────────────────────────── */
const theme = {
  get current() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; },
  set(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('ztz-theme', t);
    dispatchEvent(new CustomEvent('ztz:theme', { detail: t }));
  },
  init() {
    $$('[data-theme-toggle]').forEach(b =>
      b.addEventListener('click', () => this.set(this.current === 'dark' ? 'light' : 'dark')));
  },
};

/* ── 数据：项目 ───────────────────────────────────────── */
const PROJECTS = [
  {
    slug: 'blind-watermark', char: '隐', no: '001',
    name: '隐印', en: 'Blind Watermark',
    desc: 'Android 盲水印工具。基于 DWT-DCT-SVD 算法，支持文本 / 图片 / 比特数组水印的嵌入与提取。',
    tags: ['Kotlin', 'Android', 'DWT-DCT-SVD'], year: '2026',
    repo: 'https://github.com/Everett406/blind-watermark-android',
    story: `
      <p><strong>盲水印</strong>是一种肉眼不可见、却能用算法重新提取出来的水印。图片被截图、压缩、裁剪之后，它依然顽固地活在像素里。</p>
      <h3>为什么做这个</h3>
      <p>图片来源追溯、版权保护、防泄密 —— 这些场景都需要一种「看不见但查得到」的标记方式。市面上的工具要么藏在 PC 端的命令行里，要么收费。我想把它塞进每个人的口袋。</p>
      <h3>怎么做</h3>
      <p>核心算法走 <strong>DWT → DCT → SVD</strong> 三层变换：先小波分解把图像拆成频带子图，再对选定子图做离散余弦变换，最后对系数矩阵做奇异值分解，把水印信息藏进奇异值里。原生 Android 实现，不依赖服务端，离线可用。</p>
      <blockquote>看不见的东西，不代表不存在。</blockquote>`
  },
  {
    slug: 'fengzhi-weather', char: '风', no: '002',
    name: '风止', en: 'Fengzhi Weather',
    desc: '气象聚合 Android APP。卫星云图、雷达图、天气预报，一站式看清天空。',
    tags: ['Kotlin', 'Android', '气象数据'], year: '2026',
    repo: 'https://github.com/Everett406/fengzhi-weather',
    story: `
      <p>「风止」这个名字来自一种期待：风雨再大，总有停的时候；而在它来之前，你最好已经看见了它。</p>
      <h3>聚合，而非重复造轮子</h3>
      <p>气象数据散落在各处：卫星云图在气象局，雷达回波在雷达站，预报在各个接口。风止做的事是把它们聚到一个屏里 —— 卫星云图、雷达拼图、逐小时预报，滑动即看。</p>
      <h3>为什么</h3>
      <p>爱玩硬件的人对天气有本能的敏感。风速、降水、能见度，每一项都决定今天能不能出门折腾。这个 APP 首先是做给自己用的。</p>`
  },
  {
    slug: 'jiwei-tiku', char: '微', no: '003', featured: true,
    name: '积微题库', en: 'Jiwei Quiz',
    desc: 'Capacitor 移动端题库应用。多题型、错题本、进度追踪，离线也能刷。从一门考证工具，长成一个通用刷题框架。',
    tags: ['Capacitor', 'JavaScript', '离线优先'], year: '2026',
    repo: 'https://github.com/Everett406/jiwei-tiku',
    story: `
      <p><strong>一句话定位：让任何一个有 Excel 的人，都能在一分钟内拥有自己的刷题 APP。</strong></p>
      <h3>起源</h3>
      <p>它最初是一门职业技能考证的辅助工具 —— 网上找不到完整权威的理论题库，现有的刷题 APP 广告多、收费高、还不能导入自己的题。日常时间碎片化，需要一个能随时掏出来刷两道题的东西。</p>
      <h3>从工具到框架</h3>
      <p>经过多轮迭代，它从「一个考证题库网页」长成了基于 Capacitor 的原生 Android APP：顺序练习、随机练习、错题本、模拟考试、成绩分析，全部离线运行。代码结构预留了通用接口，目标是支持任意领域的题库导入。</p>
      <h3>技术选择</h3>
      <p>刻意不用 React/Vue —— 原生 HTML + ES6 + Capacitor 桥接原生能力（震动反馈、本地通知、返回键拦截）。<strong>极简技术栈</strong>意味着任何人都能看懂、都能改。</p>
      <blockquote>人生的意义在于折腾，而这个 APP 的意义在于：让折腾出来的知识，能被高效地记住。</blockquote>`
  },
  {
    slug: 'mxcard', char: '卡', no: '004',
    name: 'MX-CARD', en: 'MX-CARD',
    desc: '航空维修数字化工卡系统。把纸质的维修工卡，搬进屏幕里。',
    tags: ['Web', '数字化', '航空维修'], year: '2026',
    repo: 'https://github.com/Everett406/mxcard',
    story: `
      <p>航空维修离不开工卡 —— 每一步操作都要按卡作业、签字确认。纸质工卡厚重、易损、难追溯，数字化是行业的必然方向。</p>
      <h3>做什么</h3>
      <p>MX-CARD 把工卡流程搬到屏幕上：结构化步骤、逐项签署、全程留痕。这是把课堂知识和真实工业流程连起来的一次尝试。</p>`
  },
  {
    slug: 'sharp-viewer', char: '景', no: '005',
    name: 'SharpView', en: 'Sharp Mobile Viewer',
    desc: '把照片转化为 3D 高斯泼溅场景的 Android App。Apple SHARP + GitHub Actions 云端构建。',
    tags: ['Capacitor', '3DGS', 'GitHub Actions'], year: '2026',
    repo: 'https://github.com/Everett406/sharp-mobile-viewer',
    story: `
      <p>高斯泼溅（3D Gaussian Splatting）是近几年最惊艳的三维重建技术：几张照片，就能还原出一个可以自由视角漫游的场景。</p>
      <h3>手机上的 3D</h3>
      <p>SharpView 想让你掏出手机拍一圈，就能在掌心得到一个立体的「那一刻」。基于 Apple 开源的 SHARP 模型，云端用 GitHub Actions 完成构建，移动端负责浏览与展示。</p>`
  },
  {
    slug: 'roll-call', char: '点', no: '006',
    name: '点名 APP', en: 'Roll Call',
    desc: 'Flutter 跨端点名工具。随机点名、分组、记录导出，课堂好帮手。',
    tags: ['Flutter', 'Dart', '跨端'], year: '2026',
    repo: 'https://github.com/Everett406/Roll-Call-APP',
    story: `
      <p>一个简单但高频的需求：上课时随机点人、自动分组、把出勤记录导出来。</p>
      <h3>Flutter 练手作</h3>
      <p>这是 Flutter 跨端探索期的作品 —— 一套代码同时跑在 Android 和桌面上。随机算法做了防重复处理，保证一学期下来每个人都会被公平地「眷顾」到。</p>`
  },
  {
    slug: 'motion-extractor', char: '动', no: '007',
    name: 'Motion Extractor', en: 'Motion Extractor',
    desc: '动作提取视频处理器。从画面里把「运动」本身分离出来的视觉实验。',
    tags: ['Python', 'OpenCV', '视频处理'], year: '2026',
    repo: 'https://github.com/Everett406/motion-extractor-app',
    story: `
      <p>如果把一段视频里所有静止的东西都删掉，只留下「动」的部分，会看到什么？</p>
      <p>Motion Extractor 用帧间差分与背景建模回答这个问题：行人留下残影，树叶消失不见，世界被还原成纯粹的运动轨迹。一个视觉特效玩具，也是一次计算机视觉的练手。</p>`
  },
  {
    slug: 'esp32-tutorials', char: '焊', no: '008',
    name: 'ESP32 教程', en: 'ESP32 Tutorials',
    desc: 'Arduino 与 C 语言入门教程。硬件编程，从点亮一颗灯开始。',
    tags: ['C++', 'ESP32', 'Arduino'], year: '2026',
    repo: 'https://github.com/Everett406/ESP32-Tutorials',
    story: `
      <p>软件写得再溜，第一次让一颗 LED 按自己的代码闪烁时，还是会心动。</p>
      <h3>写给零基础</h3>
      <p>这是一套面向初学者的 ESP32 / Arduino 教程：从 C 语言基础到 GPIO、PWM、传感器，每一步都有可运行的最小示例。硬件的乐趣在于 —— bug 是看得见摸得着的。</p>`
  },
  {
    slug: 'quiz-web', char: '题', no: '009',
    name: 'Quiz', en: 'Quiz Web',
    desc: '题库 Web App。在线刷题、模拟考试、错题记录与学习统计。',
    tags: ['Web', 'JavaScript', '响应式'], year: '2026',
    repo: 'https://github.com/Everett406/Quiz',
    story: `
      <p>积微题库的网页版兄弟。打开浏览器就能刷题，适配移动端与桌面端。</p>
      <p>支持在线练习、模拟考试、错题记录和学习统计 —— 数据存在本地，关掉页面也不会丢。</p>`
  },
  {
    slug: 'daily-report', char: '报', no: '010',
    name: '日报生成', en: 'Daily Report',
    desc: 'Python 自动化日报生成器。数据抓取、分析、报告输出一条龙。',
    tags: ['Python', '自动化'], year: '2026',
    repo: 'https://github.com/Everett406/daily-report',
    story: `
      <p>重复的文书工作，是程序员最不能忍的事情之一。</p>
      <p>这个 Python 工具自动抓取数据、做简单分析、输出格式工整的日报 —— 把每天半小时的机械劳动，压缩成一次回车。</p>`
  },
];

/* ── 数据：足迹 ───────────────────────────────────────── */
const TIMELINE = [
  { year: '2006', tag: '启程', title: '来到这个世界', desc: '千禧年之后，故事从这里开始。具体坐标就不写了 —— 留一点神秘感。', more: '据说小时候最喜欢拆东西，装不回去的那种。' },
  { year: '2023', tag: '入门', title: '初识 Android', desc: '开始学 Kotlin 与 Android 原生开发，完成第一个练手项目。原来代码真的可以在自己手机上跑起来。', more: '第一个 APP 跑起来的时候，盯着屏幕看了很久。' },
  { year: '2024', tag: '探索', title: '跨端与自动化', desc: '深入 Flutter 跨端开发，同时用 Python 写各种自动化小工具 —— 能偷懒的地方，绝不手动。', more: '从此什么重复劳动都想写成脚本。' },
  { year: '2025', tag: '新篇', title: '长沙，与全栈', desc: '来到长沙上学；同时接触 React、TypeScript 与 Node.js，搭起第一个个人主页。', more: '新城市，新方向，旧习惯：折腾。' },
  { year: '2026', tag: '现在', title: '持续折腾', desc: '十六个开源项目，从 Android 到 Web，从工具到应用。折腾不停，好奇心不减。', more: '下一个会是什么？我也不知道，这正是有趣的部分。' },
];

/* ── 渲染：项目 ───────────────────────────────────────── */
function renderProjects() {
  const grid = $('#projectGrid');
  grid.innerHTML = '';
  PROJECTS.forEach((p, i) => {
    const card = el('article', 'project-card reveal' + (p.featured ? ' featured' : ''));
    card.style.setProperty('--d', `${(i % 4) * 0.08}s`);
    card.dataset.slug = p.slug;
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <span class="pc-char" aria-hidden="true">${p.char}</span>
      ${p.featured ? '<span class="pc-badge">主打</span>' : '<span class="pc-arrow" aria-hidden="true">↗</span>'}
      <span class="pc-no">${p.no} / ${p.en.toUpperCase()}</span>
      <h3 class="pc-name">${p.name}<em>${p.en}</em></h3>
      <p class="pc-desc">${p.desc}</p>
      <div class="pc-meta">
        <span class="pc-tags">${p.tags.map(t => `<i>${t}</i>`).join('')}</span>
        <span class="pc-year">${p.year}</span>
      </div>
      <span class="pc-line" aria-hidden="true"></span>`;
    card.addEventListener('click', () => go(`/project/${p.slug}`, card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(`/project/${p.slug}`, card); } });
    grid.appendChild(card);
  });
}

/* ── 渲染：足迹 ───────────────────────────────────────── */
function renderTimeline() {
  const tl = $('#timeline');
  $$('.tl-item', tl).forEach(n => n.remove());
  TIMELINE.forEach((t, i) => {
    const item = el('div', 'tl-item reveal');
    item.style.setProperty('--d', `${i * 0.05}s`);
    item.innerHTML = `
      <div class="tl-year">${t.year}<small>${t.tag}</small></div>
      <div class="tl-title">${t.title}</div>
      <p class="tl-desc">${t.desc}</p>
      <div class="tl-more"><p>${t.more}</p></div>`;
    tl.appendChild(item);
  });
}

/* ── 渲染：文章 ───────────────────────────────────────── */
let POSTS = [];
async function fetchPosts() {
  try {
    const data = await fetchJSON('posts/posts.json?v=' + Date.now(), 5000);
    POSTS = Array.isArray(data.posts) ? data.posts : [];
  } catch { POSTS = []; }
}
function postRowHTML(p) {
  const cover = p.cover
    ? `<span class="pr-cover"><img data-src="${esc(p.cover)}" alt="" loading="lazy" decoding="async" class="lazy-img" onerror="this.parentNode.textContent='${esc((p.title || '文')[0])}'"></span>`
    : `<span class="pr-cover">${esc((p.title || '文')[0])}</span>`;
  return `
    ${cover}
    <span class="pr-text">
      <span class="pr-title">${esc(p.title)}</span>
      ${p.excerpt ? `<span class="pr-excerpt">${esc(p.excerpt)}</span>` : ''}
    </span>
    <span class="pr-date">${esc(p.date || '')}</span>
    <span class="pr-arrow" aria-hidden="true">→</span>`;
}
function renderPosts() {
  const list = $('#postList');
  list.innerHTML = '';
  if (!POSTS.length) {
    list.appendChild(el('div', 'post-empty',
      `还没有文章。<a href="https://github.com/Everett406/Everett406.github.io/issues/new" target="_blank" rel="noopener">去发第一个 Issue</a>，它就会出现在这里。`));
    $('#postMore').hidden = true;
    return;
  }
  POSTS.slice(0, 5).forEach((p, i) => {
    const row = el('div', 'post-row reveal');
    row.style.setProperty('--d', `${i * 0.06}s`);
    row.innerHTML = postRowHTML(p);
    row.addEventListener('click', () => go(`/post/${p.slug}`));
    list.appendChild(row);
  });
  $('#postMore').hidden = POSTS.length <= 5;
  observeReveals();
}

/* ── 详情页 ───────────────────────────────────────────── */
const detailRoot = $('#detailRoot');
let openedCard = null;

function detailHTML(inner) {
  return `
    <button class="detail-back" data-back>← 返回</button>
    <div class="detail-wrap">${inner}</div>`;
}
function renderProjectDetail(slug) {
  const p = PROJECTS.find(x => x.slug === slug);
  if (!p) return null;
  return detailHTML(`
    <div class="detail-hero">
      <span class="detail-char" aria-hidden="true">${p.char}</span>
      <p class="detail-kicker">${p.no} · PROJECT · ${p.en.toUpperCase()}</p>
      <h1 class="detail-title">${p.name}</h1>
      <div class="detail-meta">
        ${p.tags.map(t => `<span class="dm-tag">${t}</span>`).join('')}
        <span class="dm-tag">${p.year}</span>
        <a class="dm-link" href="${p.repo}" target="_blank" rel="noopener">GitHub 仓库 ↗</a>
      </div>
    </div>
    <div class="detail-body">${p.story}</div>`);
}
function renderPostDetail(slug) {
  const p = POSTS.find(x => x.slug === slug);
  if (!p) return null;
  return detailHTML(`
    <div class="detail-hero">
      <p class="detail-kicker">POST · ${esc(p.date || '')}</p>
      <h1 class="detail-title">${esc(p.title)}</h1>
      <div class="detail-meta">
        <a class="dm-link" href="${esc(p.issue_url || '#')}" target="_blank" rel="noopener">在 GitHub 查看原文 ↗</a>
      </div>
      ${p.cover ? `<img class="detail-cover lazy-img" data-src="${esc(p.cover)}" alt="" loading="lazy" decoding="async">` : ''}
    </div>
    <div class="detail-body">${p.html || '<p>（空）</p>'}</div>`);
}
const ARCHIVE_PAGE_SIZE = 10;
function renderArchive(page = 1) {
  const total = POSTS.length;
  const pages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  page = Math.min(Math.max(1, page), pages);
  const items = POSTS.slice((page - 1) * ARCHIVE_PAGE_SIZE, page * ARCHIVE_PAGE_SIZE);
  return detailHTML(`
    <div class="detail-hero">
      <p class="detail-kicker">ARCHIVE · 共 ${total} 篇</p>
      <h1 class="detail-title">文章归档</h1>
    </div>
    <div class="archive-list">
      ${items.map(p => `<div class="post-row" data-slug="${esc(p.slug)}">${postRowHTML(p)}</div>`).join('') || '<div class="post-empty">还没有文章。</div>'}
    </div>
    <div class="archive-pager">
      <button data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>← 上一页</button>
      <span>${page} / ${pages}</span>
      <button data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>下一页 →</button>
    </div>`);
}

/* ── 路由 + 丝滑转场（进出对称） ──────────────────────── */
const VT = !reducedMotion && 'startViewTransition' in document;

function setDetail(html) {
  if (html == null) {
    detailRoot.classList.remove('open');
    detailRoot.setAttribute('aria-hidden', 'true');
    detailRoot.innerHTML = '';
    document.body.style.overflow = '';
  } else {
    detailRoot.innerHTML = html;
    detailRoot.classList.add('open');
    detailRoot.setAttribute('aria-hidden', 'false');
    detailRoot.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    // data-lenis-prevent 已让 Lenis 放过详情页，原生滚轮直接生效
    const back = $('[data-back]', detailRoot);
    back && back.addEventListener('click', () => go('/'));
    $$('.post-row', detailRoot).forEach(row =>
      row.addEventListener('click', () => go(`/post/${row.dataset.slug}`)));
    $$('.archive-pager button', detailRoot).forEach(btn =>
      btn.addEventListener('click', () => go(`/posts?page=${btn.dataset.page}`)));
    // 文章详情里的 <video> 套上自定义播放器皮肤
    initVideoPlayers(detailRoot);
    // 列表封面 + 详情正文图懒加载
    initLazyImages(detailRoot);
  }
}

/* ── 自定义视频播放器皮肤 ───────────────────────────────
   把 .detail-body video 包进 .ztz-video，隐藏原生 controls，
   注入朱砂书卷风控制条：播放/暂停、进度、时长、音量、全屏。
   只依赖 $ / $$ / el。重复调用安全（已初始化的会跳过）。 */
function initVideoPlayers(scope = document) {
  $$('.detail-body video', scope).forEach(v => {
    if (v.closest('.ztz-video') || v.dataset.ztzReady) return;
    // 只处理带原生 controls 的（我们渲染产物默认带），改造时移除原生控件
    const hadNative = v.hasAttribute('controls');
    v.removeAttribute('controls');
    v.preload = 'metadata';

    const wrap = el('div', 'ztz-video');
    v.parentNode.insertBefore(wrap, v);
    wrap.appendChild(v);

    // 控制条
    const bar = el('div', 'ztz-vbar');
    bar.innerHTML = `
      <button class="ztz-vp" type="button" aria-label="播放/暂停">
        <svg class="ic-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        <svg class="ic-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
      </button>
      <span class="ztz-vt ztz-vcur">0:00</span>
      <div class="ztz-vseek" role="slider" aria-label="进度" tabindex="0">
        <i class="ztz-vbuf"></i><i class="ztz-vfill"></i><i class="ztz-vknob"></i>
      </div>
      <span class="ztz-vt ztz-vdur">0:00</span>
      <button class="ztz-vm" type="button" aria-label="静音/取消" aria-pressed="false">
        <svg class="ic-vol" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
        <svg class="ic-mute" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13 0 5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
      <button class="ztz-vf" type="button" aria-label="全屏">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
    wrap.appendChild(bar);

    const btnPlay = $('.ztz-vp', bar);
    const btnMute = $('.ztz-vm', bar);
    const btnFull = $('.ztz-vf', bar);
    const seek = $('.ztz-vseek', bar);
    const fill = $('.ztz-vfill', seek);
    const buf = $('.ztz-vbuf', seek);
    const knob = $('.ztz-vknob', seek);
    const cur = $('.ztz-vcur', bar);
    const dur = $('.ztz-vdur', bar);

    const fmt = s => {
      s = Math.max(0, Math.floor(s || 0));
      const m = Math.floor(s / 60), r = s % 60;
      return `${m}:${r < 10 ? '0' : ''}${r}`;
    };
    const pct = (ratio) => `${(Math.min(1, Math.max(0, ratio)) * 100).toFixed(2)}%`;

    const syncPlay = () => {
      wrap.classList.toggle('playing', !v.paused);
      btnPlay.setAttribute('aria-label', v.paused ? '播放' : '暂停');
    };
    const syncMute = () => {
      btnMute.classList.toggle('on', !v.muted && v.volume > 0);
      btnMute.setAttribute('aria-pressed', String(v.muted));
    };
    const syncProgress = () => {
      const r = v.duration ? v.currentTime / v.duration : 0;
      fill.style.width = pct(r);
      knob.style.left = pct(r);
      cur.textContent = fmt(v.currentTime);
    };

    btnPlay.addEventListener('click', () => v[v.paused ? 'play' : 'pause']());
    v.addEventListener('play', syncPlay);
    v.addEventListener('pause', syncPlay);
    v.addEventListener('loadedmetadata', () => { dur.textContent = fmt(v.duration); });
    v.addEventListener('timeupdate', syncProgress);
    v.addEventListener('volumechange', syncMute);
    v.addEventListener('ended', syncPlay);
    v.addEventListener('progress', () => {
      if (v.buffered.length && v.duration) buf.style.width = pct(v.buffered.end(v.buffered.length - 1) / v.duration);
    });

    // 点击/拖动进度条
    let dragging = false;
    const seekTo = e => {
      const rect = seek.getBoundingClientRect();
      const r = (e.clientX - rect.left) / rect.width;
      if (v.duration) v.currentTime = r * v.duration;
    };
    seek.addEventListener('pointerdown', e => {
      dragging = true; seek.setPointerCapture(e.pointerId); seekTo(e);
    });
    seek.addEventListener('pointermove', e => dragging && seekTo(e));
    seek.addEventListener('pointerup', e => { dragging = false; try { seek.releasePointerCapture(e.pointerId); } catch {} });
    seek.addEventListener('keydown', e => {
      if (!v.duration) return;
      const step = e.shiftKey ? 10 : 5;
      if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - step); e.preventDefault(); }
      if (e.key === 'ArrowRight') { v.currentTime = Math.min(v.duration, v.currentTime + step); e.preventDefault(); }
    });

    // 音量按钮：点一下静音切换
    btnMute.addEventListener('click', () => { v.muted = !v.muted; });

    // 全屏
    btnFull.addEventListener('click', () => {
      const inFs = document.fullscreenElement === wrap;
      if (inFs) document.exitFullscreen(); else wrap.requestFullscreen?.();
    });
    document.addEventListener('fullscreenchange', () => {
      wrap.classList.toggle('fs', document.fullscreenElement === wrap);
    });

    // 点击视频本体也播放/暂停（原生体验）
    v.addEventListener('click', () => v[v.paused ? 'play' : 'pause']());

    // 初始状态
    syncPlay(); syncMute(); syncProgress();
    if (!hadNative) {
      // 没有原生控件的视频也保持自定义控件可见
    }
    v.dataset.ztzReady = '1';
  });
}

function updateRoute(path) {
  let html = null;
  if (path.startsWith('/project/')) html = renderProjectDetail(path.slice(9));
  else if (path.startsWith('/post/')) html = renderPostDetail(path.slice(6));
  else if (path.startsWith('/posts')) {
    const m = /[?&]page=(\d+)/.exec(path);
    html = renderArchive(m ? +m[1] : 1);
  }
  if (html == null && path !== '/') { location.hash = '#/'; return; }
  setDetail(path === '/' ? null : html);
}

function go(path, card) {
  const isOpen = path.startsWith('/project/');
  const isClose = path === '/';

  const apply = () => {
    $$('.vt-char, .vt-title').forEach(n => n.classList.remove('vt-char', 'vt-title'));
    if (location.hash !== '#' + path) history.pushState(null, '', '#' + path);
    updateRoute(path);
    if (isOpen && card) {
      const dc = $('.detail-char'), dt = $('.detail-title');
      dc && dc.classList.add('vt-char'); dt && dt.classList.add('vt-title');
    }
    if (isClose && openedCard) {
      const c = $('.pc-char', openedCard), t = $('.pc-name', openedCard);
      c && c.classList.add('vt-char'); t && t.classList.add('vt-title');
    }
    if (isOpen) openedCard = card || openedCard;
    if (isClose) setTimeout(() => { openedCard = null; }, 600);
  };

  if (VT && (isOpen || isClose)) {
    // 旧状态挂牌
    if (isOpen && card) {
      const c = $('.pc-char', card), t = $('.pc-name', card);
      c && c.classList.add('vt-char'); t && t.classList.add('vt-title');
    }
    if (isClose) {
      const dc = $('.detail-char'), dt = $('.detail-title');
      dc && dc.classList.add('vt-char'); dt && dt.classList.add('vt-title');
    }
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() =>
      $$('.vt-char, .vt-title').forEach(n => n.classList.remove('vt-char', 'vt-title')));
  } else {
    apply();
    if (detailRoot.classList.contains('open') && !reducedMotion) {
      detailRoot.classList.remove('fade-in');
      void detailRoot.offsetWidth;
      detailRoot.classList.add('fade-in');
    }
  }
}

window.addEventListener('popstate', () => {
  const h = location.hash;
  const path = h.startsWith('#/') ? h.slice(1) : '/';
  if (VT) {
    const vt = document.startViewTransition(() => updateRoute(path));
    vt.finished.finally(() =>
      $$('.vt-char, .vt-title').forEach(n => n.classList.remove('vt-char', 'vt-title')));
  } else updateRoute(path);
});

/* ── 锚点平滑滚动（不动 hash） ────────────────────────── */
let lenis = null;
function initScroll() {
  if (!reducedMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  $$('[data-scroll]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      closeMenu();
      const target = $(a.getAttribute('href'));
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });
  $$('[data-nav]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); go('/'); closeMenu(); });
  });
  $$('[data-archive]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); go('/posts'); });
  });
}

/* ── 渐现 / 逐字标题 / count-up / 进度 ────────────────── */
let revealIO = null;
function observeReveals() {
  if (reducedMotion) { $$('.reveal').forEach(n => n.classList.add('in')); return; }
  if (!revealIO) {
    revealIO = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  $$('.reveal:not(.in)').forEach(n => revealIO.observe(n));
}

function splitTitleChars() {
  $$('.section-title').forEach(t => {
    const textNode = [...t.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!textNode) return;
    const frag = document.createDocumentFragment();
    [...textNode.textContent].forEach((ch, i) => {
      const s = el('span', 'st-ch');
      s.textContent = ch;
      s.style.setProperty('--cd', `${i * 0.07}s`);
      frag.appendChild(s);
    });
    t.replaceChild(frag, textNode);
  });
}

function countUp() {
  $$('#heroStats b[data-count]').forEach(b => {
    if (b.dataset.fixed) return;
    const target = +b.dataset.count;
    if (reducedMotion || !target) { b.textContent = target + (b.dataset.count >= 10 ? '+' : ''); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      b.textContent = Math.round(target * e) + (k === 1 ? '+' : '');
      if (k < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 400);
  });
}

function initScrollProgress() {
  const fill = $('#railProgress');
  const tlFill = $('#timelineFill');
  const navLinks = $$('.rail-nav a');
  const sections = ['projects', 'journey', 'posts', 'board', 'about'].map(id => $('#' + id));
  const bgs = $$('.section-bg');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const sc = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      if (fill) fill.style.height = (max > 0 ? (sc / max) * 100 : 0) + '%';
      const tl = $('#timeline');
      if (tlFill && tl) {
        const r = tl.getBoundingClientRect();
        const prog = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
        tlFill.style.height = (prog * 100) + '%';
      }
      let active = -1;
      sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.45) active = i; });
      navLinks.forEach((a, i) => a.classList.toggle('active', i === active));
      // 背景巨字视差
      if (!reducedMotion) bgs.forEach(bg => {
        const r = bg.parentElement.getBoundingClientRect();
        bg.style.transform = `translateY(${r.top * 0.09}px)`;
      });
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── 自定义光标 + 磁吸 ────────────────────────────────── */
function initCursor() {
  if (!finePointer || reducedMotion || isMobile) return;
  document.documentElement.classList.add('has-cursor');
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  const pos = { x: -100, y: -100 }, ringPos = { x: -100, y: -100 };
  let shown = false;
  addEventListener('pointermove', e => {
    pos.x = e.clientX; pos.y = e.clientY;
    if (!shown) { shown = true; dot.style.opacity = 1; ring.style.opacity = 1; }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; shown = false; });
  (function follow() {
    requestAnimationFrame(follow);
    ringPos.x += (pos.x - ringPos.x) * 0.16;
    ringPos.y += (pos.y - ringPos.y) * 0.16;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
  })();
  const HOVER_SEL = 'a, button, .project-card, .post-row, [role="link"], .vinyl-progress, .tl-item';
  document.addEventListener('pointerover', e => {
    if (e.target.closest(HOVER_SEL)) ring.classList.add('hovering');
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    if (e.target.closest(HOVER_SEL)) ring.classList.remove('hovering');
  }, { passive: true });
}

function magnetic(node, strength = 0.28) {
  if (!finePointer || reducedMotion) return;
  node.addEventListener('pointermove', e => {
    const r = node.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) * strength;
    const dy = (e.clientY - r.top - r.height / 2) * strength;
    node.style.transition = 'transform .18s ease-out';
    node.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  node.addEventListener('pointerleave', () => {
    node.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
    node.style.transform = '';
    setTimeout(() => { node.style.transition = ''; }, 560);
  });
}
function initMagnetic() {
  $$('.rail-nav a').forEach(a => magnetic(a, 0.32));
  $$('.theme-toggle').forEach(b => magnetic(b, 0.3));
  magnetic($('#vinylToggle'), 0.25);
}

/* ── 移动端菜单 ───────────────────────────────────────── */
const menuBtn = $('#menuBtn'), mobileMenu = $('#mobileMenu');
function closeMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
menuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  mobileMenu.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

/* ── 看板：时间进度 ───────────────────────────────────── */
function renderTimeBars() {
  const now = new Date();
  const y0 = new Date(now.getFullYear(), 0, 1), y1 = new Date(now.getFullYear() + 1, 0, 1);
  const m0 = new Date(now.getFullYear(), now.getMonth(), 1), m1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const w0 = new Date(now); w0.setHours(0, 0, 0, 0); w0.setDate(w0.getDate() - ((w0.getDay() + 6) % 7));
  const w1 = new Date(w0); w1.setDate(w0.getDate() + 7);
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const d1 = new Date(d0); d1.setDate(d0.getDate() + 1);
  const pct = (a, b) => Math.min(100, Math.max(0, (now - a) / (b - a) * 100));
  const rows = [['年', pct(y0, y1)], ['月', pct(m0, m1)], ['周', pct(w0, w1)], ['日', pct(d0, d1)]];
  const wrap = $('#timeBars');
  wrap.innerHTML = rows.map(([l, v]) => `
    <div class="time-bar">
      <label>${l}</label>
      <div class="tb-track"><div class="tb-fill" data-v="${v.toFixed(1)}"></div></div>
      <output>${v.toFixed(1)}%</output>
    </div>`).join('');
  const holidays = [
    ['元旦', 0, 1], ['生日', 4, 3], ['劳动节', 4, 1], ['国庆', 9, 1], ['圣诞', 11, 25],
  ].map(([name, m, d]) => {
    let dt = new Date(now.getFullYear(), m, d);
    if (dt <= now) dt = new Date(now.getFullYear() + 1, m, d);
    return [name, Math.ceil((dt - now) / 864e5)];
  }).sort((a, b) => a[1] - b[1]);
  $('#nextHoliday').innerHTML = `下一个节日 <b>${holidays[0][0]}</b> · 还有 <b>${holidays[0][1]}</b> 天`;
  setTimeout(() => $$('.tb-fill', wrap).forEach(f => f.style.width = f.dataset.v + '%'), 300);
}

/* ── 看板：天气（高德 IP 定位 → 当地天气） ────────────── */
const AMAP_KEY = 'dd1086959220bba7e06900fbcf891a8e';
async function renderWeather() {
  const body = $('#weatherBody');
  const title = $('#weatherTitle');
  let city = '长沙', adcode = '430100';
  try {
    const ip = await jsonp(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`);
    if (ip && ip.status === '1' && ip.adcode && typeof ip.city === 'string' && ip.city) {
      adcode = ip.adcode;
      city = ip.city.replace(/市$/, '');
    }
  } catch { /* 定位失败就用长沙 */ }
  title.textContent = `你那边 · ${city}`;
  try {
    const w = await jsonp(`https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=all`);
    if (!w || w.status !== '1' || !w.lives || !w.lives[0]) throw new Error('amap weather fail');
    const live = w.lives[0];
    const casts = (w.forecasts && w.forecasts[0] && w.forecasts[0].casts) || [];
    const fc = casts.slice(1, 4).map(c =>
      `<div>${esc(c.dayweather)}<b>${c.date.slice(5).replace('-', '/')}</b>${esc(c.daytemp)}°/${esc(c.nighttemp)}°</div>`).join('');
    body.innerHTML = `
      <div class="weather-now">
        <div>
          <div class="w-temp">${esc(live.temperature)}°C</div>
          <div class="w-meta">${esc(live.weather)} · ${esc(city)}实时 · ${esc(live.reporttime || '').slice(5, 16)}</div>
        </div>
      </div>
      <div class="weather-detail">
        <span>风向 <b>${esc(live.winddirection)}风</b></span>
        <span>风力 <b>${esc(live.windpower)}级</b></span>
        <span>湿度 <b>${esc(live.humidity)}%</b></span>
      </div>
      ${fc ? `<div class="weather-forecast">${fc}</div>` : ''}`;
  } catch {
    renderWeatherFallback(body, title);
  }
}
async function renderWeatherFallback(body, title) {
  // 高德挂了 → open-meteo 长沙兜底
  title.textContent = '长沙 · 天气';
  try {
    const d = await fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=28.23&longitude=112.98&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FShanghai');
    const wtext = { 0: '晴', 1: '多云', 2: '多云', 3: '阴', 45: '雾', 48: '雾', 51: '小雨', 53: '中雨', 55: '大雨', 61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '雷阵雨', 82: '暴雨', 95: '雷雨' }[d.current.weather_code] || '未知';
    body.innerHTML = `
      <div class="weather-now">
        <div>
          <div class="w-temp">${Math.round(d.current.temperature_2m)}°C</div>
          <div class="w-meta">${wtext} · 长沙实时</div>
        </div>
      </div>
      <div class="weather-detail">
        <span>体感 <b>${Math.round(d.current.apparent_temperature)}°C</b></span>
        <span>湿度 <b>${d.current.relative_humidity_2m}%</b></span>
        <span>风速 <b>${d.current.wind_speed_10m} km/h</b></span>
      </div>`;
  } catch {
    body.innerHTML = '<p class="board-loading">天空暂时联络不上 —— 出门看看也一样。</p>';
  }
}

/* ── 看板：GitHub ─────────────────────────────────────── */
async function renderGithub() {
  const body = $('#githubBody');
  const rel = iso => {
    const days = Math.floor((Date.now() - new Date(iso)) / 864e5);
    return days <= 0 ? '今天' : days === 1 ? '昨天' : days < 30 ? days + ' 天前' : Math.floor(days / 30) + ' 个月前';
  };
  try {
    let data = sessionStorage.getItem('gh-board');
    if (data) data = JSON.parse(data);
    if (!data) {
      const [u, repos] = await Promise.all([
        fetchJSON('https://api.github.com/users/Everett406'),
        fetchJSON('https://api.github.com/users/Everett406/repos?per_page=100&sort=pushed'),
      ]);
      data = {
        repos: u.public_repos,
        stars: repos.reduce((s, r) => s + r.stargazers_count, 0),
        recent: repos.slice(0, 3).map(r => ({ name: r.name, url: r.html_url, when: rel(r.pushed_at) })),
      };
      sessionStorage.setItem('gh-board', JSON.stringify(data));
    }
    body.innerHTML = `
      <div class="github-stats">
        <div><b>${data.repos}</b><span>仓库</span></div>
        <div><b>${data.stars}</b><span>Stars</span></div>
      </div>
      <div class="github-recent">
        ${data.recent.map(r => `<div><a href="${r.url}" target="_blank" rel="noopener">${esc(r.name)}</a><small>${r.when}</small></div>`).join('')}
      </div>`;
  } catch {
    body.innerHTML = '<p class="board-loading">GitHub 的数据在路上堵车了。</p>';
  }
}

/* ── 看板：一言 + 自绘热图 ────────────────────────────── */
async function renderQuote() {
  const body = $('#quoteBody');
  try {
    const d = await fetchJSON('https://v1.hitokoto.cn/?c=a&c=b&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k');
    body.innerHTML = `<p>「${esc(d.hitokoto)}」</p><footer>—— ${esc(d.from_who || '佚名')} · 《${esc(d.from)}》</footer>`;
  } catch {
    body.innerHTML = '<p>「人生的意义在于折腾。」</p><footer>—— 赴野</footer>';
  }
}

async function renderHeat() {
  const body = $('#heatBody');
  try {
    let days = sessionStorage.getItem('gh-heat');
    if (days) days = JSON.parse(days);
    if (!days) {
      const pages = await Promise.all([1, 2, 3].map(p =>
        fetchJSON(`https://api.github.com/users/Everett406/events/public?per_page=100&page=${p}`, 8000).catch(() => [])));
      days = {};
      pages.flat().forEach(ev => {
        const day = (ev.created_at || '').slice(0, 10);
        if (day) days[day] = (days[day] || 0) + 1;
      });
      sessionStorage.setItem('gh-heat', JSON.stringify(days));
    }
    // 最近 12 周（84 天），从周一算起
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 83 - ((start.getDay() + 6) % 7));
    const cells = [];
    let total = 0;
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const n = days[key] || 0;
      total += n;
      const lv = n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : 3;
      cells.push(`<span class="heat-cell" data-lv="${lv}" title="${key} · ${n} 次活动"></span>`);
    }
    body.innerHTML = `
      <div class="heat-total">近 12 周共 <b>${total}</b> 次公开活动</div>
      <div class="heat-grid">${cells.join('')}</div>
      <div class="heat-legend">少 <i></i><i></i><i></i><i></i> 多</div>`;
  } catch {
    body.innerHTML = '<p class="board-loading">热图迷路了，格子们还在赶来的路上。</p>';
  }
}

/* ── 黑胶唱机 ─────────────────────────────────────────── */
const vinyl = {
  audio: new Audio(),
  list: [], idx: -1, mode: 0, // 0 顺序 1 随机 2 单曲
  els: {
    root: $('#vinyl'), toggle: $('#vinylToggle'), panel: $('#vinylPanel'),
    title: $('#vinylTitle'), play: $('#vinylPlay'), prog: $('#vinylProg'),
    list: $('#vinylList'), listBtn: $('#vinylListBtn'), count: $('#vinylCount'),
    label: $('#vinylLabel'), ring: $('#vinylRing'), time: $('#vinylTime'),
    cover: $('#vinylCover'), mode: $('#vinylMode'),
    lyric: $('#vinylLyric'),
    bar: $('#vinylBar'), barCover: $('#vinylBarCover'),
    barTitle: $('#vinylBarTitle'), barLyric: $('#vinylBarLyric'),
  },
  RING_LEN: 166.5,
  lyrics: null,   // [{t, s}] 当前曲目的时间轴歌词
  lyricLine: -1,
  lrcCache: {},

  parseLRC(text) {
    const out = [];
    for (const line of text.split(/\r?\n/)) {
      const m = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/.exec(line);
      if (!m) continue;
      const s = m[3].trim();
      if (!s) continue;
      out.push({ t: +m[1] * 60 + +m[2], s });
    }
    return out.sort((a, b) => a.t - b.t);
  },

  async loadLyrics(track) {
    this.lyrics = null;
    this.lyricLine = -1;
    this.els.lyric.textContent = '';
    if (!track.lyrics) return;
    try {
      if (!this.lrcCache[track.lyrics]) {
        const r = await fetch('assets/music/' + encodeURIComponent(track.lyrics));
        if (!r.ok) throw 0;
        this.lrcCache[track.lyrics] = this.parseLRC(await r.text());
      }
      this.lyrics = this.lrcCache[track.lyrics];
    } catch { this.lyrics = null; }
  },

  syncLyric(currentTime) {
    if (!this.lyrics || !this.lyrics.length) return;
    let idx = -1;
    // 数据量小，线性找即可
    for (let i = 0; i < this.lyrics.length; i++) {
      if (this.lyrics[i].t <= currentTime + 0.25) idx = i;
      else break;
    }
    if (idx === this.lyricLine) return;
    this.lyricLine = idx;
    const text = idx >= 0 ? this.lyrics[idx].s : '';
    // 面板歌词
    const node = this.els.lyric;
    node.classList.add('swap');
    setTimeout(() => { node.textContent = text; node.classList.remove('swap'); }, 180);
    // 迷你栏歌词（纵向翻转）
    const bar = this.els.barLyric;
    bar.classList.add('swap');
    setTimeout(() => { bar.textContent = text; bar.classList.remove('swap'); }, 160);
  },

  async init() {
    const e = this.els;
    this.audio.preload = 'none';
    try {
      const d = await fetchJSON('assets/music/playlist.json?v=' + Date.now(), 5000);
      this.list = (d.tracks || []).filter(t => t && t.file);
    } catch { this.list = []; }

    if (!this.list.length) {
      e.title.textContent = '歌单正在路上';
    } else {
      e.count.textContent = `· ${this.list.length} 首`;
      this.renderList();
      this.pick(0, false);
    }

    e.toggle.addEventListener('click', () => this.togglePanel());
    e.bar.addEventListener('click', () => { if (!e.panel.classList.contains('open')) this.togglePanel(); });
    e.play.addEventListener('click', () => this.togglePlay());
    $('#vinylPrev').addEventListener('click', () => this.step(-1));
    $('#vinylNext').addEventListener('click', () => this.step(1));
    e.mode.addEventListener('click', () => this.cycleMode());
    e.listBtn.addEventListener('click', () => e.list.classList.toggle('open'));
    $('.vinyl-progress').addEventListener('click', ev => {
      if (!this.audio.duration) return;
      const r = ev.currentTarget.getBoundingClientRect();
      this.audio.currentTime = this.audio.duration * Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
    });
    this.audio.addEventListener('timeupdate', () => this.onProgress());
    this.audio.addEventListener('loadedmetadata', () => this.onProgress());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('play', () => {
      e.root.dataset.state = 'playing';
      e.play.textContent = '⏸';
    });
    this.audio.addEventListener('pause', () => {
      e.root.dataset.state = 'paused';
      e.play.textContent = '▶';
    });
    this.audio.addEventListener('error', () => this.onError());
  },

  fmt(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  onProgress() {
    const d = this.audio.duration, c = this.audio.currentTime;
    const k = d ? c / d : 0;
    this.els.prog.style.width = (k * 100) + '%';
    this.els.ring.style.strokeDashoffset = this.RING_LEN * (1 - k);
    this.els.time.textContent = `${this.fmt(c)} / ${this.fmt(d)}`;
    this.syncLyric(c);
  },

  onEnded() {
    if (this.mode === 2) { this.audio.currentTime = 0; this.audio.play().catch(() => {}); }
    else this.step(1);
  },

  cycleMode() {
    this.mode = (this.mode + 1) % 3;
    const e = this.els.mode;
    e.className = '';
    if (this.mode === 1) { e.textContent = '随'; e.classList.add('mode-shuffle'); e.title = '随机播放'; }
    else if (this.mode === 2) { e.textContent = '单'; e.classList.add('mode-one'); e.title = '单曲循环'; }
    else { e.textContent = '顺'; e.title = '顺序播放'; }
  },

  renderList() {
    this.els.list.innerHTML = this.list.map((t, i) =>
      `<li data-i="${i}">${esc(t.title || t.file)}${t.artist ? ' · ' + esc(t.artist) : ''}</li>`).join('');
    $$('li', this.els.list).forEach(li =>
      li.addEventListener('click', () => { this.pick(+li.dataset.i, true); }));
    this.els.mode.textContent = '顺';
  },

  pick(i, autoplay) {
    if (!this.list.length) return;
    this.idx = ((i % this.list.length) + this.list.length) % this.list.length;
    const t = this.list[this.idx];
    this.els.title.textContent = (t.title || t.file) + (t.artist ? ' · ' + t.artist : '');
    $$('li', this.els.list).forEach((li, j) => li.classList.toggle('active', j === this.idx));
    // 封面：有图用图，没图用标题首字
    const coverInner = t.cover
      ? `<img src="assets/music/${encodeURIComponent(t.cover)}" alt="" onerror="this.parentNode.innerHTML='<i>${esc((t.title || '♪')[0])}</i>'">`
      : `<i>${esc((t.title || '♪')[0])}</i>`;
    this.els.cover.innerHTML = coverInner;
    this.els.barCover.innerHTML = coverInner;
    this.els.barTitle.textContent = (t.title || t.file) + (t.artist ? ' · ' + t.artist : '');
    this.audio.src = 'assets/music/' + encodeURIComponent(t.file);
    this.els.prog.style.width = '0';
    this.els.ring.style.strokeDashoffset = this.RING_LEN;
    this.els.time.textContent = '0:00 / 0:00';
    this.els.barLyric.textContent = '';
    this.loadLyrics(t);
    if (autoplay) this.audio.play().catch(() => {});
    this.preloadNext();
  },

  preloadNext() {
    if (this.list.length < 2) return;
    const n = this.list[(this.idx + 1) % this.list.length];
    if (n) { const a = new Audio(); a.preload = 'auto'; a.src = 'assets/music/' + encodeURIComponent(n.file); }
  },

  step(d) {
    if (this.mode === 1 && this.list.length > 2) {
      let n = this.idx;
      while (n === this.idx) n = Math.floor(Math.random() * this.list.length);
      this.pick(n, true);
    } else {
      this.pick(this.idx + d, true);
    }
  },

  togglePlay() {
    if (!this.list.length) { this.togglePanel(); return; }
    if (this.audio.paused) this.audio.play().catch(() => this.onError());
    else this.audio.pause();
  },

  togglePanel() {
    const open = this.els.panel.classList.toggle('open');
    this.els.panel.setAttribute('aria-hidden', String(!open));
    this.els.toggle.setAttribute('aria-expanded', String(open));
  },

  onError() {
    const li = $$('li', this.els.list)[this.idx];
    li && li.classList.add('broken');
    const alive = this.list.filter((t, i) => {
      const node = $$('li', this.els.list)[i];
      return !node || !node.classList.contains('broken');
    });
    if (alive.length && !this.audio.paused) this.step(1);
    else if (!alive.length) this.els.title.textContent = '网络原因，歌单没能加载';
  },
};

/* ── 启动 ─────────────────────────────────────────────── */
function boot() {
  theme.init();
  renderProjects();
  renderTimeline();
  splitTitleChars();
  fetchPosts().then(renderPosts);
  observeReveals();
  countUp();
  initScroll();
  initScrollProgress();
  initCursor();
  initMagnetic();
  renderTimeBars();
  renderWeather();
  renderGithub();
  renderQuote();
  renderHeat();
  vinyl.init();
  // 初始路由（支持分享链接直达详情）
  const h = location.hash;
  if (h.startsWith('#/') && h !== '#/') updateRoute(h.slice(1));
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();

/* ── 图片懒加载 ───────────────────────────────────────
   配合 build-posts.mjs / postRowHTML 里 <img data-src class="lazy-img">
   的约定：进入视口前 300px 才把 data-src 回填到 src 触发加载，
   加载完成后加 .loaded 触发淡入。无 IntersectionObserver 时直接全加载。
   重复调用安全（已加载的 img 会被跳过）。 */
function initLazyImages(scope = document) {
  const imgs = $$('.lazy-img', scope).filter(img => !img.dataset.lazyReady);
  if (!imgs.length) return;

  // 不支持 IntersectionObserver：直接全部加载
  if (!('IntersectionObserver' in window)) {
    imgs.forEach(img => {
      img.src = img.dataset.src || '';
      img.classList.add('loaded');
      img.dataset.lazyReady = '1';
    });
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const img = en.target;
      const src = img.dataset.src;
      if (src) {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
          img.dataset.lazyReady = '1';
        }, { once: true });
        img.addEventListener('error', () => {
          img.classList.add('loaded', 'failed');
          img.dataset.lazyReady = '1';
        }, { once: true });
        img.src = src;
      } else {
        img.dataset.lazyReady = '1';
      }
      obs.unobserve(img);
    });
  }, { rootMargin: '300px 0px', threshold: 0.01 });

  imgs.forEach(img => io.observe(img));
}
