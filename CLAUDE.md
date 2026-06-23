# Purify — 网易云音乐 Web 播放器

## 项目概述

Chrome-first 的网易云音乐 Web 播放器，Node.js + Express 后端，TypeScript 前端。

- `app.js` — 入口，启动 Express 服务
- `server.js` — Express 服务器配置
- `renderer/` — 前端代码（TypeScript + CSS）
- `module/` — 后端 API 模块
- `public/` — 静态资源

## 开发命令

```bash
npm run dev        # nodemon 启动开发服务器
npm run start      # 生产模式启动
npm run tsc        # TypeScript 编译检查
npm run tsc:watch  # TypeScript 监听编译
```

## 浏览器调试流程

### 前置条件

Chrome 已开启远程调试（`chrome://inspect/#remote-debugging`），MCP 配置了 `--autoConnect`。

### 调试工作流

**1. 定位页面**
```
mcp: list_pages → 找到目标标签页 → select_page
```

**2. 查看页面状态**
```
mcp: take_snapshot → 获取 DOM 结构（首选）
mcp: take_screenshot → 视觉截图（对比用）
```

**3. 检查控制台错误**
```
mcp: list_console_messages(types: ["error"]) → 过滤错误
mcp: get_console_message(msgid) → 查看详情
```

**4. 检查网络请求**
```
mcp: list_network_requests(resourceTypes: ["xhr", "fetch"]) → API 请求
mcp: get_network_request(reqid) → 请求/响应详情
```

**5. 交互调试**
```
mcp: click / fill / hover → 模拟用户操作
mcp: evaluate_script → 执行 JS 获取运行时状态
```

**6. 性能分析**
```
mcp: performance_start_trace → 录制性能
mcp: lighthouse_audit → Lighthouse 评分
```

### 常用调试场景

**播放器状态检查**
```js
// evaluate_script 检查播放器状态
() => {
  const audio = document.querySelector('audio')
  return audio ? {
    src: audio.src,
    paused: audio.paused,
    currentTime: audio.currentTime,
    duration: audio.duration
  } : 'no audio element'
}
```

**API 请求排查**
```
list_network_requests(resourceTypes: ["xhr", "fetch"])
→ 找到失败的请求
→ get_network_request 查看状态码和响应
```

**UI 元素检查**
```
take_snapshot → 获取完整 DOM 树
→ 用 uid 定位元素
→ click / hover 测试交互
→ evaluate_script 检查计算样式
```

### 调试原则

1. **先 snapshot 后 screenshot** — snapshot 可交互，screenshot 仅视觉
2. **先 console 后 network** — 错误通常在控制台有提示
3. **用 evaluate_script 替代猜测** — 直接读取运行时状态
4. **操作后重新 snapshot** — 确认 UI 状态变化

## 代码风格

- 前端 TypeScript，后端 CommonJS
- CSS 文件与页面对应（`renderer/css/`）
- SVG 图标抽到独立文件
- 注释密度中等，关键逻辑需注释
