import { usePageAgentPanelOpen } from '~/utils/pageAgentPanelState'
import {
  usePageAgentLastSummary,
  usePageAgentStatus,
} from '~/utils/pageAgentRuntimeState'
import {
  getPageAgent,
  runPageAgentTask,
  stopPageAgentTask,
  syncPageAgentPanelOpen,
} from '~/utils/pageAgentState.client'
import {
  hidePageAgentPanel,
  isPageAgentPanelVisible,
  showPageAgentPanel,
  togglePageAgentPanel,
} from '~/utils/pageAgentPanel.client'
import { PAGE_AGENT_QUICK_TASKS } from '~/utils/pageAgentTasks.client'

/** Page Agent 面板与任务控制（仅客户端） */
export function usePageAgentPanel() {
  const isOpen = usePageAgentPanelOpen()
  const status = usePageAgentStatus()
  const lastSummary = usePageAgentLastSummary()

  return {
    isOpen,
    status,
    lastSummary,
    quickTasks: PAGE_AGENT_QUICK_TASKS,
    isRunning: () => status.value === 'running',
    isVisible: () => {
      const agent = getPageAgent()
      return agent ? isPageAgentPanelVisible(agent) : false
    },
    sync: syncPageAgentPanelOpen,
    toggle: togglePageAgentPanel,
    show: showPageAgentPanel,
    hide: hidePageAgentPanel,
    /** 打开面板并执行自然语言任务 */
    run: runPageAgentTask,
    /** 停止当前任务 */
    stop: stopPageAgentTask,
  }
}
