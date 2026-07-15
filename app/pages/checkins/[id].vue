<template>
  <div v-if="point" class="xj-page detail-page">
    <NuxtLink to="/checkins" class="xj-kicker">← BACK TO POINTS</NuxtLink>
    <div class="detail-heading">
      <div>
        <span class="detail-city">{{ point.cityName }} / {{ point.category }}</span>
        <h1 class="xj-title">{{ point.name }}</h1>
        <p class="xj-lead">{{ point.description }}</p>
        <div class="detail-address">{{ point.address }}</div>
      </div>
      <div class="detail-actions">
        <button class="xj-button xj-button--ghost" :disabled="locating" @click="locateMe">
          {{ locating ? '正在获取位置' : currentLocation ? '刷新位置' : '定位我的位置' }}
        </button>
        <button class="xj-button" :disabled="point.checkedToday || locating || !canCheckin" @click="submitCheckin">
          {{ checkinButtonText }}
        </button>
      </div>
    </div>

    <div class="detail-map-grid">
      <ClientOnly>
        <XingjianPointMap
          :points="[point]"
          :selected-point-id="point.id"
          :current-location="currentLocation"
          :max-accuracy="maxAccuracy"
          height="620px"
        />
        <template #fallback><div class="map-fallback">地图加载中...</div></template>
      </ClientOnly>

      <aside class="detail-panel">
        <span class="xj-kicker">LIVE GEOFENCE DATA</span>
        <div class="metric"><small>围栏半径</small><strong>{{ point.checkinRadius }}<em>m</em></strong></div>
        <div class="metric"><small>当前位置距离</small><strong>{{ formatMapDistance(distance) }}</strong></div>
        <div class="metric"><small>定位精度</small><strong>{{ currentLocation ? `±${Math.round(currentLocation.accuracy)}m` : '--' }}</strong></div>
        <div class="metric"><small>坐标</small><code>{{ Number(point.longitude).toFixed(6) }}<br>{{ Number(point.latitude).toFixed(6) }}</code></div>
        <div class="geofence-result" :class="status.className"><i />{{ status.text }}</div>
        <p v-if="locationError" class="location-error">{{ locationError }}</p>
        <p class="detail-note">地图中的亮色圆形区域为允许打卡范围，粉色圆点及半透明圆表示你的当前位置与定位误差。</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })

const route = useRoute()
const maxAccuracy = 100
const { data, refresh } = await useFetch<any>(`/api/points/${route.params.id}`)
const point = computed(() => data.value?.data)
const { locating, currentLocation, locationError, locate, submitXingjianCheckin } = useXingjianCheckin()
const distance = computed(() => currentLocation.value && point.value ? calculateMapDistance(currentLocation.value, point.value) : null)
const status = computed(() => {
  if (!currentLocation.value) return { text: '请先定位以判断是否进入围栏', className: '' }
  if (currentLocation.value.accuracy > maxAccuracy) return { text: '定位精度不足，请刷新位置', className: 'is-warning' }
  return Number(distance.value) <= Number(point.value.checkinRadius)
    ? { text: '当前位置在围栏内，可以打卡', className: 'is-inside' }
    : { text: `当前位置在围栏外，还差 ${formatMapDistance(Number(distance.value) - Number(point.value.checkinRadius))}`, className: 'is-outside' }
})
const canCheckin = computed(() => {
  if (!currentLocation.value) return true
  return currentLocation.value.accuracy <= maxAccuracy && Number(distance.value) <= Number(point.value.checkinRadius)
})
const checkinButtonText = computed(() => {
  if (point.value.checkedToday) return '今日已完成打卡'
  if (locating.value) return '正在获取位置'
  if (currentLocation.value && !canCheckin.value) return currentLocation.value.accuracy > maxAccuracy ? '定位精度不足' : '当前不在围栏内'
  return `定位打卡并获得 ${point.value.pointsReward} 积分`
})

async function requestLocation(showMessage = true) {
  try { await locate() }
  catch (error: any) {
    if (showMessage) ElMessage.error(error?.message || '定位失败')
  }
}

function locateMe() {
  return requestLocation(true)
}

onMounted(() => { requestLocation(false) })

async function submitCheckin() {
  try {
    const response = await submitXingjianCheckin(point.value.id)
    ElMessage.success(response.message)
    await refresh()
  } catch (error: any) {
    ElMessage.error(error?.data?.message || error?.message || '打卡失败')
  }
}
</script>

<style scoped lang="scss">
.detail-page { max-width: 1460px; }
.detail-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 60px; margin: 22px 0 34px; }
.detail-city { color: rgba(255,255,255,.35); font: 11px var(--void-mono); letter-spacing: .12em; }
.detail-heading .xj-title { margin-top: 10px; }.detail-heading .xj-lead { max-width: 760px; }
.detail-address { margin-top: 20px; color: rgba(255,255,255,.5); }
.detail-actions { display: flex; gap: 10px; flex-shrink: 0; }
.detail-map-grid { display: grid; grid-template-columns: minmax(0,1fr) 310px; gap: 18px; }
.map-fallback { height: 620px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.5); }
.detail-panel { padding: 26px; border: 1px solid rgba(255,255,255,.1); background: rgba(9,11,16,.72); }
.metric { padding: 19px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
.metric small { display: block; margin-bottom: 8px; color: rgba(255,255,255,.3); font: 9px var(--void-mono); letter-spacing: .12em; }
.metric strong { color: #fff; font: 27px var(--void-mono); }.metric strong em { margin-left: 4px; color: #f4ff58; font-size: 12px; font-style: normal; }
.metric code { color: #f4ff58; font: 14px/1.7 var(--void-mono); }
.geofence-result { display: flex; align-items: flex-start; gap: 9px; margin-top: 22px; color: rgba(255,255,255,.5); font-size: 12px; line-height: 1.5; }
.geofence-result i { width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: currentColor; flex: 0 0 auto; }
.geofence-result.is-inside { color: #baff6a; }.geofence-result.is-outside { color: #ff8585; }.geofence-result.is-warning { color: #ffc85c; }
.location-error { color: #ff8585; font-size: 12px; }.detail-note { margin-top: 20px; color: rgba(255,255,255,.3); font-size: 11px; line-height: 1.7; }
</style>
