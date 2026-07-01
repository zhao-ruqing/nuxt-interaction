export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body?.query?.trim()) {
    throw createError({ statusCode: 400, message: '消息内容不能为空' })
  }

  const payload = {
    inputs: body.inputs || {},
    query: body.query.trim(),
    response_mode: 'streaming',
    user: body.user || 'nuxt-interaction-user',
    ...(body.conversation_id ? { conversation_id: body.conversation_id } : {}),
  }

  const response = await fetch(`${config.difyApiBase}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.difyApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw createError({
      statusCode: response.status,
      message: `Dify API 请求失败: ${errText}`,
    })
  }

  if (!response.body) {
    throw createError({ statusCode: 502, message: 'Dify API 未返回流式数据' })
  }

  setResponseHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  return sendStream(event, response.body)
})
