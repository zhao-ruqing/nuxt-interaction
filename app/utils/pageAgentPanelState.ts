import { readonly, ref } from 'vue'

/** 面板关闭事件（含自带关闭按钮触发的 dispose） */
export const PAGE_AGENT_PANEL_CLOSED_EVENT = 'page-agent:panel-closed'

/** 面板可见状态（供全局按钮同步，SSR 安全） */
const panelOpen = ref(false)

/** 只读的面板打开状态 */
export function usePageAgentPanelOpen() {
  return readonly(panelOpen)
}

/** 设置面板打开状态 */
export function setPageAgentPanelOpen(open: boolean) {
  panelOpen.value = open
}
