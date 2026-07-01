export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  action?: AiAction
  loading?: boolean
}

export interface AiAction {
  action: string
  product?: string
  specs?: string
  [key: string]: unknown
}

export interface SanitizedResponse {
  displayContent: string
  thinking: string
  action: AiAction | null
}

const THINKING_BLOCK_RE = /<(?:think|redacted_thinking)>[\s\S]*?<\/(?:think|redacted_thinking)>/gi
const THINKING_INCOMPLETE_RE = /<(?:think|redacted_thinking)>[\s\S]*$/i
const THINKING_TAG_RE = /<\/?(?:think|redacted_thinking)>/gi

/** 剥离 AI 思考块，返回展示文本与思考内容 */
export function stripThinkingTags(text: string): { cleaned: string; thinking: string } {
  const thinkingParts: string[] = []
  let cleaned = text

  cleaned = cleaned.replace(THINKING_BLOCK_RE, (match) => {
    const inner = match.replace(THINKING_TAG_RE, '').trim()
    if (inner) thinkingParts.push(inner)
    return ''
  })

  const incomplete = cleaned.match(THINKING_INCOMPLETE_RE)
  if (incomplete) {
    const inner = incomplete[0].replace(THINKING_TAG_RE, '').trim()
    if (inner) thinkingParts.push(inner)
    cleaned = cleaned.replace(THINKING_INCOMPLETE_RE, '')
  }

  return { cleaned: cleaned.trim(), thinking: thinkingParts.join('\n\n') }
}

/** 尝试从 AI 回复中解析指令 JSON */
export function parseAiAction(text: string): AiAction | null {
  const { cleaned } = stripThinkingTags(text)
  const trimmed = cleaned.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed?.action) return parsed as AiAction
    }
    catch { /* 非合法 JSON */ }
  }

  const match = trimmed.match(/\{[\s\S]*?"action"[\s\S]*?\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed?.action) return parsed as AiAction
    }
    catch { /* 非合法 JSON */ }
  }

  return null
}

/** 判断展示内容是否仅为指令 JSON */
function isOnlyActionJson(text: string, action: AiAction): boolean {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return true

  const match = trimmed.match(/\{[\s\S]*?"action"[\s\S]*?\}/)
  if (!match) return false
  return trimmed.replace(match[0], '').trim() === ''
}

/** 将指令 JSON 转为用户友好的展示文案 */
export function formatActionMessage(action: AiAction): string {
  if (action.action === 'ORDER') {
    const specs = action.specs ? `（${action.specs}）` : ''
    return `好的，已为您准备下单：${action.product || '饮品'}${specs}`
  }
  if (action.action === 'NAVIGATE') {
    return `好的，正在为您跳转...`
  }
  if (action.action === 'SEARCH') {
    return `好的，正在为您搜索${action.product ? `「${action.product}」` : ''}...`
  }
  return '已收到操作指令，即将为您处理'
}

/** 统一清洗 AI 回复：去思考块、解析指令、生成展示文案 */
export function sanitizeAiResponse(text: string): SanitizedResponse {
  const { cleaned, thinking } = stripThinkingTags(text)
  const action = parseAiAction(cleaned)

  let displayContent = cleaned
  if (action && isOnlyActionJson(cleaned, action)) {
    displayContent = formatActionMessage(action)
  }
  else if (!displayContent && action) {
    displayContent = formatActionMessage(action)
  }

  return { displayContent, thinking, action }
}

export function useAiChat() {
  const messages = ref<ChatMessage[]>([])
  const conversationId = ref('')
  const isStreaming = ref(false)

  async function sendMessage(query: string) {
    if (!query.trim() || isStreaming.value) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
    }
    messages.value.push(userMsg)

    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      loading: true,
    }
    messages.value.push(assistantMsg)

    isStreaming.value = true

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          conversation_id: conversationId.value || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.message || `请求失败 (${response.status})`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取流式响应')

      const decoder = new TextDecoder()
      let buffer = ''
      let rawContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const event = JSON.parse(data)

            if (event.conversation_id && !conversationId.value) {
              conversationId.value = event.conversation_id
            }

            if (event.event === 'message' || event.event === 'agent_message') {
              rawContent += event.answer || ''
            }
            else if (event.answer && !event.event) {
              rawContent = event.answer
            }

            // 流式过程中实时清洗，避免思考块展示给用户
            const sanitized = sanitizeAiResponse(rawContent)
            assistantMsg.content = sanitized.displayContent
            assistantMsg.thinking = sanitized.thinking || undefined
          }
          catch { /* 跳过无法解析的行 */ }
        }
      }

      assistantMsg.loading = false
      const final = sanitizeAiResponse(rawContent)
      assistantMsg.content = final.displayContent
      assistantMsg.thinking = final.thinking || undefined
      assistantMsg.action = final.action || undefined
    }
    catch (e: any) {
      assistantMsg.content = e?.message || '发送失败，请稍后重试'
      assistantMsg.loading = false
    }
    finally {
      isStreaming.value = false
    }
  }

  function clearMessages() {
    messages.value = []
    conversationId.value = ''
  }

  return {
    messages,
    conversationId,
    isStreaming,
    sendMessage,
    clearMessages,
    parseAiAction,
    sanitizeAiResponse,
    formatActionMessage,
  }
}
