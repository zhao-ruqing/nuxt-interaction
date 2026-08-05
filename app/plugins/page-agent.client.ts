import { togglePageAgentPanel } from '~/utils/pageAgentPanel.client'
import {
  getPageAgentPageInstructions,
  PAGE_AGENT_SYSTEM_INSTRUCTIONS,
} from '~/utils/pageAgentInstructions.client'
import { initPageAgentState } from '~/utils/pageAgentState.client'
import { createPageAgentCustomTools } from '~/utils/pageAgentTools.client'

export default defineNuxtPlugin({
  name: 'page-agent',
  parallel: false,
  async setup() {
    // 从服务端获取 DeepSeek 配置（API Key 存于数据库）
    let config: { apiKey: string; baseURL: string; model: string }
    try {
      config = await $fetch<{ apiKey: string; baseURL: string; model: string }>(
        '/api/config/deepseek',
      )
    } catch {
      // 数据库未就绪时使用空 key 兜底，面板仍可显示，执行任务前需先配置好 key
      config = { apiKey: '', baseURL: 'https://api.deepseek.com', model: 'deepseek-v4-flash' }
      console.warn('[page-agent] 无法获取 DeepSeek 配置，请先执行 server/sql/system_configs.sql 建表并填入真实 key')
    }

    const agent = initPageAgentState({
      // LLM 配置（DeepSeek，OpenAI 兼容接口）
      baseURL: config.baseURL,
      model: config.model,
      apiKey: config.apiKey,
      // 工具调用场景略降温度，减少把参数名误当成 action
      temperature: 0.2,
      maxRetries: 3,

      // Agent 行为配置
      language: 'zh-CN',
      maxSteps: 40,
      stepDelay: 0.4,

      // 页面控制器配置
      enableMask: true,

      // 任务完成后自动显示输入框
      promptForNextTask: true,

      // 业务指引：全局 + 按路由动态注入
      instructions: {
        system: PAGE_AGENT_SYSTEM_INSTRUCTIONS,
        getPageInstructions: getPageAgentPageInstructions,
      },

      // 站内导航 / 搜索等业务工具
      customTools: createPageAgentCustomTools(),

      // 任务结束后打日志，便于演示时观察
      onAfterTask: (_agent, result) => {
        console.info(
          '[page-agent] 任务结束',
          result.success ? '成功' : '失败',
          result.data,
        )
      },
    })

    // 面板默认隐藏，通过顶部按钮或快捷键显式打开

    // 键盘快捷键：Ctrl+Shift+P 切换面板显示/隐藏
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        togglePageAgentPanel()
      }
    }
    document.addEventListener('keydown', handleKeydown)

    return {
      provide: {
        pageAgent: agent,
      },
    }
  },
})
