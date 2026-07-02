export interface AdminTask {
  type:
    | 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PRODUCT_DELETE' | 'PRODUCT_SEARCH'
    | 'MAP_SEARCH_LOCATION' | 'MAP_DELETE_ADDRESS' | 'MAP_UPDATE_ADDRESS' | 'MAP_ADD_ADDRESS'
  status: 'pending' | 'running' | 'completed' | 'failed'
  data: Record<string, any>
  message?: string
}

export const useAdminAutomationStore = defineStore('adminAutomation', () => {
  const task = ref<AdminTask | null>(null)

  function setTask(t: Omit<AdminTask, 'status'> & { status?: AdminTask['status'] }) {
    task.value = { ...t, status: t.status || 'pending' }
  }

  function updateStatus(status: AdminTask['status'], message?: string) {
    if (task.value) {
      task.value.status = status
      if (message) task.value.message = message
    }
  }

  function clear() {
    task.value = null
  }

  return { task, setTask, updateStatus, clear }
})
