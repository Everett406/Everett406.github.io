# 折腾志 · 赴野 Everett

> 人生的意义在于折腾。

赴野（Everett）的个人主页 —— 手工打磨、无框架、部署于 GitHub Pages。
站点地址：<https://everett406.github.io>

当前版本：**v1.3.0**（通过 GitHub Releases 标记版本）

## 结构

```
.
├── index.html              # 单页站点（手写 HTML/CSS/JS，无构建步骤）
├── assets/                 # 样式、脚本、字体等静态资源
├── posts/
│   └── posts.json          # 由 Issue 自动生成，前端读取渲染「文章」区
├── scripts/
│   └── build-posts.mjs     # 把带 post 标签的 open issue 渲染成 posts.json
└── .github/workflows/
    └── issue-post.yml      # Issue → Post 工作流
```

## Issue → Post 机制

写文章不需要改代码：在仓库里发一个 issue、打上 `post` 标签，[Issue → Post](.github/workflows/issue-post.yml) 工作流会自动：

1. 拉取所有 `open` 且带 `post` 标签的 issue；
2. 用 `marked` 把正文渲染成 HTML（首图作封面、正文前 90 字作摘要、视频链接内嵌播放器）；
3. 写入 `posts/posts.json` 并提交回 `main`，GitHub Pages 随即重新部署。

关闭 / 删除 issue 或去掉 `post` 标签，对应文章会自动从列表里消失。也可以在 Actions 页面手动触发（`workflow_dispatch`）重新同步。

工作流使用 `concurrency.group: issue-post` 串行化，避免同一 issue 的多个事件并发推送互相拒绝；推送失败时还会 `pull --rebase` 重试。

## 图片懒加载

站点所有图片（列表封面、详情大封面、正文插图）都启用了懒加载：

- **构建端**：`build-posts.mjs` 把正文 `<img src>` 转成 `<img data-src loading="lazy" decoding="async" class="lazy-img">`，列表/详情封面同理。
- **前端**：`main.js` 的 `initLazyImages` 用 `IntersectionObserver` 监听，图片进入视口前 300px 才把 `data-src` 回填 `src` 触发加载，加载完成后加 `.loaded` 触发淡入；不支持 `IntersectionObserver` 的浏览器直接全加载，`loading="lazy"` 作为原生兜底。
- **视觉**：加载前显示 shimmer 骨架渐变占位，加载完 0.45s 淡入，失败显示灰底；`prefers-reduced-motion` 下关闭动画。

这样图多的时候首屏不会一次性请求所有图片，滚动到才加载。

## Markdown 写作约定

文章正文用 GitHub Flavored Markdown，下面几种容易踩坑的格式说明一下正确写法：

### 任务列表

`-` 后面要加 `[ ]` 或 `[x]`，才会渲染成带 checkbox 的任务列表；只写 `-` 会被当成普通无序列表。

```markdown
- [ ] 创建仓库
- [x] 写首页代码
```

### 视频

直接把视频文件拖进 Issue 编辑器，GitHub 会生成形如 `https://github.com/user-attachments/assets/<uuid>` 的链接，这种链接会被自动转成内嵌 `<video>` 播放器（无需扩展名）。外链视频则用普通 Markdown 链接写法，地址以 `.mp4` / `.mov` / `.webm` 结尾即可：

```markdown
[演示视频](https://example.com/demo.mp4)
```

注意：从 Excel 等办公软件里复制粘贴视频，通常不会自动转成 Markdown 链接，需要手动写成上面的格式，或直接把文件拖进 Issue 编辑器上传。

视频会自动套上站点专属的「朱砂书卷风」自定义播放器皮肤（朱砂进度条、hover 淡入控制条），支持播放/暂停、进度拖动、音量、全屏，无需额外配置。

### 表格

GFM 表格必须用 `|` 分隔，且要有表头分隔行；用 Tab 或空格对齐的多行文本会被当成普通段落，不会渲染成表格。

```markdown
| 项目   | 状态 | 备注         |
| ------ | ---- | ------------ |
| 标题   | ✅   | H2-H6 正常   |
| 视频   | ✅   | 自动内嵌播放 |
```

### 强调

`*星号*` 和 `_下划线_` 都表示斜体，但下划线紧贴中文时 marked 可能识别不出来，**推荐统一用星号**：`*斜体*`、`**粗体**`、`***粗斜体***`。脚本会自动把常见的 `_**x**_` 写法归一成 `***x***`。

## 版本约定

采用语义化版本 `vMAJOR.MINOR.PATCH`，每次功能更新或 bug 修复都会更新版本号、调整本文件及站内 footer，并在 [Releases](../../releases) 发布。

## 致谢

- 字体：[LXGW WenKai Lite](https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont)
- 部署：GitHub Pages · GitHub Actions

© 2026 赴野 Everett
