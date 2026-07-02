import { PageAgent } from 'page-agent'

import {
  PAGE_AGENT_PANEL_CLOSED_EVENT,
  setPageAgentPanelOpen,
} from '~/utils/pageAgentPanelState'

export type PageAgentCreateConfig = ConstructorParameters<typeof PageAgent>[0]

let createConfig: PageAgentCreateConfig | null = null
let currentAgent: PageAgent | null = null

/** 同步面板可见状态到响应式变量 */
export function syncPageAgentPanelOpen() {
  const agent = currentAgent
  setPageAgentPanelOpen(agent ? isPanelDomVisible(agent) : false)
}

/** 判断面板 DOM 是否仍挂载且可见 */
export function isPanelDomVisible(agent: PageAgent): boolean {
  const wrapper = agent.panel.wrapper
  if (!document.body.contains(wrapper)) return false
  return wrapper.style.display !== 'none'
}

function bindAgentEvents(agent: PageAgent) {
  agent.addEventListener('dispose', () => {
    setPageAgentPanelOpen(false)
    window.dispatchEvent(new CustomEvent(PAGE_AGENT_PANEL_CLOSED_EVENT))
  })
}

/** 创建新的 Page Agent 实例 */
export function createPageAgent(): PageAgent {
  if (!createConfig) {
    throw new Error('[page-agent] 未初始化配置')
  }

  const agent = new PageAgent(createConfig)
  bindAgentEvents(agent)
  currentAgent = agent

  try {
    useNuxtApp().$pageAgent = agent
  } catch {
    // 插件初始化早期可能尚无 Nuxt 上下文
  }

  return agent
}

/** 初始化 Page Agent 状态 */
export function initPageAgentState(config: PageAgentCreateConfig): PageAgent {
  createConfig = config
  return createPageAgent()
}

/** 获取当前 Page Agent 实例 */
export function getPageAgent(): PageAgent | null {
  return currentAgent
}

/**
 * 确保 Page Agent 可用
 * 自带关闭按钮会 dispose 并移除面板 DOM，需在此重建
 */
export function ensurePageAgent(): PageAgent {
  if (!currentAgent || currentAgent.disposed || !document.body.contains(currentAgent.panel.wrapper)) {
    return createPageAgent()
  }
  return currentAgent
}
