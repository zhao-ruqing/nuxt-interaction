<template>
  <VoidShell>
    <header class="void-nav void-nav--static">
      <NuxtLink to="/" class="void-nav__logo" data-magnetic>行鉴</NuxtLink>
      <nav class="void-nav__links">
        <NuxtLink to="/" class="void-nav__link" data-magnetic>首页</NuxtLink>
        <NuxtLink to="/products" class="void-nav__link" data-magnetic>饮品商城</NuxtLink>
        <NuxtLink to="/rag" class="void-nav__link" data-magnetic>知识库</NuxtLink>
        <AuthAccountLinks variant="void" />
      </nav>
    </header>

    <main class="void-page rag-page">
      <header class="rag-header" data-reveal>
        <div>
          <div class="rag-badge">
            <span class="void-card__pulse" />
            STANDARD RAG · KNOWLEDGE BASE
          </div>
          <h1 class="rag-title">知识库</h1>
          <p class="rag-sub">
            切块 → Embedding → Chroma → TopK 检索 → 仅用命中片段生成，并附引用
          </p>
        </div>
        <div class="rag-actions">
          <button class="void-btn" type="button" :disabled="healthLoading" data-magnetic @click="checkHealth">
            <span class="void-btn__glow" />
            {{ healthLoading ? '检查中…' : '检查服务' }}
          </button>
          <button class="void-btn void-btn--primary" type="button" :disabled="ingesting" data-magnetic @click="doIngest">
            <span class="void-btn__glow" />
            {{ ingesting ? '入库中…' : '重新入库' }}
          </button>
        </div>
      </header>

      <div v-if="statusText" class="rag-status" :class="statusOk ? 'rag-status--ok' : 'rag-status--warn'">
        <LucideIcon :name="statusOk ? 'sparkles' : 'bug'" :size="16" />
        <span>{{ statusText }}</span>
      </div>

      <section class="rag-panel">
        <div ref="listRef" class="rag-messages">
          <div v-if="!messages.length" class="rag-empty">
            <LucideIcon name="brain" :size="40" class="rag-empty__icon" />
            <p>先点「重新入库」，再提问。</p>
            <p class="rag-empty__hint">例：成年人每天大概需要睡多少小时？</p>
          </div>

          <div
            v-for="m in messages"
            :key="m.id"
            class="rag-msg"
            :class="m.role"
          >
            <div class="rag-bubble">
              <div class="rag-role">{{ m.role === 'user' ? '你' : '知识库' }}</div>
              <div class="rag-content">{{ m.content }}</div>

              <div v-if="m.citations?.length" class="rag-cites">
                <div class="rag-cites__title">引用</div>
                <div v-for="(c, i) in m.citations" :key="i" class="rag-cite">
                  <div class="rag-cite__meta">
                    <code>{{ c.source }}</code>
                    <span v-if="c.chunk_index != null">#{{ c.chunk_index }}</span>
                    <span v-if="c.similarity != null" class="sim">sim {{ Number(c.similarity).toFixed(3) }}</span>
                  </div>
                  <pre>{{ c.excerpt }}</pre>
                </div>
              </div>

              <details v-if="m.process" class="rag-process">
                <summary>RAG 过程</summary>
                <pre>{{ JSON.stringify(m.process, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <form class="rag-input" @submit.prevent="ask">
          <textarea
            v-model="question"
            rows="2"
            placeholder="输入问题（仅依据知识库回答）"
            :disabled="asking"
            @keydown.enter.exact.prevent="ask"
          />
          <button class="void-btn void-btn--primary" type="submit" :disabled="asking || !question.trim()" data-magnetic>
            <span class="void-btn__glow" />
            {{ asking ? '检索中…' : '提问' }}
          </button>
        </form>
      </section>
    </main>
  </VoidShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: '知识库 · 行鉴' })

interface Citation {
  source?: string
  chunk_index?: number
  excerpt?: string
  similarity?: number
  distance?: number
}

interface RagMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  process?: unknown
}

const messages = ref<RagMessage[]>([])
const question = ref('')
const asking = ref(false)
const ingesting = ref(false)
const healthLoading = ref(false)
const statusText = ref('')
const statusOk = ref(false)
const listRef = ref<HTMLElement | null>(null)

async function checkHealth() {
  healthLoading.value = true
  try {
    const h = await $fetch<any>('/api/rag/health')
    statusOk.value = !!h?.ok
    statusText.value = `服务正常 · chat=${h.chat_model} · embed=${h.embedding_model} · data=${h.data_dir}`
  }
  catch (e: any) {
    statusOk.value = false
    statusText.value = e?.data?.message || e?.message || 'RAG 服务未启动（请先跑 rag-service/run.ps1）'
  }
  finally {
    healthLoading.value = false
  }
}

async function doIngest() {
  ingesting.value = true
  try {
    const r = await $fetch<any>('/api/rag/ingest', { method: 'POST', body: { reset: true } })
    statusOk.value = true
    statusText.value = `入库完成：${r.files} 文件 / ${r.chunks} chunks · chroma=${r.chroma_dir}`
  }
  catch (e: any) {
    statusOk.value = false
    statusText.value = e?.data?.message || e?.message || '入库失败'
  }
  finally {
    ingesting.value = false
  }
}

async function ask() {
  const q = question.value.trim()
  if (!q || asking.value) return
  messages.value.push({ id: `u-${Date.now()}`, role: 'user', content: q })
  question.value = ''
  asking.value = true
  const aid = `a-${Date.now()}`
  messages.value.push({ id: aid, role: 'assistant', content: '检索中…' })
  await nextTick()
  listRef.value?.scrollTo({ top: listRef.value.scrollHeight })
  try {
    const r = await $fetch<any>('/api/rag/chat', {
      method: 'POST',
      body: { question: q, top_k: 4 },
    })
    const msg = messages.value.find(m => m.id === aid)
    if (msg) {
      msg.content = r.answer || '(空回答)'
      msg.citations = r.citations || []
      msg.process = r.process
    }
  }
  catch (e: any) {
    const msg = messages.value.find(m => m.id === aid)
    if (msg) msg.content = e?.data?.message || e?.message || '提问失败'
  }
  finally {
    asking.value = false
    await nextTick()
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight })
  }
}

onMounted(() => { checkHealth() })
</script>

<style scoped lang="scss">
.rag-page {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: 80px;
}

.rag-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.rag-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 6px 14px;
  border: 1px solid var(--void-border);
  border-radius: 100px;
  font-family: var(--void-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--void-muted);
}

.rag-title {
  margin: 0 0 8px;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--void-text);
}

.rag-sub {
  margin: 0;
  max-width: 520px;
  color: var(--void-muted);
  font-size: 14px;
  line-height: 1.6;
}

.rag-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.rag-status {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: var(--void-radius-sm);
  border: 1px solid var(--void-border);
  background: var(--void-surface);
  color: var(--xj-text-soft);
  font-size: 13px;
  line-height: 1.5;

  &--ok {
    border-color: color-mix(in srgb, var(--xj-success) 45%, var(--void-border));
    color: var(--xj-success);
  }

  &--warn {
    border-color: color-mix(in srgb, var(--xj-warning) 45%, var(--void-border));
    color: var(--xj-warning);
  }
}

.rag-panel {
  display: flex;
  flex-direction: column;
  min-height: 62vh;
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  background: var(--void-surface);
  backdrop-filter: blur(24px);
  overflow: hidden;
  box-shadow: var(--xj-shadow);
}

.rag-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 62vh;
}

.rag-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 64px 16px;
  color: var(--void-muted);
  text-align: center;

  &__icon {
    opacity: 0.55;
    color: var(--xj-accent);
    margin-bottom: 6px;
  }

  &__hint {
    font-size: 13px;
    color: var(--xj-faint);
  }
}

.rag-msg {
  display: flex;

  &.user {
    justify-content: flex-end;
  }
}

.rag-bubble {
  max-width: min(86%, 720px);
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--void-border);
  background: color-mix(in srgb, var(--xj-bg-elevated) 88%, transparent);
  color: var(--void-text);
}

.rag-msg.user .rag-bubble {
  background: var(--xj-accent-soft);
  border-color: var(--xj-border-strong);
}

.rag-role {
  margin-bottom: 6px;
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--void-muted);
}

.rag-content {
  white-space: pre-wrap;
  line-height: 1.65;
  font-size: 14px;
}

.rag-cites {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--void-border);
}

.rag-cites__title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--xj-accent);
}

.rag-cite {
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--void-border);
  background: color-mix(in srgb, var(--xj-bg) 70%, transparent);
  font-size: 12px;

  code {
    color: var(--xj-accent);
    font-family: var(--void-mono);
    font-size: 11px;
  }

  .sim {
    margin-left: 8px;
    color: var(--void-muted);
  }

  pre {
    margin: 8px 0 0;
    white-space: pre-wrap;
    color: var(--xj-text-soft);
    font-family: inherit;
    line-height: 1.5;
  }
}

.rag-cite__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.rag-process {
  margin-top: 10px;
  font-size: 12px;
  color: var(--void-muted);

  summary {
    cursor: pointer;
    color: var(--xj-accent);
  }

  pre {
    margin-top: 8px;
    max-height: 240px;
    overflow: auto;
    padding: 10px;
    border-radius: 12px;
    background: #07080c;
    color: #d7e0ea;
    border: 1px solid var(--void-border);
  }
}

.rag-input {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-top: 1px solid var(--void-border);
  align-items: flex-end;
  background: color-mix(in srgb, var(--xj-bg-elevated) 70%, transparent);

  textarea {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    resize: vertical;
    min-height: 64px;
    max-height: 160px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--void-border);
    background: color-mix(in srgb, var(--xj-bg) 80%, transparent);
    color: var(--void-text);
    font: inherit;
    line-height: 1.5;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;

    &:focus {
      border-color: var(--xj-border-strong);
      background: var(--xj-surface-hover);
    }

    &:disabled {
      opacity: 0.6;
    }

    &::placeholder {
      color: var(--xj-faint);
    }
  }

  /* 覆盖全局 .void-btn { width:100% }，避免挤扁输入框 */
  .void-btn {
    flex: 0 0 auto;
    width: auto;
    min-width: 96px;
    height: 48px;
    padding: 0 28px;
    white-space: nowrap;
    align-self: flex-end;
  }
}

.rag-actions .void-btn {
  width: auto;
  min-width: 0;
  padding: 12px 22px;
}

@media (max-width: 720px) {
  .rag-header {
    flex-direction: column;
  }

  .rag-actions {
    width: 100%;
  }

  .rag-actions .void-btn {
    flex: 1;
  }

  .rag-input {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
