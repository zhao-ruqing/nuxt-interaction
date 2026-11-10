# nuxt-interaction

基于 **Nuxt 4** 的饮品商城交互演示项目，集成用户端下单、后台管理、地图标注，并提供 **两套 AI 页面操作方案**：

| 方案 | 入口 | LLM | 操作方式 |
|------|------|-----|----------|
| **方案一：Dify + 幽灵手** | 右下角悬浮「饮品 AI 助手」 | Dify 工作流 | AI 返回 JSON 指令 → 前端解析 → 路由跳转 + 幽灵手模拟点击 |
| **方案二：Page Agent** | 右上角「页面助手」按钮 | DeepSeek（OpenAI 兼容） | Agent 直接观察 DOM、逐步推理并执行点击/输入 |

另外提供 **标准 RAG 知识库**：独立 Python 服务 `rag-service`（默认 `127.0.0.1:8002`）与 Nuxt 页面 [`/rag`](http://127.0.0.1:3000/rag)。浏览器只请求 `/api/rag/*`，由 Nuxt 服务端代理到 rag-service，前端不放密钥。

更详细的开发说明见 [`docs/AI助手开发文档.md`](docs/AI助手开发文档.md)；RAG 补充说明见 [`docs/RAG.md`](docs/RAG.md)。

---

## 技术栈

- **框架**：Nuxt 4、Vue 3、Pinia、Element Plus
- **样式**：SCSS
- **数据库**：MySQL（商品、订单、系统配置、地址标注）
- **AI**：
  - Dify API（对话 + 结构化指令）
  - [page-agent](https://github.com/alibaba/page-agent)（浏览器自动化 Agent）
  - 标准 RAG：独立 FastAPI 服务（Chroma 向量检索 + BM25 / jieba 混合检索，阿里云百炼 DashScope）
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

访问 `http://localhost:3000`（`pnpm dev` 即 `nuxt dev --open`，默认端口 3000）。

如需使用知识库问答，请再启动 `rag-service`（见下方「标准 RAG 知识库」），然后打开 `http://127.0.0.1:3000/rag`。

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
    ├── rag/index.vue             # 标准 RAG 知识库对话页
    ├── products/[id].vue         # 商品详情（含 data-ghost-target 标记）
    ├── payment/index.vue         # 支付确认页
    └── dashboard/                # 后台：概览 / 商品管理 / 地图标注

server/
├── api/
│   ├── rag/                      # 代理 rag-service：health / ingest / chat / qa / upload
│   ├── ai/chat.post.ts           # Dify 流式代理
│   ├── config/deepseek.get.ts    # DeepSeek 配置下发（仅服务端持有 Key）
│   └── products/、orders/、addresses/ ...
└── sql/                          # 建表与初始数据

rag-service/                      # 独立 Python FastAPI（默认 8002）
├── app/                          # 入库、追问改写、混合检索、生成
├── requirements.txt
├── run.ps1 / run.cmd             # 本机启动脚本
└── .env.example                  # 环境变量名示例（勿写入真实密钥后提交）
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

## 标准 RAG 知识库

Nuxt 负责页面与 API 代理，RAG 为独立的 Python FastAPI 服务；**前端不放密钥**。

### 架构

```
浏览器 /rag 页
        ↓  /api/rag/health | ingest | chat | qa | upload
Nuxt 服务端代理（server/api/rag/*）
        ↓  RAG_SERVICE_URL（默认 http://127.0.0.1:8002）
rag-service（FastAPI）
        → 追问改写（仅指代/省略时）
        → 混合检索（向量 + BM25，RRF 融合）
        → 仅用命中 chunk 生成答案与引用
```

数据源默认复用 `D:\Project\My-Projects\agent\数据源`（递归扫描 `.md` / `.txt` / `.markdown` / `.xlsx`）。该目录属于独立的 agent 项目，不在本仓库内提交。

本地向量库与 BM25 索引写在 `rag-service/data/`（`chroma/`、`bm25_index.json` 均已 gitignore），不要提交到远程。

### 入库与检索

- **文本（md / txt）**：固定切块（500 字，重叠 50）。
- **xlsx**：按工作表「表头 + 每一行」细切为可检索单元（另有表头横幅单元，便于按工作表发现）。
- **混合检索**：问题同时走 Chroma 向量检索和 BM25（jieba 分词）检索，再用 RRF 融合后取 TopK，仅用命中内容生成答案；资料不足时明确说不知道，不编造。
- **追问改写**（contextualize-question）：多轮对话中，仅当新问题依赖上文（代词指代、省略主语/型号，例如「电流呢？」）时，才改写成可独立检索的问句再检索；若问题本身已是完整新意图，则原样检索，不会把历史里的型号或限定词注入进去。

### /rag 页：新增 Q&A 与数据源

打开 `http://127.0.0.1:3000/rag`：

| 操作 | 行为 |
|------|------|
| **新增 Q&A**（「提交问答」） | 写入数据源目录 `15-用户问答\qa_<时间>_<摘要>.md`，整条 Q&A 作为一条可检索单元，**不会被切碎**；随后做增量入库。 |
| **新增数据源**（「上传并入库」） | 支持 md / txt / markdown / xlsx。默认写入 `16-用户上传\`，也可填写相对子目录（不能逃出数据源根目录）。同名不会覆盖，自动改成 `name_1.ext`。提交后增量入库。 |
| **重新入库** | 仍为全量 reset：重建 Chroma 与 BM25，并重新扫描整个数据源目录。 |

增量入库会先 embedding，再写入 Chroma 并追加 BM25，不会每次全量重建。

### 本机启动

1. 在 `rag-service/.env` 中配置密钥与模型（可复制 `rag-service/.env.example`）。至少设置 `DASHSCOPE_API_KEY`；可选 `DASHSCOPE_BASE_URL`、`CHAT_MODEL`、`EMBEDDING_MODEL`、`DATA_DIR`、`CHROMA_DIR`。项目根目录 `.env` 可设置 `RAG_SERVICE_URL`（默认 `http://127.0.0.1:8002`）。**只写环境变量名到文档，真实值只放在已忽略的 `.env` 中，不要提交。**

2. 启动 rag-service（端口 8002）。在 `rag-service` 目录激活虚拟环境后启动（建议加 `--reload`）：

```bash
cd rag-service
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

若尚未创建虚拟环境，先在该目录执行 `python -m venv .venv`，激活后 `pip install -r requirements.txt`。也可以使用目录内的 `run.ps1`（PowerShell）或 `run.cmd`（cmd）。健康检查：http://127.0.0.1:8002/health 。

3. 启动 Nuxt（端口 3000）：

```bash
pnpm dev
```

即 `nuxt dev --open`。然后打开 http://127.0.0.1:3000/rag 。

### 关键文件

| 路径 | 职责 |
|------|------|
| `rag-service/app/ingest.py` | 扫描数据源、切块（含 xlsx 表头+行、问答整条不拆）、写入 Chroma / BM25 |
| `rag-service/app/ingest_extra.py` | 新增问答、上传文件与增量入库 |
| `rag-service/app/rewrite.py` | 追问改写（仅指代/省略） |
| `rag-service/app/retrieve.py` | 向量 + BM25（jieba）RRF 混合检索 |
| `rag-service/app/generate.py` | 仅用检索 chunk 生成答案与引用 |
| `server/api/rag/*` | Nuxt 代理 `/api/rag/*` |
| `app/pages/rag/index.vue` | `/rag` 对话与入库工具页 |

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
| `/rag` | 标准 RAG 知识库（对话、引用、新增 Q&A / 上传数据源、重新入库） |

---

## 常用命令

```bash
pnpm dev        # 开发（nuxt dev --open，端口 3000）
pnpm build      # 构建
pnpm preview    # 预览构建产物

# 在 rag-service 目录：激活 .venv 后
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

---

## 相关文档

- [`docs/AI助手开发文档.md`](docs/AI助手开发文档.md) — Dify 对接、指令协议、幽灵手、后台自动化、版本记录
- [`docs/RAG.md`](docs/RAG.md) — 标准 RAG 补充说明（启动与目录）
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
| v0.6 | 标准 RAG：独立 rag-service（8002）+ `/rag` 页，数据源入库与问答 |
| v0.7 | 追问改写、向量+BM25 混合检索、新增 Q&A / 上传数据源与增量入库 |
