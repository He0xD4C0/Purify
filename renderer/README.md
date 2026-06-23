# Renderer — Purify 前端

TypeScript SPA，编译到 `js/` 目录，由 Express 静态托管。

## 目录结构

```
ts/
├── core/           # 核心模块
│   ├── app.ts      # 入口、全局状态、页面路由分发
│   ├── api.ts      # 后端 API 客户端（fetch 封装）
│   ├── auth.ts     # 登录态管理、Cookie 读写
│   ├── router.ts   # Hash-based SPA 路由
│   ├── event-bus.ts# 全局事件总线
│   ├── storage.ts  # localStorage 封装
│   └── playability.ts # 歌曲可播放性判断
├── pages/          # 页面模块（按路由拆分）
│   ├── home.ts     # 发现页（Banner、推荐、新歌）
│   ├── library.ts  # 曲库页（喜欢、歌单、最近播放）
│   ├── account.ts  # 账户页（个人信息、设置入口）
│   ├── settings.ts # 设置页（ColumnNav 多级）
│   ├── search.ts   # 搜索结果页（多 Tab）
│   ├── detail.ts   # 通用详情页（歌单 + 专辑共用）
│   ├── player-page.ts # 全屏播放器
│   └── 404.ts      # 404 页面
├── components/     # 可复用 UI 组件
│   ├── player-bar.ts   # 底部播放条
│   ├── song-list.ts    # 歌曲列表（表格/卡片）
│   ├── playlist-card.ts# 歌单卡片网格
│   ├── search-bar.ts   # 搜索框 + 建议
│   ├── navbar.ts       # 底部导航栏
│   ├── login-panel.ts  # 登录面板（手机 + 扫码）
│   ├── modal.ts        # 模态弹窗
│   ├── music-badge.ts  # VIP/版权状态标签
│   └── player-icons.ts # 播放器 SVG 图标
├── player/         # 播放器引擎
│   ├── audio-engine.ts     # HTML5 Audio + Media Session
│   ├── lyrics-engine.ts    # LRC 歌词解析 + 双语/注音
│   ├── copyright-detector.ts # 版权检测
│   └── translate.ts        # AI 翻译
└── patterns/       # 通用交互模式
    ├── swipe-banner.ts   # 轮播 Banner
    ├── interactive-cover.ts # 悬停预览封面
    ├── column-nav.ts     # 多级列导航
    ├── swipe-panel.ts    # 滑动面板
    ├── tab-manager.ts    # Tab 管理
    └── virtual-scroll.ts # 虚拟滚动
```

## 关键设计

- **状态管理**: 全局 `state` 对象 + EventBus 解耦
- **路由**: Hash-based，支持 `playlist/123`、`search?q=xxx` 子路由
- **详情页**: `detail.ts` 统一处理歌单和专辑，通过 `CollectionType` 区分
- **API 客户端**: 统一 POST 请求，自动附带 Cookie

## 开发

```bash
npm run tsc         # 编译检查
npm run tsc:watch   # 监听模式
```

输出目录: `renderer/js/`（ESNext 模块，浏览器直接加载）
