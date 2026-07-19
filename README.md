# 折腾志 · 赴野 Everett

> 人生的意义在于折腾。

赴野（Everett）的个人主页 —— 手工打磨、无框架、部署于 GitHub Pages。
站点地址：<https://everett406.github.io>

当前版本：**v1.0.0**（通过 GitHub Releases 标记版本）

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

## 版本约定

采用语义化版本 `vMAJOR.MINOR.PATCH`，每次功能更新或 bug 修复都会更新版本号、调整本文件及站内关于页 / footer，并在 [Releases](../../releases) 发布。

## 致谢

- 字体：[LXGW WenKai Lite](https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont)
- 部署：GitHub Pages · GitHub Actions

© 2026 赴野 Everett
