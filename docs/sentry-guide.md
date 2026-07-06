# Sentry 速查

## 是什么

线上错误监控：自动收集前后端异常，在后台 **Issues** 统一查看、去重、告警。

## 三个关键概念

| 名称 | 用途 | 敏感度 |
|------|------|--------|
| **DSN** | 上报地址，前端会暴露 | 低（公开密钥） |
| **Auth Token** | 构建时上传 Source Map | 高，勿提交 Git |
| **Issues** | 后台错误列表 | — |

## 接入流程（任意项目通用）

```
1. sentry.io 注册 → 建 Project → 复制 DSN
2. 安装对应 SDK（见下表）
3. 初始化 Sentry.init({ dsn })
4. 页面代码触发测试错误 → Issues 确认收到
```

### SDK 对照

| 技术栈 | 包名 |
|--------|------|
| Nuxt | `@sentry/nuxt` |
| Vue | `@sentry/vue` |
| React | `@sentry/react` |
| Node | `@sentry/node` |

> Wizard（`npx @sentry/wizard`）国内常因网络失败，直接手动接入即可。  
> 官方文档：[docs.sentry.io](https://docs.sentry.io)

## DSN 放哪

任选一种，原则：**客户端能拿到 DSN，服务端能拿到 DSN**。

- 环境变量（最简单）
- 数据库 / 配置表（多环境、可后台改）
- 配置中心 / 接口下发（微服务常用）

## 初始化要点

```ts
Sentry.init({
  dsn: "你的DSN",
  environment: "production",     // 区分环境
  tracesSampleRate: 0.2,         // 性能采样，生产别设 1.0
  replaysOnErrorSampleRate: 1.0, // 出错时录屏回放
});
```

## 常用 API

```ts
Sentry.captureException(err)           // 上报错误
Sentry.captureMessage("提示", "warn")  // 上报消息
Sentry.setUser({ id: "1" })            // 关联用户
```

## 验证 & 排错

- **测试**：在页面代码里 `throw new Error("test")`，不要用浏览器控制台
- **堆栈乱码**：配 Auth Token + 开启 Source Map 上传
- **服务端没数据**：确认生产环境已初始化，dev 模式多数框架默认不采集服务端

## Checklist

- [ ] 拿到 DSN
- [ ] 安装 SDK 并 `Sentry.init`
- [ ] 测试错误出现在 Issues
- [ ] 生产调低 `tracesSampleRate`
- [ ] （可选）配 Auth Token 上传 Source Map
