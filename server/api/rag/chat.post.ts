export default defineEventHandler(async (event) => {
  const base = getRagServiceBase()
  const body = await readBody(event)
  const question = (body?.question || body?.query || '').toString().trim()
  if (!question) {
    throw createError({ statusCode: 400, message: 'question 不能为空' })
  }
  const top_k = Number(body?.top_k) > 0 ? Number(body.top_k) : 4

  // Forward prior turns for follow-up rewrite (optional).
  const rawHist = body?.messages ?? body?.history
  let messages: Array<{ role: string; content: string }> | undefined
  if (Array.isArray(rawHist)) {
    messages = rawHist
      .map((m: any) => ({
        role: String(m?.role || '').trim(),
        content: String(m?.content || '').trim(),
      }))
      .filter(
        (m: { role: string; content: string }) =>
          (m.role === 'user' || m.role === 'assistant' || m.role === 'system')
          && m.content.length > 0,
      )
    if (!messages.length) messages = undefined
  }

  try {
    return await $fetch(`${base}/chat`, {
      method: 'POST',
      body: {
        question,
        top_k,
        ...(messages ? { messages } : {}),
      },
    })
  }
  catch (e: any) {
    const status = e?.statusCode || e?.response?.status || 502
    const detail = e?.data?.detail || e?.message || 'chat 失败'
    throw createError({ statusCode: status, message: String(detail) })
  }
})