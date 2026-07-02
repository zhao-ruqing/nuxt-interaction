import type { PageAgent } from 'page-agent'

import {
  ensurePageAgent,
  isPanelDomVisible,
  syncPageAgentPanelOpen,
} from '~/utils/pageAgentState.client'

/** 判断 Page Agent 面板是否可见 */
export function isPageAgentPanelVisible(agent: PageAgent): boolean {
  return isPanelDomVisible(agent)
}

/** 切换 Page Agent 面板显示状态 */
export function togglePageAgentPanel(): PageAgent {
  const agent = ensurePageAgent()
  if (isPanelDomVisible(agent)) {
    agent.panel.hide()
  } else {
    agent.panel.show()
  }
  syncPageAgentPanelOpen()
  return agent
}

/** 显示 Page Agent 面板 */
export function showPageAgentPanel(): PageAgent {
  const agent = ensurePageAgent()
  agent.panel.show()
  syncPageAgentPanelOpen()
  return agent
}

/** 隐藏 Page Agent 面板 */
export function hidePageAgentPanel(): PageAgent {
  const agent = ensurePageAgent()
  agent.panel.hide()
  syncPageAgentPanelOpen()
  return agent
}
