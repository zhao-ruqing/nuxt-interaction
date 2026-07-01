export interface PendingOrder {
  productId: number
  productName: string
  specs: string
  quantity: number
  status: 'pending' | 'running' | 'done' | 'failed'
  message?: string
}

export const useOrderAutomationStore = defineStore('orderAutomation', () => {
  const pending = ref<PendingOrder | null>(null)

  function setPending(order: Omit<PendingOrder, 'status'> & { status?: PendingOrder['status'] }) {
    pending.value = {
      ...order,
      status: order.status || 'pending',
    }
  }

  function updateStatus(status: PendingOrder['status'], message?: string) {
    if (pending.value) {
      pending.value.status = status
      if (message) pending.value.message = message
    }
  }

  function clear() {
    pending.value = null
  }

  return { pending, setPending, updateStatus, clear }
})
