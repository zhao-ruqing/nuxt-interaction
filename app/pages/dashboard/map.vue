<template>
  <div class="map-page">
    <ClientOnly>
      <div ref="mapContainerRef" class="map-container" />
      <div v-if="loading" class="map-loading">地图加载中...</div>
      <div v-if="errorMsg" class="map-error">{{ errorMsg }}</div>
      <div v-if="!loading && !errorMsg" class="map-search">
        <el-input
          v-model="searchAddress"
          placeholder="输入地址，如：北京市朝阳区"
          clearable
          @keyup.enter="handleAddressSearch"
        />
        <el-button type="primary" :loading="searching" @click="handleAddressSearch">定位</el-button>
      </div>
      <div v-if="!loading && !errorMsg" class="map-hint">点击地图任意位置，或输入地址搜索定位</div>
      <el-dialog v-model="dialogVisible" title="标注详情" width="420px" destroy-on-close>
        <div class="dialog-body">
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
            <span class="info-value">{{ markerData.address || '获取中...' }}</span>
          </div>
        </div>
        <template #footer>
          <el-button @click="dialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>
      <template #fallback>
        <div class="map-loading">地图加载中...</div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const AMAP_KEY = '75e7e73e950401aa1362427451d2cc69'
const AMAP_SECRET = 'fb4f4ae4a9bcc783ca84ac4b12c93571'

const mapContainerRef = ref<HTMLElement>()
const dialogVisible = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const searchAddress = ref('')
const searching = ref(false)
const markerData = reactive({ lng: '', lat: '', address: '' })

let AMapRef: any = null
let mapInstance: any = null
let markerInstance: any = null
let geocoder: any = null

const SEARCH_ZOOM = 16
const FLY_DURATION = 800

// 更新或创建标注点
function setMarkerPosition(lng: number, lat: number) {
  if (markerInstance) {
    markerInstance.setPosition([lng, lat])
  } else {
    markerInstance = new AMapRef.Marker({
      position: [lng, lat],
      map: mapInstance,
    })
  }
}

// 带动画飞行到目标位置并缩放
function flyToPosition(lng: number, lat: number) {
  mapInstance.setZoomAndCenter(SEARCH_ZOOM, [lng, lat], false, FLY_DURATION)
}

// 同步标注信息并打开详情
function showMarkerDetail(lng: number, lat: number, address: string) {
  markerData.lng = lng.toFixed(6)
  markerData.lat = lat.toFixed(6)
  markerData.address = address
  dialogVisible.value = true
}

// 地址搜索定位
function handleAddressSearch() {
  const keyword = searchAddress.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入地址')
    return
  }
  if (!geocoder) return

  searching.value = true
  geocoder.getLocation(keyword, (status: string, result: any) => {
    searching.value = false
    if (status === 'complete' && result.geocodes?.length) {
      const geo = result.geocodes[0]
      const { lng, lat } = geo.location
      setMarkerPosition(lng, lat)
      flyToPosition(lng, lat)
      showMarkerDetail(lng, lat, geo.formattedAddress || keyword)
    } else {
      ElMessage.error('未找到该地址，请换个关键词试试')
    }
  })
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

    mapInstance = new AMap.Map(mapContainerRef.value!, {
      zoom: 12,
      center: [116.397428, 39.909187],
      viewMode: '2D',
      resizeEnable: true,
    })

    geocoder = new AMap.Geocoder()

    mapInstance.on('click', (e: any) => {
      const { lng, lat } = e.lnglat

      setMarkerPosition(lng, lat)
      showMarkerDetail(lng, lat, '获取中...')

      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          markerData.address = result.regeocode.formattedAddress || '未知地址'
        } else {
          markerData.address = '地址获取失败'
        }
      })
    })

    loading.value = false
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
  height: calc(100vh - 56px);
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
  color: $text-secondary;
  pointer-events: none;
  z-index: 5;
}

.map-error {
  color: #e74c3c;
  background: rgba(255, 255, 255, .85);
}

.map-search {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  width: min(480px, calc(100% - 32px));
  padding: 12px;
  background: #fff;
  border-radius: $radius;
  box-shadow: $shadow;
  z-index: 10;

  .el-input {
    flex: 1;
  }
}

.map-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  background: rgba(0, 0, 0, .7);
  color: #fff;
  font-size: 13px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 10;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.info-row {
  display: flex;
  gap: $spacing-md;

  .info-label {
    width: 48px;
    flex-shrink: 0;
    color: $text-secondary;
    font-size: $font-size-sm;
  }

  .info-value {
    color: $text;
    font-size: $font-size-sm;
    word-break: break-all;
  }
}
</style>
