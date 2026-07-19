/* ═══════════════════════════════════════════════════════════
   《折腾志》 main.js — 路由 / 转场 / 滚动动效 / 看板 / 黑胶唱机
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── 工具 ─────────────────────────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 1023px)').matches;

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
    slug: 'jiwei-tiku', char: '微', no: '003',
    name: '积微题库', en: 'Jiwei Quiz',
    desc: 'Capacitor 移动端题库应用。多题型、错题本、进度追踪，离线也能刷。',
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
  { year: '2006', tag: '启程', title: '来到这个世界', desc: '千禧年之后，故事从这里开始。具体坐标就不写了 —— 留一点神秘感。' },
  { year: '2023', tag: '入门', title: '初识 Android', desc: '开始学 Kotlin 与 Android 原生开发，完成第一个练手项目。原来代码真的可以在自己手机上跑起来。' },
  { year: '2024', tag: '探索', title: '跨端与自动化', desc: '深入 Flutter 跨端开发，同时用 Python 写各种自动化小工具 —— 能偷懒的地方，绝不手动。' },
  { year: '2025', tag: '新篇', title: '长沙，与全栈', desc: '来到长沙上学；同时接触 React、TypeScript 与 Node.js，搭起第一个个人主页。' },
  { year: '2026', tag: '现在', title: '持续折腾', desc: '十六个开源项目，从 Android 到 Web，从工具到应用。折腾不停，好奇心不减。' },
];

/* ── 渲染：项目 ───────────────────────────────────────── */
function renderProjects() {
  const grid = $('#projectGrid');
  grid.innerHTML = '';
  PROJECTS.forEach((p, i) => {
    const card = el('article', 'project-card reveal');
    card.style.setProperty('--d', `${(i % 4) * 0.08}s`);
    card.dataset.slug = p.slug;
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <span class="pc-char" aria-hidden="true">${p.char}</span>
      <span class="pc-arrow" aria-hidden="true">↗</span>
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
      <p class="tl-desc">${t.desc}</p>`;
    tl.appendChild(item);
  });
}

/* ── 渲染：文章 ───────────────────────────────────────── */
let POSTS = [];
async function renderPosts() {
  const list = $('#postList');
  try {
    const data = await fetchJSON('posts/posts.json?v=' + Date.now(), 5000);
    POSTS = Array.isArray(data.posts) ? data.posts : [];
  } catch { POSTS = []; }
  list.innerHTML = '';
  if (!POSTS.length) {
    list.appendChild(el('div', 'post-empty',
      `还没有文章。<a href="https://github.com/Everett406/Everett406.github.io/issues/new" target="_blank" rel="noopener">去发第一个 Issue</a>，它就会出现在这里。`));
    return;
  }
  POSTS.forEach((p, i) => {
    const row = el('div', 'post-row reveal');
    row.style.setProperty('--d', `${i * 0.06}s`);
    row.innerHTML = `
      <span class="pr-date">${esc(p.date || '')}</span>
      <span class="pr-title">${esc(p.title)}</span>
      <span class="pr-arrow" aria-hidden="true">→</span>`;
    row.addEventListener('click', () => go(`/post/${p.slug}`));
    list.appendChild(row);
  });
  observeReveals();
}

/* ── 详情页 ───────────────────────────────────────────── */
const detailRoot = $('#detailRoot');
let lastCard = null;

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
    </div>
    <div class="detail-body">${p.html || '<p>（空）</p>'}</div>`);
}

/* ── 路由 + 丝滑转场 ──────────────────────────────────── */
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
    const back = $('[data-back]', detailRoot);
    back && back.addEventListener('click', () => go('/'));
  }
}

function updateRoute(path) {
  let html = null;
  if (path.startsWith('/project/')) html = renderProjectDetail(path.slice(9));
  else if (path.startsWith('/post/')) html = renderPostDetail(path.slice(6));
  if (html == null && path !== '/') { location.hash = '#/'; return; }
  setDetail(path === '/' ? null : html);
}

function go(path, card) {
  const apply = () => {
    // 旧状态摘牌，新状态挂牌（共享元素转场）
    if (card) {
      const c = $('.pc-char', card), t = $('.pc-name', card);
      c && c.classList.remove('vt-char'); t && t.classList.remove('vt-title');
    }
    if (location.hash !== '#' + path) {
      history.pushState(null, '', '#' + path);
    }
    updateRoute(path);
    if (card && path.startsWith('/project/')) {
      const dc = $('.detail-char'), dt = $('.detail-title');
      dc && dc.classList.add('vt-char'); dt && dt.classList.add('vt-title');
    }
  };

  if (VT && (path === '/' || path.startsWith('/project/'))) {
    if (card) {
      const c = $('.pc-char', card), t = $('.pc-name', card);
      c && c.classList.add('vt-char'); t && t.classList.add('vt-title');
    }
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => {
      $$('.vt-char').forEach(n => n.classList.remove('vt-char'));
      $$('.vt-title').forEach(n => n.classList.remove('vt-title'));
    });
  } else {
    // 降级：淡入淡出
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
  updateRoute(h.startsWith('#/') ? h.slice(1) : '/');
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
}

/* ── 渐现 / count-up / 进度 ───────────────────────────── */
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
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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

/* ── 看板：天气 ───────────────────────────────────────── */
async function renderWeather() {
  const body = $('#weatherBody');
  const wmap = {
    0: ['☀️', '晴'], 1: ['🌤️', '多云'], 2: ['⛅', '多云'], 3: ['☁️', '阴'],
    45: ['🌫️', '雾'], 48: ['🌫️', '雾'], 51: ['🌦️', '小雨'], 53: ['🌧️', '中雨'], 55: ['🌧️', '大雨'],
    61: ['🌦️', '小雨'], 63: ['🌧️', '中雨'], 65: ['🌧️', '大雨'],
    71: ['🌨️', '小雪'], 73: ['❄️', '中雪'], 75: ['❄️', '大雪'],
    80: ['🌦️', '阵雨'], 81: ['⛈️', '雷阵雨'], 82: ['🌩️', '暴雨'], 95: ['⛈️', '雷雨'],
  };
  try {
    const d = await fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=28.23&longitude=112.98&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=4');
    const [icon, text] = wmap[d.current.weather_code] || ['✨', '未知'];
    const fc = [1, 2, 3].map(i => {
      const dt = new Date(d.daily.time[i]);
      const [fi] = wmap[d.daily.weather_code[i]] || ['✨'];
      return `<div>${fi}<b>${dt.getMonth() + 1}/${dt.getDate()}</b>${Math.round(d.daily.temperature_2m_max[i])}°/${Math.round(d.daily.temperature_2m_min[i])}°</div>`;
    }).join('');
    body.innerHTML = `
      <div class="weather-now">
        <span class="w-icon">${icon}</span>
        <div>
          <div class="w-temp">${Math.round(d.current.temperature_2m)}°C</div>
          <div class="w-meta">${text} · 长沙实时</div>
        </div>
      </div>
      <div class="weather-detail">
        <span>体感 <b>${Math.round(d.current.apparent_temperature)}°C</b></span>
        <span>湿度 <b>${d.current.relative_humidity_2m}%</b></span>
        <span>风速 <b>${d.current.wind_speed_10m} km/h</b></span>
      </div>
      <div class="weather-forecast">${fc}</div>`;
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

/* ── 看板：一言 + 热图 ────────────────────────────────── */
async function renderQuote() {
  const body = $('#quoteBody');
  try {
    const d = await fetchJSON('https://v1.hitokoto.cn/?c=a&c=b&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k');
    body.innerHTML = `<p>「${esc(d.hitokoto)}」</p><footer>—— ${esc(d.from_who || '佚名')} · 《${esc(d.from)}》</footer>`;
  } catch {
    body.innerHTML = '<p>「人生的意义在于折腾。」</p><footer>—— 赴野</footer>';
  }
}
function renderHeat() {
  const body = $('#heatBody');
  const img = new Image();
  img.alt = 'GitHub 提交热图';
  img.loading = 'lazy';
  img.src = 'https://ghchart.rshah.org/c2402a/Everett406.svg';
  img.onload = () => {
    body.innerHTML = '';
    body.appendChild(img);
    body.appendChild(el('a', '', '@Everett406')).href = 'https://github.com/Everett406';
    body.lastChild.target = '_blank'; body.lastChild.rel = 'noopener';
  };
  img.onerror = () => { body.innerHTML = '<p class="board-loading">热图迷路了，格子们还在赶来的路上。</p>'; };
}

/* ── 黑胶唱机 ─────────────────────────────────────────── */
const vinyl = {
  audio: new Audio(),
  list: [], idx: -1, ready: false,
  els: {
    root: $('#vinyl'), toggle: $('#vinylToggle'), panel: $('#vinylPanel'),
    title: $('#vinylTitle'), play: $('#vinylPlay'), prog: $('#vinylProg'),
    list: $('#vinylList'), listBtn: $('#vinylListBtn'), count: $('#vinylCount'),
    label: $('#vinylLabel'),
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
      e.count.textContent = '';
    } else {
      e.count.textContent = `· ${this.list.length} 首`;
      this.renderList();
      this.pick(0, false);
    }

    e.toggle.addEventListener('click', () => this.togglePanel());
    e.play.addEventListener('click', () => this.togglePlay());
    $('#vinylPrev').addEventListener('click', () => this.step(-1));
    $('#vinylNext').addEventListener('click', () => this.step(1));
    e.listBtn.addEventListener('click', () => e.list.classList.toggle('open'));
    $('.vinyl-progress').addEventListener('click', ev => {
      if (!this.audio.duration) return;
      const r = ev.currentTarget.getBoundingClientRect();
      this.audio.currentTime = this.audio.duration * Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
    });
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.duration) e.prog.style.width = (this.audio.currentTime / this.audio.duration * 100) + '%';
    });
    this.audio.addEventListener('ended', () => this.step(1));
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

  renderList() {
    this.els.list.innerHTML = this.list.map((t, i) =>
      `<li data-i="${i}">${esc(t.title || t.file)}${t.artist ? ' · ' + esc(t.artist) : ''}</li>`).join('');
    $$('li', this.els.list).forEach(li =>
      li.addEventListener('click', () => { this.pick(+li.dataset.i, true); }));
  },

  pick(i, autoplay) {
    if (!this.list.length) return;
    this.idx = ((i % this.list.length) + this.list.length) % this.list.length;
    const t = this.list[this.idx];
    this.els.title.textContent = (t.title || t.file) + (t.artist ? ' · ' + t.artist : '');
    $$('li', this.els.list).forEach((li, j) => li.classList.toggle('active', j === this.idx));
    this.audio.src = 'assets/music/' + encodeURIComponent(t.file);
    this.els.prog.style.width = '0';
    if (autoplay) this.audio.play().catch(() => {});
    this.preloadNext();
  },

  preloadNext() {
    if (this.list.length < 2) return;
    const n = this.list[(this.idx + 1) % this.list.length];
    if (n) { const a = new Audio(); a.preload = 'auto'; a.src = 'assets/music/' + encodeURIComponent(n.file); }
  },

  step(d) { this.pick(this.idx + d, true); },

  togglePlay() {
    if (!this.list.length) { this.togglePanel(); return; }
    if (this.audio.paused) this.audio.play().catch(() => this.onError());
    else this.audio.pause();
  },

  togglePanel() {
    const open = this.els.panel.classList.toggle('open');
    this.els.panel.setAttribute('aria-hidden', String(!open));
    this.els.toggle.setAttribute('aria-expanded', String(open));
    if (open && this.list.length && this.audio.paused && this.audio.readyState === 0) {
      // 展开面板时不自动播放，等用户点
    }
  },

  onError() {
    const li = $$('li', this.els.list)[this.idx];
    li && li.classList.add('broken');
    // 自动跳到下一首可播的；全部挂了就停
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
  renderProjects();
  renderTimeline();
  renderPosts();
  observeReveals();
  countUp();
  initScroll();
  initScrollProgress();
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
