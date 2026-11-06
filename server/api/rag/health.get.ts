export default defineEventHandler(async () => {
  const base = getRagServiceBase()
  try {
    return await $fetch(`${base}/health`)
  }
  catch (e: any) {
    throw createError({
      statusCode: 502,
      message: e?.message || 'RAG 服务不可用，请先启动 rag-service（端口 8002）',
    })
  }
})
