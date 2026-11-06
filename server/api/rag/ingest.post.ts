export default defineEventHandler(async (event) => {
  const base = getRagServiceBase()
  const body = await readBody(event).catch(() => ({}))
  try {
    return await $fetch(`${base}/ingest`, {
      method: 'POST',
      body: { reset: body?.reset !== false },
    })
  }
  catch (e: any) {
    const status = e?.statusCode || e?.response?.status || 502
    const detail = e?.data?.detail || e?.message || 'ingest 失败'
    throw createError({ statusCode: status, message: String(detail) })
  }
})
