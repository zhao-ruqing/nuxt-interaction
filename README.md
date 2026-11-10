# nuxt-interaction

基于 **Nuxt 4** 的饮品商城交互演示：用户端下单、后台管理、地图标注，以及两套 AI 页面操作（右下角 Dify + 幽灵手，右上角 Page Agent）。

标准 RAG 知识库在 [`/rag`](http://127.0.0.1:3000/rag)。入库与检索由独立 Python 服务 `rag-service` 完成；浏览器只请求 `/api/rag/*`，由 Nuxt 代理到该服务，前端不放密钥。

## 启动

先启动 rag-service（端口 8002），再启动 Nuxt（端口 3000）。

```bash
cd rag-service
# Windows PowerShell：激活虚拟环境
.\.venv\Scripts\Activate.ps1
# 若尚未建环境：python -m venv .venv，然后 pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

健康检查：http://127.0.0.1:8002/health 。也可用目录内的 `run.ps1` / `run.cmd`。

另开一个终端：

```bash
pnpm install
pnpm dev          # 即 nuxt dev --open，端口 3000
```

打开知识库页：http://127.0.0.1:3000/rag 。商城首页：http://127.0.0.1:3000 。数据库初始化脚本在 `server/sql/`。

## RAG 要点

- **数据源**：默认复用 `D:\Project\My-Projects\agent\数据源`（递归扫描 `.md` / `.txt` / `.markdown` / `.xlsx`）。该目录属于独立项目，不在本仓库。本地索引在 `rag-service/data/`（含 Chroma 与 `bm25_index.json`，已 gitignore，勿提交）。
- **切块**：文本按 500 字、重叠 50；xlsx 按工作表「表头 + 每一行」细切。
- **追问改写**：仅当新问题依赖上文（指代、省略，如「电流呢？」）时，才改写成可独立检索的问句；完整新意图原样检索，不注入历史里的型号或限定词。
- **混合检索**：向量（Chroma）+ BM25（jieba），RRF 融合后取 TopK，只用命中内容生成答案；资料不足时明确说不知道。
- **新增 Q&A**（「提交问答」）：写入 `15-用户问答/qa_<时间>_<摘要>.md`，整条问答作为一条单元、不拆开，然后增量入库。
- **新增数据源**（「上传并入库」）：默认写入 `16-用户上传/`，可填相对子目录（不能逃出数据源根目录）；同名自动改为 `name_1.ext`，然后增量入库。
- **重新入库**：仍为全量 reset，重建 Chroma 与 BM25。

## 环境变量

真实值只放在已忽略的 `.env` 中，不要提交，也不要写入文档。

| 变量 | 位置 | 说明 |
|------|------|------|
| `DASHSCOPE_API_KEY` | `rag-service/.env` | 必填 |
| `DASHSCOPE_BASE_URL`、`CHAT_MODEL`、`EMBEDDING_MODEL`、`DATA_DIR`、`CHROMA_DIR` | `rag-service/.env` | 可选，参见 `rag-service/.env.example` |
| `RAG_SERVICE_URL` | 项目根 `.env` | 可选，默认指向本机 8002 |
| `DIFY_API_KEY`、`DEEPSEEK_API_KEY` | 项目根 `.env` 或 `system_configs` 表 | 两套页面助手备用 |

## 相关文档

- [`docs/AI助手开发文档.md`](docs/AI助手开发文档.md) — Dify、幽灵手、Page Agent
- [`docs/api/products.md`](docs/api/products.md) — 商品接口
- `docs/RAG.md` 是早期笔记，**当前 RAG 流程以本 README 为准**。
