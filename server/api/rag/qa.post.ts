export default defineEventHandler(async (event) => {
  const base = getRagServiceBase()
  const body = await readBody(event)
  const question = (body?.question || '').toString().trim()
  const answer = (body?.answer || '').toString().trim()
  if (!question || !answer) {
    throw createError({ statusCode: 400, message: 'question 与 answer 均不能为空' })
  }
  try {
    return await $fetch(`${base}/qa`, {
      method: 'POST',
      body: { question, answer },
    })
  }
  catch (e: any) {
    const status = e?.statusCode || e?.response?.status || 502
    const detail = e?.data?.detail || e?.message || 'qa 失败'
    throw createError({ statusCode: status, message: String(detail) })
  }
})