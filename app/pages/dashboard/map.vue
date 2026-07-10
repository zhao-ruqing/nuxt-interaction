<template>
  <div class="void-dash-page map-page">
    <ClientOnly>
      <div ref="mapContainerRef" class="map-container" />
      <div v-if="loading" class="map-loading">地图加载中...</div>
      <div v-if="errorMsg" class="map-error">{{ errorMsg }}</div>

      <template v-if="!loading && !errorMsg">
        <div class="map-toolbar void-dash-float">
          <el-select v-model="searchCity" data-ghost-target="map-city-select" class="city-select" placeholder="搜索区域" @change="handleCityChange">
            <el-option
              v-for="item in CITY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-model="searchAddress"
            data-ghost-target="map-search-input"
            :placeholder="searchPlaceholder"
            clearable
            @keyup.enter="handleAddressSearch"
          />
          <el-button type="primary" data-ghost-target="map-locate-btn" :loading="searching" @click="handleAddressSearch">定位</el-button>
          <el-switch
            v-model="clickModeEnabled"
            inline-prompt
            active-text="标注"
            inactive-text="标注"
            class="click-mode-switch"
          />
        </div>

        <aside class="address-panel void-dash-float">
          <div class="panel-header">
            <span>地址列表</span>
            <el-button text size="small" data-ghost-target="map-refresh-btn" :loading="listLoading" @click="fetchAddressList">刷新</el-button>
          </div>
          <div v-if="addressList.length === 0" class="panel-empty">暂无保存的地址</div>
          <ul v-else class="address-list">
            <li
              v-for="item in addressList"
              :key="item.id"
              class="address-item"
              :class="{ active: activeAddressId === item.id }"
              @click="handleSelectAddress(item)"
            >
              <div class="address-text">{{ item.address }}</div>
              <div class="address-coord">{{ item.lng }}, {{ item.lat }}</div>
              <div class="address-actions" @click.stop>
                <el-button text size="small" :data-ghost-target="'address-edit-' + item.id" @click="openEditDialog(item)">编辑</el-button>
                <el-button text size="small" type="danger" :data-ghost-target="'address-delete-' + item.id" @click="handleDeleteAddress(item)">删除</el-button>
              </div>
            </li>
          </ul>
        </aside>

        <div v-if="pendingVisible" class="pending-panel void-dash-float" :class="{ expanded: pendingExpanded }">
          <div class="pending-header" data-ghost-target="map-pending-header" @click="pendingExpanded = !pendingExpanded">
            <span class="pending-title">{{ markerData.address || '待保存地址' }}</span>
            <span class="pending-toggle">{{ pendingExpanded ? '▲' : '▼' }}</span>
          </div>
          <div v-show="pendingExpanded" class="pending-body">
            <div class="info-row">
              <span class="info-label">经度</span>
              <span class="info-value">{{ markerData.lng }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">纬度</span>
              <span class="info-value">{{ markerData.lat }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">地址</span>
              <el-input v-model="markerData.address" data-ghost-target="map-pending-address" placeholder="地址描述" :disabled="isExistingSelection" />
            </div>
            <div class="pending-footer">
              <el-button @click="pendingVisible = false">关闭</el-button>
              <el-button v-if="!isExistingSelection" type="primary" data-ghost-target="map-save-btn" :loading="saving" @click="handleSaveAddress">保存地址</el-button>
            </div>
          </div>
        </div>

        <div class="map-hint">
          当前搜索区域：{{ currentCityLabel }}。{{ clickModeEnabled ? '标注模式已开启' : '开启标注模式后可点击地图标注' }}
        </div>
      </template>

      <el-dialog v-model="editDialogVisible" title="编辑地址" width="420px" destroy-on-close>
        <el-form label-width="48px">
          <el-form-item label="经度">
            <el-input :model-value="editForm.lng" disabled />
          </el-form-item>
          <el-form-item label="纬度">
            <el-input :model-value="editForm.lat" disabled />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="editForm.address" data-ghost-target="map-edit-address" placeholder="地址描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" data-ghost-target="map-edit-save" :loading="editing" @click="handleUpdateAddress">保存</el-button>
        </template>
      </el-dialog>

      <template #fallback>
        <div class="map-loading">地图加载中...</div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useAdminAutomationStore } from '~/stores/adminAutomation'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

interface AddressItem {
  id: number
  address: string
  lng: number
  lat: number
  created_at: string
  updated_at: string
}

interface CityOption {
  label: string
  value: string
  center: [number, number]
  zoom: number
}

// 常用城市配置（含中心点与默认缩放）
const CITY_OPTIONS: CityOption[] = [
  { label: '上海', value: '上海', center: [121.473701, 31.230416], zoom: 11 },
  { label: '北京', value: '北京', center: [116.397428, 39.909187], zoom: 11 },
  { label: '广州', value: '广州', center: [113.264385, 23.129112], zoom: 11 },
  { label: '深圳', value: '深圳', center: [114.057868, 22.543099], zoom: 11 },
  { label: '杭州', value: '杭州', center: [120.155070, 30.274084], zoom: 11 },
  { label: '成都', value: '成都', center: [104.065735, 30.659462], zoom: 11 },
  { label: '全国', value: '全国', center: [116.397428, 39.909187], zoom: 5 },
]

const AMAP_KEY = '75e7e73e950401aa1362427451d2cc69'
const AMAP_SECRET = 'fb4f4ae4a9bcc783ca84ac4b12c93571'

const api = useApi()
const mapContainerRef = ref<HTMLElement>()
const loading = ref(true)
const errorMsg = ref('')
const searchAddress = ref('')
const searchCity = ref('上海')
const searching = ref(false)
const clickModeEnabled = ref(false)
const pendingVisible = ref(false)
const pendingExpanded = ref(false)
const saving = ref(false)
const listLoading = ref(false)
const editing = ref(false)
const editDialogVisible = ref(false)
const activeAddressId = ref<number | null>(null)
const isExistingSelection = ref(false)
const addressList = ref<AddressItem[]>([])
const markerData = reactive({ lng: '', lat: '', address: '' })
const editForm = reactive({ id: 0, lng: '', lat: '', address: '' })

let AMapRef: any = null
let mapInstance: any = null
let geocoder: any = null
let tempMarker: any = null
const savedMarkers = new Map<number, any>()

const SEARCH_ZOOM = 16
const FLY_DURATION = 800

const currentCityLabel = computed(() => {
  return CITY_OPTIONS.find(item => item.value === searchCity.value)?.label || searchCity.value
})

const searchPlaceholder = computed(() => {
  if (searchCity.value === '全国') return '输入地址，如：上海市中山公园'
  return `输入${searchCity.value}内地址，如：中山公园`
})

// 获取当前城市配置
function getCityOption(city = searchCity.value) {
  return CITY_OPTIONS.find(item => item.value === city)
}

// 同步 Geocoder 搜索城市
function applyGeocoderCity() {
  if (!geocoder) return
  geocoder.setCity(searchCity.value)
}

// 切换城市时调整地图视野
function applyMapCityView(animate = true) {
  const option = getCityOption()
  if (!option || !mapInstance) return
  mapInstance.setZoomAndCenter(option.zoom, option.center, !animate, animate ? FLY_DURATION : 0)
}

function handleCityChange() {
  applyGeocoderCity()
  applyMapCityView()
}

// 从结果中筛选当前城市内的地址
function pickGeocodeInCity(geocodes: any[]) {
  if (searchCity.value === '全国') return geocodes[0]

  const cityName = searchCity.value
  return geocodes.find((geo) => {
    const address = geo.formattedAddress || ''
    const componentCity = geo.addressComponent?.city || geo.addressComponent?.province || ''
    return address.includes(cityName) || componentCity.includes(cityName)
  }) || null
}

// 更新临时标注点（未保存）
function setTempMarker(lng: number, lat: number) {
  if (tempMarker) {
    tempMarker.setPosition([lng, lat])
  } else {
    tempMarker = new AMapRef.Marker({
      position: [lng, lat],
      map: mapInstance,
    })
  }
}

// 渲染已保存地址标注
function renderSavedMarkers() {
  savedMarkers.forEach(marker => marker.setMap(null))
  savedMarkers.clear()

  addressList.value.forEach((item) => {
    const marker = new AMapRef.Marker({
      position: [item.lng, item.lat],
      map: mapInstance,
    })
    marker.on('click', () => handleSelectAddress(item))
    savedMarkers.set(item.id, marker)
  })
}

// 带动画飞行到目标位置
function flyToPosition(lng: number, lat: number) {
  mapInstance.setZoomAndCenter(SEARCH_ZOOM, [lng, lat], false, FLY_DURATION)
}

// 更新待保存地址信息（收缩面板，不弹窗）
function updatePendingMarker(lng: number, lat: number, address: string, existing = false) {
  markerData.lng = Number(lng).toFixed(6)
  markerData.lat = Number(lat).toFixed(6)
  markerData.address = address
  pendingVisible.value = true
  pendingExpanded.value = false
  isExistingSelection.value = existing
  if (!existing) {
    activeAddressId.value = null
    setTempMarker(Number(lng), Number(lat))
  }
}

// 逆地理编码补全地址
function reverseGeocode(lng: number, lat: number) {
  geocoder.getAddress([lng, lat], (status: string, result: any) => {
    if (status === 'complete' && result.regeocode) {
      markerData.address = result.regeocode.formattedAddress || '未知地址'
    } else {
      markerData.address = '地址获取失败'
    }
  })
}

// 地址搜索定位（不打开弹窗）
function handleAddressSearch() {
  const keyword = searchAddress.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入地址')
    return
  }
  if (!geocoder) return

  searching.value = true
  applyGeocoderCity()
  geocoder.getLocation(keyword, (status: string, result: any) => {
    searching.value = false
    if (status === 'complete' && result.geocodes?.length) {
      const geo = pickGeocodeInCity(result.geocodes)
      if (!geo) {
        ElMessage.error(`在${currentCityLabel.value}未找到该地址，请换个关键词试试`)
        return
      }
      const { lng, lat } = geo.location
      updatePendingMarker(lng, lat, geo.formattedAddress || keyword)
      flyToPosition(lng, lat)
    } else {
      ElMessage.error(`在${currentCityLabel.value}未找到该地址，请换个关键词试试`)
    }
  })
}

// 拉取地址列表
async function fetchAddressList() {
  listLoading.value = true
  const res = await api.get<{ success: boolean, data?: AddressItem[], message?: string }>('/api/addresses')
  listLoading.value = false
  if (res?.success) {
    addressList.value = res.data || []
    if (AMapRef && mapInstance) renderSavedMarkers()
  } else {
    ElMessage.error(res?.message || '获取地址列表失败')
  }
}

// 保存新地址
async function handleSaveAddress() {
  if (!markerData.address.trim()) {
    ElMessage.warning('请填写地址')
    return
  }

  saving.value = true
  const res = await api.post<{ success: boolean, data?: AddressItem, message?: string }>('/api/addresses', {
    address: markerData.address.trim(),
    lng: Number(markerData.lng),
    lat: Number(markerData.lat),
  })
  saving.value = false

  if (res?.success && res.data) {
    ElMessage.success('地址已保存')
    addressList.value.unshift(res.data)
    if (tempMarker) {
      tempMarker.setMap(null)
      tempMarker = null
    }
    renderSavedMarkers()
    pendingVisible.value = false
    activeAddressId.value = res.data.id
  } else {
    ElMessage.error(res?.message || '保存失败')
  }
}

// 选中列表地址
function handleSelectAddress(item: AddressItem) {
  activeAddressId.value = item.id
  updatePendingMarker(item.lng, item.lat, item.address, true)
  flyToPosition(Number(item.lng), Number(item.lat))
}

// 打开编辑弹窗
function openEditDialog(item: AddressItem) {
  editForm.id = item.id
  editForm.lng = String(item.lng)
  editForm.lat = String(item.lat)
  editForm.address = item.address
  editDialogVisible.value = true
}

// 更新地址
async function handleUpdateAddress() {
  if (!editForm.address.trim()) {
    ElMessage.warning('请填写地址')
    return
  }

  editing.value = true
  const res = await api.put<{ success: boolean, data?: AddressItem, message?: string }>(
    `/api/addresses/${editForm.id}`,
    {
      address: editForm.address.trim(),
      lng: Number(editForm.lng),
      lat: Number(editForm.lat),
    },
  )
  editing.value = false

  if (res?.success && res.data) {
    ElMessage.success('更新成功')
    const idx = addressList.value.findIndex(a => a.id === res.data!.id)
    if (idx !== -1) addressList.value[idx] = res.data
    renderSavedMarkers()
    editDialogVisible.value = false
  } else {
    ElMessage.error(res?.message || '更新失败')
  }
}

// 删除地址
async function handleDeleteAddress(item: AddressItem) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.address}」？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }

  const res = await api.del<{ success: boolean, message?: string }>(`/api/addresses/${item.id}`)
  if (res?.success) {
    ElMessage.success('已删除')
    addressList.value = addressList.value.filter(a => a.id !== item.id)
    const marker = savedMarkers.get(item.id)
    if (marker) {
      marker.setMap(null)
      savedMarkers.delete(item.id)
    }
    if (activeAddressId.value === item.id) {
      activeAddressId.value = null
      pendingVisible.value = false
    }
  } else {
    ElMessage.error(res?.message || '删除失败')
  }
}

onMounted(async () => {
  try {
    window._AMapSecurityConfig = { securityJsCode: AMAP_SECRET }

    const AMapLoader = (await import('@amap/amap-jsapi-loader')).default
    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder'],
    })
    AMapRef = AMap

    const cityOption = getCityOption()
    const defaultCenter = cityOption?.center || [116.397428, 39.909187]
    const defaultZoom = cityOption?.zoom || 11

    mapInstance = new AMap.Map(mapContainerRef.value!, {
      zoom: defaultZoom,
      center: defaultCenter,
      viewMode: '2D',
      resizeEnable: true,
      mapStyle: 'amap://styles/dark',
    })

    geocoder = new AMap.Geocoder({ city: searchCity.value })

    // 仅标注模式开启时响应点击
    mapInstance.on('click', (e: any) => {
      if (!clickModeEnabled.value) return

      const { lng, lat } = e.lnglat
      updatePendingMarker(lng, lat, '获取中...')
      reverseGeocode(lng, lat)
    })

    loading.value = false
    await fetchAddressList()

    // 优先检查是否有 AI 自动化任务（幽灵手）
    const adminStore = useAdminAutomationStore()
    const taskType = adminStore.task?.type
    if (adminStore.task?.status === 'pending' && taskType?.startsWith('MAP_')) {
      const { run } = useAdminAutomation()
      setTimeout(() => run(), 800)
    } else {
      // 兜底：处理 URL 查询参数
      const route = useRoute()
      const qKeyword = route.query.searchKeyword as string
      const qCity = route.query.searchCity as string
      if (qKeyword) {
        if (qCity) {
          searchCity.value = qCity
          applyGeocoderCity()
          applyMapCityView(false)
        }
        setTimeout(() => {
          searchAddress.value = qKeyword
          handleAddressSearch()
        }, 600)
      }
    }
  } catch (err: any) {
    loading.value = false
    errorMsg.value = `地图加载失败：${err?.message || '未知错误'}`
  }
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped lang="scss">
.map-page {
  position: relative;
  height: calc(100vh - 108px);
  margin: -24px;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading,
.map-error {
  @include flex-center;
  position: absolute;
  inset: 0;
  font-size: $font-size-lg;
  color: var(--void-muted);
  pointer-events: none;
  z-index: 5;
}

.map-error {
  color: #ff8a8a;
  background: rgba(3, 3, 6, 0.88);
}

.map-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 296px;
  display: flex;
  gap: 8px;
  padding: 12px;
  z-index: 10;

  .el-input {
    flex: 1;
    min-width: 0;
  }

  .city-select {
    width: 108px;
    flex-shrink: 0;
  }

  .click-mode-switch {
    flex-shrink: 0;
  }
}

.address-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  bottom: 16px;
  width: 272px;
  display: flex;
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid var(--void-border);
  color: var(--void-text);
}

.panel-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--void-muted);
  font-size: 13px;
}

.address-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 8px;
}

.address-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--void-border);
  }
}

.address-text {
  font-size: 13px;
  color: var(--void-text);
  line-height: 1.4;
  margin-bottom: 4px;
}

.address-coord {
  font-size: 11px;
  font-family: var(--void-mono);
  color: var(--void-muted);
  margin-bottom: 4px;
}

.address-actions {
  display: flex;
  gap: 4px;
}

.pending-panel {
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, calc(100% - 320px));
  z-index: 10;
  overflow: hidden;
}

.pending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

.pending-title {
  flex: 1;
  font-size: 13px;
  color: var(--void-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.pending-toggle {
  color: var(--void-muted);
}

.pending-body {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.pending-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.map-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  background: rgba(8, 8, 12, 0.88);
  border: 1px solid var(--void-border);
  color: var(--void-text);
  font-family: var(--void-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  border-radius: 100px;
  pointer-events: none;
  z-index: 10;
  max-width: calc(100% - 320px);
  text-align: center;
  backdrop-filter: blur(12px);
}

.info-row {
  display: flex;
  gap: $spacing-md;
  align-items: center;

  .info-label {
    width: 48px;
    flex-shrink: 0;
    color: var(--void-muted);
    font-size: $font-size-sm;
  }

  .info-value {
    flex: 1;
    font-family: var(--void-mono);
    font-size: $font-size-sm;
    color: var(--void-text);
  }
}
</style>
