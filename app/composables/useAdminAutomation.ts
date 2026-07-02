/**
 * 后台管理幽灵手自动化编排
 * - manage-products.vue → 商品 CRUD
 * - map.vue → 地图标注
 */
import { useAdminAutomationStore } from '~/stores/adminAutomation'

/** 在操作完成后统一清理幽灵手（延迟以确保最后一步可见） */
function scheduleGhostCleanup(ghost: ReturnType<typeof useGhostHand>, delay = 1200) {
  setTimeout(() => ghost.hide(), delay)
}

export function useAdminAutomation() {
  const store = useAdminAutomationStore()
  const ghost = useGhostHand()

  // ---- 通用等待工具 ----

  async function waitForTableReady() {
    const tbody = await ghost.waitForSelector('.el-table__body-wrapper tbody', 8000)
    if (!tbody) return false
    await ghost.wait(600)
    return true
  }

  async function waitForDialog() {
    const dialog = await ghost.waitForSelector('.el-dialog:not([style*="display: none"])', 3000)
    if (!dialog) return false
    await ghost.wait(400)
    return true
  }

  async function waitForDialogClose() {
    const start = Date.now()
    while (Date.now() - start < 5000) {
      const dialog = document.querySelector('.el-dialog:not([style*="display: none"])')
      if (!dialog) return true
      await ghost.wait(300)
    }
    return false
  }

  async function waitForElMessageBox() {
    const box = await ghost.waitForSelector('.el-message-box__btns .el-button--primary', 3000)
    await ghost.wait(300)
    return !!box
  }

  // ==================== 商品搜索 ====================

  async function runProductSearch() {
    const data = store.task!.data
    store.updateStatus('running')
    ElMessage.info('正在为您筛选商品...')
    await ghost.wait(500)

    if (data.category) {
      const catMap: Record<string, string> = { coffee: '咖啡', tea: '茶饮', juice: '果汁', soda: '汽水', milk: '奶茶' }
      await ghost.selectOption('[data-ghost-target="search-category"]', catMap[data.category] || data.category)
    }
    if (data.keyword) {
      await ghost.fillInput('[data-ghost-target="search-keyword"]', data.keyword)
    }
    await ghost.tapSelector('[data-ghost-target="btn-search"]')

    store.updateStatus('completed', '筛选完成')
    ElMessage.success('商品筛选完成')
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 商品创建 ====================

  async function runProductCreate() {
    const data = store.task!.data
    store.updateStatus('running')
    ElMessage.info('正在为您创建商品...')

    await ghost.tapSelector('[data-ghost-target="btn-create"]')
    if (!await waitForDialog()) {
      store.updateStatus('failed', '弹窗未打开')
      scheduleGhostCleanup(ghost)
      return
    }

    if (data.name) await ghost.fillInput('[data-ghost-target="form-name"]', data.name)
    if (data.category) {
      const catMap: Record<string, string> = { coffee: '咖啡', tea: '茶饮', juice: '果汁', soda: '汽水', milk: '奶茶' }
      await ghost.selectOption('[data-ghost-target="form-category"]', catMap[data.category] || data.category)
    }
    if (data.image) await ghost.fillInput('[data-ghost-target="form-image"]', data.image)
    if (data.price !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-price"]', data.price)
    if (data.originalPrice !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-original-price"]', data.originalPrice)
    if (data.description) await ghost.fillInput('[data-ghost-target="form-description"]', data.description)
    if (data.rating !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-rating"]', data.rating)
    if (data.stock !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-stock"]', data.stock)
    if (data.sales !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-sales"]', data.sales)

    if (data.specs && Array.isArray(data.specs)) {
      for (let i = 0; i < data.specs.length; i++) {
        if (i > 0) {
          await ghost.tapSelector('[data-ghost-target="btn-add-spec"]')
          await ghost.wait(400)
        }
        const spec = data.specs[i]
        if (spec.size) await ghost.fillInput(`[data-ghost-target="spec-size-${i}"]`, spec.size)
        if (spec.price !== undefined) await ghost.fillNumberInput(`[data-ghost-target="spec-price-${i}"]`, spec.price)
      }
    }

    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      for (const tag of data.tags) {
        await ghost.fillInput('[data-ghost-target="form-tags"]', tag)
        await ghost.wait(200)
        const input = document.querySelector('[data-ghost-target="form-tags"] input') as HTMLInputElement
        if (input) { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await ghost.wait(300) }
      }
    }

    if (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
      for (const ing of data.ingredients) {
        await ghost.fillInput('[data-ghost-target="form-ingredients"]', ing)
        await ghost.wait(200)
        const input = document.querySelector('[data-ghost-target="form-ingredients"] input') as HTMLInputElement
        if (input) { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await ghost.wait(300) }
      }
    }

    await ghost.tapSelector('[data-ghost-target="btn-save"]')
    await waitForDialogClose()

    store.updateStatus('completed', `商品「${data.name || ''}」创建完成`)
    ElMessage.success(`商品「${data.name || ''}」创建完成`)
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 商品更新 ====================

  async function runProductUpdate() {
    const data = store.task!.data
    const productId = data.productId

    store.updateStatus('running')
    ElMessage.info('正在为您更新商品...')

    if (!productId) { store.updateStatus('failed', '未指定商品'); scheduleGhostCleanup(ghost); return }
    if (!await waitForTableReady()) { store.updateStatus('failed', '列表加载超时'); scheduleGhostCleanup(ghost); return }

    const editBtn = await ghost.waitForSelector(`[data-ghost-target="edit-${productId}"]`, 3000)
    if (!editBtn) {
      store.updateStatus('failed', '未找到该商品')
      ElMessage.error('未在列表中找到该商品')
      scheduleGhostCleanup(ghost)
      return
    }

    await ghost.tap(editBtn)
    if (!await waitForDialog()) { store.updateStatus('failed', '弹窗未打开'); scheduleGhostCleanup(ghost); return }

    const changes = data.changes || {}
    if (changes.name) await ghost.fillInput('[data-ghost-target="form-name"]', changes.name)
    if (changes.category) {
      const catMap: Record<string, string> = { coffee: '咖啡', tea: '茶饮', juice: '果汁', soda: '汽水', milk: '奶茶' }
      await ghost.selectOption('[data-ghost-target="form-category"]', catMap[changes.category] || changes.category)
    }
    if (changes.image) await ghost.fillInput('[data-ghost-target="form-image"]', changes.image)
    if (changes.price !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-price"]', changes.price)
    if (changes.description) await ghost.fillInput('[data-ghost-target="form-description"]', changes.description)
    if (changes.rating !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-rating"]', changes.rating)
    if (changes.stock !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-stock"]', changes.stock)
    if (changes.sales !== undefined) await ghost.fillNumberInput('[data-ghost-target="form-sales"]', changes.sales)

    await ghost.tapSelector('[data-ghost-target="btn-save"]')
    await waitForDialogClose()

    store.updateStatus('completed', '商品更新完成')
    ElMessage.success('商品更新完成')
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 商品删除 ====================

  async function runProductDelete() {
    const data = store.task!.data
    const productId = data.productId

    store.updateStatus('running')
    ElMessage.info('正在为您删除商品...')

    if (!productId) { store.updateStatus('failed', '未指定商品'); scheduleGhostCleanup(ghost); return }
    if (!await waitForTableReady()) { store.updateStatus('failed', '列表加载超时'); scheduleGhostCleanup(ghost); return }

    const deleteBtn = await ghost.waitForSelector(`[data-ghost-target="delete-${productId}"]`, 3000)
    if (!deleteBtn) {
      store.updateStatus('failed', '未找到该商品')
      ElMessage.error('未在列表中找到该商品')
      scheduleGhostCleanup(ghost)
      return
    }

    await ghost.tap(deleteBtn)
    if (!await waitForElMessageBox()) { store.updateStatus('failed'); scheduleGhostCleanup(ghost); return }

    const confirmBtn = document.querySelector('.el-message-box__btns .el-button--primary') as HTMLElement
    if (confirmBtn) {
      await ghost.tap(confirmBtn)
      await ghost.wait(1200)
    }

    store.updateStatus('completed', '商品已删除')
    ElMessage.success('商品已删除')
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 地图：搜索位置 ====================

  async function runMapSearchLocation() {
    const data = store.task!.data
    store.updateStatus('running')
    ElMessage.info('正在为您搜索位置...')

    // 等待地图工具栏出现
    await ghost.waitForSelector('.map-toolbar', 10000)
    await ghost.wait(800)

    // 选择城市
    if (data.city) {
      await ghost.selectOption('[data-ghost-target="map-city-select"]', data.city)
      await ghost.wait(400)
    }

    // 填入搜索关键词
    if (data.keyword) {
      await ghost.fillInput('[data-ghost-target="map-search-input"]', data.keyword)
    }

    // 点击定位按钮
    await ghost.tapSelector('[data-ghost-target="map-locate-btn"]')

    store.updateStatus('completed', '搜索完成')
    ElMessage.success('位置搜索完成')
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 地图：新增地址（搜索 + 自动保存） ====================

  async function runMapAddAddress() {
    const data = store.task!.data
    const address = data.address || ''
    store.updateStatus('running')
    ElMessage.info(`正在搜索并保存地址「${address}」...`)

    // 等待地图工具栏出现
    await ghost.waitForSelector('.map-toolbar', 10000)
    await ghost.wait(800)

    // 填入搜索关键词
    await ghost.fillInput('[data-ghost-target="map-search-input"]', address)

    // 点击定位按钮
    await ghost.tapSelector('[data-ghost-target="map-locate-btn"]')

    // 等待 pending 面板出现（地理编码需要时间）
    const pendingPanel = await ghost.waitForSelector('.pending-panel', 8000)
    if (!pendingPanel) {
      store.updateStatus('failed', '地址搜索超时，请重试')
      ElMessage.error('地址搜索超时')
      scheduleGhostCleanup(ghost)
      return
    }
    await ghost.wait(1000)

    // 展开 pending 面板（如果未展开）
    const expanded = document.querySelector('.pending-panel.expanded')
    if (!expanded) {
      await ghost.tapSelector('[data-ghost-target="map-pending-header"]')
      await ghost.wait(500)
    }

    // 如果地址描述需要补全，填入
    await ghost.fillInput('[data-ghost-target="map-pending-address"]', address)

    // 点击保存
    await ghost.tapSelector('[data-ghost-target="map-save-btn"]')
    await ghost.wait(1500)

    store.updateStatus('completed', `地址「${address}」已保存`)
    ElMessage.success(`地址「${address}」标注完成`)
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 地图：删除地址 ====================

  async function runMapDeleteAddress() {
    const data = store.task!.data
    const addressId = data.addressId

    store.updateStatus('running')
    ElMessage.info('正在为您删除地址标注...')

    if (!addressId) { store.updateStatus('failed', '未指定地址ID'); scheduleGhostCleanup(ghost); return }

    // 等待地址列表出现
    await ghost.waitForSelector('.address-panel', 10000)
    await ghost.wait(1000)

    // 先刷新列表
    await ghost.tapSelector('[data-ghost-target="map-refresh-btn"]')
    await ghost.wait(800)

    // 找到该地址的删除按钮
    const deleteBtn = await ghost.waitForSelector(`[data-ghost-target="address-delete-${addressId}"]`, 5000)
    if (!deleteBtn) {
      store.updateStatus('failed', '未在列表中找到该地址')
      ElMessage.error('未在列表中找到该地址')
      scheduleGhostCleanup(ghost)
      return
    }

    await ghost.tap(deleteBtn)
    if (!await waitForElMessageBox()) { store.updateStatus('failed'); scheduleGhostCleanup(ghost); return }

    const confirmBtn = document.querySelector('.el-message-box__btns .el-button--primary') as HTMLElement
    if (confirmBtn) {
      await ghost.tap(confirmBtn)
      await ghost.wait(1200)
    }

    store.updateStatus('completed', '地址已删除')
    ElMessage.success('地址标注已删除')
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 地图：更新地址 ====================

  async function runMapUpdateAddress() {
    const data = store.task!.data
    const addressId = data.addressId

    store.updateStatus('running')
    ElMessage.info('正在为您更新地址...')

    if (!addressId) { store.updateStatus('failed', '未指定地址ID'); scheduleGhostCleanup(ghost); return }

    await ghost.waitForSelector('.address-panel', 10000)
    await ghost.wait(1000)

    await ghost.tapSelector('[data-ghost-target="map-refresh-btn"]')
    await ghost.wait(800)

    // 找到该地址的编辑按钮
    const editBtn = await ghost.waitForSelector(`[data-ghost-target="address-edit-${addressId}"]`, 5000)
    if (!editBtn) {
      store.updateStatus('failed', '未找到该地址')
      ElMessage.error('未在列表中找到该地址')
      scheduleGhostCleanup(ghost)
      return
    }

    await ghost.tap(editBtn)
    if (!await waitForDialog()) { store.updateStatus('failed', '编辑弹窗未打开'); scheduleGhostCleanup(ghost); return }

    // 填写编辑表单
    if (data.address) await ghost.fillInput('[data-ghost-target="map-edit-address"]', data.address)

    await ghost.tapSelector('[data-ghost-target="map-edit-save"]')
    await waitForDialogClose()

    store.updateStatus('completed', '地址更新完成')
    ElMessage.success('地址标注已更新')
    scheduleGhostCleanup(ghost)
    setTimeout(() => store.clear(), 2500)
  }

  // ==================== 统一入口 ====================

  async function run() {
    const t = store.task
    if (!t || t.status !== 'pending') return

    try {
      switch (t.type) {
        case 'PRODUCT_SEARCH':      await runProductSearch(); break
        case 'PRODUCT_CREATE':      await runProductCreate(); break
        case 'PRODUCT_UPDATE':      await runProductUpdate(); break
        case 'PRODUCT_DELETE':      await runProductDelete(); break
        case 'MAP_SEARCH_LOCATION': await runMapSearchLocation(); break
        case 'MAP_ADD_ADDRESS':     await runMapAddAddress(); break
        case 'MAP_DELETE_ADDRESS':  await runMapDeleteAddress(); break
        case 'MAP_UPDATE_ADDRESS':  await runMapUpdateAddress(); break
        default: store.updateStatus('failed', `未知任务: ${t.type}`); scheduleGhostCleanup(ghost)
      }
    } catch (e: any) {
      store.updateStatus('failed', e?.message || '操作失败')
      ElMessage.error('自动化操作失败')
    } finally {
      // 确保幽灵手最终一定会消失
      scheduleGhostCleanup(ghost, 800)
    }
  }

  return { run }
}
