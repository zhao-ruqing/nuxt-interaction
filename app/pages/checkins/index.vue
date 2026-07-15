<template>
  <div class="xj-page checkin-page">
    <div class="checkin-heading">
      <div>
        <span class="xj-kicker">CHECK-IN POINTS / GEOFENCE</span>
        <h1 class="xj-title">城市地图打卡</h1>
        <p class="xj-lead">在地图中查看点位、有效围栏与你的实时位置。前端会预判距离，最终打卡结果仍由服务端围栏校验决定。</p>
      </div>
      <button class="xj-button xj-button--locate" :disabled="locating" @click="locateMe">
        {{ locating ? '正在获取位置...' : currentLocation ? '刷新我的位置' : '定位我的位置' }}
      </button>
    </div>

    <div class="xj-toolbar checkin-toolbar">
      <select v-model="cityId" class="xj-select">
        <option value="">全部城市</option>
        <option v-for="city in cities" :key="city.id" :value="String(city.id)">{{ city.name }}</option>
      </select>
      <input v-model="keyword" class="xj-select" placeholder="搜索点位或地址" @keyup.enter="refreshPoints">
      <button class="xj-button xj-button--ghost" @click="refreshPoints">查询</button>
      <span v-if="currentLocation" class="location-accuracy" :class="{ warning: currentLocation.accuracy > maxAccuracy }">
        定位精度 ±{{ Math.round(currentLocation.accuracy) }}m
      </span>
    </div>

    <p v-if="locationError" class="location-error">{{ locationError }}</p>

    <div v-if="points.length" class="map-layout">
      <ClientOnly>
        <XingjianPointMap
          ref="mapRef"
          :points="points"
          :selected-point-id="selectedPointId"
          :current-location="currentLocation"
          :max-accuracy="maxAccuracy"
          height="680px"
          @select-point="selectPoint"
        />
        <template #fallback><div class="map-fallback">地图加载中...</div></template>
      </ClientOnly>

      <aside class="point-rail">
        <div class="point-rail__header">
          <span>VISIBLE POINTS</span>
          <strong>{{ points.length }}</strong>
        </div>
        <div class="point-list">
          <article
            v-for="point in points"
            :key="point.id"
            class="point-card"
            :class="{ active: point.id === selectedPointId }"
            @click="selectPoint(point)"
          >
            <div class="point-card__meta">
              <span>{{ point.cityName }} / {{ point.category }}</span>
              <span>#{{ point.id }}</span>
            </div>
            <h2>{{ point.name }}</h2>
            <p>{{ point.address }}</p>
            <div class="point-card__metrics">
              <span><small>GEOFENCE</small>{{ point.checkinRadius }}m</span>
              <span><small>DISTANCE</small>{{ pointDistanceText(point) }}</span>
              <span><small>REWARD</small>+{{ point.pointsReward }}</span>
            </div>
            <div v-if="currentLocation" class="point-card__status" :class="pointStatus(point).className">
              <i />{{ pointStatus(point).text }}
            </div>
            <div class="point-card__actions" @click.stop>
              <NuxtLink class="xj-button xj-button--ghost" :to="`/checkins/${point.id}`">查看详情</NuxtLink>
              <button
                class="xj-button"
                :disabled="point.checkedToday || locating || !canCheckin(point)"
                @click="submitCheckin(point)"
              >
                {{ checkinButtonText(point) }}
              </button>
            </div>
          </article>
        </div>
      </aside>
    </div>
    <div v-else class="xj-empty">没有符合条件的点位</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })

const route = useRoute()
const cityId = ref(String(route.query.cityId || ''))
const keyword = ref('')
const maxAccuracy = 100
const mapRef = ref<any>(null)
const selectedPointId = ref<number | null>(null)
const { data: cityData } = await useFetch<any>('/api/cities')
const cities = computed(() => cityData.value?.data || [])
const points = ref<any[]>([])
const { locating, currentLocation, locationError, locate, submitXingjianCheckin } = useXingjianCheckin()

function distanceTo(point: any) {
  if (!currentLocation.value) return null
  return calculateMapDistance(currentLocation.value, point)
}

function pointDistanceText(point: any) {
  return formatMapDistance(distanceTo(point))
}

function pointStatus(point: any) {
  if (!currentLocation.value) return { text: '尚未定位', className: '' }
  if (currentLocation.value.accuracy > maxAccuracy) {
    return { text: '定位精度不足，无法确认围栏', className: 'is-warning' }
  }
  const distance = distanceTo(point) || 0
  return distance <= Number(point.checkinRadius)
    ? { text: '当前位于围栏内', className: 'is-inside' }
    : { text: `位于围栏外，还差 ${formatMapDistance(Math.max(0, distance - Number(point.checkinRadius)))}`, className: 'is-outside' }
}

function canCheckin(point: any) {
  if (!currentLocation.value) return true
  if (currentLocation.value.accuracy > maxAccuracy) return false
  return (distanceTo(point) || 0) <= Number(point.checkinRadius)
}

function checkinButtonText(point: any) {
  if (point.checkedToday) return '今日已打卡'
  if (locating.value) return '正在定位'
  if (currentLocation.value && !canCheckin(point)) return pointStatus(point).className === 'is-warning' ? '定位精度不足' : '不在围栏内'
  return '定位打卡'
}

function selectPoint(point: any) {
  selectedPointId.value = point.id
}

async function requestLocation(showMessage = true) {
  try {
    await locate()
  } catch (error: any) {
    if (showMessage) ElMessage.error(error?.message || '定位失败')
  }
}

function locateMe() {
  return requestLocation(true)
}

async function refreshPoints() {
  const response = await $fetch<any>('/api/points', {
    query: { cityId: cityId.value || undefined, keyword: keyword.value || undefined },
  })
  points.value = response.data
  if (!points.value.some(point => point.id === selectedPointId.value)) {
    selectedPointId.value = points.value[0]?.id || null
  }
}

async function submitCheckin(point: any) {
  selectedPointId.value = point.id
  try {
    const response = await submitXingjianCheckin(point.id)
    ElMessage.success(response.message)
    point.checkedToday = true
  } catch (error: any) {
    ElMessage.error(error?.data?.message || error?.message || '打卡失败')
  }
}

await refreshPoints()
watch(cityId, refreshPoints)
onMounted(() => { requestLocation(false) })
</script>

<style scoped lang="scss">
.checkin-page { max-width: 1500px; }
.checkin-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; }
.checkin-heading .xj-lead { max-width: 850px; }
.xj-button--locate { min-width: 160px; margin-bottom: 8px; }
.checkin-toolbar { flex-wrap: wrap; }
.location-accuracy { margin-left: auto; color: #aef8c4; font: 11px var(--void-mono); letter-spacing: .06em; }
.location-accuracy.warning { color: #ffc85c; }
.location-error { margin: -10px 0 20px; color: #ff8585; font-size: 13px; }
.map-layout { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 18px; align-items: stretch; }
.map-fallback { height: 680px; display: grid; place-items: center; border: 1px solid var(--xj-border); color: var(--xj-muted); }
.point-rail { height: 680px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--xj-border); background: rgba(9,11,16,.75); }
.point-rail__header { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; border-bottom: 1px solid var(--xj-border); color: var(--xj-muted); font: 11px var(--void-mono); letter-spacing: .12em; }
.point-rail__header strong { color: var(--xj-accent); font-size: 18px; }
.point-list { overflow-y: auto; padding: 10px; }
.point-card { position: relative; padding: 18px; border: 1px solid transparent; cursor: pointer; transition: .2s ease; }
.point-card + .point-card { border-top-color: var(--xj-border); }
.point-card:hover, .point-card.active { background: rgba(244,255,88,.045); border-color: rgba(244,255,88,.3); }
.point-card.active::before { content: ''; position: absolute; left: -1px; top: 16px; bottom: 16px; width: 2px; background: var(--xj-accent); box-shadow: 0 0 12px var(--xj-accent); }
.point-card__meta { display: flex; justify-content: space-between; color: var(--xj-muted); font: 10px var(--void-mono); letter-spacing: .06em; }
.point-card h2 { margin: 12px 0 6px; color: var(--xj-text); font-size: 20px; }
.point-card > p { min-height: 36px; margin: 0; color: var(--xj-muted); font-size: 12px; line-height: 1.5; }
.point-card__metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 15px; }
.point-card__metrics span { color: var(--xj-text); font: 13px var(--void-mono); }
.point-card__metrics small { display: block; margin-bottom: 5px; color: var(--xj-muted); font-size: 8px; letter-spacing: .08em; }
.point-card__status { display: flex; align-items: center; gap: 7px; margin-top: 13px; color: var(--xj-muted); font-size: 11px; }
.point-card__status i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.point-card__status.is-inside { color: #baff6a; }.point-card__status.is-outside { color: #ff8585; }.point-card__status.is-warning { color: #ffc85c; }
.point-card__actions { display: flex; gap: 8px; margin-top: 15px; }
.point-card__actions .xj-button { flex: 1; padding: 10px 11px; text-align: center; font-size: 11px; }
@media (max-width: 1100px) { .map-layout { grid-template-columns: minmax(0,1fr) 330px; } }
</style>
