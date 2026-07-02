import { usePageAgentPanelOpen } from '~/utils/pageAgentPanelState'
import {
  getPageAgent,
  syncPageAgentPanelOpen,
} from '~/utils/pageAgentState.client'
import {
  hidePageAgentPanel,
  isPageAgentPanelVisible,
  showPageAgentPanel,
  togglePageAgentPanel,
} from '~/utils/pageAgentPanel.client'

/** Page Agent 面板控制（仅客户端） */
export function usePageAgentPanel() {
  const isOpen = usePageAgentPanelOpen()

  return {
    isOpen,
    isVisible: () => {
      const agent = getPageAgent()
      return agent ? isPageAgentPanelVisible(agent) : false
    },
    sync: syncPageAgentPanelOpen,
    toggle: togglePageAgentPanel,
    show: showPageAgentPanel,
    hide: hidePageAgentPanel,
  }
}
