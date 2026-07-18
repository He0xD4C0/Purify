# Purify

网易云音乐 Web 播放器项目，采用 Node.js + Express 后端与 TypeScript 前端。

## 概览

Purify 是一个面向浏览器的网易云音乐 Web 播放器，包含：

- Express 服务端，用于提供 API 与静态资源
- TypeScript SPA 前端，运行在 `renderer/` 下
- `module/` 中的大量网易云音乐接口封装
- 本地播放器、歌词、搜索、账号、详情页等前端功能

当前运行入口是 `app.js`，服务核心实现在 `server.js`。

## 目录结构

```text
.
├── app.js                # 当前服务启动入口
├── server.js             # Express 服务构造与启动逻辑
├── module/               # API 模块
├── renderer/             # 前端代码与静态页面
│   ├── src/              # TypeScript 源码
│   ├── built/            # TypeScript 编译产物（可重建）
│   ├── css/              # 前端样式
│   └── index.html        # SPA 入口页面
├── public/               # 其他静态资源与历史页面
├── util/                 # 服务端工具函数
├── data/                 # 数据文件
├── BACK_END_GUID.MD      # 后端相关说明
└── README.md             # 项目根说明
```

## 环境要求

- Node.js >= 18
- 推荐使用 pnpm

## 安装依赖

```bash
pnpm i
```

## 开发命令

```bash
pnpm run dev
pnpm run start
pnpm run tsc
pnpm run tsc:watch
```

说明：

- `pnpm run dev`：使用 nodemon 启动服务
- `pnpm run start`：直接启动生产模式服务
- `pnpm run tsc`：检查并编译前端 TypeScript 到 `renderer/built/`
- `pnpm run tsc:watch`：监听前端 TypeScript 变更

## 前端说明

前端源码位于 `renderer/src/`，编译输出到 `renderer/built/`。

浏览器入口页面为 `renderer/index.html`，默认加载：

- `css/main.css`
- `css/player.css`
- `built/core/app.js`

如果修改了前端源码，需要重新执行：

```bash
pnpm run tsc
```

## 测试说明

仓库当前包含：

- `server.test.js`：服务侧测试入口
- `main.test.js`：聚合导出层测试

但 `package.json` 当前未声明统一的 `test` 脚本。如果后续继续整理入口文件，可以再统一测试执行方式。

## 部署说明

Vercel 配置位于 `vercel.json`，当前部署入口已指向 `app.js`。

## 额外说明

- `renderer/built/` 是可再生产物，建议不纳入版本控制
- `renderer/screenshots/` 为截图资料，建议不纳入版本控制
- 当前锁文件以 `pnpm-lock.yaml` 为准
