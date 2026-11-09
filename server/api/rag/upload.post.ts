export default defineEventHandler(async (event) => {
  const base = getRagServiceBase()
  // Forward multipart as-is so FastAPI receives file + optional subdir.
  return proxyRequest(event, `${base}/upload`)
})