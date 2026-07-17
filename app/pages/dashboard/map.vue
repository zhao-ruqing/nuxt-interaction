<template>
  <div class="void-dash-page map-page">
    <div class="map-stage">
      <ClientOnly>
        <XingjianPointMap
          ref="mapRef"
          :points="filteredPoints"
          :selected-point-id="selectedPointId"
          :current-location="currentLocation"
          height="100%"
          @select-point="selectPoint"
        />
        <template #fallback><div class="map-loading">地图加载中...</div></template>
      </ClientOnly>
    </div>

    <div class="map-toolbar void-dash-float">
      <div class="toolbar-title"><span>XINGJIAN MAP</span><strong>地图标注</strong></div>
      <el-select v-model="cityId" clearable placeholder="全部城市" class="city-select">
        <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
      </el-select>
      <el-select v-model="status" clearable placeholder="全部状态" class="status-select">
        <el-option label="已发布" value="published" /><el-option label="草稿" value="draft" /><el-option label="停用" value="disabled" />
      </el-select>
      <el-input v-model="keyword" clearable placeholder="搜索点位或地址" />
      <el-button :loading="locating" @click="locateMe">{{ currentLocation ? '刷新位置' : '我的位置' }}</el-button>
      <el-button type="primary" @click="navigateTo('/dashboard/points?create=1')">新增点位</el-button>
    </div>

    <aside class="point-panel void-dash-float">
      <div class="panel-header">
        <div><span>POINT GEOFENCES</span><strong>{{ filteredPoints.length }} 个围栏</strong></div>
        <el-button text size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
      <div v-if="!filteredPoints.length" class="panel-empty">暂无符合条件的点位</div>
      <div v-else class="point-list">
        <button
          v-for="point in filteredPoints"
          :key="point.id"
          class="point-item"
          :class="{ active: point.id === selectedPointId }"
          @click="selectPoint(point)"
        >
          <span class="point-item__top"><b>{{ point.name }}</b><i :class="`is-${point.status}`">{{ statusText[point.status] }}</i></span>
          <span class="point-item__address">{{ point.cityName }} · {{ point.address }}</span>
          <span class="point-item__data"><em>R {{ point.checkinRadius }}m</em><em>{{ point.longitude.toFixed(4) }}, {{ point.latitude.toFixed(4) }}</em></span>
        </button>
      </div>
    </aside>

    <section v-if="selectedPoint" class="point-detail void-dash-float">
      <div class="detail-head">
        <div><span>SELECTED POINT</span><h2>{{ selectedPoint.name }}</h2></div>
        <button class="detail-close" @click="selectedPointId = null">×</button>
      </div>
      <p>{{ selectedPoint.address }}</p>
      <div class="detail-metrics">
        <label><small>围栏半径</small><strong>{{ radiusDraft }}m</strong></label>
        <label><small>积分奖励</small><strong>+{{ selectedPoint.pointsReward }}</strong></label>
        <label><small>累计打卡</small><strong>{{ selectedPoint.checkinCount }}</strong></label>
      </div>
      <el-slider v-model="radiusDraft" :min="50" :max="3000" :step="10" />
      <div class="detail-actions">
        <el-button @click="navigateTo(`/dashboard/points?edit=${selectedPoint.id}`)">完整编辑</el-button>
        <el-button type="primary" :loading="saving" :disabled="radiusDraft === selectedPoint.checkinRadius" @click="saveRadius">保存半径</el-button>
      </div>
    </section>

    <div class="map-hint void-dash-float">点击地图标记查看围栏，可在右侧筛选点位；亮色圆形区域即服务端打卡判定范围。</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const cities = ref<any[]>([])
const points = ref<any[]>([])
const cityId = ref<number | undefined>()
const status = ref('')
const keyword = ref('')
const selectedPointId = ref<number | null>(null)
const radiusDraft = ref(500)
const loading = ref(false)
const saving = ref(false)
const mapRef = ref<any>(null)
const statusText: Record<string, string> = { published: '已发布', draft: '草稿', disabled: '停用' }
const { locating, currentLocation, locate } = useXingjianCheckin()

const filteredPoints = computed(() => points.value.filter((point) => {
  if (cityId.value && point.cityId !== cityId.value) return false
  if (status.value && point.status !== status.value) return false
  const search = keyword.value.trim().toLowerCase()
  if (search && !`${point.name} ${point.address} ${point.code}`.toLowerCase().includes(search)) return false
  return true
}))
const selectedPoint = computed(() => points.value.find(point => point.id === selectedPointId.value) || null)

async function load() {
  loading.value = true
  try {
    const [cityResponse, pointResponse] = await Promise.all([
      $fetch<any>('/api/admin/cities'),
      $fetch<any>('/api/admin/points'),
    ])
    cities.value = cityResponse.data
    points.value = pointResponse.data
    if (!selectedPointId.value && points.value.length) selectPoint(points.value[0])
  } finally { loading.value = false }
}

function selectPoint(point: any) {
  selectedPointId.value = point.id
  radiusDraft.value = Number(point.checkinRadius)
}

async function locateMe() {
  try { await locate() }
  catch (error: any) { ElMessage.error(error?.message || '定位失败') }
}

async function saveRadius() {
  if (!selectedPoint.value) return
  saving.value = true
  try {
    const response = await $fetch<any>(`/api/admin/points/${selectedPoint.value.id}`, {
      method: 'PUT',
      body: { ...selectedPoint.value, checkinRadius: radiusDraft.value },
    })
    const index = points.value.findIndex(point => point.id === selectedPoint.value.id)
    if (index >= 0) points.value[index] = response.data
    ElMessage.success('围栏半径已更新')
  } catch (error: any) {
    ElMessage.error(error?.data?.message || '保存失败')
  } finally { saving.value = false }
}

watch(filteredPoints, (list) => {
  if (selectedPointId.value && !list.some(point => point.id === selectedPointId.value)) {
    selectedPointId.value = list[0]?.id || null
    if (list[0]) radiusDraft.value = Number(list[0].checkinRadius)
  }
}, { deep: true })

await load()
</script>

<style scoped lang="scss">
.map-page { position: relative; height: calc(100vh - 108px); margin: -24px; overflow: hidden; }
.map-stage { position: absolute; inset: 0; }.map-loading { height: 100%; display: grid; place-items: center; color: var(--void-muted); background: var(--xj-bg-elevated); }
.map-toolbar { position: absolute; top: 16px; left: 16px; right: 336px; z-index: 20; display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
.toolbar-title { display: flex; flex-direction: column; width: 128px; flex: 0 0 auto; }.toolbar-title span { color: var(--xj-accent); font: 9px var(--void-mono); letter-spacing: .1em; }.toolbar-title strong { margin-top: 3px; color: var(--void-text); font-size: 15px; }
.city-select { width: 120px; }.status-select { width: 110px; }.map-toolbar .el-input { flex: 1; min-width: 150px; }
.point-panel { position: absolute; z-index: 20; top: 16px; right: 16px; bottom: 16px; width: 304px; display: flex; flex-direction: column; overflow: hidden; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 16px; border-bottom: 1px solid var(--void-border); }.panel-header div { display: flex; flex-direction: column; gap: 5px; }.panel-header span { color: var(--void-muted); font: 9px var(--void-mono); letter-spacing: .1em; }.panel-header strong { color: var(--void-text); font-size: 14px; }.panel-empty { padding: 30px 16px; color: var(--void-muted); text-align: center; }
.point-list { flex: 1; overflow-y: auto; padding: 8px; }.point-item { width: 100%; padding: 13px 12px; color: var(--void-text); text-align: left; background: transparent; border: 1px solid transparent; cursor: pointer; transition: .2s; }.point-item:hover, .point-item.active { border-color: var(--xj-border-strong); background: var(--xj-accent-soft); }.point-item__top, .point-item__data { display: flex; justify-content: space-between; gap: 8px; }.point-item__top b { font-size: 13px; }.point-item__top i { padding: 2px 5px; color: var(--void-muted); border: 1px solid var(--void-border); font: 9px var(--void-mono); font-style: normal; }.point-item__top i.is-published { color: var(--xj-success); }.point-item__top i.is-disabled { color: var(--xj-danger); }.point-item__address { display: block; margin: 7px 0; overflow: hidden; color: var(--void-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.point-item__data { color: var(--xj-muted); font: 9px var(--void-mono); }.point-item__data em { font-style: normal; }
.point-detail { position: absolute; z-index: 20; left: 16px; bottom: 54px; width: 350px; padding: 18px; }.detail-head { display: flex; justify-content: space-between; }.detail-head span { color: var(--xj-accent); font: 9px var(--void-mono); letter-spacing: .1em; }.detail-head h2 { margin: 6px 0 0; color: var(--void-text); font-size: 20px; }.detail-close { color: var(--void-muted); background: none; border: 0; font-size: 22px; cursor: pointer; }.point-detail > p { overflow: hidden; color: var(--void-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.detail-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 16px 0 8px; }.detail-metrics small { display: block; margin-bottom: 5px; color: var(--xj-muted); font-size: 9px; }.detail-metrics strong { color: var(--void-text); font: 14px var(--void-mono); }.detail-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.map-hint { position: absolute; z-index: 19; left: 380px; bottom: 16px; max-width: 520px; padding: 8px 12px; color: var(--void-muted); font-size: 10px; }
</style>
