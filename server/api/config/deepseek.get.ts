import { getDeepSeekApiKey } from '../../utils/config'

/** 获取 DeepSeek 配置（API Key + 地址 + 模型），供客户端 PageAgent 初始化使用 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const apiKey = await getDeepSeekApiKey()

  return {
    apiKey,
    baseURL: config.deepseekApiBase,
    model: config.deepseekModel,
  }
})
