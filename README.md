# nuxt-interaction

基于 **Nuxt 4** 的饮品商城交互演示项目，集成用户端下单、后台管理、地图标注，并提供 **两套 AI 页面操作方案**：

| 方案 | 入口 | LLM | 操作方式 |
|------|------|-----|----------|
| **方案一：Dify + 幽灵手** | 右下角悬浮「饮品 AI 助手」 | Dify 工作流 | AI 返回 JSON 指令 → 前端解析 → 路由跳转 + 幽灵手模拟点击 |
| **方案二：Page Agent** | 右上角「页面助手」按钮 | DeepSeek（OpenAI 兼容） | Agent 直接观察 DOM、逐步推理并执行点击/输入 |

更详细的开发说明见 [`docs/AI助手开发文档.md`](docs/AI助手开发文档.md)。

---

## 技术栈

- **框架**：Nuxt 4、Vue 3、Pinia、Element Plus
- **样式**：SCSS
- **数据库**：MySQL（商品、订单、系统配置、地址标注）
- **AI**：
  - Dify API（对话 + 结构化指令）
  - [page-agent](https://github.com/alibaba/page-agent)（浏览器自动化 Agent）
- **动画**：GSAP（幽灵手光标移动）
- **地图**：高德地图 JS API

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 初始化数据库

默认连接配置见 `server/utils/db.ts`（`localhost` / `root` / `root` / `nuxt_interaction`），按需修改后执行：

```bash
mysql -u root -p nuxt_interaction < server/sql/system_configs.sql
mysql -u root -p nuxt_interaction < server/sql/products.sql
mysql -u root -p nuxt_interaction < server/sql/addresses.sql
```

### 3. 配置 API Key

在 `system_configs` 表中填入真实密钥（或使用环境变量备用）：

```sql
UPDATE system_configs SET config_value = '你的Dify Key' WHERE config_key = 'dify_api_key';
UPDATE system_configs SET config_value = '你的DeepSeek Key' WHERE config_key = 'deepseek_api_key';
```

| 配置键 | 用途 | 环境变量备用 |
|--------|------|--------------|
| `dify_api_key` | 饮品 AI 助手（方案一） | `DIFY_API_KEY` |
| `deepseek_api_key` | Page Agent（方案二） | `DEEPSEEK_API_KEY` |

### 4. 启动开发服务

```bash
pnpm dev
```

访问 `http://localhost:3000`。

---

## 项目结构（节选）

```
app/
├── components/
│   ├── AiChatWidget.vue          # 方案一：右下角 AI 对话悬浮窗
│   └── PageAgentTrigger.client.vue  # 方案二：顶部 Page Agent 触发按钮
├── composables/
│   ├── useAiChat.ts              # Dify 流式对话 + 指令 JSON 解析
│   ├── useActionExecutor.ts      # 指令分发（下单 / 跳转 / 管理任务）
│   ├── useGhostHand.ts           # 幽灵手：虚拟光标 + 模拟点击/填表
│   ├── useAdminAutomation.ts     # 后台管理页幽灵手编排
│   └── usePageAgentPanel.client.ts
├── plugins/
│   └── page-agent.client.ts      # Page Agent 初始化（仅客户端）
├── stores/
│   ├── orderAutomation.ts        # 待执行的下单任务
│   └── adminAutomation.ts        # 待执行的后台管理任务
└── pages/
    ├── products/[id].vue         # 商品详情（含 data-ghost-target 标记）
    ├── payment/index.vue         # 支付确认页
    └── dashboard/                # 后台：概览 / 商品管理 / 地图标注

server/
├── api/
│   ├── ai/chat.post.ts           # Dify 流式代理
│   ├── config/deepseek.get.ts    # DeepSeek 配置下发（仅服务端持有 Key）
│   └── products/、orders/、addresses/ ...
└── sql/                          # 建表与初始数据
```

---

## AI 页面操作：两种实现方案

### 方案对比

| 维度 | 方案一：Dify + 幽灵手 | 方案二：Page Agent |
|------|----------------------|-------------------|
| **触发入口** | 右下角 🤖 悬浮按钮 | 右上角 ⚡「页面助手」按钮 |
| **快捷键** | — | `Ctrl + Shift + P` |
| **LLM 提供方** | Dify Cloud 工作流 | DeepSeek（`deepseek-v4-flash`） |
| **交互形态** | 聊天对话，流式打字 | 底部 Agent 面板，逐步展示思考与操作 |
| **如何操作页面** | AI 输出固定 JSON → 前端按协议执行 | Agent 自行观察 DOM，调用内置工具点击/输入 |
| **可控性** | 高：指令字段、跳转路径、幽灵手步骤均可精确约定 | 中：依赖模型推理，适合开放式任务 |
| **适用场景** | 下单、支付引导、后台 CRUD 等**业务流程固定**的操作 | 「帮我在这个页面完成某某事」等**开放式**自动化 |
| **页面标记** | 需 `data-ghost-target` 等约定选择器 | 无需预标记，直接读 DOM |
| **服务端代理** | `POST /api/ai/chat` | `GET /api/config/deepseek` |

---

### 方案一：Dify + JSON 指令 + 幽灵手

#### 架构

```
用户 → AiChatWidget → useAiChat
                          ↓ POST（SSE）
                    /api/ai/chat → Dify API
                          ↓
                   解析 JSON 指令
                          ↓
                 useActionExecutor
                    ↙          ↘
            navigateTo      useGhostHand
            （页面跳转）    （模拟点击/填表）
```

#### 工作流程

1. 用户在 **饮品 AI 助手** 中输入自然语言（如「帮我点一杯咖啡」）。
2. Dify 工作流返回结构化 JSON（可约束为**仅输出 JSON**）。
3. `useAiChat.ts` 在流式结束后调用 `parseAiAction()` 提取指令，并触发 `useActionExecutor().execute(action)`。
4. 执行器根据 `action` 类型：
   - **用户端**：匹配商品 → 写入 `orderAutomation` store → 跳转商品页 → `useGhostHand` 点规格、调数量、点「立即购买」→ 跳转支付页。
   - **管理端**：写入 `adminAutomation` store → 跳转对应后台页 → `useAdminAutomation` 驱动幽灵手完成表单填写、按钮点击。

#### 支持的 action 类型（节选）

**用户端**

| action | 说明 |
|--------|------|
| `ORDER` | 自动下单（`product` / `productId` / `specs` / `quantity`） |
| `NAVIGATE` | 跳转指定路由 `route` |
| `SEARCH` | 商品搜索跳转 |

**管理端**

| action | 说明 |
|--------|------|
| `PRODUCT_CREATE` / `PRODUCT_UPDATE` / `PRODUCT_DELETE` | 商品 CRUD |
| `PRODUCT_SEARCH` | 商品管理页搜索 |
| `MAP_ADD_ADDRESS` / `MAP_UPDATE_ADDRESS` / `MAP_DELETE_ADDRESS` | 地图标注 |
| `MAP_SEARCH_LOCATION` / `MAP_LIST_ADDRESSES` | 地图搜索与列表 |

指令 JSON 示例：

```json
{
  "action": "ORDER",
  "product": "咖啡",
  "specs": "大杯",
  "quantity": 1
}
```

#### 幽灵手机制

- 组件：`useGhostHand.ts`（GSAP 驱动虚拟光标 `👆`）
- 页面元素通过 `data-ghost-target` 标记，例如商品详情页：

```html
<button data-ghost-target="spec-0">中杯</button>
<button data-ghost-target="quantity-plus">+</button>
<button data-ghost-target="buy-now">立即购买</button>
```

- 用户**真实移动鼠标**时会自动中止幽灵手，防止误操作。
- 规格/库存校验在跳转前与幽灵手执行前**双重检查**。

#### 关键文件

| 文件 | 职责 |
|------|------|
| `app/components/AiChatWidget.vue` | 对话 UI |
| `app/composables/useAiChat.ts` | SSE 解析、指令提取、触发执行 |
| `app/composables/useActionExecutor.ts` | 指令分发与商品匹配 |
| `app/composables/useGhostHand.ts` | 虚拟光标与 DOM 操作 |
| `app/composables/useAdminAutomation.ts` | 后台页面自动化编排 |
| `server/api/ai/chat.post.ts` | Dify 流式代理 |

#### Dify 配置建议

在 Dify 中配置意图路由：订单类走 `ORDER` 提示词，管理类走后台管理提示词。要求模型**只输出合法 JSON**，不要多余 Markdown 或解释文字。详见 [`docs/AI助手开发文档.md` §7、§10](docs/AI助手开发文档.md)。

---

### 方案二：Page Agent（浏览器自动化 Agent）

#### 架构

```
用户 → PageAgentTrigger（顶部按钮）
           ↓
    page-agent.client.ts 插件
           ↓
    PageAgent（DeepSeek LLM）
           ↓
    观察 DOM → 推理 → 逐步点击/输入/滚动
           ↓
    底部 Agent 面板（实时展示步骤）
```

#### 工作流程

1. 点击右上角 **「页面助手」**，或按 `Ctrl + Shift + P` 打开底部面板。
2. 输入任务描述（如「在商品管理页新增一杯奶茶」）。
3. Page Agent 循环执行：**观察页面** → **LLM 推理** → **调用工具**（点击元素、输入文本、滚动等），最多 40 步。
4. 面板实时展示思考过程、工具调用与执行结果；任务结束后可继续输入下一任务。

#### 特性说明

- **无需预定义 JSON 协议**：不依赖 `useActionExecutor`，由 Agent 直接理解页面结构。
- **配置来源**：启动时从 `GET /api/config/deepseek` 获取 `apiKey` / `baseURL` / `model`，Key 仅存服务端。
- **客户端专属**：`page-agent` 依赖浏览器 `window`，相关模块均使用 `.client.ts` / `.client.vue` 后缀，避免 SSR 报错。
- **面板关闭**：自带关闭按钮会 `dispose` 并移除 DOM；再次点击顶部按钮会**自动重建** Agent 实例。

#### 关键文件

| 文件 | 职责 |
|------|------|
| `app/plugins/page-agent.client.ts` | Agent 初始化、快捷键 |
| `app/utils/pageAgentState.client.ts` | 实例管理、dispose 后重建 |
| `app/utils/pageAgentPanel.client.ts` | 面板显示/隐藏/切换 |
| `app/components/PageAgentTrigger.client.vue` | 全局触发按钮 |
| `server/api/config/deepseek.get.ts` | DeepSeek 配置接口 |

#### 使用注意

- 需配置有效的 `deepseek_api_key`。
- 复杂业务（如支付密码确认）仍建议配合方案一的固定流程，或人工介入。
- Agent 操作时会显示页面遮罩（`enableMask: true`），减少用户干扰。

---

### 何时选用哪种方案？

| 需求 | 推荐 |
|------|------|
| 饮品下单、支付引导、固定后台流程 | **方案一**（可控、可测试、可对接 Dify 知识库） |
| 探索性任务、临时自动化、不想维护 JSON 协议 | **方案二**（开箱即用，适应页面变化） |
| 生产环境关键路径 | **方案一**为主；方案二作辅助或内部工具 |

两套方案**可同时使用**，互不冲突：右下角是业务向 AI 助手，右上角是通用页面 Agent。

---

## 主要功能页面

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/products` | 饮品商城列表 |
| `/products/:id` | 商品详情（幽灵手下单目标页） |
| `/payment` | 支付确认（AI 下单后跳转） |
| `/auth/login`、`/auth/register` | 登录注册 |
| `/dashboard` | 后台概览（内嵌 AI 助手） |
| `/dashboard/manage-products` | 商品管理 |
| `/dashboard/map` | 地图标注 |

---

## 常用命令

```bash
pnpm dev        # 开发
pnpm build      # 构建
pnpm preview    # 预览构建产物
```

---

## 相关文档

- [`docs/AI助手开发文档.md`](docs/AI助手开发文档.md) — Dify 对接、指令协议、幽灵手、后台自动化、版本记录
- [`docs/api/products.md`](docs/api/products.md) — 商品接口说明

---

## 版本摘要

| 版本 | 说明 |
|------|------|
| v0.1 | Dify 流式对话 + 指令 JSON 解析展示 |
| v0.2 | 自动下单 + 幽灵手模拟点击 |
| v0.3 | 规格/库存校验 + 支付页 + 真实数据库库存 |
| v0.4 | 后台管理 AI 自动化（商品 CRUD、地图标注） |
| v0.5 | 集成 Page Agent（DeepSeek）作为第二套页面操作方案 |
