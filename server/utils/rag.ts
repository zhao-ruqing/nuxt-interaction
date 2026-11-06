/** Base URL of the local Python RAG FastAPI service (no secrets here). */
export function getRagServiceBase(): string {
  const config = useRuntimeConfig()
  const base = (config.ragServiceUrl as string) || 'http://127.0.0.1:8002'
  return base.replace(/\/$/, '')
}
