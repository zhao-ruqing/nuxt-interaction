import type { AgentStatus, ExecutionResult, PageAgent } from 'page-agent'
import { readonly, ref } from 'vue'

/** Agent 运行状态（供浮钮同步） */
const agentStatus = ref<AgentStatus>('idle')

/** 最近一次任务摘要（成功/失败短文案） */
const lastTaskSummary = ref('')

/** 只读的 Agent 状态 */
export function usePageAgentStatus() {
  return readonly(agentStatus)
}

/** 只读的最近任务摘要 */
export function usePageAgentLastSummary() {
  return readonly(lastTaskSummary)
}

/** 同步 Agent 状态到响应式变量 */
export function syncPageAgentStatus(agent: PageAgent | null) {
  agentStatus.value = agent && !agent.disposed ? agent.status : 'idle'
}

/** 设置最近任务摘要 */
export function setPageAgentLastSummary(summary: string) {
  lastTaskSummary.value = summary
}

/** 根据执行结果生成摘要文案 */
export function summarizeExecutionResult(result: ExecutionResult): string {
  if (result.success) {
    const text = (result.data || '任务完成').trim()
    return text.length > 80 ? `${text.slice(0, 80)}…` : text
  }
  const text = (result.data || '任务失败').trim()
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}
