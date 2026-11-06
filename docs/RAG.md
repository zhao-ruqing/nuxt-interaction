# 标准 RAG 知识库（nuxt-interaction）

企业形态：Nuxt 管页面与 API；RAG 为独立 Python FastAPI；**前端零密钥**。

## 流程（标准）

1. 文档固定切块（500 / overlap 50）
2. DashScope Embedding → Chroma 本地持久化
3. 提问 Embedding → TopK 相似度检索
4. **仅用**检索到的 chunk 拼 Prompt → Chat 生成 + citations
5. 资料不足明确说不知道；新增文件需显式「重新入库」

## 目录

| 路径 | 说明 |
| --- | --- |
| `rag-service/` | Python FastAPI（ingest / retrieve / generate 分离） |
| `rag-service/.env` | 百炼密钥与模型（已 gitignore，勿提交） |
| `rag-service/data/chroma` | Chroma 本地库 |
| `server/api/rag/*` | Nuxt 代理：`/api/rag/health|ingest|chat` |
| `app/pages/rag/index.vue` | 对话页（答案 + 引用 + 过程） |
| 数据源 | `D:\Project\My-Projects\agent\数据源`（复用，不另找） |

## 启动

### 1) Python RAG（端口 8002）

```powershell
cd D:\Project\My-Projects\nuxt\nuxt-interaction\rag-service
.\run.ps1
```

健康检查：http://127.0.0.1:8002/health

### 2) Nuxt

```powershell
cd D:\Project\My-Projects\nuxt\nuxt-interaction
pnpm dev
```

打开：http://127.0.0.1:3000/rag

可选环境变量（项目根 `.env`）：`RAG_SERVICE_URL=http://127.0.0.1:8002`

## 使用

1. 打开 `/rag` →「重新入库」
2. 提问生活向问题（应有引用）
3. 问无关问题应拒答 / 说不知道

## 密钥

- 只放在 `rag-service/.env`（从 agent `.env` 复制键）
- 禁止写入前端、README 正文、git commit