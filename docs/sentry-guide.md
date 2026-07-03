# Sentry 快速接入指南（Nuxt）

> 精简版，适用于 Nuxt 3/4 项目，可复用到其他仓库。

## 1. Sentry 是什么

Sentry 是**错误监控平台**：自动捕获前端/后端的未处理异常，汇总到后台统一查看。

| 概念 | 说明 |
|------|------|
| **DSN** | 项目上报地址，格式如 `https://<key>@o<orgId>.ingest.us.sentry.io/<projectId>` |
| **Issues** | 后台错误列表，相同错误会自动合并 |
| **Auth Token** | 仅用于构建时上传 Source Map，**比 DSN 更敏感** |

DSN 会出现在前端代码中，属于公开密钥；Auth Token 绝不能提交到 Git。

---

## 2. 创建项目（一次性）

1. 注册 [sentry.io](https://sentry.io)
2. 创建 Organization → 创建 Project，平台选 **Nuxt**
3. 进入 **Settings → Client Keys (DSN)**，复制 DSN
4. （可选）**Settings → Auth Tokens** 创建 Token，勾选 `project:releases` 权限

> Wizard 命令 `npx @sentry/wizard@latest -i nuxt` 需访问 `sentry.io`，国内网络可能失败。失败时按下方手动接入即可。

---

## 3. 接入步骤（新项目照抄）

### 3.1 安装

```bash
pnpm add @sentry/nuxt
pnpm approve-builds @sentry/cli   # pnpm 需批准 CLI 构建脚本
```

### 3.2 环境变量

复制 `.env.example` 为 `.env`：

```env
NUXT_PUBLIC_SENTRY_DSN=https://<key>@o<orgId>.ingest.us.sentry.io/<projectId>
SENTRY_AUTH_TOKEN=                    # 可选，上传 Source Map 用
```

### 3.3 配置文件（项目根目录）

**`sentry.client.config.ts`** — 浏览器端

```ts
import * as Sentry from "@sentry/nuxt";

const dsn = useRuntimeConfig().public.sentry.dsn;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,           // 生产建议调低到 0.1~0.2
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    enableLogs: true,
  });
}
```

**`sentry.server.config.ts`** — 服务端

```ts
import * as Sentry from "@sentry/nuxt";

const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    enableLogs: true,
  });
}
```

> 服务端配置里只能用 `process.env`，不能用 `useRuntimeConfig()`。

### 3.4 `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ["@sentry/nuxt/module"],

  sentry: {
    org: "你的-org-slug",
    project: "你的-project-slug",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },

  sourcemap: { client: "hidden" },   // 配合 Source Map 上传

  runtimeConfig: {
    public: {
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
      },
    },
  },
});
```

### 3.5 `package.json` 生产启动脚本

```json
{
  "scripts": {
    "start": "node --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs"
  }
}
```

---

## 4. 开发 vs 生产

| 环境 | 客户端错误 | 服务端错误 |
|------|-----------|-----------|
| `pnpm dev` | ✅ 自动捕获 | ❌ 默认不生效 |
| `pnpm build` + `pnpm start` | ✅ | ✅（需 `--import` 脚本） |

验证服务端监控：必须先 `build`，再用 `start` 启动，不能用 `dev`。

---

## 5. 验证是否接通

在页面组件中加一个测试按钮（**不要用浏览器控制台抛错**，控制台错误不会被捕获）：

```vue
<script setup>
function testSentry() {
  throw new Error("Sentry 测试错误");
}
</script>

<template>
  <button @click="testSentry">触发测试错误</button>
</template>
```

点击后等几秒，到 Sentry 后台 **Issues** 查看是否出现。

---

## 6. 常用 API

```ts
import * as Sentry from "@sentry/nuxt";

// 手动上报错误
Sentry.captureException(new Error("自定义错误"));

// 手动上报消息
Sentry.captureMessage("某操作失败", "warning");

// 性能追踪
Sentry.startSpan({ name: "加载数据", op: "fetch" }, async () => {
  await $fetch("/api/xxx");
});

// 给错误附加上下文
Sentry.setUser({ id: "123", email: "user@example.com" });
Sentry.setTag("page", "dashboard");
```

---

## 7. 生产环境建议

```ts
Sentry.init({
  dsn,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,              // 不必 100% 采样
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,      // 出错时 100% 录制回放
});
```

- `tracesSampleRate`：性能追踪采样率，生产调低可省配额
- `replaysOnErrorSampleRate: 1.0`：出错时录制用户操作回放，排查很有用
- 配置 `SENTRY_AUTH_TOKEN` 后，`build` 会自动上传 Source Map，错误堆栈显示源码行号

---

## 8. 常见问题

| 问题 | 原因 / 解决 |
|------|------------|
| Wizard 报 `ECONNRESET` | 网络无法访问 `sentry.io`，改用手动接入 |
| 控制台抛错看不到 | 浏览器 DevTools 里的错误被沙箱隔离，需在页面代码中触发 |
| 服务端错误 dev 看不到 | 服务端监控仅生产构建后生效 |
| pnpm 报 `Ignored build scripts` | 执行 `pnpm approve-builds @sentry/cli` |
| 错误堆栈是压缩代码 | 配置 `SENTRY_AUTH_TOKEN` + `sourcemap: { client: "hidden" }` |

---

## 9. 新项目 Checklist

- [ ] sentry.io 创建 Project，拿到 DSN
- [ ] `pnpm add @sentry/nuxt`
- [ ] 创建 `sentry.client.config.ts` + `sentry.server.config.ts`
- [ ] `nuxt.config.ts` 加 module、sentry、runtimeConfig
- [ ] `.env` 填 `NUXT_PUBLIC_SENTRY_DSN`
- [ ] `package.json` 加 `start` 脚本（带 `--import`）
- [ ] 页面触发测试错误，Issues 确认收到
- [ ] （可选）配置 Auth Token，build 后检查堆栈是否有源码行号

---

## 参考

- [Sentry Nuxt 官方文档](https://docs.sentry.io/platforms/javascript/guides/nuxt/)
- [手动接入指南](https://docs.sentry.io/platforms/javascript/guides/nuxt/manual-setup/)
